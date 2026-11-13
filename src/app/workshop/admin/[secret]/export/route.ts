import ExcelJS from "exceljs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  workshopContacts,
  workshopSessions,
  type WorkshopContact,
} from "@/db/schema";
import { isValidAdminSecret } from "@/lib/workshop/admin";
import { OTHER_SEAT, TEAMS, getTeam } from "@/lib/workshop/config";
import { getLiveSession } from "@/lib/workshop/session";

export const dynamic = "force-dynamic";

const UNKNOWN_MEMBER = "Not recorded";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * The workbook Harry and Matt work the follow-up from.
 *
 * A sheet per round, because the rounds mean different things: round 1 is a
 * member filling their own team's seats, round 2 is anyone filling the gaps.
 * Rows lead with who added the contact and are grouped by that member, since
 * the job afterwards is working out who knows whom and who makes each call.
 */
function addContactSheet(
  book: ExcelJS.Workbook,
  title: string,
  rows: WorkshopContact[],
  blurb: string,
) {
  const sheet = book.addWorksheet(title);

  sheet.mergeCells("A1:K1");
  const header = sheet.getCell("A1");
  header.value = blurb;
  header.font = { italic: true, color: { argb: "FF5C5752" }, size: 10 };
  header.alignment = { vertical: "middle" };
  sheet.getRow(1).height = 22;

  sheet.getRow(2).values = [
    "Added by (member)",
    "Their power team",
    "Contact name",
    "Company",
    "Phone",
    "Email",
    "Key seat",
    "Category",
    "Seat belongs to",
    "Points",
    "Added at",
  ];
  sheet.columns = [
    { key: "addedBy", width: 22 },
    { key: "memberTeam", width: 20 },
    { key: "contactName", width: 24 },
    { key: "company", width: 26 },
    { key: "phone", width: 18 },
    { key: "email", width: 28 },
    { key: "seat", width: 28 },
    { key: "category", width: 24 },
    { key: "seatTeam", width: 20 },
    { key: "points", width: 8 },
    { key: "addedAt", width: 18 },
  ];
  sheet.getRow(2).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 2 }];
  sheet.autoFilter = { from: "A2", to: "K2" };

  // Grouped by member so one person's contacts sit together on the page.
  const ordered = [...rows].sort((a, b) => {
    const left = (a.submitterName ?? UNKNOWN_MEMBER).localeCompare(
      b.submitterName ?? UNKNOWN_MEMBER,
      "en-GB",
    );
    if (left !== 0) return left;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });

  for (const row of ordered) {
    sheet.addRow({
      addedBy: row.submitterName ?? UNKNOWN_MEMBER,
      memberTeam: getTeam(row.submitterTeam)?.name ?? row.submitterTeam,
      contactName: row.contactName,
      company: row.company,
      phone: row.phone ?? "",
      email: row.email ?? "",
      seat: row.seatIndex === OTHER_SEAT ? "Other" : row.category,
      category: row.category,
      seatTeam: getTeam(row.seatTeam)?.name ?? row.seatTeam,
      points: row.points,
      addedAt: row.createdAt,
    });
  }
  sheet.getColumn("addedAt").numFmt = "dd/mm/yyyy hh:mm";

  if (ordered.length === 0) {
    const empty = sheet.addRow({ addedBy: "No contacts were added in this round." });
    empty.font = { italic: true, color: { argb: "FF8A8278" } };
  }

  return sheet;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ secret: string }> },
) {
  const { secret } = await params;
  if (!isValidAdminSecret(secret)) {
    return new Response("Not found", { status: 404 });
  }

  // ?session=<id> exports an archived run; without it, the live one.
  const requested = new URL(request.url).searchParams.get("session");
  const sessionId = requested ?? (await getLiveSession()).id;

  if (!UUID.test(sessionId)) {
    return new Response("Not found", { status: 404 });
  }

  const [session] = await db
    .select()
    .from(workshopSessions)
    .where(eq(workshopSessions.id, sessionId))
    .limit(1);

  if (!session) {
    return new Response("Not found", { status: 404 });
  }

  const rows = await db
    .select()
    .from(workshopContacts)
    .where(eq(workshopContacts.sessionId, session.id))
    .orderBy(asc(workshopContacts.createdAt));

  const round1 = rows.filter((row) => row.round === 1);
  const round2 = rows.filter((row) => row.round === 2);

  const book = new ExcelJS.Workbook();
  book.creator = "BNI Dabbers Growth Workshop";
  book.created = new Date();

  addContactSheet(
    book,
    "Round 1",
    round1,
    "Round 1 — members adding contacts for their own power team's key seats.",
  );
  addContactSheet(
    book,
    "Round 2",
    round2,
    "Round 2 — all 20 seats open, so members filled gaps for other teams too.",
  );

  // ---- Totals ----
  const totals = book.addWorksheet("Totals");
  totals.columns = [
    { key: "a", width: 28 },
    { key: "b", width: 20 },
    { key: "c", width: 16 },
    { key: "d", width: 16 },
    { key: "e", width: 18 },
  ];

  const title = totals.addRow({ a: "Chapter totals" });
  title.font = { bold: true, size: 13 };
  totals.addRow({ a: "Round 1 contacts", b: round1.length });
  totals.addRow({ a: "Round 2 contacts", b: round2.length });
  const grand = totals.addRow({ a: "Total contacts", b: rows.length });
  grand.font = { bold: true };
  totals.addRow({});

  const teamHead = totals.addRow({
    a: "By power team",
    b: "Contacts added",
    c: "Round 1",
    d: "Round 2",
    e: "Points scored",
  });
  teamHead.font = { bold: true };
  for (const team of TEAMS) {
    const mine = rows.filter((row) => row.submitterTeam === team.id);
    totals.addRow({
      a: team.name,
      b: mine.length,
      c: mine.filter((row) => row.round === 1).length,
      d: mine.filter((row) => row.round === 2).length,
      e: mine.reduce((sum, row) => sum + row.points, 0),
    });
  }
  totals.addRow({});

  // Who knows whom: the list the follow-up is organised from.
  const memberHead = totals.addRow({
    a: "By member — who to ask about each contact",
    b: "Contacts added",
    c: "Round 1",
    d: "Round 2",
    e: "Points scored",
  });
  memberHead.font = { bold: true };

  const byMember = new Map<string, WorkshopContact[]>();
  for (const row of rows) {
    const key = row.submitterName ?? UNKNOWN_MEMBER;
    byMember.set(key, [...(byMember.get(key) ?? []), row]);
  }
  const members = [...byMember.entries()].sort(
    (a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0], "en-GB"),
  );
  for (const [name, mine] of members) {
    totals.addRow({
      a: name,
      b: mine.length,
      c: mine.filter((row) => row.round === 1).length,
      d: mine.filter((row) => row.round === 2).length,
      e: mine.reduce((sum, row) => sum + row.points, 0),
    });
  }
  if (members.length === 0) {
    const none = totals.addRow({ a: "No contacts yet." });
    none.font = { italic: true, color: { argb: "FF8A8278" } };
  }

  const buffer = await book.xlsx.writeBuffer();
  const stamp = session.createdAt.toISOString().slice(0, 10);

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="dabbers-workshop-contacts-${stamp}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}

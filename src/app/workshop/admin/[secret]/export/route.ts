import ExcelJS from "exceljs";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { workshopContacts } from "@/db/schema";
import { isValidAdminSecret } from "@/lib/workshop/admin";
import { OTHER_SEAT, TEAMS, getTeam } from "@/lib/workshop/config";
import { getLiveSession } from "@/lib/workshop/session";

export const dynamic = "force-dynamic";

/**
 * One row per contact plus a summary tab, as Harry asked.
 *
 * No password on the file, but it is behind the admin secret and the subdomain
 * is noindexed, since these are third parties who did not hand their own
 * details over.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ secret: string }> },
) {
  const { secret } = await params;
  if (!isValidAdminSecret(secret)) {
    return new Response("Not found", { status: 404 });
  }

  const session = await getLiveSession();
  const rows = await db
    .select()
    .from(workshopContacts)
    .where(eq(workshopContacts.sessionId, session.id))
    .orderBy(asc(workshopContacts.createdAt));

  const book = new ExcelJS.Workbook();
  book.creator = "BNI Dabbers Growth Workshop";
  book.created = new Date();

  const sheet = book.addWorksheet("Contacts");
  sheet.columns = [
    { header: "Added at", key: "createdAt", width: 20 },
    { header: "Round", key: "round", width: 8 },
    { header: "Submitted by team", key: "submitterTeam", width: 22 },
    { header: "Seat team", key: "seatTeam", width: 22 },
    { header: "Seat", key: "seat", width: 28 },
    { header: "Category", key: "category", width: 26 },
    { header: "Contact name", key: "contactName", width: 24 },
    { header: "Company", key: "company", width: 26 },
    { header: "Phone", key: "phone", width: 18 },
    { header: "Email", key: "email", width: 28 },
    { header: "Points", key: "points", width: 8 },
  ];
  sheet.getRow(1).font = { bold: true };
  sheet.views = [{ state: "frozen", ySplit: 1 }];

  for (const row of rows) {
    sheet.addRow({
      createdAt: row.createdAt,
      round: row.round,
      submitterTeam: getTeam(row.submitterTeam)?.name ?? row.submitterTeam,
      seatTeam: getTeam(row.seatTeam)?.name ?? row.seatTeam,
      seat: row.seatIndex === OTHER_SEAT ? "Other" : row.category,
      category: row.category,
      contactName: row.contactName,
      company: row.company,
      phone: row.phone ?? "",
      email: row.email ?? "",
      points: row.points,
    });
  }
  sheet.getColumn("createdAt").numFmt = "dd/mm/yyyy hh:mm";

  const summary = book.addWorksheet("Summary");
  summary.columns = [
    { header: "Team", key: "team", width: 24 },
    { header: "Contacts added", key: "added", width: 16 },
    { header: "Points scored", key: "points", width: 16 },
    { header: "Own seats filled", key: "filled", width: 18 },
  ];
  summary.getRow(1).font = { bold: true };

  for (const team of TEAMS) {
    summary.addRow({
      team: team.name,
      added: rows.filter((r) => r.submitterTeam === team.id).length,
      points: rows
        .filter((r) => r.submitterTeam === team.id)
        .reduce((sum, r) => sum + r.points, 0),
      filled: rows.filter((r) => r.seatTeam === team.id && r.seatIndex !== OTHER_SEAT).length,
    });
  }
  summary.addRow({});
  summary.addRow({ team: "Chapter total", added: rows.length });
  summary.lastRow!.font = { bold: true };

  const buffer = await book.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "content-type":
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "content-disposition": `attachment; filename="dabbers-workshop-contacts-${stamp}.xlsx"`,
      "cache-control": "no-store",
    },
  });
}

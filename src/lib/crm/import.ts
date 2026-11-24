import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/db";
import { crmVisitors } from "@/db/schema";
import { addTimelineEntry, type CrmResult } from "@/lib/crm/visitors";
import { readVisitorCsv, type MappedRow } from "@/lib/crm/csv";
import { emailKey, normaliseText, phoneKey } from "@/lib/workshop/normalise";

/**
 * Bulk import, in two halves: work out what would happen, then do it.
 *
 * The plan is the point. Pasting a spreadsheet into somebody else's CRM is
 * the easiest way to make a mess that takes an afternoon to undo, so nothing
 * is written until a member has seen the count, the duplicates and the rows
 * that will be skipped. It is the same discipline as the reminder cron's dry
 * run, for the same reason: these are real people's records.
 */

export type ImportRowPlan = {
  /** 1-based row number in the file, header excluded, for error messages. */
  line: number;
  name: string;
  company: string | null;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  notes: string | null;
  /** add: will be created. skip: will not, and `problem` says why. */
  action: "add" | "skip";
  problem: string | null;
  /** Someone already in the chapter who looks like this row. */
  duplicateOf: string | null;
};

export type ImportPlan = {
  rows: ImportRowPlan[];
  willAdd: number;
  willSkip: number;
  duplicates: number;
  /** Columns in the file nobody asked for, named so the member can check. */
  ignoredColumns: string[];
};

const LIMITS = {
  name: 120,
  company: 80,
  category: 80,
  phone: 40,
  email: 120,
  website: 200,
  notes: 500,
} as const;

function clip(value: string | undefined, max: number): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, max) : null;
}

/**
 * An email has to look like one before it goes in an email column.
 *
 * Loose on purpose: this rejects "n/a" and "ask him", not unusual but valid
 * addresses. A row with a bad email is still imported, just without it.
 */
function looksLikeEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function planImport(
  chapterId: string,
  text: string,
): Promise<CrmResult<ImportPlan>> {
  const read = readVisitorCsv(text);
  if (!read.ok) return { ok: false, error: read.error };
  if (read.rows.length === 0) {
    return { ok: false, error: "That file has a header but no rows under it." };
  }

  const rows = read.rows.map((row, index) => toPlanRow(row, index + 1));

  // Two passes of duplicate checking. Within the file first, because a
  // spreadsheet that lists somebody twice should not create them twice.
  const seen = new Map<string, number>();
  for (const row of rows) {
    if (row.action === "skip") continue;
    const key = `${normaliseText(row.name)}|${normaliseText(row.company ?? "")}`;
    const first = seen.get(key);
    if (first !== undefined) {
      row.action = "skip";
      row.problem = `Same as row ${first} of this file.`;
      continue;
    }
    seen.set(key, row.line);
  }

  await markExistingDuplicates(chapterId, rows);

  return {
    ok: true,
    data: {
      rows,
      willAdd: rows.filter((row) => row.action === "add").length,
      willSkip: rows.filter((row) => row.action === "skip").length,
      duplicates: rows.filter((row) => row.duplicateOf !== null).length,
      ignoredColumns: read.ignored,
    },
  };
}

function toPlanRow(row: MappedRow, line: number): ImportRowPlan {
  const name = clip(row.name, LIMITS.name);
  const rawEmail = clip(row.email, LIMITS.email);
  const email = rawEmail && looksLikeEmail(rawEmail) ? rawEmail : null;

  const plan: ImportRowPlan = {
    line,
    name: name ?? "",
    company: clip(row.company, LIMITS.company),
    category: clip(row.category, LIMITS.category),
    phone: clip(row.phone, LIMITS.phone),
    email,
    website: clip(row.website, LIMITS.website),
    notes: clip(row.notes, LIMITS.notes),
    action: "add",
    problem: null,
    duplicateOf: null,
  };

  if (!name) {
    plan.action = "skip";
    plan.problem = "No name.";
    return plan;
  }
  if (rawEmail && !email) {
    // Worth saying out loud rather than silently dropping: the member can
    // fix the file, or accept the row without an address.
    plan.problem = `"${rawEmail}" is not an email address, so it was left out.`;
  }
  return plan;
}

/**
 * Flags rows that match somebody already in the chapter.
 *
 * A warning, never a refusal, which is the same rule the single "add a
 * visitor" form follows: two people really can share a name, and records
 * from two workshops are deliberately never merged. Archived people count,
 * because somebody archived after saying no is exactly who should be
 * flagged before a member starts again.
 */
async function markExistingDuplicates(
  chapterId: string,
  rows: ImportRowPlan[],
): Promise<void> {
  const live = rows.filter((row) => row.action === "add");
  if (live.length === 0) return;

  const nameKeys = [...new Set(live.map((row) => normaliseText(row.name)))];
  const phoneKeys = live
    .map((row) => phoneKey(row.phone))
    .filter((key): key is string => Boolean(key));
  const emailKeys = live
    .map((row) => emailKey(row.email))
    .filter((key): key is string => Boolean(key));

  // One read, narrowed to the keys this file actually mentions. Selecting
  // every visitor in the chapter and filtering in memory would work today at
  // 107 rows and quietly stop working later.
  const candidates = [
    inArray(crmVisitors.nameKey, nameKeys),
    phoneKeys.length > 0 ? inArray(crmVisitors.phoneKey, phoneKeys) : null,
    emailKeys.length > 0 ? inArray(crmVisitors.emailKey, emailKeys) : null,
  ].filter((clause): clause is NonNullable<typeof clause> => clause !== null);

  const existing = await db
    .select({
      name: crmVisitors.name,
      nameKey: crmVisitors.nameKey,
      companyKey: crmVisitors.companyKey,
      phoneKey: crmVisitors.phoneKey,
      emailKey: crmVisitors.emailKey,
      archivedAt: crmVisitors.archivedAt,
    })
    .from(crmVisitors)
    .where(and(eq(crmVisitors.chapterId, chapterId), or(...candidates)));

  for (const row of live) {
    const nKey = normaliseText(row.name);
    const cKey = normaliseText(row.company ?? "");
    const pKey = phoneKey(row.phone);
    const eKey = emailKey(row.email);

    // Name alone is not a match -- half the point of the import is adding
    // several people from one firm. Name AND company is, and so is a shared
    // phone or email whatever the name is spelt like.
    const match =
      existing.find(
        (found) => found.nameKey === nKey && found.companyKey === cKey,
      ) ??
      existing.find(
        (found) =>
          (pKey !== null && found.phoneKey === pKey) ||
          (eKey !== null && found.emailKey === eKey),
      ) ??
      null;

    if (match) {
      row.duplicateOf = match.archivedAt
        ? `${match.name} (archived)`
        : match.name;
    }
  }
}

export type ImportOutcome = { added: number; skipped: number };

/**
 * Writes the rows the plan said it would.
 *
 * Re-plans from the same text rather than trusting a list posted back from
 * the browser: the preview a member approved is a description of what to do,
 * not the instruction itself, and anything else would let an edited payload
 * write whatever it liked.
 *
 * `skipDuplicates` is the member's answer to the warning, so it is the one
 * thing the browser does get to decide.
 */
export async function runImport(
  chapterId: string,
  memberId: string,
  memberName: string,
  text: string,
  options: { skipDuplicates: boolean },
): Promise<CrmResult<ImportOutcome>> {
  const planned = await planImport(chapterId, text);
  if (!planned.ok) return planned;

  const wanted = planned.data.rows.filter(
    (row) =>
      row.action === "add" &&
      (!options.skipDuplicates || row.duplicateOf === null),
  );

  if (wanted.length === 0) {
    return { ok: false, error: "Nothing to import once the skips are taken out." };
  }

  const inserted = await db
    .insert(crmVisitors)
    .values(
      wanted.map((row) => ({
        chapterId,
        name: row.name,
        company: row.company,
        phone: row.phone,
        email: row.email,
        website: row.website,
        category: row.category,
        addedByMemberId: memberId,
        nameKey: normaliseText(row.name),
        companyKey: normaliseText(row.company ?? ""),
        phoneKey: phoneKey(row.phone),
        emailKey: emailKey(row.email),
      })),
    )
    .returning({ id: crmVisitors.id });

  // One timeline entry per person, so an imported record reads the same as a
  // hand-typed one: you can always see where somebody came from.
  for (const [index, created] of inserted.entries()) {
    const row = wanted[index];
    await addTimelineEntry({
      chapterId,
      visitorId: created.id,
      authorMemberId: memberId,
      kind: "system",
      body: `${memberName} imported this one from a spreadsheet`,
    });
    if (row?.notes) {
      await addTimelineEntry({
        chapterId,
        visitorId: created.id,
        authorMemberId: memberId,
        kind: "note",
        body: row.notes,
      });
    }
  }

  return {
    ok: true,
    data: {
      added: inserted.length,
      skipped: planned.data.rows.length - inserted.length,
    },
  };
}

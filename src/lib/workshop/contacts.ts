import { and, asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { members, workshopContacts, type WorkshopContact } from "@/db/schema";
import {
  NAMES_PER_SEAT,
  OTHER_SEAT,
  POINTS_NORMAL,
  POINTS_TRIPLE,
  TEAMS,
  getTeam,
  isTeamId,
  type TeamId,
} from "@/lib/workshop/config";
import {
  emailKey,
  isSamePerson,
  normaliseText,
  phoneKey,
} from "@/lib/workshop/normalise";

/**
 * Names from Harry's spec, kept as a floor under the live roster.
 *
 * The live roster is the real source (it has since grown to 36, and a member
 * missing from this list must still be blocked), but if the roster query fails
 * mid-session we would rather over-block than let a member through.
 */
const SPEC_ROSTER = [
  "Benjamin Warr-Barnes", "Daniel Corden", "Danny Bland", "James Starkey",
  "Roy Chesworth", "Dale Cox", "Daniel Scott", "Oliver Cooper", "Travis Alcott",
  "Lauren Tudor", "Jon Griffiths", "Layla Dean", "Kyle Watt", "Richard Capener",
  "Megan Gilsenan", "Joel Dovey", "Penelope Trotman", "Matt Fludgate",
  "Jason Munnelly", "Jamie Riseley", "Jack Beaumont", "Cheryl Mckay",
  "Robert Adams", "Jez Touch", "Harry Heath", "Martin Neal", "Bex Widdowson",
  "Heather Pritchett", "Lee Taylor", "Lisa Gallimore", "Ryan McCandless",
  "Darren Page", "Sam Taylor", "Marc Halstead",
];

/** Current members, from the live roster where available, else the spec list. */
export async function getBlockedNames(): Promise<string[]> {
  try {
    const rows = await db
      .select({ first: members.firstName, last: members.lastName })
      .from(members)
      .where(eq(members.status, "active"));
    const live = rows.map((r) => `${r.first} ${r.last}`);
    return [...new Set([...live, ...SPEC_ROSTER])];
  } catch {
    return SPEC_ROSTER;
  }
}

export type SubmitInput = {
  submitterTeam: string;
  seatTeam: string;
  seatIndex: number;
  contactName: string;
  company: string;
  category: string;
  phone: string;
  email: string;
};

export type SubmitResult =
  | { ok: true; contact: WorkshopContact }
  | { ok: false; error: string };

type ValidInput = Omit<SubmitInput, "submitterTeam" | "seatTeam"> & {
  submitterTeam: TeamId;
  seatTeam: TeamId;
};

/** Shape checks that do not need the database. */
export function validateInput(input: SubmitInput): { ok: true; value: ValidInput } | { ok: false; error: string } {
  if (!isTeamId(input.submitterTeam) || !isTeamId(input.seatTeam)) {
    return { ok: false, error: "Pick your power team before adding a contact." };
  }

  const isOther = input.seatIndex === OTHER_SEAT;
  if (!isOther && (input.seatIndex < 0 || input.seatIndex >= 5)) {
    return { ok: false, error: "Pick which key seat this contact fits." };
  }

  const name = input.contactName.trim();
  const company = input.company.trim();
  const category = input.category.trim();

  if (!name || !company) {
    return { ok: false, error: "Contact name and company are needed." };
  }
  if (isOther && !category) {
    return {
      ok: false,
      error: "Contact name, company and their category are needed, so we know who they are.",
    };
  }

  return {
    ok: true,
    value: {
      ...input,
      submitterTeam: input.submitterTeam,
      seatTeam: input.seatTeam,
      contactName: name,
      company,
      category,
    },
  };
}

type PgErrorish = { code?: string; constraint?: string; message?: string; cause?: unknown };

/**
 * Drizzle wraps driver errors in a DrizzleQueryError, so the Postgres `code`
 * and `constraint` sit on the cause rather than the error we catch.
 */
function rootCause(error: unknown): PgErrorish {
  let current = error as PgErrorish;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && current.cause && !seen.has(current)) {
    seen.add(current);
    current = current.cause as PgErrorish;
  }
  return current ?? {};
}

function constraintOf(error: unknown): string {
  const cause = rootCause(error);
  const text = `${cause.constraint ?? ""} ${cause.message ?? ""} ${(error as PgErrorish)?.message ?? ""}`;
  if (text.includes("person_idx")) return "person";
  if (text.includes("phone_idx")) return "phone";
  if (text.includes("email_idx")) return "email";
  return "";
}

function isUniqueViolation(error: unknown): boolean {
  const cause = rootCause(error);
  if (cause.code === "23505" || (error as PgErrorish)?.code === "23505") return true;
  const text = `${cause.message ?? ""} ${(error as PgErrorish)?.message ?? ""}`;
  return text.includes("duplicate key");
}

/**
 * Inserts a contact, awarding triple points when the seat is already full.
 *
 * Points are decided inside the INSERT so two phones filling the last slot at
 * the same moment cannot both read "3 names so far". Duplicates are caught by
 * the unique indexes rather than a read-then-write, for the same reason.
 */
export async function submitContact(
  sessionId: string,
  round: 1 | 2,
  input: SubmitInput,
  blockedNames: string[],
): Promise<SubmitResult> {
  const parsed = validateInput(input);
  if (!parsed.ok) return parsed;
  const value = parsed.value;

  const clash = blockedNames.find((member) => isSamePerson(value.contactName, member));
  if (clash) {
    return {
      ok: false,
      error: `${value.contactName} is already a Dabbers member. We're looking for people outside BNI.`,
    };
  }

  const isOther = value.seatIndex === OTHER_SEAT;
  const seatName = isOther
    ? value.category
    : (getTeam(value.seatTeam)?.seats[value.seatIndex] ?? value.category);

  const nameKey = normaliseText(value.contactName);
  const companyKey = normaliseText(value.company);
  const pKey = phoneKey(value.phone);
  const eKey = emailKey(value.email);

  // The scoring numbers are inlined rather than bound as parameters: the Neon
  // HTTP driver sends every parameter as text, so a CASE whose branches are
  // both parameters resolves to text and Postgres refuses to store it in an
  // integer column. These are module constants, never user input.
  const seatFull = sql.raw(String(NAMES_PER_SEAT));
  const triple = sql.raw(String(POINTS_TRIPLE));
  const single = sql.raw(String(POINTS_NORMAL));

  // "Other" never fills a seat, so it always scores a single point.
  const pointsExpr = isOther
    ? sql`${single}`
    : sql`(case when (
        select count(*) from ${workshopContacts}
        where ${workshopContacts.sessionId} = ${sessionId}
          and ${workshopContacts.seatTeam} = ${value.seatTeam}
          and ${workshopContacts.seatIndex} = ${value.seatIndex}
      ) >= ${seatFull} then ${triple} else ${single} end)`;

  try {
    const [row] = await db
      .insert(workshopContacts)
      .values({
        sessionId,
        round,
        submitterTeam: value.submitterTeam,
        seatTeam: value.seatTeam,
        seatIndex: value.seatIndex,
        category: seatName,
        contactName: value.contactName,
        company: value.company,
        phone: value.phone.trim() || null,
        email: value.email.trim() || null,
        points: pointsExpr as unknown as number,
        nameKey,
        companyKey,
        phoneKey: pKey,
        emailKey: eKey,
      })
      .returning();

    return { ok: true, contact: row! };
  } catch (error) {
    if (!isUniqueViolation(error)) throw error;

    const which = constraintOf(error);
    const existing = await findExisting(sessionId, { nameKey, companyKey, pKey, eKey, which });
    const byTeam = existing ? getTeam(existing.submitterTeam)?.name : null;

    if (which === "phone") {
      return { ok: false, error: `That phone number is already on the list${byTeam ? `, added by ${byTeam}` : ""}.` };
    }
    if (which === "email") {
      return { ok: false, error: `That email address is already on the list${byTeam ? `, added by ${byTeam}` : ""}.` };
    }
    return {
      ok: false,
      error: `${value.contactName} at ${value.company} is already on the list${byTeam ? `, added by ${byTeam}` : ""}.`,
    };
  }
}

async function findExisting(
  sessionId: string,
  keys: { nameKey: string; companyKey: string; pKey: string | null; eKey: string | null; which: string },
) {
  const match =
    keys.which === "phone" && keys.pKey
      ? eq(workshopContacts.phoneKey, keys.pKey)
      : keys.which === "email" && keys.eKey
        ? eq(workshopContacts.emailKey, keys.eKey)
        : and(
            eq(workshopContacts.nameKey, keys.nameKey),
            eq(workshopContacts.companyKey, keys.companyKey),
          );

  const [row] = await db
    .select()
    .from(workshopContacts)
    .where(and(eq(workshopContacts.sessionId, sessionId), match))
    .limit(1);
  return row;
}

export type SeatProgress = { filled: number; total: number };

export type BoardSnapshot = {
  totalContacts: number;
  points: Record<TeamId, number>;
  /** Names per seat, capped at NAMES_PER_SEAT for display. */
  seats: Record<TeamId, number[]>;
  /** Uncapped counts, so the admin and export can see the real numbers. */
  seatsRaw: Record<TeamId, number[]>;
  recent: Array<{ id: string; category: string; byTeam: TeamId; points: number }>;
};

export async function getBoardSnapshot(sessionId: string): Promise<BoardSnapshot> {
  const rows = await db
    .select()
    .from(workshopContacts)
    .where(eq(workshopContacts.sessionId, sessionId))
    .orderBy(asc(workshopContacts.createdAt));

  const points = {} as Record<TeamId, number>;
  const seats = {} as Record<TeamId, number[]>;
  const seatsRaw = {} as Record<TeamId, number[]>;
  for (const team of TEAMS) {
    points[team.id] = 0;
    seats[team.id] = [0, 0, 0, 0, 0];
    seatsRaw[team.id] = [0, 0, 0, 0, 0];
  }

  for (const row of rows) {
    if (isTeamId(row.submitterTeam)) points[row.submitterTeam] += row.points;
    if (isTeamId(row.seatTeam) && row.seatIndex >= 0 && row.seatIndex < 5) {
      seatsRaw[row.seatTeam][row.seatIndex]! += 1;
      seats[row.seatTeam][row.seatIndex] = Math.min(
        NAMES_PER_SEAT,
        seatsRaw[row.seatTeam][row.seatIndex]!,
      );
    }
  }

  const recent = rows
    .slice(-7)
    .reverse()
    .filter((row) => isTeamId(row.submitterTeam))
    .map((row) => ({
      id: row.id,
      category: row.category,
      byTeam: row.submitterTeam as TeamId,
      points: row.points,
    }));

  return { totalContacts: rows.length, points, seats, seatsRaw, recent };
}

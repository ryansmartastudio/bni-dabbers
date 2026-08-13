import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, type Member } from "@/db/schema";

const memberNameOrder = [asc(members.firstName), asc(members.lastName)];

export async function getAllMembers(): Promise<Member[]> {
  const rows = await db.query.members.findMany({
    orderBy: memberNameOrder,
  });
  return sortMembersWithPinnedLast(rows);
}

export async function getActiveMembers(): Promise<Member[]> {
  const rows = await db.query.members.findMany({
    where: eq(members.status, "active"),
    orderBy: memberNameOrder,
  });
  return sortMembersWithPinnedLast(rows);
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  return db.query.members.findFirst({ where: eq(members.id, id) });
}

export async function getMemberBySlug(slug: string): Promise<Member | undefined> {
  const bySlug = await db.query.members.findFirst({
    where: eq(members.slug, slug),
  });
  if (bySlug) return bySlug;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (uuidPattern.test(slug)) {
    return getMemberById(slug);
  }

  return undefined;
}

export function slugifyMemberName(
  member: Pick<Member, "firstName" | "lastName">,
) {
  return `${member.firstName}-${member.lastName}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function buildUniqueMemberSlug(
  member: Pick<Member, "firstName" | "lastName" | "company">,
  excludeId?: string,
) {
  const base = slugifyMemberName(member);
  const companySuffix = member.company
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);

  const candidates = [
    base,
    companySuffix ? `${base}-${companySuffix}` : null,
    ...Array.from({ length: 20 }, (_, index) => `${base}-${index + 2}`),
  ].filter(Boolean) as string[];

  for (const candidate of candidates) {
    const existing = await db.query.members.findFirst({
      where: eq(members.slug, candidate),
    });
    if (!existing || existing.id === excludeId) {
      return candidate;
    }
  }

  return `${base}-${crypto.randomUUID().slice(0, 8)}`;
}

export function getMemberProfilePath(member: Pick<Member, "id" | "slug">) {
  return `/directory/${member.slug ?? member.id}`;
}

export function getMemberDisplayName(member: Pick<Member, "firstName" | "lastName">) {
  return `${member.firstName} ${member.lastName}`;
}

export function normalizeWebsiteUrl(url: string) {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function formatWebsiteLabel(url: string) {
  return url.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function formatChapterRoles(roles: string[] | null | undefined) {
  if (!roles?.length) return "";
  return roles.join(" · ");
}

export function hasChapterRoles(roles: string[] | null | undefined) {
  return Boolean(roles?.length);
}

function compareMembersByName(
  a: Pick<Member, "firstName" | "lastName">,
  b: Pick<Member, "firstName" | "lastName">,
) {
  const byFirst = a.firstName.localeCompare(b.firstName, undefined, {
    sensitivity: "base",
  });
  if (byFirst !== 0) return byFirst;
  return a.lastName.localeCompare(b.lastName, undefined, {
    sensitivity: "base",
  });
}

/** Alphabetical order, with bookletAtBottom members last. */
export function sortMembersWithPinnedLast(membersList: Member[]) {
  const regular = membersList.filter((member) => !member.bookletAtBottom);
  const bottom = membersList.filter((member) => member.bookletAtBottom);
  return [
    ...regular.sort(compareMembersByName),
    ...bottom.sort(compareMembersByName),
  ];
}

export const sortMembersForBooklet = sortMembersWithPinnedLast;

export function getMembersByRoleGroup(membersList: Member[]) {
  return {
    leadership: membersList.filter(
      (m) => m.roleGroup === "leadership" && hasChapterRoles(m.chapterRoles),
    ),
    support: membersList.filter(
      (m) => m.roleGroup === "support" && hasChapterRoles(m.chapterRoles),
    ),
    committee: membersList.filter(
      (m) => m.roleGroup === "committee" && hasChapterRoles(m.chapterRoles),
    ),
  };
}

import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, type Member } from "@/db/schema";

const memberNameOrder = [asc(members.firstName), asc(members.lastName)];

export async function getAllMembers(): Promise<Member[]> {
  return db.query.members.findMany({
    orderBy: memberNameOrder,
  });
}

export async function getActiveMembers(): Promise<Member[]> {
  return db.query.members.findMany({
    where: eq(members.status, "active"),
    orderBy: memberNameOrder,
  });
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  return db.query.members.findFirst({ where: eq(members.id, id) });
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

/** Meeting sheet member pages: alphabetical, with pinned members last. */
export function sortMembersForBooklet(membersList: Member[]) {
  const regular = membersList.filter((member) => !member.bookletAtBottom);
  const bottom = membersList.filter((member) => member.bookletAtBottom);
  return [
    ...regular.sort(compareMembersByName),
    ...bottom.sort(compareMembersByName),
  ];
}

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

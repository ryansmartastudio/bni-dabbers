import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { members, type Member } from "@/db/schema";

export async function getAllMembers(): Promise<Member[]> {
  return db.query.members.findMany({
    orderBy: [asc(members.sortOrder), asc(members.lastName)],
  });
}

export async function getActiveMembers(): Promise<Member[]> {
  return db.query.members.findMany({
    where: eq(members.status, "active"),
    orderBy: [asc(members.sortOrder), asc(members.lastName)],
  });
}

export async function getMemberById(id: string): Promise<Member | undefined> {
  return db.query.members.findFirst({ where: eq(members.id, id) });
}

export function getMemberDisplayName(member: Pick<Member, "firstName" | "lastName">) {
  return `${member.firstName} ${member.lastName}`;
}

export function getMembersByRoleGroup(membersList: Member[]) {
  return {
    leadership: membersList.filter(
      (m) => m.roleGroup === "leadership" && m.chapterRole,
    ),
    support: membersList.filter(
      (m) => m.roleGroup === "support" && m.chapterRole,
    ),
    committee: membersList.filter(
      (m) => m.roleGroup === "committee" && m.chapterRole,
    ),
  };
}

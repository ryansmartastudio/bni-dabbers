export const BNI_RED = "#cf1f2e";
export const BNI_GREY = "#6b6b6f";

export const CHAPTER_ROLES = [
  "President",
  "Vice President",
  "Secretary/Treasurer",
  "Membership Committee",
  "Visitor Host",
  "Education Coordinator",
  "Mentor Coordinator",
  "Growth Coordinator",
  "Events Coordinator",
  "Communications Coordinator",
] as const;

export function isPresetChapterRole(
  role: string,
): role is (typeof CHAPTER_ROLES)[number] {
  return (CHAPTER_ROLES as readonly string[]).includes(role);
}

export function getChapterRolesFormState(chapterRoles?: string[] | null) {
  const roles = chapterRoles ?? [];
  return {
    presetRoles: roles.filter(isPresetChapterRole),
    otherRoles: roles.filter((role) => !isPresetChapterRole(role)),
  };
}

export const ROLE_GROUPS = [
  { value: "leadership", label: "Leadership Team" },
  { value: "support", label: "Supporting Roles" },
  { value: "committee", label: "Committee Members" },
  { value: "none", label: "None" },
] as const;

export const MEMBER_STATUSES = [
  { value: "active", label: "Active" },
  { value: "on_leave", label: "On Leave" },
  { value: "former", label: "Former" },
] as const;

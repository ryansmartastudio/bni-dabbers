import type { CoreValue } from "@/db/schema";

export const CORE_VALUE_ICON_OPTIONS = [
  { key: "gift", label: "Gift" },
  { key: "landmark", label: "Landmark" },
  { key: "users", label: "People" },
  { key: "clipboard-check", label: "Accountability" },
  { key: "book-open", label: "Learning" },
  { key: "sun", label: "Positive attitude" },
  { key: "trophy", label: "Trophy" },
  { key: "heart", label: "Heart" },
  { key: "handshake", label: "Handshake" },
  { key: "star", label: "Star" },
  { key: "lightbulb", label: "Innovation" },
] as const;

export type CoreValueIconKey = (typeof CORE_VALUE_ICON_OPTIONS)[number]["key"];

export const DEFAULT_CORE_VALUES: CoreValue[] = [
  {
    id: "givers-gain",
    title: "Givers Gain®",
    description:
      "Only by giving to others first will we ever be able to receive.",
    iconKey: "gift",
  },
  {
    id: "traditions-innovation",
    title: "Traditions + Innovation",
    description: "We honour the past while embracing the future.",
    iconKey: "landmark",
  },
  {
    id: "building-relationships",
    title: "Building Relationships",
    description: "Relationships are the foundation of every successful business.",
    iconKey: "users",
  },
  {
    id: "accountability",
    title: "Accountability",
    description: "We hold ourselves accountable for our actions and results.",
    iconKey: "clipboard-check",
  },
  {
    id: "lifelong-learning",
    title: "Lifelong Learning",
    description: "Continuous improvement through education and personal growth.",
    iconKey: "book-open",
  },
  {
    id: "positive-attitude",
    title: "Positive Attitude",
    description: "A positive mindset creates positive outcomes for everyone.",
    iconKey: "sun",
  },
  {
    id: "recognition",
    title: "Recognition",
    description:
      "We celebrate achievements and acknowledge the contributions of our members.",
    iconKey: "trophy",
  },
];

export function normalizeCoreValues(values?: CoreValue[] | null): CoreValue[] {
  if (!values?.length) return DEFAULT_CORE_VALUES;

  const byId = new Map(values.map((value) => [value.id, value]));

  return DEFAULT_CORE_VALUES.map((defaultValue, index) => {
    const saved = byId.get(defaultValue.id);
    if (!saved) return { ...defaultValue };

    return {
      id: saved.id || defaultValue.id,
      title: saved.title?.trim() || defaultValue.title,
      description: saved.description?.trim() || defaultValue.description,
      iconKey: saved.iconKey || defaultValue.iconKey,
      iconUrl: saved.iconUrl || null,
    };
  }).concat(
    values
      .filter(
        (value) =>
          !DEFAULT_CORE_VALUES.some((defaultValue) => defaultValue.id === value.id),
      )
      .map((value, index) => ({
        id: value.id || `core-value-extra-${index}`,
        title: value.title?.trim() || "Core value",
        description: value.description?.trim() || "",
        iconKey: value.iconKey || "star",
        iconUrl: value.iconUrl || null,
      })),
  );
}

export function isCoreValueIconKey(value: string): value is CoreValueIconKey {
  return CORE_VALUE_ICON_OPTIONS.some((option) => option.key === value);
}

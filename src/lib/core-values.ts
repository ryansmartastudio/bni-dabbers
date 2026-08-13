import type { CoreValue } from "@/db/schema";

export const CORE_VALUE_ICON_OPTIONS = [
  { key: "handshake-angle", label: "Handshake angle" },
  { key: "lightbulb-on", label: "Lightbulb on" },
  { key: "user-group", label: "User group" },
  { key: "shield-check", label: "Shield check" },
  { key: "graduation-cap", label: "Graduation cap" },
  { key: "face-smile", label: "Face smile" },
  { key: "trophy", label: "Trophy" },
  { key: "heart", label: "Heart" },
  { key: "handshake", label: "Handshake" },
  { key: "star", label: "Star" },
  { key: "lightbulb", label: "Lightbulb" },
] as const;

export type CoreValueIconKey = (typeof CORE_VALUE_ICON_OPTIONS)[number]["key"];

const LEGACY_CORE_VALUE_ICON_KEYS: Record<string, CoreValueIconKey> = {
  gift: "handshake-angle",
  landmark: "lightbulb-on",
  users: "user-group",
  "clipboard-check": "shield-check",
  "book-open": "graduation-cap",
  sun: "face-smile",
};

export function resolveCoreValueIconKey(iconKey: string): CoreValueIconKey {
  if (isCoreValueIconKey(iconKey)) return iconKey;
  return LEGACY_CORE_VALUE_ICON_KEYS[iconKey] ?? "star";
}

export const DEFAULT_CORE_VALUES: CoreValue[] = [
  {
    id: "givers-gain",
    title: "Givers Gain®",
    description:
      "Only by giving to others first will we ever be able to receive.",
    iconKey: "handshake-angle",
  },
  {
    id: "traditions-innovation",
    title: "Traditions + Innovation",
    description: "We honour the past while embracing the future.",
    iconKey: "lightbulb-on",
  },
  {
    id: "building-relationships",
    title: "Building Relationships",
    description: "Relationships are the foundation of every successful business.",
    iconKey: "user-group",
  },
  {
    id: "accountability",
    title: "Accountability",
    description: "We hold ourselves accountable for our actions and results.",
    iconKey: "shield-check",
  },
  {
    id: "lifelong-learning",
    title: "Lifelong Learning",
    description: "Continuous improvement through education and personal growth.",
    iconKey: "graduation-cap",
  },
  {
    id: "positive-attitude",
    title: "Positive Attitude",
    description: "A positive mindset creates positive outcomes for everyone.",
    iconKey: "face-smile",
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

  return DEFAULT_CORE_VALUES.map((defaultValue) => {
    const saved = byId.get(defaultValue.id);
    if (!saved) return { ...defaultValue };

    return {
      id: saved.id || defaultValue.id,
      title: saved.title?.trim() || defaultValue.title,
      description: saved.description?.trim() || defaultValue.description,
      iconKey: resolveCoreValueIconKey(saved.iconKey || defaultValue.iconKey),
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
        iconKey: resolveCoreValueIconKey(value.iconKey || "star"),
        iconUrl: value.iconUrl || null,
      })),
  );
}

export function isCoreValueIconKey(value: string): value is CoreValueIconKey {
  return CORE_VALUE_ICON_OPTIONS.some((option) => option.key === value);
}

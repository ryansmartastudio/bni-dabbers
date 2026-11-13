/**
 * Matching keys for the Contact Collector.
 *
 * Everything here is pure so it can be reasoned about and tested without a
 * database. The keys produced back the unique indexes on `workshop_contacts`,
 * so a change here needs a reindex, not just a deploy.
 */

/** Lower-cases, strips punctuation and collapses whitespace. */
export function normaliseText(value: string | null | undefined): string {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[’'`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * UK phone numbers, reduced so `+44 7700 900111`, `07700 900111` and
 * `7700900111` all land on the same key.
 */
export function phoneKey(value: string | null | undefined): string | null {
  const raw = String(value ?? "").replace(/[^\d+]/g, "");
  if (!raw) return null;

  let digits = raw.replace(/\+/g, "");
  if (digits.startsWith("44")) digits = `0${digits.slice(2)}`;
  else if (digits.length === 10 && digits.startsWith("7")) digits = `0${digits}`;

  return digits.length >= 7 ? digits : null;
}

export function emailKey(value: string | null | undefined): string | null {
  const raw = String(value ?? "").trim().toLowerCase();
  return raw.includes("@") ? raw : null;
}

/**
 * Diminutives seen on the Dabbers roster, plus the common UK ones a guest's
 * name might arrive as. Used only to decide whether a submitted contact is
 * really an existing member — never for deduping guests against each other.
 */
const NICKNAMES: Record<string, string> = {
  ben: "benjamin",
  benji: "benjamin",
  bex: "rebecca",
  becky: "rebecca",
  bob: "robert",
  bobby: "robert",
  rob: "robert",
  robbie: "robert",
  dan: "daniel",
  danny: "daniel",
  dave: "david",
  davy: "david",
  jim: "james",
  jimmy: "james",
  jamie: "james",
  jon: "jonathan",
  jonny: "jonathan",
  john: "jonathan",
  kate: "katherine",
  katie: "katherine",
  liz: "elizabeth",
  lizzie: "elizabeth",
  matt: "matthew",
  matty: "matthew",
  mike: "michael",
  micky: "michael",
  nick: "nicholas",
  penny: "penelope",
  pen: "penelope",
  pete: "peter",
  rich: "richard",
  richie: "richard",
  rick: "richard",
  sam: "samuel",
  sammy: "samuel",
  steve: "stephen",
  steven: "stephen",
  tom: "thomas",
  tommy: "thomas",
  will: "william",
  billy: "william",
  chris: "christopher",
  greg: "gregory",
  andy: "andrew",
  tony: "anthony",
  gaz: "gary",
  jez: "jeremy",
  harry: "henry",
};

export function canonicalFirstName(first: string): string {
  return NICKNAMES[first] ?? first;
}

export type NameParts = {
  /** First name with diminutives resolved, e.g. "ben" -> "benjamin". */
  first: string;
  /** Everything after the first name, e.g. "warr barnes". */
  last: string;
};

/**
 * Splits a name for member matching. The surname keeps every remaining token,
 * so "Warr-Barnes" and "Warr Barnes" agree.
 */
export function nameParts(value: string): NameParts | null {
  const tokens = normaliseText(value).split(" ").filter(Boolean);
  if (tokens.length === 0) return null;
  const [first, ...rest] = tokens;
  if (rest.length === 0) return { first: canonicalFirstName(first!), last: "" };
  return { first: canonicalFirstName(first!), last: rest.join(" ") };
}

/**
 * True when a submitted contact looks like an existing chapter member.
 *
 * Requires the surname to match in full and the first names to agree once
 * diminutives are resolved. Matching on surname plus initial was rejected
 * deliberately: the roster holds both a Lee Taylor and a Sam Taylor, so a
 * genuine guest called Sarah Taylor would have been blocked.
 */
export function isSamePerson(a: string, b: string): boolean {
  const left = nameParts(a);
  const right = nameParts(b);
  if (!left || !right) return false;
  if (left.last === "" || right.last === "") return false;
  return left.first === right.first && left.last === right.last;
}

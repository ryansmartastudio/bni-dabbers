/**
 * Minimal vCard reader for the iPhone import path.
 *
 * iOS Safari has no Contact Picker API, so the only real "import a contact" is
 * a .vcf shared out of Contacts. Handles 2.1/3.0/4.0, line folding and the
 * quoted-printable encoding older exports still use.
 */

export type ParsedContact = {
  name: string;
  company: string;
  phone: string;
  email: string;
};

function unfold(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    // A leading space or tab continues the previous line.
    if (/^[ \t]/.test(line) && out.length > 0) out[out.length - 1] += line.slice(1);
    else out.push(line);
  }
  return out;
}

function decodeQuotedPrintable(value: string): string {
  const joined = value.replace(/=\n/g, "");
  try {
    const bytes = joined.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
    return decodeURIComponent(escape(bytes));
  } catch {
    return joined.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16)),
    );
  }
}

function unescapeValue(value: string): string {
  return value
    .replace(/\\n/gi, " ")
    .replace(/\\,/g, ",")
    .replace(/\;/g, ";")
    .replace(/\\\\/g, "\\")
    .trim();
}

export function parseVCard(text: string): ParsedContact | null {
  const lines = unfold(text);
  let fn = "";
  let structuredName = "";
  let org = "";
  let phone = "";
  let email = "";

  for (const line of lines) {
    const colon = line.indexOf(":");
    if (colon === -1) continue;

    const rawKey = line.slice(0, colon);
    let value = line.slice(colon + 1);
    const [property, ...params] = rawKey.split(";");
    const key = (property ?? "").toUpperCase().replace(/^ITEM\d+\./, "");

    if (params.some((p) => /QUOTED-PRINTABLE/i.test(p))) value = decodeQuotedPrintable(value);
    value = unescapeValue(value);
    if (!value) continue;

    if (key === "FN" && !fn) fn = value;
    else if (key === "N" && !structuredName) {
      // N is Family;Given;Middle;Prefix;Suffix
      const [family = "", given = ""] = value.split(";");
      structuredName = [given, family].filter(Boolean).join(" ").trim();
    } else if (key === "ORG" && !org) org = value.split(";").filter(Boolean)[0] ?? "";
    else if (key === "TEL" && !phone) phone = value;
    else if (key === "EMAIL" && !email) email = value;
  }

  const name = fn || structuredName;
  if (!name && !org && !phone && !email) return null;

  return { name, company: org, phone, email };
}

/* ---------------------------------------------------------------------------
   Pasted text.

   Samsung Internet has no Contact Picker API and no setting that adds one,
   and sharing a contact straight into a file input hands back an empty stub,
   so neither import route exists on the browser a good share of the room
   uses. What every browser does have is the clipboard: share the person out
   of Contacts as text, or copy the fields, and paste the lot in here.

   Deliberately forgiving, because what lands on the clipboard differs by
   phone, by Contacts app and by which share option was tapped. It reads a
   whole vCard, Samsung's labelled "Mobile: …" lines, and a bare block of
   name / company / number. Anything it gets wrong is visible and editable in
   the form before it is saved, so guessing beats refusing.
   --------------------------------------------------------------------------- */

const EMAIL_RE = /[A-Za-z0-9._%+'-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/;

const LABELS = new Map<string, keyof ParsedContact>([
  ["name", "name"],
  ["full name", "name"],
  ["contact", "name"],
  ["company", "company"],
  ["organisation", "company"],
  ["organization", "company"],
  ["org", "company"],
  ["employer", "company"],
  ["business", "company"],
  ["phone", "phone"],
  ["telephone", "phone"],
  ["tel", "phone"],
  ["mobile", "phone"],
  ["mobile phone", "phone"],
  ["cell", "phone"],
  ["cell phone", "phone"],
  ["number", "phone"],
  ["home", "phone"],
  ["work", "phone"],
  ["email", "email"],
  ["e-mail", "email"],
  ["mail", "email"],
]);

function digitCount(value: string): number {
  return (value.match(/\d/g) ?? []).length;
}

/** The first run in `value` that could be dialled, or null. */
function firstPhone(value: string): string | null {
  // The optional opening bracket matters: without it "(0161) 123 4567"
  // starts matching at the 0 and comes back missing its first character.
  const re = /\(?\+?\d[\d\s().\-]{5,20}/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(value)) !== null) {
    const raw = match[0].replace(/[\s.\-(]+$/, "").trim();
    const digits = digitCount(raw);
    // Seven digits is the shortest real UK local number; anything past
    // fifteen is an account number or a run of two things stuck together.
    if (digits >= 7 && digits <= 15) return raw.replace(/\s{2,}/g, " ");
  }
  return null;
}

function tidy(value: string): string {
  return value.replace(/^[\s,;|·•\-–—]+/, "").replace(/[\s,;|·•\-–—]+$/, "").trim();
}

/** Could this stand in as a person's name or a company's? */
function looksLikeWords(value: string): boolean {
  return value.length > 1 && value.length < 80 && /\p{L}/u.test(value) && digitCount(value) < 4;
}

function parseLooseContact(text: string): ParsedContact | null {
  let name = "";
  let company = "";
  let phone = "";
  let email = "";
  const unlabelled: string[] = [];

  const lines = text
    .split(/[\r\n]+/)
    .map((line) => line.trim())
    .filter(Boolean);

  // Labelled lines first: "Mobile: 07700 900123" tells us more than any
  // amount of guessing at position can.
  for (const line of lines) {
    const match = /^([\p{L}][\p{L} \-]{1,20}?)\s*[:\t]\s*(.+)$/u.exec(line);
    const slot = match ? LABELS.get(match[1].toLowerCase().replace(/\s+/g, " ")) : undefined;
    const value = match && slot ? tidy(match[2]) : line;

    if (!slot) {
      unlabelled.push(line);
      continue;
    }

    // A label only counts if the value behind it fits: Samsung labels an
    // address "Home" as readily as it labels a landline.
    if (slot === "email") {
      const found = EMAIL_RE.exec(value);
      if (found && !email) email = found[0];
    } else if (slot === "phone") {
      const found = firstPhone(value);
      if (found && !phone) phone = found;
    } else if (slot === "company") {
      if (!company && looksLikeWords(value)) company = value;
    } else if (slot === "name") {
      if (!name && looksLikeWords(value)) name = value;
    }
  }

  // Then sweep what is left for an address and a number wherever they sit,
  // cutting each out so the words around them can still be read as a name.
  const leftovers: string[] = [];
  for (const line of unlabelled) {
    let rest = line;
    if (!email) {
      const found = EMAIL_RE.exec(rest);
      if (found) {
        email = found[0];
        rest = rest.replace(found[0], " ");
      }
    } else {
      rest = rest.replace(EMAIL_RE, " ");
    }
    if (!phone) {
      const found = firstPhone(rest);
      if (found) {
        phone = found;
        rest = rest.replace(found, " ");
      }
    }
    const remainder = tidy(rest);
    if (looksLikeWords(remainder)) leftovers.push(remainder);
  }

  // First line that reads as words is the person, the next is where they
  // work. Wrong often enough that it would be a bad guess to save, which is
  // exactly why it lands in the form rather than in the database.
  if (!name && leftovers.length > 0) name = leftovers.shift() ?? "";
  if (!company) {
    const next = leftovers.find((line) => line !== name);
    if (next) company = next;
  }

  if (!name && !company && !phone && !email) return null;
  return { name, company, phone, email };
}

/**
 * Read a contact out of whatever the clipboard held — a full vCard, labelled
 * lines, or a plain block of text.
 */
export function parseContactText(text: string): ParsedContact | null {
  if (/BEGIN\s*:\s*VCARD/i.test(text)) {
    const card = parseVCard(text);
    if (card) return card;
  }
  return parseLooseContact(text.trim());
}

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

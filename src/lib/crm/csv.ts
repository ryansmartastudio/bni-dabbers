/**
 * Reading a spreadsheet somebody exported from somewhere else.
 *
 * Deliberately not `text.split(",")`. The first real file anybody uploads
 * will have a company called "Smith, Jones & Co" in it, and a naive split
 * turns that one row into a silent mess -- a visitor called "Smith" with a
 * phone number in the email column. So this is a proper character-by-
 * character reader: quoted fields, commas and newlines inside quotes, ""
 * as an escaped quote, CRLF, and a leading BOM, which Excel always writes.
 *
 * Pure, no database, no Node APIs, so the browser and the server can both
 * use it and the tests need neither.
 */

/** Bigger than any chapter's list, small enough to parse in a request. */
export const MAX_IMPORT_ROWS = 500;
/** 1MB of text is far more than 500 rows; past that something is wrong. */
export const MAX_IMPORT_BYTES = 1_000_000;

/**
 * One importable field, and everything anybody is likely to have called it.
 *
 * The aliases are why a file exported from Outlook, a phone or a different
 * CRM tends to just work. They are matched loosely -- case, spaces and
 * punctuation are stripped -- so "E-mail Address" finds "email".
 */
export const CSV_COLUMNS = [
  {
    key: "name",
    label: "Name",
    required: true,
    example: "Jane Fletcher",
    aliases: ["name", "fullname", "contact", "contactname", "person", "visitor"],
  },
  {
    key: "company",
    label: "Company",
    required: false,
    example: "Fletcher Plumbing",
    aliases: [
      "company",
      "business",
      "businessname",
      "companyname",
      "organisation",
      "organization",
      "firm",
    ],
  },
  {
    key: "category",
    label: "Trade",
    required: false,
    example: "Plumber",
    aliases: [
      "trade",
      "category",
      "seat",
      "profession",
      "industry",
      "jobtitle",
      "occupation",
    ],
  },
  {
    key: "phone",
    label: "Phone",
    required: false,
    example: "07700 900123",
    aliases: [
      "phone",
      "mobile",
      "telephone",
      "tel",
      "phonenumber",
      "mobilenumber",
      "contactnumber",
    ],
  },
  {
    key: "email",
    label: "Email",
    required: false,
    example: "jane@fletcherplumbing.co.uk",
    aliases: ["email", "emailaddress", "mail"],
  },
  {
    key: "website",
    label: "Website",
    required: false,
    example: "fletcherplumbing.co.uk",
    aliases: ["website", "web", "url", "site", "webaddress"],
  },
  {
    key: "notes",
    label: "Notes",
    required: false,
    example: "Met at the Nantwich show. Keen, ring after the 8th.",
    aliases: ["notes", "note", "comment", "comments", "detail", "details"],
  },
] as const;

export type CsvColumnKey = (typeof CSV_COLUMNS)[number]["key"];

/** Loose match: case, spaces, punctuation and a BOM all stop mattering. */
export function headerKey(value: string): string {
  return value
    .replace(/^﻿/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

/**
 * Splits CSV text into rows of raw strings.
 *
 * Returns rows exactly as written, including blank trailing fields, so the
 * caller can tell "no column" from "empty column".
 */
export function parseCsv(input: string): string[][] {
  const text = input.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  let i = 0;

  const endField = () => {
    row.push(field);
    field = "";
  };
  const endRow = () => {
    endField();
    // A trailing newline would otherwise add a row of one empty string.
    if (row.length > 1 || row[0] !== "") rows.push(row);
    row = [];
  };

  while (i < text.length) {
    const char = text[i]!;

    if (quoted) {
      if (char === '"') {
        // "" inside a quoted field is one literal quote, not the end of it.
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
          continue;
        }
        quoted = false;
        i += 1;
        continue;
      }
      field += char;
      i += 1;
      continue;
    }

    if (char === '"' && field === "") {
      quoted = true;
      i += 1;
      continue;
    }
    if (char === ",") {
      endField();
      i += 1;
      continue;
    }
    if (char === "\r") {
      // CRLF and a lone CR both end the row.
      if (text[i + 1] === "\n") i += 1;
      endRow();
      i += 1;
      continue;
    }
    if (char === "\n") {
      endRow();
      i += 1;
      continue;
    }
    field += char;
    i += 1;
  }

  // Whatever is left when the text runs out is the last row, unless the file
  // ended on a newline and left nothing behind.
  if (field !== "" || row.length > 0) endRow();

  return rows;
}

export type MappedRow = Partial<Record<CsvColumnKey, string>>;

export type CsvReadResult =
  | { ok: false; error: string }
  | {
      ok: true;
      /** Which column of the file each field was found in. */
      mapping: Partial<Record<CsvColumnKey, number>>;
      /** Headers in the file that matched nothing, so the UI can say so. */
      ignored: string[];
      rows: MappedRow[];
    };

/**
 * Turns CSV text into rows keyed by what each column means.
 *
 * The header row is required. Guessing from the shape of the data -- "this
 * column has an @ in it, so it must be email" -- gets it wrong on exactly
 * the messy files where a mistake costs most, and a wrong guess here writes
 * somebody's phone number into an email field.
 */
export function readVisitorCsv(input: string): CsvReadResult {
  if (input.length > MAX_IMPORT_BYTES) {
    return { ok: false, error: "That file is too big. Split it up and try again." };
  }

  const rows = parseCsv(input);
  if (rows.length === 0) return { ok: false, error: "That file is empty." };

  const header = rows[0]!;
  const mapping: Partial<Record<CsvColumnKey, number>> = {};
  const matched = new Set<number>();

  for (const column of CSV_COLUMNS) {
    const index = header.findIndex(
      (cell, at) =>
        !matched.has(at) &&
        (column.aliases as readonly string[]).includes(headerKey(cell)),
    );
    if (index !== -1) {
      mapping[column.key] = index;
      matched.add(index);
    }
  }

  if (mapping.name === undefined) {
    return {
      ok: false,
      error:
        "No name column. The first row has to name the columns - download the template if it helps.",
    };
  }

  const ignored = header
    .map((cell, at) => (matched.has(at) ? null : cell.trim()))
    .filter((cell): cell is string => Boolean(cell));

  const body = rows.slice(1);
  if (body.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `That is ${body.length} rows. ${MAX_IMPORT_ROWS} at a time is the limit.`,
    };
  }

  const mapped: MappedRow[] = body
    .map((cells) => {
      const row: MappedRow = {};
      for (const column of CSV_COLUMNS) {
        const index = mapping[column.key];
        if (index === undefined) continue;
        const value = (cells[index] ?? "").replace(/\s+/g, " ").trim();
        if (value) row[column.key] = value;
      }
      return row;
    })
    // A spreadsheet with formatting below the data gives rows of empty
    // strings. They are not failures, they are not rows.
    .filter((row) => Object.keys(row).length > 0);

  return { ok: true, mapping, ignored, rows: mapped };
}

/** One field, quoted only when it has to be. */
function csvCell(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replaceAll('"', '""')}"` : value;
}

/**
 * The blank the import page offers for download.
 *
 * Built from CSV_COLUMNS rather than written out, so a column added to the
 * importer appears in the template in the same commit.
 */
export function buildCsvTemplate(): string {
  const header = CSV_COLUMNS.map((column) => csvCell(column.label)).join(",");
  const example = CSV_COLUMNS.map((column) => csvCell(column.example)).join(",");
  return `${header}\r\n${example}\r\n`;
}

/**
 * The CSV reader, and the template it hands out.
 *
 * Worth testing hard because the failure mode is silent: a naive split on
 * commas does not throw on "Smith, Jones & Co", it just quietly files a
 * phone number as an email address and nobody notices until someone rings
 * the wrong person. Pure functions, no database.
 */
import {
  CSV_COLUMNS,
  MAX_IMPORT_ROWS,
  buildCsvTemplate,
  headerKey,
  parseCsv,
  readVisitorCsv,
} from "../src/lib/crm/csv";

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

const j = (value: unknown) => JSON.stringify(value);

console.log("Splitting the text");
check("a plain row", j(parseCsv("a,b,c")) === j([["a", "b", "c"]]));
check("two rows", j(parseCsv("a,b\nc,d")) === j([["a", "b"], ["c", "d"]]));
check("CRLF, which Excel writes",
  j(parseCsv("a,b\r\nc,d")) === j([["a", "b"], ["c", "d"]]));
check("a lone CR, which old Macs wrote",
  j(parseCsv("a,b\rc,d")) === j([["a", "b"], ["c", "d"]]));
check("a BOM, which Excel also writes",
  j(parseCsv("﻿Name,Company")) === j([["Name", "Company"]]));
check("a trailing newline adds no empty row",
  j(parseCsv("a,b\nc,d\n")) === j([["a", "b"], ["c", "d"]]));
check("empty fields are kept",
  j(parseCsv("a,,c")) === j([["a", "", "c"]]));
check("a trailing empty field is kept",
  j(parseCsv("a,b,")) === j([["a", "b", ""]]));

console.log("\nQuoting, which is the whole point");
// The case a naive split silently mangles.
check("a comma inside quotes stays in the field",
  j(parseCsv('Jane,"Smith, Jones & Co",07700')) ===
    j([["Jane", "Smith, Jones & Co", "07700"]]));
check("a newline inside quotes does not end the row",
  j(parseCsv('a,"line one\nline two",c')) ===
    j([["a", "line one\nline two", "c"]]));
check('"" is one literal quote',
  j(parseCsv('a,"He said ""hello""",c')) ===
    j([["a", 'He said "hello"', "c"]]));
check("a quoted empty field",
  j(parseCsv('a,"",c')) === j([["a", "", "c"]]));
check("quotes only count at the start of a field",
  j(parseCsv('a,b"c,d')) === j([["a", 'b"c', "d"]]));
check("an unterminated quote does not lose the text",
  j(parseCsv('a,"never closed')) === j([["a", "never closed"]]));
check("a quoted field with CRLF inside",
  j(parseCsv('a,"one\r\ntwo"')) === j([["a", "one\r\ntwo"]]));

console.log("\nFinding the columns");
check("exact headers", headerKey("Name") === "name");
check("case is ignored", headerKey("NAME") === headerKey("name"));
check("spaces are ignored", headerKey("Full Name") === "fullname");
check("punctuation is ignored", headerKey("E-mail Address") === "emailaddress");
check("a BOM on the first header is stripped", headerKey("﻿Name") === "name");

const basic = readVisitorCsv("Name,Company,Phone\nJane Fletcher,Fletcher Plumbing,07700 900123");
check("a basic file reads", basic.ok);
if (basic.ok) {
  check("the name lands", basic.rows[0]?.name === "Jane Fletcher");
  check("the company lands", basic.rows[0]?.company === "Fletcher Plumbing");
  check("the phone lands", basic.rows[0]?.phone === "07700 900123");
  check("nothing is invented", basic.rows[0]?.email === undefined);
}

const aliased = readVisitorCsv(
  "Mobile Number,Business Name,E-mail Address,Full Name,Job Title\n07700 900123,Acme Ltd,jane@acme.test,Jane Fletcher,Plumber",
);
check("a file from another system reads", aliased.ok);
if (aliased.ok) {
  const row = aliased.rows[0]!;
  check("out-of-order columns are matched by name",
    row.name === "Jane Fletcher" && row.company === "Acme Ltd");
  check("mobile is a phone", row.phone === "07700 900123");
  check("e-mail address is an email", row.email === "jane@acme.test");
  check("job title is a trade", row.category === "Plumber");
}

const ignored = readVisitorCsv("Name,Shoe size,Favourite colour\nJane,9,Blue");
check("unknown columns are reported, not guessed",
  ignored.ok && ignored.ignored.length === 2 &&
    ignored.ignored.includes("Shoe size"),
  ignored.ok ? j(ignored.ignored) : "");
check("and their values are not imported",
  ignored.ok && Object.keys(ignored.rows[0]!).length === 1);

console.log("\nFiles that should be refused");
const noName = readVisitorCsv("Company,Phone\nAcme,07700");
check("no name column is refused", !noName.ok);
check("and says what to do",
  !noName.ok && noName.error.toLowerCase().includes("name"));
check("an empty file is refused", !readVisitorCsv("").ok);
check("a header with no rows is not refused here",
  readVisitorCsv("Name,Company").ok);
check("too many rows is refused",
  !readVisitorCsv(`Name\n${"Jane\n".repeat(MAX_IMPORT_ROWS + 1)}`).ok);
check("exactly the limit is allowed",
  readVisitorCsv(`Name\n${"Jane\n".repeat(MAX_IMPORT_ROWS)}`).ok);
check("an enormous file is refused",
  !readVisitorCsv(`Name\n${"x".repeat(1_000_001)}`).ok);

console.log("\nMessy real-world rows");
const messy = readVisitorCsv(
  'Name,Company\n  Jane   Fletcher  ,  Acme  Ltd \n,\n\nBob Smith,"Smith, Jones & Co"\n',
);
check("a messy file still reads", messy.ok);
if (messy.ok) {
  check("whitespace is collapsed", messy.rows[0]?.name === "Jane Fletcher",
    j(messy.rows[0]?.name));
  check("and inside the company too", messy.rows[0]?.company === "Acme Ltd");
  // A spreadsheet with formatting below the data gives rows of empty cells.
  check("blank rows are dropped, not imported as blanks",
    messy.rows.length === 2, j(messy.rows.length));
  check("the quoted comma survived",
    messy.rows[1]?.company === "Smith, Jones & Co", j(messy.rows[1]?.company));
}

const shortRow = readVisitorCsv("Name,Company,Phone\nJane");
check("a row shorter than the header does not throw", shortRow.ok);
check("and its missing cells are simply absent",
  shortRow.ok && shortRow.rows[0]?.company === undefined);

// Two columns both matching the same field: the first wins and the second is
// reported as ignored, rather than one silently overwriting the other.
const twoNames = readVisitorCsv("Name,Contact\nJane,Bob");
check("a duplicate-meaning column does not overwrite",
  twoNames.ok && twoNames.rows[0]?.name === "Jane",
  twoNames.ok ? j(twoNames.rows[0]) : "");
check("and the second is listed as ignored",
  twoNames.ok && twoNames.ignored.includes("Contact"));

console.log("\nThe template");
const template = buildCsvTemplate();
const back = readVisitorCsv(template);
// The template is only useful if the importer accepts it unedited.
check("the template reads back through the importer", back.ok);
check("it carries every column",
  back.ok && Object.keys(back.mapping).length === CSV_COLUMNS.length,
  back.ok ? j(Object.keys(back.mapping).length) : "");
check("it has exactly one example row", back.ok && back.rows.length === 1);
check("the example row has a name",
  back.ok && back.rows[0]?.name === "Jane Fletcher");
check("nothing in the template is ignored",
  back.ok && back.ignored.length === 0, back.ok ? j(back.ignored) : "");
// The example note contains a full stop and spaces; if a column's example
// ever gains a comma, it has to be quoted or the template breaks itself.
check("the template survives a comma in an example",
  back.ok && back.rows[0]?.notes?.includes("Nantwich") === true);
check("it uses CRLF, which every spreadsheet opens", template.includes("\r\n"));
check("exactly one column is marked required",
  CSV_COLUMNS.filter((column) => column.required).length === 1);
check("and it is the name", CSV_COLUMNS[0]!.key === "name");

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);

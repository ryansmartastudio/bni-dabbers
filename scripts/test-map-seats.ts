/**
 * Which power team a typed trade belongs to.
 *
 * Harry added thirty-odd visitors after the workshop and sixteen of them
 * landed in the grey "no seat yet" lump, which read as a fault in the map
 * rather than as a trade nobody holds. The cases below are the real ones
 * from the live pipeline, so this is a regression test against actual data
 * rather than against what I imagined people would type.
 *
 * Pure functions, no database.
 */
import { TEAMS } from "../src/lib/workshop/config";
import { seatTeamFor } from "../src/lib/crm/map-adapter";

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

function expect(category: string, team: string | null) {
  const got = seatTeamFor(category);
  check(
    `${category.padEnd(32)} -> ${team ?? "no seat"}`,
    got === team,
    `got ${got ?? "no seat"}`,
  );
}

console.log("Every seat still matches itself exactly");
for (const team of TEAMS) {
  for (const seat of team.seats) {
    check(`${seat.slice(0, 34).padEnd(34)} -> ${team.id}`, seatTeamFor(seat) === team.id);
  }
}

console.log("\nThe wordings Harry actually typed");
// Same trade, different words. These used to fall through.
expect("Kitchen installer", "pt");
expect("Building", "pt");
expect("Energy & Utilities Brokerage", "bs");
expect("Cleaning", "bs");
expect("Exterior cleaning", "bs");

console.log("\nTrades the chapter genuinely has no seat for");
// These SHOULD be unseated. Matching them would be worse than not.
expect("Air con", null);
expect("Flooring", null);
expect("Garden maintenance", null);
expect("Landscaper", null);
expect("Loft Ladders", null);

console.log("\nThe trap: a shared word that means nothing");
// "Commercial" is in three seat names, so it cannot decide between them.
// Without the distinctiveness rule this lands a flooring firm in with the
// commercial cleaners, and nobody notices until a member rings them.
expect("Commercial flooring", null);
expect("Commercial catering", null);
expect("Commercial window tinting", null);
// But the distinctive half of a compound still wins.
expect("Commercial photography", "mv");
// "contractor" belongs to Builder / General Contractor and "cleaning" to
// Commercial Cleaning, so this names two teams. Refusing to choose is the
// cheap mistake: it shows as its own labelled trade under Other trades,
// where it is visible and can be renamed. Guessing files a cleaner as a
// builder and nobody finds out.
expect("Commercial cleaning contractor", null);

console.log("\nStemming, only as far as it needs to go");
expect("Builders", "pt");
expect("Roofing", "pt");
expect("Roofer", "pt");
expect("Videography", "mv");
expect("Removals", "hl");
expect("Conveyancing", "hl");

console.log("\nNothing to go on");
expect("", null);
check("null is unseated", seatTeamFor(null) === null);
expect("   ", null);
expect("Other", null);
expect("---", null);

console.log("\nIt must not invent a team from a short or common word");
// Words of three letters or fewer are ignored, so these cannot latch on.
expect("CCTV and alarms", "pt");
expect("The", null);
expect("Services", null);
// "provider" is in exactly one seat, so "Care provider" finding Later-Life
// Care is right rather than lucky.
expect("Care provider", "hl");

console.log("\nA trade that straddles two teams picks neither");
// "Estate" is Home & Life Events, "Photographer" is Marketing & Visual.
// Guessing between them would be worse than saying nothing.
expect("Estate photographer", null);

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);

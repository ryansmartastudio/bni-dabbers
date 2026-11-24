/**
 * The host helpers, which decide what the CRM subdomain serves and what it
 * lets through without a sign-in. Pure functions, no database.
 */
import {
  CRM_HOST,
  isCrmAuthPassthroughPath,
  getCrmUrl,
  isCrmAdminPath,
  isCrmHost,
  isCrmPath,
  isCrmReminderPath,
  toCrmPath,
} from "../src/lib/crm-host";

let pass = 0, fail = 0;
function check(label: string, ok: boolean, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${label}`); }
  else { fail++; console.log(`  FAIL  ${label} ${detail}`); }
}

console.log("Which host is the CRM");
check("the CRM host matches", isCrmHost(CRM_HOST));
check("a port does not confuse it", isCrmHost(`${CRM_HOST}:443`));
check("case does not matter", isCrmHost(CRM_HOST.toUpperCase()));
check("the main site is not the CRM", !isCrmHost("www.bnidabbers.co.uk"));
check("the apex is not the CRM", !isCrmHost("bnidabbers.co.uk"));
check("the workshop is not the CRM", !isCrmHost("visitorworkshop.bnidabbers.co.uk"));
check("a lookalike suffix is not the CRM", !isCrmHost("evilcrm.bnidabbers.co.uk"));
check("somebody else's host is not the CRM", !isCrmHost("crm.bnidabbers.co.uk.attacker.test"));
check("nothing is not the CRM", !isCrmHost(null) && !isCrmHost("") && !isCrmHost(undefined));

console.log("\nWhere a path lands");
check("root becomes the board", toCrmPath("/") === "/crm");
check("a bare path is prefixed", toCrmPath("/reports") === "/crm/reports");
check("a visitor page is prefixed", toCrmPath("/visitor/abc") === "/crm/visitor/abc");
check("an already-prefixed path is left alone", toCrmPath("/crm") === "/crm");
check("and so is a deeper one", toCrmPath("/crm/visitor/abc") === "/crm/visitor/abc");
check("prefixing is not fooled by a lookalike",
  toCrmPath("/crmsomething") === "/crm/crmsomething", toCrmPath("/crmsomething"));
check("isCrmPath is not fooled either", !isCrmPath("/crmsomething"));

console.log("\nWhat is public");
check("a reminder link is public", isCrmReminderPath("/crm/r/abc/yes"));
check("so is the no page", isCrmReminderPath("/crm/r/abc/no"));
check("the board is not", !isCrmReminderPath("/crm"));
check("reports are not", !isCrmReminderPath("/crm/reports"));
check("a visitor page is not", !isCrmReminderPath("/crm/visitor/abc"));
// The carve-out is a prefix match, so anything that merely starts with the
// letters must not slip through it.
check("a lookalike segment is not public", !isCrmReminderPath("/crm/reports/r/abc"));
check("the bare /crm/r is not public", !isCrmReminderPath("/crm/r"));

console.log("\nWhat needs an admin");
check("reports need admin", isCrmAdminPath("/crm/reports"));
check("and anything under them", isCrmAdminPath("/crm/reports/export"));
check("the board does not", !isCrmAdminPath("/crm"));
check("a visitor page does not", !isCrmAdminPath("/crm/visitor/abc"));
check("reminder links do not", !isCrmAdminPath("/crm/r/abc/yes"));
check("a lookalike does not slip in", !isCrmAdminPath("/crm/reportsomething"));

console.log("\nLinks that go in emails");
check("the root link is the host", getCrmUrl() === `https://${CRM_HOST}`);
check("a reminder link is clean", getCrmUrl("/r/tok/yes") === `https://${CRM_HOST}/r/tok/yes`);
check("a missing slash is added", getCrmUrl("r/tok/no") === `https://${CRM_HOST}/r/tok/no`);
check("no double slash", !getCrmUrl("/r/tok/yes").includes("co.uk//"));
// What an email link resolves to once the proxy has rewritten it.
check("an email link lands on a real route",
  toCrmPath("/r/tok/yes") === "/crm/r/tok/yes" && isCrmReminderPath(toCrmPath("/r/tok/yes")));

console.log("\nClerk's own paths on the CRM host");
// The subdomain rewrites everything under /crm and protects it. Left to that
// rule, /sign-in becomes /crm/sign-in, which needs a member, so the browser is
// sent to /sign-in and round it goes. This is that infinite redirect.
check("the sign-in page serves itself", isCrmAuthPassthroughPath("/sign-in"));
check("and its catch-all segments", isCrmAuthPassthroughPath("/sign-in/factor-two"));
check("the sign-up page too", isCrmAuthPassthroughPath("/sign-up"));
check("and its catch-all segments", isCrmAuthPassthroughPath("/sign-up/verify-email-address"));
check("the frontend-API proxy is untouched", isCrmAuthPassthroughPath("/__clerk/v1/client"));
check("including its root", isCrmAuthPassthroughPath("/__clerk"));
// If any of these became a passthrough the CRM would be readable signed out.
check("the board is NOT a passthrough", !isCrmAuthPassthroughPath("/"));
check("the toolkit is NOT a passthrough", !isCrmAuthPassthroughPath("/toolkit"));
check("reports are NOT a passthrough", !isCrmAuthPassthroughPath("/reports"));
check("a visitor page is NOT a passthrough", !isCrmAuthPassthroughPath("/visitor/abc"));
check("a lookalike is NOT a passthrough", !isCrmAuthPassthroughPath("/sign-in-now"));
check("nor is a nested lookalike", !isCrmAuthPassthroughPath("/crm/sign-in"));
check("nor is a clerk lookalike", !isCrmAuthPassthroughPath("/__clerkish/x"));

// The whole loop in one assertion: what the proxy would have done before.
check("without the exemption, sign-in needs a sign-in",
  toCrmPath("/sign-in") === "/crm/sign-in" && !isCrmReminderPath(toCrmPath("/sign-in")));
check("with it, sign-in is never rewritten", isCrmAuthPassthroughPath("/sign-in"));

console.log("\nMember access is admin-only on both hosts");
// This page can email the whole chapter, so it gets the same gate as the
// reports rather than relying on the page guard alone.
check("member access needs admin", isCrmAdminPath("/crm/members"));
check("and anything under it", isCrmAdminPath("/crm/members/anything"));
check("reports still need admin", isCrmAdminPath("/crm/reports"));
check("the board does not", !isCrmAdminPath("/crm"));
check("the toolkit does not", !isCrmAdminPath("/crm/toolkit"));
check("import does not", !isCrmAdminPath("/crm/import"));
check("the archive does not", !isCrmAdminPath("/crm/archive"));
check("a visitor page does not", !isCrmAdminPath("/crm/visitor/abc"));
// The subdomain rewrites first, so the check must see the rewritten path.
check("the subdomain path maps onto the admin rule",
  isCrmAdminPath(toCrmPath("/members")) && isCrmAdminPath(toCrmPath("/reports")));
check("a lookalike is not admin-gated into existence",
  !isCrmAdminPath("/crm/membership"));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail > 0) process.exit(1);

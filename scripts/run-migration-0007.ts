import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql } from "drizzle-orm";
import { db } from "../src/db";

const migrationPath = join(process.cwd(), "drizzle/0007_member_profiles.sql");
const statements = readFileSync(migrationPath, "utf8")
  .split("--> statement-breakpoint")
  .map((statement) => statement.trim())
  .filter(Boolean);

async function migrate() {
  for (const statement of statements) {
    console.log(`Running: ${statement.slice(0, 80)}...`);
    await db.execute(sql.raw(statement));
  }
  console.log("Migration 0007 complete");
}

migrate().catch((error) => {
  console.error(error);
  process.exit(1);
});

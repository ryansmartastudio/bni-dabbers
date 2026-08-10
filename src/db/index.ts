import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = NeonHttpDatabase<typeof schema>;

let dbInstance: Db | undefined;

function getDb(): Db {
  if (dbInstance) return dbInstance;

  const url = process.env.DATABASE_URL;
  if (!url?.startsWith("postgresql://") && !url?.startsWith("postgres://")) {
    throw new Error(
      "DATABASE_URL must be a full postgresql:// connection string. In Neon, copy the pooled connection URL — not just the hostname.",
    );
  }

  dbInstance = drizzle(neon(url), { schema });
  return dbInstance;
}

export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    return Reflect.get(getDb() as object, prop, receiver);
  },
});

function getNestedMessage(error: unknown): string {
  if (!(error instanceof Error)) return "Could not connect to the database.";

  const parts = [error.message];
  let current: unknown = error;

  while (current && typeof current === "object" && "cause" in current) {
    current = (current as { cause?: unknown }).cause;
    if (current instanceof Error) {
      parts.push(current.message);
    }
  }

  return parts.join(" ");
}

export function isDatabaseSetupError(error: unknown): boolean {
  const message = getNestedMessage(error).toLowerCase();

  return (
    message.includes("database_url") ||
    message.includes("connection string") ||
    message.includes("password authentication failed") ||
    message.includes("failed query") ||
    message.includes("relation") ||
    message.includes("does not exist")
  );
}

export function getDatabaseSetupMessage(error: unknown): string {
  const message = getNestedMessage(error);

  if (message.toLowerCase().includes("password authentication failed")) {
    return "Neon rejected the database password. Copy a fresh connection string from the Neon dashboard into Vercel's DATABASE_URL. If your password contains special characters (@, #, /, etc.), URL-encode them or reset the password in Neon.";
  }

  if (message.toLowerCase().includes("does not exist")) {
    return "Database tables have not been created yet. Run npm run db:push against production, then npm run db:seed.";
  }

  return message;
}

export async function safeGenerateStaticParams<T>(
  loader: () => Promise<T[]>,
): Promise<T[]> {
  if (
    !process.env.DATABASE_URL?.startsWith("postgresql://") &&
    !process.env.DATABASE_URL?.startsWith("postgres://")
  ) {
    return [];
  }

  try {
    return await loader();
  } catch {
    return [];
  }
}

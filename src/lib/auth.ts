import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export type UserRole = "admin" | "member";

export function getRoleFromClaims(
  sessionClaims: Record<string, unknown> | null | undefined,
): UserRole {
  const metadata = sessionClaims?.metadata as { role?: string } | undefined;
  return metadata?.role === "admin" ? "admin" : "member";
}

export async function getAuthContext() {
  const { userId, sessionClaims } = await auth();
  const role = getRoleFromClaims(sessionClaims as Record<string, unknown>);
  return { userId, role, isSignedIn: Boolean(userId) };
}

export async function requireAuth() {
  const context = await getAuthContext();
  if (!context.userId) {
    redirect("/sign-in");
  }
  return context;
}

export async function requireAdmin() {
  const context = await requireAuth();
  if (context.role !== "admin") {
    redirect("/members");
  }
  return context;
}

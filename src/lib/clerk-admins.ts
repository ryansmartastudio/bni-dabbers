import { clerkClient } from "@clerk/nextjs/server";
import { getRoleFromPublicMetadata } from "@/lib/auth";

export type AdminUserSummary = {
  id: string;
  email: string;
  name: string;
  imageUrl: string | null;
};

export type PendingInviteSummary = {
  id: string;
  email: string;
  createdAt: number;
  url: string | null;
};

function getUserPublicMetadata(
  metadata: Record<string, unknown> | null | undefined,
) {
  return metadata ?? {};
}

export function getAppOrigin() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  if (explicit) return explicit;

  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;

  return "http://localhost:3000";
}

export function getClerkErrorMessage(error: unknown) {
  if (error && typeof error === "object" && "errors" in error) {
    const errors = (
      error as { errors: { message?: string; longMessage?: string }[] }
    ).errors;
    return errors[0]?.longMessage ?? errors[0]?.message ?? "Request failed.";
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Request failed.";
}

export async function listAdminUsers(): Promise<AdminUserSummary[]> {
  const client = await clerkClient();
  const admins: AdminUserSummary[] = [];
  let offset = 0;
  const limit = 100;

  while (true) {
    const { data } = await client.users.getUserList({ limit, offset });

    for (const user of data) {
      const role = getRoleFromPublicMetadata(
        user.publicMetadata as Record<string, unknown>,
      );

      if (role !== "admin") continue;

      admins.push({
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? "",
        name:
          [user.firstName, user.lastName].filter(Boolean).join(" ") ||
          user.username ||
          "Admin",
        imageUrl: user.imageUrl,
      });
    }

    if (data.length < limit) break;
    offset += limit;
  }

  return admins.sort((a, b) => a.email.localeCompare(b.email));
}

export async function listPendingAdminInvites(): Promise<PendingInviteSummary[]> {
  const client = await clerkClient();
  const { data } = await client.invitations.getInvitationList({
    status: "pending",
    orderBy: "-created_at",
  });

  return data.map((invitation) => ({
    id: invitation.id,
    email: invitation.emailAddress,
    createdAt: invitation.createdAt,
    url: invitation.url ?? null,
  }));
}

export async function inviteAdmin(emailAddress: string) {
  const email = emailAddress.trim().toLowerCase();
  const client = await clerkClient();
  const { data: users } = await client.users.getUserList({
    emailAddress: [email],
  });

  if (users.length > 0) {
    const user = users[0];
    const role = getRoleFromPublicMetadata(
      user.publicMetadata as Record<string, unknown>,
    );

    if (role === "admin") {
      throw new Error("This person is already an admin.");
    }

    await client.users.updateUserMetadata(user.id, {
      publicMetadata: {
        ...getUserPublicMetadata(user.publicMetadata as Record<string, unknown>),
        role: "admin",
      },
    });

    return { type: "promoted" as const, email };
  }

  const invitation = await client.invitations.createInvitation({
    emailAddress: email,
    redirectUrl: `${getAppOrigin()}/sign-in`,
    publicMetadata: { role: "admin" },
    // Clerk blocks automated invite emails until a custom domain is configured.
    notify: false,
  });

  return {
    type: "invited" as const,
    email,
    invitationUrl: invitation.url ?? null,
  };
}

export async function revokeAdminInvite(invitationId: string) {
  const client = await clerkClient();
  await client.invitations.revokeInvitation(invitationId);
}

export async function removeAdminAccess(userId: string, currentUserId: string) {
  if (userId === currentUserId) {
    throw new Error("You cannot remove your own admin access.");
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      ...getUserPublicMetadata(user.publicMetadata as Record<string, unknown>),
      role: "member",
    },
  });
}

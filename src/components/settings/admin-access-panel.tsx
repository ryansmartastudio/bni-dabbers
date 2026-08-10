"use client";

import { useState, useTransition } from "react";
import {
  inviteAdminAction,
  removeAdminAccessAction,
  revokeAdminInviteAction,
} from "@/actions/admin-invites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import { SettingsSection } from "@/components/settings/settings-section";
import type {
  AdminUserSummary,
  PendingInviteSummary,
} from "@/lib/clerk-admins";

type AdminAccessPanelProps = {
  admins: AdminUserSummary[];
  pendingInvites: PendingInviteSummary[];
  currentUserId: string;
};

function formatInviteDate(timestamp: number | null) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function AdminAccessPanel({
  admins,
  pendingInvites,
  currentUserId,
}: AdminAccessPanelProps) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await inviteAdminAction(email);

      if (!result.success) {
        setError(result.error ?? "Could not send the invite.");
        return;
      }

      if ("type" in result && result.type === "promoted") {
        setMessage(`${result.email} already had an account and is now an admin.`);
      } else if ("type" in result && result.type === "invited") {
        setMessage(`Invitation sent to ${result.email}.`);
      }

      setEmail("");
    });
  }

  function handleRevokeInvite(invitationId: string) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await revokeAdminInviteAction(invitationId);
      if (!result.success) {
        setError(result.error ?? "Could not revoke the invite.");
        return;
      }
      setMessage("Invitation revoked.");
    });
  }

  function handleRemoveAdmin(userId: string) {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await removeAdminAccessAction(userId);
      if (!result.success) {
        setError(result.error ?? "Could not remove admin access.");
        return;
      }
      setMessage("Admin access removed.");
    });
  }

  return (
    <SettingsSection
      title="Admin access"
      description="Invite chapter admins who can manage members, settings and meeting sheet exports."
    >
      <form onSubmit={handleInvite} className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input
            label="Invite admin by email"
            name="adminEmail"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="martin@genieswish.co.uk"
            disabled={isPending}
          />
        </div>
        <Button type="submit" disabled={isPending || !email.trim()}>
          Send invite
        </Button>
      </form>

      {message ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-medium text-foreground">Current admins</h3>
          {admins.length > 0 ? (
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {admins.map((admin) => (
                <li
                  key={admin.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {admin.name}
                      {admin.id === currentUserId ? (
                        <span className="ml-2 text-xs font-normal text-muted">
                          (you)
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">{admin.email}</p>
                  </div>
                  {admin.id !== currentUserId ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="shrink-0"
                      disabled={isPending}
                      onClick={() => handleRemoveAdmin(admin.id)}
                    >
                      Remove
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-muted">No admins found.</p>
          )}
        </div>

        {pendingInvites.length > 0 ? (
          <div>
            <h3 className="text-sm font-medium text-foreground">
              Pending invitations
            </h3>
            <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
              {pendingInvites.map((invite) => (
                <li
                  key={invite.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {invite.email}
                    </p>
                    <p className="text-xs text-muted">
                      Sent {formatInviteDate(invite.createdAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0"
                    disabled={isPending}
                    onClick={() => handleRevokeInvite(invite.id)}
                  >
                    Revoke
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <p className="text-xs text-muted">
        Invited admins receive a Clerk email to sign in. They can manage members,
        chapter settings and generate meeting sheets once they accept.
      </p>
    </SettingsSection>
  );
}

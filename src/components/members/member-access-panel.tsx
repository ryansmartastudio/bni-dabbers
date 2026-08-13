"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  removeMemberAccessAction,
  resendMemberInviteAction,
  revokeMemberInviteAction,
  sendMemberInviteAction,
} from "@/actions/member-access";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form-fields";
import type { MemberAccessState } from "@/lib/member-invites";

type MemberAccessPanelProps = {
  memberId: string;
  defaultEmail: string;
  accessState: MemberAccessState;
};

function CopyInviteLinkButton({
  url,
  disabled,
}: {
  url: string;
  disabled?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this invite link:", url);
    }
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="shrink-0"
      disabled={disabled}
      onClick={handleCopy}
    >
      {copied ? "Copied" : "Copy link"}
    </Button>
  );
}

function formatInviteDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function MemberAccessPanel({
  memberId,
  defaultEmail,
  accessState,
}: MemberAccessPanelProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(
    accessState.status === "pending" ? accessState.invitationUrl : null,
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleInvite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await sendMemberInviteAction(memberId, email);

      if (!result.success) {
        setError(result.error ?? "Could not send the invite.");
        return;
      }

      if ("invitationUrl" in result && result.invitationUrl) {
        setInvitationUrl(result.invitationUrl);
      }

      if ("type" in result && result.type === "linked") {
        setMessage(
          result.emailSent
            ? `${result.email} already had an account and is now linked. We've emailed them a link to manage their profile.`
            : `${result.email} is now linked, but the email could not be sent. Copy the link below.`,
        );
      } else if ("type" in result && result.type === "invited") {
        setMessage(
          result.emailSent
            ? `Invite sent to ${result.email}. They'll receive an email with a link to set up access.`
            : `Invite created for ${result.email}, but the email could not be sent. Copy the link below.`,
        );
      }

      if ("emailError" in result && result.emailError && !result.emailSent) {
        setError(result.emailError);
      }

      router.refresh();
    });
  }

  function handleResend() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await resendMemberInviteAction(memberId);
      if (!result.success) {
        setError(result.error ?? "Could not resend the invite email.");
        if ("invitationUrl" in result && result.invitationUrl) {
          setInvitationUrl(result.invitationUrl);
        }
        return;
      }

      if ("invitationUrl" in result && result.invitationUrl) {
        setInvitationUrl(result.invitationUrl);
      }
      setMessage("Invitation email resent.");
      router.refresh();
    });
  }

  function handleRevoke() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await revokeMemberInviteAction(memberId);
      if (!result.success) {
        setError(result.error ?? "Could not revoke the invite.");
        return;
      }
      setInvitationUrl(null);
      setMessage("Invitation revoked.");
      router.refresh();
    });
  }

  function handleRemoveAccess() {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      const result = await removeMemberAccessAction(memberId);
      if (!result.success) {
        setError(result.error ?? "Could not remove profile access.");
        return;
      }
      setMessage("Profile access removed.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold text-foreground">
          Invite member to manage their profile
        </h2>
        <p className="mt-1 text-sm text-muted">
          Send an invitation so this member can update their own directory
          profile, headshot and public copy. They can also download the meeting
          sheet once signed in.
        </p>
      </div>

      {accessState.status === "active" ? (
        <div className="rounded-lg border border-border bg-surface-muted/60 px-4 py-4">
          <p className="text-sm font-medium text-foreground">Active access</p>
          <p className="mt-1 text-sm text-muted">
            Linked to{" "}
            <span className="font-medium text-foreground">
              {accessState.linkedEmail}
            </span>
            {accessState.invite?.acceptedAt
              ? ` · accepted ${formatInviteDate(accessState.invite.acceptedAt)}`
              : null}
          </p>
          <Button
            type="button"
            variant="secondary"
            className="mt-4"
            disabled={isPending}
            onClick={handleRemoveAccess}
          >
            Remove access
          </Button>
        </div>
      ) : accessState.status === "pending" ? (
        <div className="rounded-lg border border-border bg-surface-muted/60 px-4 py-4">
          <p className="text-sm font-medium text-foreground">
            Pending invitation
          </p>
          <p className="mt-1 text-sm text-muted">
            Sent to{" "}
            <span className="font-medium text-foreground">
              {accessState.linkedEmail}
            </span>{" "}
            on {formatInviteDate(accessState.invite.sentAt)}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button
              type="button"
              disabled={isPending}
              onClick={handleResend}
            >
              Resend email
            </Button>
            {invitationUrl || accessState.invitationUrl ? (
              <CopyInviteLinkButton
                url={invitationUrl ?? accessState.invitationUrl ?? ""}
                disabled={isPending}
              />
            ) : null}
            <Button
              type="button"
              variant="secondary"
              disabled={isPending}
              onClick={handleRevoke}
            >
              Revoke
            </Button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handleInvite}
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
        >
          <div className="flex-1">
            <Input
              label="Member email"
              name="memberEmail"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="member@example.com"
              disabled={isPending}
            />
          </div>
          <Button type="submit" disabled={isPending || !email.trim()}>
            Send invite
          </Button>
        </form>
      )}

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

      {invitationUrl && accessState.status !== "active" ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            Invite link
          </p>
          <p className="mt-2 break-all text-sm text-foreground">{invitationUrl}</p>
          <div className="mt-3">
            <CopyInviteLinkButton url={invitationUrl} disabled={isPending} />
          </div>
        </div>
      ) : null}

      <p className="text-xs text-muted">
        Members can edit their contact details, headshot and public profile
        copy. BNI seat, slug, sort order, role group, status, chapter roles,
        notes and meeting sheet placement stay admin-only.
      </p>
    </div>
  );
}

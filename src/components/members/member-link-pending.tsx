import Link from "next/link";
import { requireAuth } from "@/lib/auth";
import { getMemberLinkDiagnostics } from "@/lib/member-access";
import { Button } from "@/components/ui/button";

export async function MemberLinkPending() {
  await requireAuth();
  const diagnostics = await getMemberLinkDiagnostics();

  const signedInEmail =
    diagnostics?.signedInEmails[0] ?? "your signed-in account";
  const invitedEmail = diagnostics?.pendingInviteEmail;
  const emailMismatch =
    invitedEmail &&
    diagnostics?.signedInEmails.every(
      (email) => email.toLowerCase() !== invitedEmail.toLowerCase(),
    );

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-foreground">
          We couldn&apos;t connect your profile yet
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Your account signed in successfully, but it isn&apos;t linked to a
          member profile yet. This usually happens if the invite link expired,
          was already used, or the Google account email doesn&apos;t match the
          invited address.
        </p>
        <div className="mt-4 rounded-lg border border-border bg-surface-muted/60 px-4 py-3 text-sm text-foreground">
          <p>
            Signed in as:{" "}
            <span className="font-medium">{signedInEmail}</span>
          </p>
          {invitedEmail ? (
            <p className="mt-1">
              Pending invite sent to:{" "}
              <span className="font-medium">{invitedEmail}</span>
            </p>
          ) : null}
        </div>
        {emailMismatch ? (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Those email addresses don&apos;t match. Sign out, then open the
            invite link again and choose the Google account for{" "}
            <span className="font-medium">{invitedEmail}</span>.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Ask a chapter admin to resend your invite from the member edit
            screen, then open the new link and sign in with the same email
            address.
          </p>
        )}
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/my-profile">
            <Button type="button">Try again</Button>
          </Link>
          <Link href="/members">
            <Button type="button" variant="secondary">
              Back to roster
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

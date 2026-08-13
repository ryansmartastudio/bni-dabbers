import Image from "next/image";
import Link from "next/link";
import type { Member } from "@/db/schema";
import { ChevronIcon } from "@/components/ui/chevron-icon";
import { LinkedInQr } from "@/components/qr/linkedin-qr";
import { MemberWebsiteLink } from "@/components/members/member-website-link";
import {
  formatChapterRoles,
  getMemberDisplayName,
  getMemberProfilePath,
  hasChapterRoles,
} from "@/lib/members";
import {
  isProfileFieldVisible,
  hasVisibleContactFields,
  hasVisiblePublishedContent,
} from "@/lib/profile-visibility";

type MemberProfileViewProps = {
  member: Member;
  relatedMembers: Member[];
  editHref?: string;
};

function ContactLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="wrap-break-word text-foreground underline decoration-border underline-offset-4 transition hover:text-bni hover:decoration-bni/40"
    >
      {children}
    </a>
  );
}

export function MemberProfileView({
  member,
  relatedMembers,
  editHref,
}: MemberProfileViewProps) {
  const displayName = getMemberDisplayName(member);
  const published =
    member.profilePublished && hasVisiblePublishedContent(member);
  const showContactPanel = hasVisibleContactFields(member);
  const showHeadline =
    member.profilePublished &&
    isProfileFieldVisible(member.profileVisibility, "headline") &&
    Boolean(member.profileHeadline?.trim());
  const showSummary =
    member.profilePublished &&
    isProfileFieldVisible(member.profileVisibility, "summary") &&
    Boolean(member.profileSummary?.trim());
  const showIdealReferral =
    member.profilePublished &&
    isProfileFieldVisible(member.profileVisibility, "idealReferral") &&
    Boolean(member.profileIdealReferral?.trim());
  const showServices =
    member.profilePublished &&
    isProfileFieldVisible(member.profileVisibility, "services") &&
    member.profileServices.length > 0;

  return (
    <div className="directory-shell">
      <section className="border-b border-border bg-[#fffdf9]">
        <div
          className={`mx-auto max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:py-14 ${
            showContactPanel
              ? "grid lg:grid-cols-[minmax(0,1fr)_320px]"
              : "max-w-5xl"
          }`}
        >
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground"
            >
              <ChevronIcon direction="left" />
              Back to directory
            </Link>

            {editHref ? (
              <div className="mt-4">
                <Link
                  href={editHref}
                  className="inline-flex items-center rounded-md border border-border bg-white px-3 py-2 text-sm font-medium text-foreground transition hover:border-bni/40 hover:text-bni"
                >
                  Edit profile
                </Link>
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="relative h-36 w-36 shrink-0 overflow-hidden rounded-[1.4rem] bg-surface-muted ring-1 ring-border">
                {member.headshotUrl ? (
                  <Image
                    src={member.headshotUrl}
                    alt={displayName}
                    fill
                    className="object-cover"
                    sizes="144px"
                    priority
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-sm text-muted">
                    No photo
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <h1 className="text-[clamp(2.2rem,5vw,3.8rem)] font-bold leading-[0.98] tracking-[-0.03em] text-foreground">
                  {displayName}
                </h1>
                <p className="mt-2 text-xl text-muted">{member.company}</p>
                <p className="mt-2 text-sm font-medium text-bni">{member.bniSeat}</p>
                {hasChapterRoles(member.chapterRoles) ? (
                  <p className="mt-3 text-sm text-muted">
                    {formatChapterRoles(member.chapterRoles)}
                  </p>
                ) : null}
                {showHeadline ? (
                  <p className="mt-5 max-w-3xl text-lg leading-relaxed text-foreground">
                    {member.profileHeadline}
                  </p>
                ) : null}
              </div>
            </div>
          </div>

          {showContactPanel ? (
          <aside className="rounded-2xl border border-border bg-white p-5 shadow-[0_18px_40px_-34px_rgba(23,20,18,0.45)]">
            <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-muted">
              Contact
            </h2>
            <dl className="mt-4 space-y-4 text-sm">
              {isProfileFieldVisible(member.profileVisibility, "email") ? (
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Email</dt>
                <dd className="mt-1">
                  <ContactLink href={`mailto:${member.email}`}>
                    {member.email}
                  </ContactLink>
                </dd>
              </div>
              ) : null}
              {isProfileFieldVisible(member.profileVisibility, "phone") ? (
              <div>
                <dt className="text-xs uppercase tracking-[0.16em] text-muted">Phone</dt>
                <dd className="mt-1">
                  <ContactLink href={`tel:${member.phone.replace(/\s+/g, "")}`}>
                    {member.phone}
                  </ContactLink>
                </dd>
              </div>
              ) : null}
              {member.websiteUrl &&
              isProfileFieldVisible(member.profileVisibility, "website") ? (
                <div>
                  <dt className="text-xs uppercase tracking-[0.16em] text-muted">
                    Website
                  </dt>
                  <dd className="mt-1">
                    <MemberWebsiteLink
                      url={member.websiteUrl}
                      className="font-medium text-bni hover:underline"
                    />
                  </dd>
                </div>
              ) : null}
            </dl>

            {member.linkedinUrl &&
            isProfileFieldVisible(member.profileVisibility, "linkedin") ? (
              <div className="mt-6 border-t border-border pt-5">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-ink-muted">
                  LinkedIn
                </p>
                <div className="mt-3 flex justify-center">
                  <LinkedInQr url={member.linkedinUrl} size={120} />
                </div>
              </div>
            ) : null}
          </aside>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        {published ? (
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
            <div className="space-y-8">
              {showSummary && member.profileSummary ? (
                <div>
                  <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
                    About {member.company}
                  </h2>
                  <div className="mt-4 space-y-4 text-base leading-relaxed text-muted">
                    {member.profileSummary.split(/\n{2,}/).map((paragraph) => (
                      <p key={paragraph.slice(0, 24)}>{paragraph.trim()}</p>
                    ))}
                  </div>
                </div>
              ) : null}

              {showIdealReferral && member.profileIdealReferral ? (
                <div className="rounded-2xl border border-border bg-white p-6">
                  <h3 className="text-2xl font-semibold text-foreground">
                    Ideal referral
                  </h3>
                  <p className="mt-3 text-base leading-relaxed text-muted">
                    {member.profileIdealReferral}
                  </p>
                </div>
              ) : null}
            </div>

            {showServices ? (
              <div className="rounded-2xl border border-border bg-white p-6">
                <h3 className="text-2xl font-semibold text-foreground">
                  Services
                </h3>
                <ul className="mt-4 space-y-3">
                  {member.profileServices.map((service) => (
                    <li
                      key={service}
                      className="flex gap-3 text-sm leading-relaxed text-foreground"
                    >
                      <span
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-bni"
                        aria-hidden="true"
                      />
                      <span>{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-white/70 px-6 py-10 text-center">
            <h2 className="text-2xl font-semibold text-foreground">
              Profile details coming soon
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-muted">
              {showContactPanel
                ? `Contact ${displayName} using the details above. A fuller company profile will appear here once it is published.`
                : `A fuller company profile for ${displayName} will appear here once it is published.`}
            </p>
          </div>
        )}

        {relatedMembers.length ? (
          <div className="mt-16 border-t border-border pt-12">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-semibold tracking-[-0.02em] text-foreground">
                  More members
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Other active chapter members you may want to connect with.
                </p>
              </div>
              <Link
                href="/"
                className="text-sm font-semibold text-bni hover:underline"
              >
                View all
              </Link>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {relatedMembers.map((related) => (
                <Link
                  key={related.id}
                  href={getMemberProfilePath(related)}
                  className="rounded-xl border border-border bg-white p-4 transition hover:border-[color-mix(in_srgb,var(--color-bni-red)_35%,var(--color-border))]"
                >
                  <p className="font-medium text-foreground">
                    {getMemberDisplayName(related)}
                  </p>
                  <p className="mt-1 text-sm text-muted">{related.company}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-bni">
                    {related.bniSeat}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

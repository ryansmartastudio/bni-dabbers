import Link from "next/link";
import { getAuthContext } from "@/lib/auth";
import { isLinkedMember } from "@/lib/member-access";
import { AuthButtons } from "@/components/layout/auth-buttons";

const navLinks = [
  { href: "/", label: "Directory", public: true },
  { href: "/members", label: "Members", auth: true },
  { href: "/my-profile", label: "My profile", linkedMember: true },
  { href: "/exports", label: "Exports", auth: true },
  { href: "/settings", label: "Settings", admin: true },
];

export async function Header() {
  const { isSignedIn, role } = await getAuthContext();
  const linkedMember = isSignedIn ? await isLinkedMember() : false;

  const visibleLinks = navLinks.filter((link) => {
    if (link.public) return true;
    if (link.auth && !isSignedIn) return false;
    if (link.admin && role !== "admin") return false;
    if (link.linkedMember && !linkedMember) return false;
    return true;
  });

  return (
    <header className="border-b border-border bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-bni text-sm font-bold text-white">
            BNI
          </span>
          <div>
            <p className="text-sm font-semibold tracking-wide text-foreground">
              BNI Dabbers
            </p>
            <p className="text-xs text-muted">Cheshire East</p>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {visibleLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground transition hover:bg-surface-muted"
              >
                {link.label}
              </Link>
            ))}
        </nav>

        {isSignedIn ? (
          <nav className="flex items-center gap-2 md:hidden">
            {visibleLinks
              .filter((link) => !link.public)
              .map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-2 py-1.5 text-xs font-medium text-foreground"
                >
                  {link.label}
                </Link>
              ))}
          </nav>
        ) : null}

        <AuthButtons />
      </div>
    </header>
  );
}

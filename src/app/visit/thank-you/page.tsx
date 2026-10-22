import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/marketing/marketing-shell";

export const metadata: Metadata = {
  title: { absolute: "Thank you | BNI Dabbers" },
  description: "Your guest visit enquiry was received.",
  robots: { index: false, follow: false },
};

export default function VisitThankYouPage() {
  return (
    <MarketingShell>
      <div className="marketing-container py-16 text-center">
        <h1 className="font-display text-3xl font-bold text-foreground">Thank you</h1>
        <p className="mx-auto mt-4 max-w-lg text-muted">
          Your guest visit enquiry was received. A chapter representative will email you with
          meeting details.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="marketing-primary-button">
            Back to home
          </Link>
          <Link href="/directory" className="marketing-secondary-button">
            Browse members
          </Link>
        </div>
      </div>
    </MarketingShell>
  );
}

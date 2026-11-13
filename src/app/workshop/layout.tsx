import type { Metadata } from "next";
import { WorkshopFooter } from "@/components/workshop/workshop-footer";

/**
 * Belt and braces on indexing: the proxy sets `X-Robots-Tag` on every workshop
 * response and serves a `Disallow: /` robots.txt on the subdomain; this adds
 * the meta tag so the page is self-describing wherever it is reached from.
 */
export const metadata: Metadata = {
  title: {
    default: "Visitor workshop",
    template: "%s · BNI Dabbers growth workshop",
  },
  description: "An interactive session for members of BNI Dabbers.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false },
  },
  alternates: { canonical: null },
  openGraph: undefined,
  twitter: undefined,
};

export default function WorkshopLayout({ children }: LayoutProps<"/workshop">) {
  return (
    <div id="workshop-root" className="relative flex min-h-dvh flex-col bg-surface">
      <div className="flex-1">{children}</div>
      <WorkshopFooter />
    </div>
  );
}

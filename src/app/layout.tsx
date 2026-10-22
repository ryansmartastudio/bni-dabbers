import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Header } from "@/components/layout/header";
import { SiteFooter } from "@/components/layout/site-footer";
import { GlobalWebsiteJsonLd } from "@/components/marketing/global-website-jsonld";
import { getClerkProxyUrl } from "@/lib/clerk-config";
import { DEFAULT_SITE_URL } from "@/lib/constants";
import { getSiteUrl } from "@/lib/site-url";
import "./globals.css";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? DEFAULT_SITE_URL),
  title: {
    default: "BNI Dabbers | Business networking in Cheshire East",
    template: "%s | BNI Dabbers",
  },
  description:
    "BNI Dabbers is a referral-first business networking group for Cheshire East — weekly meetings near Crewe, serving Nantwich, Sandbach and surrounding towns.",
  openGraph: {
    siteName: "BNI Dabbers",
    locale: "en_GB",
    type: "website",
    url: getSiteUrl(),
  },
  twitter: {
    card: "summary_large_image",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  ...(process.env.GOOGLE_SITE_VERIFICATION
    ? {
        verification: {
          google: process.env.GOOGLE_SITE_VERIFICATION,
        },
      }
    : {}),
  other: {
    "llms-txt": "/llms.txt",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  const proxyUrl = getClerkProxyUrl();

  return (
    <ClerkProvider
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/sign-in"}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/sign-up"}
      signInFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? "/members"
      }
      signUpFallbackRedirectUrl={
        process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? "/my-profile"
      }
      {...(proxyUrl ? { proxyUrl } : {})}
    >
      <html
        lang="en"
        className={`${figtree.variable} h-full antialiased`}
      >
        <head>
          <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM site index" />
        </head>
        <body className="flex min-h-full flex-col bg-background text-foreground">
          {/* impeccable-direction
          THESIS: A referral-ready chapter roster that proves meeting logistics and member credibility in one glance, not a generic card grid.
          OWN-WORLD: Warm ledger paper, BNI red rule and CTAs, Figtree sans UI, elevated white panels with measured shadow.
          STORY: Visitors understand when and where to meet, browse members by trade, open a profile to trust and connect.
          FIRST VIEWPORT: Full-width hero with chapter name at display scale, meeting facts in three ledger cards, venue image panel, primary browse CTA.
          FORM: Professional roster ledger; candidate 5; seed c02884ca.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
          */}
          <GlobalWebsiteJsonLd />
          <Header />
          <main className="flex-1">{children}</main>
          <SiteFooter />
          <Analytics />
          <SpeedInsights />
        </body>
      </html>
    </ClerkProvider>
  );
}

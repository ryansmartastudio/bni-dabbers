import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Source_Sans_3, Source_Serif_4 } from "next/font/google";
import { Header } from "@/components/layout/header";
import "./globals.css";

const sourceSans = Source_Sans_3({
  variable: "--font-source-sans",
  subsets: ["latin"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BNI Dabbers | Chapter Directory",
  description:
    "Member directory, roster management and meeting sheet exports for BNI Dabbers.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <ClerkProvider>
      <html
        lang="en"
        className={`${sourceSans.variable} ${sourceSerif.variable} h-full antialiased`}
      >
        <body className="flex min-h-full flex-col bg-background text-foreground">
          {/* impeccable-direction
          THESIS: A referral-ready chapter roster that proves meeting logistics and member credibility in one glance, not a generic card grid.
          OWN-WORLD: Warm ledger paper, BNI red rule and CTAs, Source Serif display over Source Sans UI, elevated white panels with measured shadow.
          STORY: Visitors understand when and where to meet, browse members by trade, open a profile to trust and connect.
          FIRST VIEWPORT: Full-width hero with chapter name at display scale, meeting facts in three ledger cards, venue image panel, primary browse CTA.
          FORM: Professional roster ledger; candidate 5; seed c02884ca.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
          */}
          <Header />
          <main className="flex-1">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}

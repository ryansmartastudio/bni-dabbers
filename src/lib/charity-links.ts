import type { CharityLink } from "@/db/schema";

export const GENIE_WISH_BLUE = "#64b4f5";
export const GENIE_WISH_GOLD = "#ffb71c";

export type CharityLinkPlacement = "charity" | "cover";

export type CharityLinkWithQr = CharityLink & { qrDataUrl: string };

function isChapterLinkLabel(label: string) {
  return /chapter/i.test(label);
}

export function resolveCharityLinkPlacement(
  link: Pick<CharityLink, "label" | "placement">,
): CharityLinkPlacement {
  if (link.placement === "cover" || link.placement === "charity") {
    return link.placement;
  }
  return isChapterLinkLabel(link.label) ? "cover" : "charity";
}

export function splitCharityLinksForBooklet<T extends CharityLink>(links: T[]) {
  const coverLinks: T[] = [];
  const charityLinks: T[] = [];

  for (const link of links) {
    if (resolveCharityLinkPlacement(link) === "cover") {
      coverLinks.push(link);
    } else {
      charityLinks.push(link);
    }
  }

  return { coverLinks, charityLinks };
}

export const CHARITY_LINK_PLACEMENTS = [
  { value: "charity", label: "Charity section (page 2)" },
  { value: "cover", label: "Front cover" },
] as const;

import {
  formatWebsiteLabel,
  normalizeWebsiteUrl,
} from "@/lib/members";

type MemberWebsiteLinkProps = {
  url: string;
  className?: string;
};

export function MemberWebsiteLink({ url, className }: MemberWebsiteLinkProps) {
  const href = normalizeWebsiteUrl(url);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className ?? "text-bni hover:underline"}
    >
      {formatWebsiteLabel(url)}
    </a>
  );
}

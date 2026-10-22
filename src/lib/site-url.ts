import { DEFAULT_SITE_URL } from "@/lib/constants";

export function getSiteUrl() {
  const explicit = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  return explicit || DEFAULT_SITE_URL;
}

export function absoluteUrl(path: string) {
  const base = getSiteUrl();
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalized}`;
}

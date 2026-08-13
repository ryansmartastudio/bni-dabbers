const clerkProxyUrl = process.env.NEXT_PUBLIC_CLERK_PROXY_URL?.replace(/\/$/, "");

export function getClerkProxyUrl() {
  return clerkProxyUrl || undefined;
}

export function isClerkProxyEnabled() {
  return Boolean(clerkProxyUrl);
}

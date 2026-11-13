import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest } from "next/server";
import { isClerkProxyEnabled } from "@/lib/clerk-config";
import {
  WORKSHOP_NOINDEX,
  isWorkshopHost,
  isWorkshopPath,
  toWorkshopPath,
} from "@/lib/workshop";

const isAdminRoute = createRouteMatcher([
  "/members/new(.*)",
  "/members/(.*)/edit(.*)",
  "/settings(.*)",
  "/pages(.*)",
  "/enquiries(.*)",
]);

const isProtectedRoute = createRouteMatcher([
  "/members(.*)",
  "/exports(.*)",
  "/settings(.*)",
  "/my-profile(.*)",
  "/pages(.*)",
  "/enquiries(.*)",
]);

const WORKSHOP_ROBOTS_TXT = "User-agent: *\nDisallow: /\n";

/**
 * Serves the visitor workshop from its own subdomain and keeps it out of search.
 *
 * Returns a response when the request belongs to the workshop, otherwise `null`
 * so the normal site (including Clerk route protection) handles it.
 */
function handleWorkshopRequest(req: NextRequest): NextResponse | null {
  const onWorkshopHost = isWorkshopHost(req.headers.get("host"));
  const { pathname } = req.nextUrl;

  if (!onWorkshopHost && !isWorkshopPath(pathname)) {
    return null;
  }

  // Clerk's optional frontend-API proxy must keep working untouched.
  if (pathname.startsWith("/__clerk/")) {
    return null;
  }

  // The subdomain gets its own robots.txt, not the main site's.
  if (onWorkshopHost && pathname === "/robots.txt") {
    return new NextResponse(WORKSHOP_ROBOTS_TXT, {
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "x-robots-tag": WORKSHOP_NOINDEX,
      },
    });
  }

  let response: NextResponse;
  if (onWorkshopHost && !isWorkshopPath(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = toWorkshopPath(pathname);
    response = NextResponse.rewrite(url);
  } else {
    response = NextResponse.next();
  }

  response.headers.set("x-robots-tag", WORKSHOP_NOINDEX);
  return response;
}

export default clerkMiddleware(
  async (auth, req) => {
    const workshopResponse = handleWorkshopRequest(req);
    if (workshopResponse) {
      return workshopResponse;
    }

    if (isProtectedRoute(req)) {
      await auth.protect();
    }

    if (isAdminRoute(req)) {
      const { sessionClaims } = await auth();
      const role = (sessionClaims?.metadata as { role?: string } | undefined)
        ?.role;
      if (role !== "admin") {
        return Response.redirect(new URL("/members", req.url));
      }
    }
  },
  {
    frontendApiProxy: {
      enabled: isClerkProxyEnabled(),
    },
  },
);

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/(.*)",
  ],
};

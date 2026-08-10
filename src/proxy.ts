import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isAdminRoute = createRouteMatcher([
  "/members/new(.*)",
  "/members/(.*)/edit(.*)",
  "/settings(.*)",
]);

const isProtectedRoute = createRouteMatcher([
  "/members(.*)",
  "/exports(.*)",
  "/settings(.*)",
]);

export default clerkMiddleware(
  async (auth, req) => {
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
      enabled: true,
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

"use client";

import { SignInButton, UserButton, useAuth } from "@clerk/nextjs";

export function AuthButtons() {
  const { isSignedIn } = useAuth();

  if (isSignedIn) {
    return (
      <div className="flex items-center gap-3">
        <UserButton />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <SignInButton mode="modal">
        <button className="rounded-md bg-bni px-4 py-2 text-sm font-medium text-white transition hover:bg-bni-dark">
          Sign in
        </button>
      </SignInButton>
    </div>
  );
}

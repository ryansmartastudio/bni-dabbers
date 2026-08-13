import { SignUp } from "@clerk/nextjs";
import { memberSignUpAppearance } from "@/lib/clerk-appearance";

export default function SignUpPage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-12">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/my-profile"
        appearance={memberSignUpAppearance}
      />
    </div>
  );
}

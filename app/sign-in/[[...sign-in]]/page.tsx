import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="surface-page grid min-h-screen place-items-center px-4 py-10">
      <div className="grid w-full max-w-md gap-6">
        <div className="text-center">
          <p className="text-sm font-medium text-subtle">Welcome back</p>
          <h1 className="mt-3 font-display text-4xl leading-tight">
            Continue your gentle progress.
          </h1>
        </div>
        <SignIn signUpUrl="/sign-up" fallbackRedirectUrl="/plan" />
      </div>
    </main>
  );
}

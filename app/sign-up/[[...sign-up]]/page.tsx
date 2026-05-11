import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="surface-page grid min-h-screen place-items-center px-4 py-10">
      <div className="grid w-full max-w-md gap-6">
        <div className="text-center">
          <p className="text-sm font-medium text-subtle">Create your space</p>
          <h1 className="mt-3 font-display text-4xl leading-tight">
            Save your growth plan.
          </h1>
        </div>
        <SignUp signInUrl="/sign-in" fallbackRedirectUrl="/plan" />
      </div>
    </main>
  );
}

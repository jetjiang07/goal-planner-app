import Link from "next/link";
import { ClipboardList, HelpCircle, ListChecks, Target } from "lucide-react";

import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Intake", icon: Target },
  { href: "/clarify", label: "Questions", icon: HelpCircle },
  { href: "/plan", label: "Plan", icon: ClipboardList },
  { href: "/tracker", label: "Tracker", icon: ListChecks },
];

type AppShellProps = {
  children: React.ReactNode;
  currentPath: string;
  eyebrow: string;
  title: string;
  description: string;
};

export function AppShell({
  children,
  currentPath,
  eyebrow,
  title,
  description,
}: AppShellProps) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-5 border-b pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              {eyebrow}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">{description}</p>
          </div>
          <nav className="grid grid-cols-2 gap-2 sm:flex">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-colors",
                    isActive
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-card hover:bg-muted",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}

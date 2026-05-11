import Link from "next/link";
import { Show, UserButton } from "@clerk/nextjs";
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
    <main className="surface-page min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:gap-10 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <header className="flex flex-col gap-6 border-b border-border/50 pb-6 sm:pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">
              {eyebrow}
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight tracking-normal sm:text-4xl lg:text-[2.75rem]">
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-soft sm:text-lg">
              {description}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <nav className="grid grid-cols-2 gap-2 sm:flex sm:rounded-lg sm:border sm:border-border/50 sm:bg-card/60 sm:p-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    className={cn(
                      "inline-flex h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition-all",
                      isActive
                        ? "border-primary/70 bg-primary text-primary-foreground shadow-calm"
                        : "border-border/60 bg-card/60 text-soft hover:border-primary/25 hover:bg-surface-tint/70 sm:border-transparent sm:bg-transparent",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <Show when="signed-in">
              <div className="flex justify-end">
                <UserButton />
              </div>
            </Show>
          </div>
        </header>
        {children}
      </div>
    </main>
  );
}

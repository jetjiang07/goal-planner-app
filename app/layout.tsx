import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter, Newsreader } from "next/font/google";

import { ThemeProvider } from "@/components/theme-provider";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const newsreader = Newsreader({
  subsets: ["latin"],
  variable: "--font-newsreader",
});

const themeScript = `
(() => {
  try {
    const key = "goal-planner:accent-theme";
    const theme = window.localStorage.getItem(key);
    const allowed = ["blossom", "mist", "sage", "dawn", "lavender", "peach"];
    document.documentElement.dataset.accentTheme = allowed.includes(theme) ? theme : "blossom";
  } catch {
    document.documentElement.dataset.accentTheme = "blossom";
  }
})();
`;

export const metadata: Metadata = {
  title: "Goal Planner AI",
  description: "A gentle AI growth companion for small, steady progress.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${newsreader.variable} font-sans`}>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <ClerkProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}

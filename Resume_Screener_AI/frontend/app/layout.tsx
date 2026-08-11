import type { Metadata } from "next";
import { DM_Sans, Instrument_Serif } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/app-shell";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Resume Screener AI",
    template: "%s · Resume Screener AI",
  },
  description:
    "AI-powered resume screening and job matching platform — screen hundreds of resumes in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${instrumentSerif.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ThemeProvider defaultTheme="system" storageKey="theme">
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}

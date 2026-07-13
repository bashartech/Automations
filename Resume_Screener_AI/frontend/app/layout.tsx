import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import AuthSidebar from "@/components/AuthSidebar";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Resume Screener AI",
  description: "AI-powered resume screening and job matching platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex">
        {/* Sidebar */}
        <nav className="w-64 bg-gray-900 text-white flex flex-col shrink-0">
          <div className="p-5 border-b border-gray-700">
            <h1 className="text-lg font-bold">Resume Screener</h1>
            <p className="text-xs text-gray-400 mt-1">AI Platform</p>
          </div>
          <div className="flex-1 py-4">
            <NavItem href="/" label="Dashboard" icon="📊" />
            <NavItem href="/candidates" label="Candidates" icon="👥" />
            <NavItem href="/analyze" label="Analyze" icon="🔍" />
            {/* <NavItem href="/search" label="Search" icon="🔎" /> */}
            <NavItem href="/bulk" label="Bulk Upload" icon="📦" />
            <NavItem href="/batches" label="Batch History" icon="📋" />
            <NavItem href="/pricing" label="Pricing" icon="💎" />
          </div>
          <div className="border-t border-gray-700 py-2">
            <AuthSidebar />
          </div>
        </nav>
        {/* Main content */}
        <main className="flex-1 overflow-auto bg-gray-50">
          {children}
        </main>
      </body>
    </html>
  );
}

function NavItem({ href, label, icon }: { href: string; label: string; icon: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-5 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
    >
      <span className="text-lg">{icon}</span>
      {label}
    </Link>
  );
}

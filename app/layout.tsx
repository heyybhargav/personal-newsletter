import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { getSession } from "@/lib/auth";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ['normal', 'italic'],
  variable: "--font-newsreader"
});

export const metadata: Metadata = {
  metadataBase: new URL('https://signaldaily.me'),
  title: "Signal - High-Signal Intelligence Briefing",
  description: "Your AI-curated daily executive briefing. Less scrolling, more knowing.",
  openGraph: {
    title: "Signal - High-Signal Intelligence Briefing",
    description: "Your AI-curated daily executive briefing. Less scrolling, more knowing.",
    url: 'https://signaldaily.me',
    siteName: 'Signal Daily',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Signal - High-Signal Intelligence Briefing",
    description: "Your AI-curated daily executive briefing. Less scrolling, more knowing.",
  },
  appleWebApp: {
    capable: true,
    title: "Signal",
    statusBarStyle: "black-translucent",
  },

};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const initialUser = session ? { email: session.email } : null;

  return (
    <html lang="en">
      <body className={`${inter.variable} ${newsreader.variable} font-sans antialiased`}>
        <Navbar initialUser={initialUser} />
        {children}
        <div className="fixed inset-0 z-50 pointer-events-none bg-noise opacity-[0.03] mix-blend-overlay"></div>
      </body>
    </html>
  );
}

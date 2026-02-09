import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ['normal', 'italic'],
  variable: "--font-newsreader"
});

export const metadata: Metadata = {
  title: "Signal - High-Signal Intelligence Briefing",
  description: "Your AI-curated daily executive briefing. Less scrolling, more knowing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${newsreader.variable} font-sans antialiased`}>
        <Navbar />
        {children}
        <div className="fixed inset-0 z-50 pointer-events-none bg-noise opacity-[0.03] mix-blend-overlay"></div>
      </body>
    </html>
  );
}

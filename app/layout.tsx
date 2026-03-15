import type { Metadata } from "next";
import { Inter, Newsreader } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import GoogleAuthProvider from "@/components/GoogleAuthProvider";
import { getSession } from "@/lib/auth";
import { getUser, getTrialDaysRemaining } from "@/lib/db";

import { Analytics } from "@vercel/analytics/react";
import { GoogleAnalytics } from "@next/third-parties/google";
import { SITE_URL } from "@/lib/config";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const newsreader = Newsreader({
  subsets: ["latin"],
  style: ['normal'],
  variable: "--font-newsreader"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Stay on top of everything you read, watch, and listen to.",
  description: "Siftl follows your newsletters, podcasts, and YouTube channels and delivers the highlights in one clean email, on your schedule.",
  openGraph: {
    title: "Stay on top of everything you read, watch, and listen to.",
    description: "Siftl follows your newsletters, podcasts, and YouTube channels and delivers the highlights in one clean email, on your schedule.",
    url: SITE_URL,
    siteName: 'Siftl',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: 'any' },
    ],
    apple: [
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
  },
  // Next.js will automatically use app/icon.svg and app/apple-icon.tsx
  applicationName: 'Siftl',
  appleWebApp: {
    capable: true,
    title: "Siftl",
    statusBarStyle: "default",
  },

};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  let initialUser = null;
  let tier = 'active';
  let trialDaysRemaining = 0;

  if (session) {
    const user = await getUser(session.email);
    if (user) {
      initialUser = { email: user.email };
      tier = user.tier || 'active';
      trialDaysRemaining = getTrialDaysRemaining(user);
    }
  }

  return (
    <html lang="en">
      <body className={`${inter.variable} ${newsreader.variable} font-sans antialiased`}>
        <GoogleAuthProvider />
        <Navbar initialUser={initialUser} tier={tier} trialDaysRemaining={trialDaysRemaining} />
        {children}
        <Analytics />
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID!} />
        <div className="fixed inset-0 z-50 pointer-events-none bg-noise opacity-[0.03] mix-blend-overlay"></div>
      </body>
    </html>
  );
}

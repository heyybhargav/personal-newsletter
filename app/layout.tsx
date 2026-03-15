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
  title: "Siftl - Your automated research analyst.",
  description: "Siftl watches, reads, and listens for you—simplifying complex ideas into clear insights, delivered in one clean daily briefing.",
  openGraph: {
    title: "Siftl - Your automated research analyst.",
    description: "Siftl watches, reads, and listens for you—simplifying complex ideas into clear insights, delivered in one clean daily briefing.",
    url: SITE_URL,
    siteName: 'Siftl',
    locale: 'en_US',
    type: 'website',
  },
  icons: {
    icon: [
      { url: '/icon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-48.png', sizes: '48x48', type: 'image/png' },
      { url: '/icon-96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
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
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "Siftl",
              "url": SITE_URL,
              "potentialAction": {
                "@type": "SearchAction",
                "target": `${SITE_URL}/blog?q={search_term_string}`,
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SiteNavigationElement",
              "hasPart": [
                {
                  "@type": "WebPage",
                  "name": "Home",
                  "url": SITE_URL
                },
                {
                  "@type": "WebPage",
                  "name": "Blog",
                  "url": `${SITE_URL}/blog`
                },
                {
                  "@type": "WebPage",
                  "name": "Pricing",
                  "url": `${SITE_URL}/pricing`
                },
                {
                  "@type": "WebPage",
                  "name": "FAQ",
                  "url": `${SITE_URL}/faq`
                }
              ]
            })
          }}
        />
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

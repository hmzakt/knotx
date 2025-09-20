import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import { Navbar } from "@/components/navbar";
import { RouteLoadingProvider } from "@/contexts/RouteLoadingContext";
import RouteLoadingOverlay from "@/components/RouteLoadingOverlay";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // ✅ better performance
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

// ✅ Enhanced SEO metadata
export const metadata: Metadata = {
  title: {
    default: "SkillBridge - Learn Design & Development Online",
    template: "%s | SkillBridge",
  },
  description:
    "Unlock your creative potential with SkillBridge. Learn design and development from industry experts with flexible, up-to-date online courses.",
  keywords: [
    "online courses",
    "design learning",
    "web development tutorials",
    "learn coding",
    "UI/UX training",
  ],
  authors: [{ name: "SkillBridge" }],
  creator: "SkillBridge Team",
  openGraph: {
    title: "SkillBridge - Learn Design & Development Online",
    description:
      "Learn from industry experts and enhance your skills with practical projects, flexible schedules, and updated curriculum.",
    url: "https://your-domain.com",
    siteName: "SkillBridge",
    images: [
      {
        url: "https://your-domain.com/og-image.png", // ✅ replace with your OG image
        width: 1200,
        height: 630,
        alt: "SkillBridge - Online Learning",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SkillBridge - Learn Design & Development Online",
    description:
      "Learn design and development online from industry experts. Flexible, practical, and updated courses.",
    images: ["https://your-domain.com/og-image.png"], // ✅ replace with your image
    creator: "@your_twitter_handle", // ✅ update if available
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" dir="ltr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          <SubscriptionProvider>
            <RouteLoadingProvider>
              <RouteLoadingOverlay />
              <Navbar />
              {children}
            </RouteLoadingProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

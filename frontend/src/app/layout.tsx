import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../contexts/AuthContext";
import { SubscriptionProvider } from "../contexts/SubscriptionContext";
import { ThemeProvider } from "../contexts/ThemeContext";
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


export const metadata: Metadata = {
  title: {
    default: "KnotX",
    template: "%s | KnotX",
  },
  description:
    "Unlock your creative potential with KnotX. Practise with and upgrade yourself.",
  keywords: [
    "online courses",
    "test series",
    "dgca tutorials",
    "dgca",
    "preparation",
    "flight",
    "online preparation",
    "learn",
    "fly",
    "dgca practise"
  ],
  authors: [{ name: "KnotX" }],
  creator: "Md Hamza Akhtar",
  openGraph: {
    title: "KnotX - Your flight companion",
    description:
      "Learn from industry experts and enhance your skills with properly structures papers, test series and updated curriculum.",
    url: "https://your-domain.com",
    siteName: "knotX",
    // images: [
    //   {
    //     url: "https://your-domain.com/og-image.png", 
    //     width: 1200,
    //     height: 630,
    //     alt: "SkillBridge - Online Learning",
    //   },
    // ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "KnotX - Your friendly flight instruction",
    description:
      "Learn from industry experts and enhance your skills with properly structures papers, test series and updated curriculum.",
    // images: ["https://your-domain.com/og-image.png"], // ✅ replace with your image
    creator: "@hmz_akt", //
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" dir="ltr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <ThemeProvider>
          <AuthProvider>
            <SubscriptionProvider>
              <RouteLoadingProvider>
                <RouteLoadingOverlay />
                <Navbar />
                {children}
              </RouteLoadingProvider>
            </SubscriptionProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

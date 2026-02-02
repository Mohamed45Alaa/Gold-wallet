import type { Metadata } from "next";
import { Inter, Cairo } from "next/font/google";
import "./globals.css";
import { UserAuth } from "@/components/UserAuth";
import { RealtimeInitializer } from "@/components/RealtimeInitializer";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { ScrollReset } from "@/components/ScrollReset";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const cairo = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: "Gold Asset Tracker",
  description: "Personal finance dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <body
        className={`${cairo.variable} ${inter.variable} font-sans antialiased min-h-screen bg-background text-foreground`}
      >
        <RealtimeInitializer />
        <OnboardingGuide />
        <ScrollReset />
        <UserAuth />
        <main className="container mx-auto px-4 py-8 max-w-4xl relative">
          {children}
        </main>
      </body>
    </html>
  );
}

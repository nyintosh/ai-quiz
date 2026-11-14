import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ),
  title: "Quiz AI",
  description: "Check multiple-choice answers with your camera and AI",
  keywords: [
    "quiz",
    "AI",
    "camera",
    "study",
    "multiple choice",
    "Claude",
    "Gemini",
    "GPT",
  ],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quiz AI",
  },
  icons: {
    apple: "/icons/icon-192.png",
  },
  openGraph: {
    title: "Quiz AI",
    description: "Check multiple-choice answers with your camera and AI",
    type: "website",
    locale: "en_US",
    siteName: "Quiz AI",
  },
  twitter: {
    card: "summary_large_image",
    title: "Quiz AI",
    description: "Check multiple-choice answers with your camera and AI",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#07080b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full overflow-hidden">
      <body className="h-full overflow-hidden bg-[#07080b] text-slate-50 antialiased">
        {children}
      </body>
    </html>
  );
}

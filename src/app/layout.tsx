import type { Metadata, Viewport } from "next";
import { AudioUnlock } from "@/components/AudioUnlock";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/InstallPrompt";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLAY CITY",
  description:
    "Gamified English learning for kids — explore the city, complete missions, earn rewards.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "SLAY CITY",
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/icons/favicon-32x32.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#FF2D8E",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // No `height: 100%` on <html>/<body>: an installed iOS PWA refuses to
    // scroll the document at all when the root elements are locked to the
    // viewport that way. `min-h-dvh` keeps a short page filling the screen
    // without capping how tall the document may grow.
    <html lang="en">
      <body className="min-h-dvh flex flex-col bg-black text-white antialiased">
        <ServiceWorkerRegistration />
        <AudioUnlock />
        <InstallPrompt />
        {children}
      </body>
    </html>
  );
}

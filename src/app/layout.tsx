import type { Metadata, Viewport } from "next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { AudioUnlock } from "@/components/AudioUnlock";
import { MediaGuard } from "@/components/MediaGuard";
import { PortraitLock } from "@/components/PortraitLock";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { InstallPrompt } from "@/components/InstallPrompt";
import { resolveLocale } from "@/features/i18n/server";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Only for the rotate-your-phone overlay, which has to be in the first paint
  // to be of any use. Every route here is server-rendered on demand already, so
  // reading the request costs no static rendering.
  const { locale } = await resolveLocale();

  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-black text-white antialiased">
        <ServiceWorkerRegistration />
        <AudioUnlock />
        <MediaGuard />
        <InstallPrompt />
        {children}
        {/* Last, so it covers the app on stacking order as well as z-index. */}
        <PortraitLock locale={locale} />
      </body>
      {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
        <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
      )}
    </html>
  );
}

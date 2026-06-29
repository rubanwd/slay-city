import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SLAY CITY",
  description: "Gamified English learning for kids",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-black text-white antialiased">
        {children}
      </body>
    </html>
  );
}

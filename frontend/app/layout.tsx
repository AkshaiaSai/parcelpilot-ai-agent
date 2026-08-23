import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "ParcelPilot — Operations Support & Ground-Truth Intelligence",
  description: "Autonomous reasoning console for logistics operations, contract verification, and customer support dispatch.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body
        className={`${inter.variable} ${jetbrainsMono.variable} font-sans bg-background text-foreground h-full antialiased selection:bg-primary/20 selection:text-primary overflow-hidden`}
      >
        {children}
      </body>
    </html>
  );
}

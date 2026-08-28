import type { Metadata } from "next";
import "@machi-asia/ui/styles.css";
import "@machi-asia/rose/styles.css";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Rose — AI Companion",
  description: "A general-purpose AI assistant powered by Google Gemini.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import "@machi-asia/ui/styles.css";
import "@machi-asia/rose/styles.css";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "Component Explorer — machi-asia",
  description: "Dynamic .tsx component explorer and navigation across all monorepo packages.",
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

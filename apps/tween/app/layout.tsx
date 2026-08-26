import type { Metadata } from "next";
import "@machi-asia/ui/styles.css";
import "./globals.css";
import { Providers } from "@/components/Providers";

export const metadata: Metadata = {
  title: "tween — Build pages that move",
  description:
    "tween is the web page builder where scroll-driven motion is a setting, not a plugin. Drag, drop, tween — publish pages that move.",
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

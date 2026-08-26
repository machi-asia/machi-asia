import type { Metadata } from "next";
import "@machi-asia/ui/styles.css";

export const metadata: Metadata = {
  title: "API Gateway",
  description: "Machi Asia API Gateway",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

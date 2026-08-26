import "@machi-asia/ui/styles.css";

export const metadata = {
  title: "Media Library — Machi Asia",
  description: "Manage and organize media assets",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

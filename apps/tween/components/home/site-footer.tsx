import { Footer } from "@machi-asia/ui";

export function SiteFooter() {
  return (
    <Footer
      variant="solid"
      brand={<strong className="brand">tween</strong>}
      links={[
        { label: "Features", href: "#features" },
        { label: "Showcase", href: "#showcase" },
        { label: "Pricing", href: "#pricing" },
        { label: "GitHub", href: "https://github.com/machi-asia/component-library" },
      ]}
      note={`© ${new Date().getFullYear()} Machi Asia. Built with @machi-asia/ui.`}
    />
  );
}

import { Button, Navbar } from "@machi-asia/ui";
import { ScrollButton } from "@/components/scroll-button";

export function SiteNavbar() {
  return (
    <Navbar
      sticky
      variant="glass"
      brand={<strong className="brand">tween</strong>}
      links={[
        { label: "Features", targetId: "features" },
        { label: "Showcase", targetId: "showcase" },
        { label: "Pricing", targetId: "pricing" },
      ]}
      actions={
        <>
          <Button variant="ghost" size="sm">
            Sign in
          </Button>
          <ScrollButton variant="primary" size="sm" targetId="pricing">
            Start building
          </ScrollButton>
        </>
      }
    />
  );
}

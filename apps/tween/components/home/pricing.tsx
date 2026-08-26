import { Button, Card, CardBody, CardFooter, ScrollReveal } from "@machi-asia/ui";
import { ScrollButton } from "@/components/scroll-button";

const TIERS: Array<{
  name: string;
  price: string;
  period: string;
  perks: string[];
  cta: string;
  buttonVariant: "ghost" | "primary" | "secondary";
  featured?: boolean;
}> = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    perks: [
      "3 published pages",
      "tween.site subdomain",
      "Core motion presets",
      "Community support",
    ],
    cta: "Start free",
    buttonVariant: "ghost",
  },
  {
    name: "Pro",
    price: "$12",
    period: "per month",
    featured: true,
    perks: [
      "Unlimited pages",
      "Custom domains + SSL",
      "Full motion library",
      "Built-in analytics",
      "No tween badge",
    ],
    cta: "Go Pro",
    buttonVariant: "primary",
  },
  {
    name: "Team",
    price: "$29",
    period: "per month",
    perks: [
      "Everything in Pro",
      "Shared workspaces",
      "Roles and approvals",
      "Priority support",
      "SSO (coming soon)",
    ],
    cta: "Contact sales",
    buttonVariant: "secondary",
  },
];

export function Pricing() {
  return (
    <section className="section" id="pricing">
      <div className="container">
        <ScrollReveal variant="wipe">
          <div className="section-head">
            <span className="kicker">Pricing</span>
            <h2>Start free, scale when it moves you</h2>
            <p>
              Every plan ships the full builder. Paid plans unlock publishing
              power and the complete motion library.
            </p>
          </div>
        </ScrollReveal>

        <div className="pricing-grid">
          {TIERS.map((tier) => (
            <ScrollReveal
              key={tier.name}
              variant={tier.featured ? "zoom-in" : "fade-up"}
            >
              <Card
                variant={tier.featured ? "glass" : "outline"}
                hoverable
                padding="lg"
                className="feature-card tier"
                style={
                  tier.featured
                    ? { borderColor: "color-mix(in oklab, var(--mui-primary) 55%, transparent)" }
                    : undefined
                }
              >
                <CardBody style={{ display: "grid", gap: 16 }}>
                  {tier.featured && (
                    <span className="tier-flag">Most popular</span>
                  )}
                  <h3 style={{ margin: 0, fontSize: 20 }}>{tier.name}</h3>
                  <p className="price">
                    <strong>{tier.price}</strong>
                    <span>{tier.period}</span>
                  </p>
                  <ul className="perk-list">
                    {tier.perks.map((perk) => (
                      <li key={perk}>{perk}</li>
                    ))}
                  </ul>
                </CardBody>
                <CardFooter>
                  {tier.featured ? (
                    <ScrollButton
                      variant={tier.buttonVariant}
                      fullWidth
                      targetId="top"
                    >
                      {tier.cta}
                    </ScrollButton>
                  ) : (
                    <Button variant={tier.buttonVariant} fullWidth>
                      {tier.cta}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

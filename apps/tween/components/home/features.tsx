import { Card, CardBody, ScrollReveal } from "@machi-asia/ui";

import type { ScrollRevealVariant } from "@machi-asia/ui";

const FEATURES: Array<{
  glyph: string;
  title: string;
  body: string;
  reveal: ScrollRevealVariant;
}> = [
  {
    glyph: "\u25C6",
    title: "Visual canvas",
    body: "Drag, drop and resize sections on a freeform canvas. Grid and flex layouts assemble themselves — you never touch a stylesheet.",
    reveal: "fade-up",
  },
  {
    glyph: "\u2726",
    title: "Motion presets",
    body: "Curtains, splits, stacks, tunnels — every scroll-driven entrance is a preset you apply to any section in one click.",
    reveal: "zoom-in",
  },
  {
    glyph: "\u25B2",
    title: "Template gallery",
    body: "Start from landing pages, portfolios and launch pages that already move, then swap the copy and ship.",
    reveal: "blur",
  },
  {
    glyph: "\u25CF",
    title: "Responsive by default",
    body: "Every section adapts across phone, tablet and desktop breakpoints. Preview them side by side while you edit.",
    reveal: "fade-right",
  },
  {
    glyph: "\u25A0",
    title: "One-click publish",
    body: "Ship to a global edge CDN with custom domains and SSL. Your page goes live before the animation finishes playing.",
    reveal: "fade-up",
  },
  {
    glyph: "\u271A",
    title: "Fast out of the box",
    body: "Motion runs on transforms and opacity alone — no layout thrash, no re-renders, Lighthouse scores that stay green.",
    reveal: "zoom-out",
  },
];

export function Features() {
  return (
    <section className="section" id="features">
      <div className="container">
        <ScrollReveal variant="fade-up">
          <div className="section-head">
            <span className="kicker">Why tween</span>
            <h2>A builder that speaks motion</h2>
            <p>
              Everything you need to compose, animate and publish a page —
              built into one canvas.
            </p>
          </div>
        </ScrollReveal>

        <div className="features-grid">
          {FEATURES.map((feature) => (
            <ScrollReveal key={feature.title} variant={feature.reveal}>
              <Card
                variant="outline"
                hoverable
                padding="lg"
                className="feature-card"
              >
                <CardBody>
                  <span className="feature-icon">{feature.glyph}</span>
                  <h3>{feature.title}</h3>
                  <p>{feature.body}</p>
                </CardBody>
              </Card>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}

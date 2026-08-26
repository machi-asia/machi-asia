import { Button, ScrollReveal } from "@machi-asia/ui";

export function CtaBand() {
  return (
    <section className="cta-band" id="start">
      <ScrollReveal variant="fade-up" className="container">
        <div className="cta-band-inner">
          <h2>Your next page is one drag away.</h2>
          <p>
            Spin up a project for free and publish your first moving page
            today.
          </p>
          <Button size="lg">Start building free</Button>
        </div>
      </ScrollReveal>
    </section>
  );
}

import { Parallax, ScrollReveal } from "@machi-asia/ui";
import { ScrollButton } from "@/components/scroll-button";

export function Hero() {
  return (
    <header className="hero" id="top">
      <Parallax
        speed={-0.35}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <span className="hero-blob hero-blob-a" />
      </Parallax>
      <Parallax
        speed={0.25}
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <span className="hero-blob hero-blob-b" />
      </Parallax>

      <div className="container">
        <ScrollReveal variant="fade-up">
          <div className="hero-inner">
            <span className="kicker">Web page builder &middot; beta</span>
            <h1>
              Build pages that <span className="grad">move.</span>
            </h1>
            <p className="lede">
              tween turns scroll-driven motion into a setting, not a plugin.
              Drag sections onto a canvas, pick an entrance, and publish pages
              that feel alive — no code, no keyframes.
            </p>
            <div className="hero-actions">
              <ScrollButton size="lg" targetId="pricing">
                Start building
              </ScrollButton>
              <ScrollButton size="lg" variant="ghost" targetId="showcase">
                See it in motion
              </ScrollButton>
            </div>

            <ScrollReveal variant="zoom-out">
              <div className="builder" aria-hidden>
                <div className="builder-bar">
                  <span className="dot" />
                  <span className="dot" />
                  <span className="dot" />
                  <span className="builder-tab">landing.tw</span>
                </div>
                <div className="builder-body">
                  <div className="builder-layers">
                    <span className="layer-chip">Header</span>
                    <span className="layer-chip active">Hero &middot; curtain</span>
                    <span className="layer-chip">Feature grid</span>
                    <span className="layer-chip">Pricing</span>
                    <span className="layer-chip">Footer</span>
                  </div>
                  <div className="builder-canvas">
                    <span className="motion-tag">ScrollCurtain &middot; 600ms</span>
                    <div className="canvas-block canvas-title" />
                    <div className="canvas-block canvas-selected" />
                    <div className="canvas-block" style={{ width: "84%" }} />
                    <div className="canvas-block" style={{ width: "68%" }} />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </ScrollReveal>
      </div>
    </header>
  );
}

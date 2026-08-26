import type { CSSProperties } from "react";
import {
  ScrollCurtain,
  ScrollDepth,
  ScrollHorizontal,
  ScrollReveal,
  ScrollRotate,
  ScrollSplit,
  ScrollStack,
  ScrollZoom,
} from "@machi-asia/ui";
import { BrowserMock } from "./browser-mock";

const TINT_A = { background: "color-mix(in oklab, var(--mui-primary) 5%, var(--mui-bg))" };
const TINT_B = { background: "color-mix(in oklab, var(--mui-primary) 9%, var(--mui-bg))" };
const TINT_C = { background: "color-mix(in oklab, var(--mui-primary) 13%, var(--mui-bg))" };
const TINT_D = { background: "color-mix(in oklab, var(--mui-primary) 7%, var(--mui-bg))" };

function DemoCard(props: {
  kicker: string;
  title: string;
  body: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="demo-card">
      <span className="kicker">{props.kicker}</span>
      <h3>{props.title}</h3>
      <p>{props.body}</p>
      {props.children}
    </div>
  );
}

function StackItem(props: {
  theme: string;
  address: string;
  title: string;
  caption: string;
}) {
  return (
    <div className="stack-item">
      <BrowserMock theme={props.theme} address={props.address} />
      <div className="slide-label">
        <strong>{props.title}</strong>
        <span>{props.caption}</span>
      </div>
    </div>
  );
}

export function Showcase() {
  return (
    <section id="showcase">
      <div className="container section">
        <ScrollReveal variant="fade-up">
          <div className="section-head">
            <span className="kicker">Motion presets</span>
            <h2>Every entrance is a preset</h2>
            <p>
              Keep scrolling — every panel below is a live tween preset. Pick
              one, drop it on a section, done.
            </p>
          </div>
        </ScrollReveal>
      </div>

      {/* Curtain */}
      <ScrollCurtain
        direction="up"
        length={1.4}
        curtain={<span className="curtain-word">reveal</span>}
        curtainClassName="curtain-cover"
      >
        <section className="demo-panel" style={TINT_A}>
          <DemoCard
            kicker="ScrollCurtain"
            title="Sections that introduce themselves"
            body="An opaque cover slides away as the reader arrives, while the content settles from a gentle zoom. Put your logo on the curtain — it leaves with the reveal."
          />
        </section>
      </ScrollCurtain>

      {/* Split */}
      <ScrollSplit
        direction="horizontal"
        length={1.4}
        panelA={<span className="split-word">drag</span>}
        panelB={<span className="split-word">drop</span>}
        panelClassName="split-panel"
        panelStyle={{ background: "var(--mui-primary)" }}
      >
        <section className="demo-panel" style={TINT_B}>
          <DemoCard
            kicker="ScrollSplit"
            title="Doors that part like an elevator"
            body="Two opaque panels slide apart along either axis. Perfect for before/after stories or a dramatic first impression."
          />
        </section>
      </ScrollSplit>

      {/* Stack */}
      <ScrollStack itemHeight="92vh">
        <StackItem
          theme="theme-dusk"
          address="saas.tween.site"
          title="SaaS landing"
          caption="Stacked deck · card 1 of 3"
        />
        <StackItem
          theme="theme-meadow"
          address="studio.tween.site"
          title="Portfolio"
          caption="Stacked deck · card 2 of 3"
        />
        <StackItem
          theme="theme-ember"
          address="launch.tween.site"
          title="Product launch"
          caption="Stacked deck · card 3 of 3"
        />
      </ScrollStack>

      {/* Horizontal */}
      <ScrollHorizontal>
        <div className="hslide">
          <DemoCard
            kicker="ScrollHorizontal"
            title="Sideways galleries"
            body="Vertical scroll becomes horizontal travel — one viewport per slide. Great for template tours and step-by-step stories."
          />
        </div>
        <div className="hslide">
          <BrowserMock theme="theme-tide" address="event.tween.site" />
          <div className="slide-label">
            <strong>Event page</strong>
            <span>Schedule, speakers, tickets</span>
          </div>
        </div>
        <div className="hslide">
          <BrowserMock theme="theme-meadow" address="shop.tween.site" />
          <div className="slide-label">
            <strong>Storefront</strong>
            <span>Catalog, cart, checkout</span>
          </div>
        </div>
        <div className="hslide">
          <BrowserMock theme="theme-dusk" address="blog.tween.site" />
          <div className="slide-label">
            <strong>Blog</strong>
            <span>Posts, tags, archive</span>
          </div>
        </div>
      </ScrollHorizontal>

      {/* Zoom */}
      <ScrollZoom mode="zoom-in" length={1.6}>
        <section className="demo-panel" style={TINT_C}>
          <DemoCard
            kicker="ScrollZoom"
            title="Your work, rushing forward"
            body="Content grows into place from the distance as the reader scrolls in — or recedes away when they leave."
          >
            <div className="zoom-preview">
              <BrowserMock theme="theme-tide" address="preview.tween.site" />
            </div>
          </DemoCard>
        </section>
      </ScrollZoom>

      {/* Rotate */}
      <ScrollRotate angle={360} length={1.8}>
        <section className="demo-panel" style={TINT_D}>
          <div className="rotate-stage">
            <span className="spin-glyph">{"\u2726"}</span>
            <DemoCard
              kicker="ScrollRotate"
              title="Motion with meaning"
              body="Pin any element and spin it through an arc of your choosing as the page scrolls."
            />
          </div>
        </section>
      </ScrollRotate>

      {/* Depth */}
      <ScrollDepth length={2}>
        {[0, 1, 2].map((i) => (
          <div key={i} className="depth-center">
            <div
              className="depth-frame"
              style={{ "--i": i } as CSSProperties}
            >
              <span>{`Layer 0${i + 1}`}</span>
            </div>
          </div>
        ))}
        <div className="depth-center">
          <div className="depth-frame" style={{ "--i": 3 } as CSSProperties}>
            <div className="demo-card depth-copy">
              <span className="kicker">ScrollDepth</span>
              <h3>Tunnels of layers</h3>
            </div>
          </div>
        </div>
      </ScrollDepth>
    </section>
  );
}

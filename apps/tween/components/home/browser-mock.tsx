interface BrowserMockProps {
  theme?: string;
  address?: string;
}

export function BrowserMock({
  theme = "theme-dusk",
  address = "page.tween.site",
}: BrowserMockProps) {
  return (
    <div className={`browser ${theme}`}>
      <div className="browser-bar">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="address-pill">{address}</span>
      </div>
      <div className="browser-body">
        <span className="skel-line skel-hero" />
        <span className="skel-line" style={{ width: "58%" }} />
        <span className="skel-line" style={{ width: "40%" }} />
        <span className="skel-btn" />
      </div>
    </div>
  );
}

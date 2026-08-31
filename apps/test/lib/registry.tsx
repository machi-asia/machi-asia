"use client";

import React, { useState } from "react";
import * as UI from "@machi-asia/ui";
import * as Rose from "@machi-asia/rose";
import * as ApiGateway from "@machi-asia/api-gateway";
import * as MediaLibrary from "@machi-asia/media-library";

// ==========================================
// 1. UI Components Previews
// ==========================================

interface PreviewProps {
  /** Selected values for enumerable props, keyed by prop name. */
  props?: Record<string, string>;
}

function ButtonPreview({ props }: PreviewProps) {
  const [count, setCount] = useState(0);
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
      <UI.Button variant={props?.variant as UI.ButtonProps["variant"]} onClick={() => setCount((c) => c + 1)} size={props?.size as UI.ButtonProps["size"]}>
        {props?.variant} (Clicked {count})
      </UI.Button>
      <UI.Button variant="secondary">Secondary</UI.Button>
      <UI.Button variant="ghost">Ghost</UI.Button>
      <UI.Button variant="danger">Danger</UI.Button>
      <UI.Button disabled>Disabled</UI.Button>
    </div>
  );
}

function CardPreview({ props }: PreviewProps) {
  return (
    <div style={{ maxWidth: "480px", width: "100%" }}>
      <UI.Card variant={props?.variant as UI.CardVariant} padding={props?.padding as UI.CardProps["padding"]}>
        <UI.CardHeader
          title="Interactive Card Preview"
          subtitle="Dynamic monorepo component explorer"
        />
        <UI.CardBody>
          <p style={{ margin: "0 0 12px 0", lineHeight: "1.5" }}>
            This is a live rendered preview of the <code>Card</code> component from <code>@machi-asia/ui</code>.
          </p>
          <div style={{ display: "flex", gap: "8px" }}>
            <UI.Button variant="primary" size="sm">Action</UI.Button>
            <UI.Button variant="secondary" size="sm">Cancel</UI.Button>
          </div>
        </UI.CardBody>
      </UI.Card>
    </div>
  );
}

function AccordionPreview({ props }: PreviewProps) {
  return (
    <div style={{ maxWidth: "560px", width: "100%" }}>
      <UI.Accordion allowMultiple variant={props?.variant as UI.AccordionVariant}>
        <UI.AccordionItem header="What is the machi-asia Monorepo?">
          <p style={{ padding: "8px 0" }}>
            A unified workspace housing apps (tween, rose, test) and reusable packages (ui, auth, api-gateway, media-library, rose).
          </p>
        </UI.AccordionItem>
        <UI.AccordionItem header="How does dynamic discovery work?">
          <p style={{ padding: "8px 0" }}>
            The test app inspects the packages filesystem at runtime, discovering all .tsx files instantly without code changes.
          </p>
        </UI.AccordionItem>
        <UI.AccordionItem header="Can I add new components?">
          <p style={{ padding: "8px 0" }}>
            Yes! Any new .tsx component added to any package will appear in the navigation bar automatically.
          </p>
        </UI.AccordionItem>
      </UI.Accordion>
    </div>
  );
}

function SwitchPreview({ props }: PreviewProps) {
  const [checked, setChecked] = useState(true);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <UI.Switch
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        variant={props?.variant as UI.SwitchVariant}
        label={`Status: ${checked ? "Active / Enabled" : "Disabled"}`}
      />
    </div>
  );
}

function TabsPreview({ props }: PreviewProps) {
  return (
    <div style={{ maxWidth: "600px", width: "100%" }}>
      <UI.Tabs
        variant={props?.variant as UI.TabsVariant}
        items={[
          { id: "tab1", label: "Overview", content: <div style={{ padding: "16px 0" }}>Component overview & API specs.</div> },
          { id: "tab2", label: "Props", content: <div style={{ padding: "16px 0" }}>Interactive props inspector.</div> },
          { id: "tab3", label: "Source", content: <div style={{ padding: "16px 0" }}>Full TypeScript source code.</div> },
        ]}
      />
    </div>
  );
}

function TablePreview({ props }: PreviewProps) {
  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <UI.Table
        variant={props?.variant as UI.TableVariant}
        size={props?.size as UI.TableProps<never>["size"]}
        columns={[
          { key: "pkg", header: "Package" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status" },
        ]}
        data={[
          { pkg: "@machi-asia/ui", type: "Core Design System", status: "Active" },
          { pkg: "@machi-asia/rose", type: "AI Companion Suite", status: "Active" },
          { pkg: "@machi-asia/auth", type: "Authentication Provider", status: "Active" },
          { pkg: "@machi-asia/api-gateway", type: "Gateway & Usage", status: "Active" },
        ]}
      />
    </div>
  );
}

function DropdownPreview({ props }: PreviewProps) {
  const [selected, setSelected] = useState("option1");
  return (
    <div style={{ width: "260px" }}>
      <UI.Dropdown
        value={selected}
        onChange={setSelected}
        variant={props?.variant as UI.DropdownVariant}
        options={[
          { value: "option1", label: "Option 1 — Standard" },
          { value: "option2", label: "Option 2 — Enhanced" },
          { value: "option3", label: "Option 3 — Custom" },
        ]}
      />
    </div>
  );
}

function CalendarPreview({ props }: PreviewProps) {
  const weekStartsOn = props?.weekStartsOn === "1" ? (1 as const) : (0 as const);
  return (
    <div style={{ maxWidth: "360px" }}>
      <UI.Calendar weekStartsOn={weekStartsOn} />
    </div>
  );
}

function ModalPreview({ componentName, props }: PreviewProps & { componentName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <UI.Button variant="primary" onClick={() => setIsOpen(true)}>
        Open {componentName}
      </UI.Button>
      <UI.Modal open={isOpen} onClose={() => setIsOpen(false)} size={props?.size as UI.ModalProps["size"]} title={`Preview: ${componentName}`}>
        <div style={{ padding: "16px 0" }}>
          <p>Modal dialog rendered live from <code>@machi-asia/ui</code>.</p>
          <div style={{ marginTop: "16px", display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <UI.Button variant="secondary" onClick={() => setIsOpen(false)}>Close</UI.Button>
          </div>
        </div>
      </UI.Modal>
    </div>
  );
}

function AuthModalPreview({ props }: PreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <UI.Button variant="primary" onClick={() => setIsOpen(true)}>
        Open Auth Modal
      </UI.Button>
      <UI.AuthModal
        open={isOpen}
        onClose={() => setIsOpen(false)}
        initialMode={props?.initialMode as UI.AuthModalProps["initialMode"]}
        onLogin={async (creds) => alert(`Simulated Login for: ${creds.email}`)}
        onRegister={async (details) => alert(`Simulated Register for: ${details.email}`)}
        onOAuthLogin={async (provider) => alert(`Simulated OAuth for: ${provider}`)}
      />
    </div>
  );
}

function NavbarPreview({ props }: PreviewProps) {
  return (
    <div style={{ width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color, #333)" }}>
      <UI.Navbar
        brand={<div style={{ fontWeight: 800, fontSize: "17px", display: "flex", alignItems: "center", gap: "8px" }}>🌸 machi-asia</div>}
        sticky={false}
        variant={props?.variant as UI.NavbarVariant}
        linkAlign={props?.linkAlign as UI.NavbarLinkAlign}
        links={[
          { label: "Overview", href: "#overview" },
          {
            label: "Products",
            children: [
              { label: "Rose AI", href: "#rose" },
              { label: "Tween Motion", href: "#tween" },
              { label: "Media Library", href: "#media" },
            ],
          },
          { label: "Docs", href: "#docs" },
          { label: "Pricing", href: "#pricing" },
        ]}
        actions={
          <div style={{ display: "flex", gap: "8px" }}>
            <UI.Button variant="primary" size="sm">Get Started</UI.Button>
          </div>
        }
      />
    </div>
  );
}

function FooterPreview({ props }: PreviewProps) {
  return (
    <div style={{ width: "100%", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border-color, #333)" }}>
      <UI.Footer
        brand={<div style={{ fontWeight: 800, fontSize: "16px" }}>🌸 machi-asia</div>}
        variant={props?.variant as UI.FooterVariant}
        links={[
          { label: "Rose AI", href: "#rose" },
          { label: "Tween Motion", href: "#tween" },
          { label: "Media Library", href: "#media" },
          { label: "API Gateway", href: "#api" },
          { label: "Docs", href: "#docs" },
        ]}
        note={`© ${new Date().getFullYear()} machi-asia monorepo. All rights reserved.`}
      />
    </div>
  );
}

function GalleryPreview({ props }: PreviewProps) {
  const items: UI.GalleryItem[] = [
    { id: "1", src: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&q=80", title: "Abstract Geometry", subtitle: "Design Systems" },
    { id: "2", src: "https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=600&q=80", title: "Gradient Flow", subtitle: "Motion Canvas" },
    { id: "3", src: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&q=80", title: "Cyber Tech", subtitle: "AI Agents" },
    { id: "4", src: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=600&q=80", title: "Minimalist Workspace", subtitle: "Developer Tools" },
  ];
  return (
    <div style={{ maxWidth: "720px", width: "100%" }}>
      <UI.Gallery
        items={items}
        columns={2}
        enableLightbox
        variant={props?.variant as UI.GalleryVariant}
        layout={props?.layout as UI.GalleryLayout}
      />
    </div>
  );
}

function TextEditorPreview() {
  const [content, setContent] = useState("<p>Welcome to <strong>@machi-asia/ui</strong> TextEditor! You can highlight text, apply styles, headings, lists, and quotes.</p>");
  return (
    <div style={{ maxWidth: "600px", width: "100%" }}>
      <UI.TextEditor
        value={content}
        onChange={setContent}
        placeholder="Start typing rich text here..."
        minHeight={160}
      />
    </div>
  );
}

function ToastPreviewContent({ props }: PreviewProps) {
  const toast = UI.useToast();
  const variant = (props?.variant ?? "success") as UI.ToastVariant;
  return (
    <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
      <UI.Button
        variant="primary"
        onClick={() => toast.show({ title: `${variant} Notification`, description: `Operation finished successfully (${variant}).`, variant })}
      >
        Trigger {variant} Toast
      </UI.Button>
    </div>
  );
}

function ToastPreview({ props }: PreviewProps) {
  return (
    <UI.ToastProvider>
      <ToastPreviewContent props={props} />
    </UI.ToastProvider>
  );
}

function MotionComponentPreview({ componentName, props }: PreviewProps & { componentName: string }) {
  const isCurtain = componentName.toLowerCase().includes("curtain");
  const isZoom = componentName.toLowerCase().includes("zoom");
  const isSplit = componentName.toLowerCase().includes("split");

  const movementNode = isCurtain ? (
    <UI.ScrollCurtain direction={(props?.direction ?? "up") as UI.ScrollCurtainDirection} length={2}>
      <div style={{ padding: "40px", background: "rgba(99,102,241,0.12)", borderRadius: "8px", textAlign: "center" }}>
        <strong>Curtain direction: {props?.direction ?? "up"}</strong>
      </div>
    </UI.ScrollCurtain>
  ) : isZoom ? (
    <UI.ScrollZoom mode={(props?.mode ?? "zoom-out") as UI.ScrollZoomMode} length={2}>
      <div style={{ padding: "40px", background: "rgba(16,185,129,0.12)", borderRadius: "8px", textAlign: "center" }}>
        <strong>Zoom mode: {props?.mode ?? "zoom-out"}</strong>
      </div>
    </UI.ScrollZoom>
  ) : isSplit ? (
    <UI.ScrollSplit
      direction={(props?.direction ?? "horizontal") as UI.ScrollSplitDirection}
      panelA={<div style={{ padding: "24px", fontWeight: 700 }}>A</div>}
      panelB={<div style={{ padding: "24px", fontWeight: 700 }}>B</div>}
    >
      <div style={{ padding: "40px", textAlign: "center" }}>
        <strong>Split direction: {props?.direction ?? "horizontal"}</strong>
      </div>
    </UI.ScrollSplit>
  ) : null;

  const revealVariant = (props?.variant ?? "fade-up") as UI.ScrollRevealVariant;
  return (
    <div style={{ maxWidth: "640px", width: "100%", padding: "24px", border: "1px solid var(--border-color, #333)", borderRadius: "12px" }}>
      <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <h4 style={{ margin: 0, fontSize: "16px" }}>{componentName} Playground</h4>
        <span style={{ fontSize: "12px", background: "rgba(99,102,241,0.15)", color: "#818cf8", padding: "4px 8px", borderRadius: "4px" }}>
          Scroll-Driven Motion
        </span>
      </div>
      <div style={{ height: "300px", overflowY: "auto", border: "1px dashed var(--border-color, #444)", borderRadius: "8px", padding: "16px" }}>
        {movementNode ? (
          <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px" }}>
            Use the <code>variant</code>/<code>direction</code>/<code>mode</code> dropdowns above. Scroll inside this box to inspect the behavior:
          </p>
        ) : (
          <p style={{ color: "#888", fontSize: "13px", marginBottom: "20px" }}>
            Scroll inside this box to inspect the <code>{componentName}</code> entrance and interpolation behaviors:
          </p>
        )}
        {movementNode}
        {!movementNode && (
          <UI.ScrollReveal variant={revealVariant}>
            <div style={{ padding: "20px", background: "rgba(99,102,241,0.12)", borderRadius: "8px", marginBottom: "16px" }}>
              <strong>{componentName}: {revealVariant}</strong>
              <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#aaa" }}>Applies the selected variant via the dropdown above.</p>
            </div>
          </UI.ScrollReveal>
        )}
        {!movementNode && (
          <UI.ScrollReveal variant="zoom-in">
            <div style={{ padding: "20px", background: "rgba(16,185,129,0.12)", borderRadius: "8px", marginBottom: "16px" }}>
              <strong>Card 2: Zoom In Entrance</strong>
              <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#aaa" }}>Scales into view with GPU-accelerated transforms.</p>
            </div>
          </UI.ScrollReveal>
        )}
        {!movementNode && (
          <UI.ScrollReveal variant="fade-right">
            <div style={{ padding: "20px", background: "rgba(245,158,11,0.12)", borderRadius: "8px", marginBottom: "16px" }}>
              <strong>Card 3: Slide Right</strong>
              <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "#aaa" }}>Horizontal translation tied to scroll velocity.</p>
            </div>
          </UI.ScrollReveal>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. Rose AI Components Previews
// ==========================================

function ChatbotOptionsPickerPreview() {
  const [lastSelected, setLastSelected] = useState<string | null>(null);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "560px", width: "100%" }}>
      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#888" }}>
          Single Select Options
        </h4>
        <Rose.ChatbotOptionsPicker
          payload={{
            question: "What would you like assistance with today?",
            options: ["Full-Stack Architecture", "Database Modeling", "API Gateway Integration", "AI Agent Workflows"],
            allowMultiple: false,
          }}
          onSelectOption={(val) => setLastSelected(`Single selected: "${val}"`)}
        />
      </div>

      <div>
        <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "#888" }}>
          Multiple Select Options
        </h4>
        <Rose.ChatbotOptionsPicker
          payload={{
            question: "Select preferred tech stack layers:",
            options: ["Next.js App Router", "Supabase Postgres", "Tailwind CSS", "Turborepo"],
            allowMultiple: true,
          }}
          onSelectOption={(val) => setLastSelected(`Multiple selected: "${val}"`)}
        />
      </div>

      {lastSelected && (
        <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "6px", fontSize: "13px" }}>
          {lastSelected}
        </div>
      )}
    </div>
  );
}

function ChatbotInputBadgePreview({ props }: PreviewProps) {
  const [badges, setBadges] = useState<Rose.SelectedBadge[]>([
    { id: "1", category: "Project", title: "machi-asia", token: "@project:machi-asia" },
    { id: "2", category: "Skill", title: "Supabase Postgres", token: "@skill:supabase" },
    { id: "3", category: "Architecture", title: "Vercel Multi-Zone", token: "@arch:vercel" },
  ]);

  const handleRemove = (id: string) => {
    setBadges((prev) => prev.filter((b) => b.id !== id));
  };

  const handleReset = () => {
    setBadges([
      { id: "1", category: "Project", title: "machi-asia", token: "@project:machi-asia" },
      { id: "2", category: "Skill", title: "Supabase Postgres", token: "@skill:supabase" },
      { id: "3", category: "Architecture", title: "Vercel Multi-Zone", token: "@arch:vercel" },
    ]);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "560px", width: "100%" }}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
        {badges.map((b) => (
          <Rose.ChatbotInputBadge
            key={b.id}
            variant={(props?.variant ?? "main") as "main" | "compact"}
            badge={b}
            onRemove={handleRemove}
          />
        ))}
      </div>
      {badges.length === 0 && (
        <UI.Button variant="secondary" size="sm" onClick={handleReset}>
          Reset Badges
        </UI.Button>
      )}
    </div>
  );
}

function ChatbotSlashMenuPreview({ props }: PreviewProps) {
  const [input, setInput] = useState("/");
  const [selectedAction, setSelectedAction] = useState<string | null>(null);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "560px", width: "100%" }}>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type / to filter slash commands..."
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "6px",
          border: "1px solid var(--border-color, #333)",
          background: "var(--input-bg, #1e293b)",
          color: "inherit",
        }}
      />
      <Rose.ChatbotSlashMenu
        variant={(props?.variant ?? "main") as "main" | "compact"}
        categories={Rose.DEFAULT_COMMAND_CATEGORIES}
        inputValue={input}
        onSelectCategory={(cat) => setSelectedAction(`Selected category: ${cat.label} (${cat.command})`)}
        onSelectItem={(item) => setSelectedAction(`Selected command item: ${item.title}`)}
      />
      {selectedAction && (
        <div style={{ padding: "10px 14px", background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)", borderRadius: "6px", fontSize: "13px" }}>
          {selectedAction}
        </div>
      )}
    </div>
  );
}

function ChatbotTracesPreview({ props }: PreviewProps) {
  return (
    <div style={{ maxWidth: "560px", width: "100%" }}>
      <Rose.ChatbotTraces
        variant={(props?.variant ?? "main") as "main" | "compact"}
        traces={[
          "Analyzing user intent and project requirements",
          "Inspecting workspace packages and database schemas",
          "Executing Supabase query for cached session data",
          "Formulating optimized response with code samples",
        ]}
        defaultExpanded={true}
        photoUrl="/rose/thinking.png"
      />
    </div>
  );
}

function ChatbotWelcomePreview({ props }: PreviewProps) {
  return (
    <div style={{ maxWidth: "600px", width: "100%" }}>
      <Rose.ChatbotWelcome
        variant={(props?.variant ?? "main") as "main" | "compact"}
        onSelectStarter={(q: string) => alert(`Selected starter: ${q}`)}
        onSelectBadge={(b: Rose.ReferenceBadge) => alert(`Selected badge: ${b.title}`)}
      />
    </div>
  );
}

function ChatbotInputAreaPreview({ props }: PreviewProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  return (
    <div style={{ maxWidth: "600px", width: "100%" }}>
      <Rose.ChatbotInputArea
        variant={(props?.variant ?? "main") as "main" | "compact"}
        inputValue={inputValue}
        setInputValue={setInputValue}
        showSlashMenu={showSlashMenu}
        setShowSlashMenu={setShowSlashMenu}
        onSendMessage={(text: string) => alert(`Sent: ${text}`)}
        isLoading={false}
      />
    </div>
  );
}

function RoseChatPreview({ props, useFull = false }: PreviewProps & { useFull?: boolean }) {
  const [messages, setMessages] = useState<Rose.RoseMessage[]>([
    {
      id: "1",
      role: "model",
      text: "Hello! I'm **Rose**, your AI assistant for the `machi-asia` platform. How can I help you explore or build today?",
      emotion: "happy",
    },
    {
      id: "2",
      role: "user",
      text: "What packages and UI components are available?",
    },
    {
      id: "3",
      role: "model",
      text: "We provide `@machi-asia/ui` (design system & motion), `@machi-asia/rose` (AI companion & memory), `@machi-asia/api-gateway`, `@machi-asia/media-library`, and `@machi-asia/auth`.",
      emotion: "bright",
      traces: [
        "Scanning monorepo package manifests",
        "Validating workspace exports and types",
      ],
      optionsPayload: {
        question: "Would you like to explore a specific package?",
        options: ["@machi-asia/ui", "@machi-asia/rose", "@machi-asia/auth"],
      },
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSlashMenu, setShowSlashMenu] = useState(false);

  const handleSend = (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg: Rose.RoseMessage = {
      id: Date.now().toString(),
      role: "user",
      text: text.trim(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "model",
          text: `I received your message: **"${text.trim()}"**. This is a live preview of the Rose companion engine with user and Rose profile pictures!`,
          emotion: "happy",
        },
      ]);
      setIsLoading(false);
    }, 600);
  };

  if (useFull) {
    const b = (v: string | undefined, fallback: boolean) => (v === undefined ? fallback : v === "true");
    return (
      <div style={{ width: "100%", height: "620px", border: "1px solid var(--border-color, #333)", borderRadius: "12px", overflow: "hidden", background: "var(--bg-card, #0f172a)" }}>
        <Rose.RoseChat
          title="Rose — AI Companion (live)"
          requireAuth={b(props?.requireAuth, false)}
          showSidebar={b(props?.showSidebar, true)}
          showHeader={b(props?.showHeader, true)}
          showMemories={b(props?.showMemories, true)}
          showUsage={b(props?.showUsage, true)}
          showLogout={b(props?.showLogout, true)}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "720px", width: "100%", border: "1px solid var(--border-color, #333)", borderRadius: "12px", overflow: "hidden", display: "flex", flexDirection: "column", height: "520px", background: "var(--bg-card, #0f172a)" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color, #333)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: "bold" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/rose/happy.png" alt="Rose" style={{ width: "28px", height: "28px", borderRadius: "50%" }} />
          Rose AI Companion
        </div>
        <span style={{ fontSize: "12px", color: "#888" }}>v0.1.0</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        <Rose.Chat
          messages={messages}
          isLoading={isLoading}
          avatarUrl="/rose/happy.png"
          userName="Developer"
          onOptionSelect={handleSend}
          onSelectStarter={handleSend}
        />
      </div>

      <div style={{ padding: "12px 16px", borderTop: "1px solid var(--border-color, #333)" }}>
        <Rose.ChatbotInputArea
          inputValue={input}
          setInputValue={setInput}
          showSlashMenu={showSlashMenu}
          setShowSlashMenu={setShowSlashMenu}
          onSendMessage={handleSend}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}

function MemoriesSettingsModalPreview() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <UI.Button variant="primary" onClick={() => setIsOpen(true)}>
        Open Memories Settings Modal
      </UI.Button>
      <Rose.MemoriesSettingsModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

function MarkdownRendererPreview({ props }: PreviewProps) {
  return (
    <div style={{ maxWidth: "600px", width: "100%" }}>
      <Rose.MarkdownRenderer
        variant={props?.variant as Rose.MarkdownRendererProps["variant"]}
        content={`# Markdown Preview\n\nThis is **rendered** in real-time by \`@machi-asia/rose\`:\n\n- Dynamic navigation\n- Fast monorepo scanning\n- High fidelity component rendering\n\n\`\`\`ts\nconst success = true;\n\`\`\``}
      />
    </div>
  );
}

// ==========================================
// 3. API Gateway Previews
// ==========================================

function UsagePagePreview() {
  return (
    <div style={{ width: "100%", maxHeight: "560px", overflowY: "auto", border: "1px solid var(--border-color, #333)", borderRadius: "10px" }}>
      <ApiGateway.UsagePage />
    </div>
  );
}

// ==========================================
// 4. Media Library Previews
// ==========================================

function MediaLibraryModalPreview() {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <UI.Button variant="primary" onClick={() => setIsOpen(true)}>
        Open Media Library Modal
      </UI.Button>
      <MediaLibrary.MediaLibraryModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </div>
  );
}

function MediaPagePreview() {
  return (
    <div style={{ width: "100%", maxHeight: "560px", overflowY: "auto", border: "1px solid var(--border-color, #333)", borderRadius: "10px" }}>
      <MediaLibrary.MediaPage />
    </div>
  );
}

// ==========================================
// 5. Auth Package Previews
// ==========================================

function AuthGatePreview() {
  const [mockLoggedIn, setMockLoggedIn] = useState(false);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px", maxWidth: "560px", width: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: "8px" }}>
        <div>
          <strong>Simulated Auth State:</strong> {mockLoggedIn ? "✅ Authenticated User" : "🔒 Unauthenticated / Guest"}
        </div>
        <UI.Button variant={mockLoggedIn ? "secondary" : "primary"} size="sm" onClick={() => setMockLoggedIn((v) => !v)}>
          {mockLoggedIn ? "Switch to Guest" : "Simulate Login"}
        </UI.Button>
      </div>

      {mockLoggedIn ? (
        <div style={{ padding: "24px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#10b981" }}>Protected Route Unlocked</h4>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
            Welcome! The <code>AuthGate</code> allows access to authenticated components and protected API routes.
          </p>
        </div>
      ) : (
        <div style={{ padding: "24px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 8px 0", color: "#ef4444" }}>Auth Gate Locked</h4>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.5" }}>
            Access is currently gated. In production, this component prompts an authentication modal or redirects to sign in.
          </p>
        </div>
      )}
    </div>
  );
}

function AuthProviderPreview() {
  return (
    <div style={{ maxWidth: "560px", width: "100%", padding: "24px", border: "1px solid var(--border-color, #333)", borderRadius: "10px" }}>
      <h4 style={{ margin: "0 0 8px 0" }}>AuthProvider Context Container</h4>
      <p style={{ margin: "0 0 16px 0", color: "#888", fontSize: "14px" }}>
        Provides unified session management, token storage, and user credentials across all app consumers.
      </p>
      <div style={{ padding: "16px", background: "rgba(99,102,241,0.08)", borderRadius: "6px", fontFamily: "monospace", fontSize: "13px" }}>
        <code>{`<AuthProvider authApiUrl="/api/auth">\n  {children}\n</AuthProvider>`}</code>
      </div>
    </div>
  );
}

function GenericProviderPreview({ packageName }: { packageName: string }) {
  return (
    <div style={{ maxWidth: "560px", width: "100%", padding: "24px", border: "1px solid var(--border-color, #333)", borderRadius: "10px" }}>
      <h4 style={{ margin: "0 0 8px 0" }}>{packageName} Context Provider</h4>
      <p style={{ margin: "0 0 16px 0", color: "#888", fontSize: "14px" }}>
        Top-level React context wrapper managing state, theme providers, and query clients for <code>@{packageName}</code>.
      </p>
      <div style={{ padding: "16px", background: "rgba(99,102,241,0.08)", borderRadius: "6px", fontFamily: "monospace", fontSize: "13px" }}>
        <code>{`<Providers>\n  {children}\n</Providers>`}</code>
      </div>
    </div>
  );
}

function FallbackPreview({ componentName, packageKey, relativePath }: { componentName: string; packageKey: string; relativePath: string }) {
  return (
    <div style={{ padding: "32px", textAlign: "center", border: "1px dashed var(--border-color, #444)", borderRadius: "8px", maxWidth: "600px" }}>
      <div style={{ fontSize: "28px", marginBottom: "12px" }}>🧩</div>
      <h4 style={{ margin: "0 0 8px 0", fontSize: "18px" }}>{componentName}</h4>
      <p style={{ margin: "0 0 16px 0", color: "#888", fontSize: "14px" }}>
        Package: <code>@{packageKey}</code> &bull; Path: <code>{relativePath}</code>
      </p>
      <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
        Component definition detected and loaded. Check the <strong>Source Code</strong> tab above for the full implementation and export specs.
      </p>
    </div>
  );
}

/**
 * Component Preview Registry that dynamically maps components
 * from monorepo packages to interactive rendered sandboxes.
 */
export function getComponentPreview(
  packageKey: string,
  componentName: string,
  relativePath: string,
  props?: Record<string, string>
): { render: (props: { isDark: boolean }) => React.ReactNode } | null {
  const name = componentName.toLowerCase();
  const rel = relativePath.toLowerCase();

  const P = props ?? {};

  // 1. @machi-asia/ui components
  if (packageKey === "ui") {
    if (name === "button" || rel.includes("/button/")) {
      return { render: () => <ButtonPreview props={P} /> };
    }

    if (name === "card" || rel.includes("/card/")) {
      return { render: () => <CardPreview props={P} /> };
    }

    if (name === "accordion" || rel.includes("/accordion/")) {
      return { render: () => <AccordionPreview props={P} /> };
    }

    if (name === "switch" || rel.includes("/switch/")) {
      return { render: () => <SwitchPreview props={P} /> };
    }

    if (name === "tabs" || rel.includes("/tabs/")) {
      return { render: () => <TabsPreview props={P} /> };
    }

    if (name === "table" || rel.includes("/table/")) {
      return { render: () => <TablePreview props={P} /> };
    }

    if (name === "dropdown" || rel.includes("/dropdown/")) {
      return { render: () => <DropdownPreview props={P} /> };
    }

    if (name === "calendar" || rel.includes("/calendar/")) {
      return { render: () => <CalendarPreview props={P} /> };
    }

    if (name === "authmodal" || rel.includes("/auth/")) {
      return { render: () => <AuthModalPreview props={P} /> };
    }

    if (name === "modal" || rel.includes("/modal/")) {
      return { render: () => <ModalPreview componentName={componentName} props={P} /> };
    }

    if (name === "navbar" || rel.includes("/navbar/")) {
      return { render: () => <NavbarPreview props={P} /> };
    }

    if (name === "footer" || rel.includes("/footer/")) {
      return { render: () => <FooterPreview props={P} /> };
    }

    if (name === "gallery" || rel.includes("/gallery/")) {
      return { render: () => <GalleryPreview props={P} /> };
    }

    if (name === "texteditor" || rel.includes("/texteditor/")) {
      return { render: () => <TextEditorPreview /> };
    }

    if (name === "toast" || rel.includes("/toast/")) {
      return { render: () => <ToastPreview props={P} /> };
    }

    // Scroll & Motion components
    if (name.startsWith("scroll") || name === "parallax") {
      return { render: () => <MotionComponentPreview componentName={componentName} props={P} /> };
    }
  }

  // 2. @machi-asia/rose components
  if (packageKey === "rose") {
    if (name === "chatbotoptionspicker" || rel.includes("chatbotoptionspicker")) {
      return { render: () => <ChatbotOptionsPickerPreview /> };
    }

    if (name === "chatbotinputbadge" || rel.includes("chatbotinputbadge")) {
      return { render: () => <ChatbotInputBadgePreview props={P} /> };
    }

    if (name === "chatbotslashmenu" || rel.includes("chatbotslashmenu")) {
      return { render: () => <ChatbotSlashMenuPreview props={P} /> };
    }

    if (name === "chatbottraces" || rel.includes("chatbottraces")) {
      return { render: () => <ChatbotTracesPreview props={P} /> };
    }

    if (name === "chatbotwelcome" || rel.includes("chatbotwelcome")) {
      return { render: () => <ChatbotWelcomePreview props={P} /> };
    }

    if (name === "chatbotinputarea" || rel.includes("chatbotinputarea")) {
      return { render: () => <ChatbotInputAreaPreview props={P} /> };
    }

    if (name === "markdownrenderer" || rel.includes("markdownrenderer")) {
      return { render: () => <MarkdownRendererPreview props={P} /> };
    }

    if (name === "usagebar" || rel.includes("usagebar")) {
      return { render: () => <Rose.UsageBar /> };
    }

    if (name === "memoriessettingsmodal" || rel.includes("memoriessettingsmodal")) {
      return { render: () => <MemoriesSettingsModalPreview /> };
    }

    if (name === "rosechat" || rel.includes("/rosechat.tsx")) {
      return { render: () => <RoseChatPreview useFull props={P} /> };
    }

    if (name === "chat" || rel.includes("/chat.tsx")) {
      return { render: () => <RoseChatPreview props={P} /> };
    }

    if (rel.includes("chat")) {
      return { render: () => <RoseChatPreview props={P} /> };
    }

    if (name === "providers" || rel.includes("providers")) {
      return { render: () => <GenericProviderPreview packageName="rose" /> };
    }
  }

  // 3. @machi-asia/api-gateway components
  if (packageKey === "api-gateway") {
    if (name === "usagepage" || rel.includes("usagepage")) {
      return { render: () => <UsagePagePreview /> };
    }

    if (name === "usagecard" || rel.includes("usagecard")) {
      return { render: () => <ApiGateway.UsageCard /> };
    }
  }

  // 4. @machi-asia/media-library components
  if (packageKey === "media-library") {
    if (name === "medialibrarymodal" || rel.includes("medialibrarymodal")) {
      return { render: () => <MediaLibraryModalPreview /> };
    }

    if (name === "mediapage" || rel.includes("mediapage")) {
      return { render: () => <MediaPagePreview /> };
    }

    if (name === "providers" || rel.includes("providers")) {
      return { render: () => <GenericProviderPreview packageName="media-library" /> };
    }
  }

  // 5. @machi-asia/auth components
  if (packageKey === "auth") {
    if (name.includes("gate") || rel.includes("gate")) {
      return { render: () => <AuthGatePreview /> };
    }

    if (name.includes("provider") || rel.includes("provider")) {
      return { render: () => <AuthProviderPreview /> };
    }
  }

  // Fallback renderer for non-visual or unknown files
  return {
    render: () => (
      <FallbackPreview
        componentName={componentName}
        packageKey={packageKey}
        relativePath={relativePath}
      />
    ),
  };
}

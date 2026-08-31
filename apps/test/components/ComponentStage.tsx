"use client";

import React, { useState } from "react";
import {
  Eye,
  Code2,
  Info,
  Smartphone,
  Tablet,
  Laptop,
  Monitor,
  RotateCcw,
  Sparkles,
  Package,
  FileText,
  BookOpen,
} from "lucide-react";
import { ComponentFile } from "@/lib/scanner";
import { getComponentPreview } from "@/lib/registry";
import { SourceViewer } from "./SourceViewer";
import { ErrorBoundary } from "./ErrorBoundary";

interface ComponentStageProps {
  component: ComponentFile | null;
  sourceCode: string;
  isLoadingSource?: boolean;
  isDark: boolean;
}

type TabType = "preview" | "source" | "docs" | "meta";
type ViewportType = "mobile" | "tablet" | "laptop" | "desktop";

export function ComponentStage({
  component,
  sourceCode,
  isLoadingSource = false,
  isDark,
}: ComponentStageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("preview");
  const [viewport, setViewport] = useState<ViewportType>("desktop");
  const [bgPattern, setBgPattern] = useState<"grid" | "plain" | "dots">("grid");
  const [previewKey, setPreviewKey] = useState(0);
  const [propValues, setPropValues] = useState<Record<string, string>>({});

  const enumerableProps = component?.enumerableProps ?? [];

  // Reset prop dropdowns whenever a different component is selected.
  React.useEffect(() => {
    if (!component) {
      setPropValues({});
      return;
    }
    const next: Record<string, string> = {};
    for (const def of component.enumerableProps ?? []) {
      next[def.prop] = def.default ?? def.values[0];
    }
    setPropValues(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [component?.packageKey, component?.relativePath, component?.componentName]);

  if (!component) {
    return (
      <div className="stage-empty-state">
        <div className="stage-empty-card">
          <Package size={48} className="empty-icon" />
          <h3>Select a Component from the Navigation</h3>
          <p>
            Choose any <code>.tsx</code> file from the left sidebar to view its live interactive preview, source code, and metadata.
          </p>
        </div>
      </div>
    );
  }

  const preview = getComponentPreview(
    component.packageKey,
    component.componentName,
    component.relativePath,
    propValues
  );

  const getViewportWidth = () => {
    switch (viewport) {
      case "mobile":
        return "375px";
      case "tablet":
        return "768px";
      case "laptop":
        return "1024px";
      case "desktop":
      default:
        return "100%";
    }
  };

  const formattedDate = new Date(component.lastModified).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <main className="stage-container">
      {/* Top Header Bar */}
      <div className="stage-header">
        <div className="stage-header-left">
          <div className="breadcrumb-nav">
            <span className="breadcrumb-pkg">@{component.packageKey}</span>
            <span className="breadcrumb-sep">/</span>
            <span className="breadcrumb-file">{component.relativePath}</span>
          </div>
          <div className="stage-title-row">
            <h1 className="stage-component-title">{component.componentName}</h1>
            <span className={`category-tag category-${component.category.toLowerCase().replace(/[^a-z0-9]/g, "-")}`}>
              {component.category}
            </span>
            {component.isTest && <span className="category-tag test-tag">Unit Test</span>}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="stage-tabs-row">
          <button
            onClick={() => setActiveTab("preview")}
            className={`stage-tab-btn ${activeTab === "preview" ? "active" : ""}`}
          >
            <Eye size={15} />
            <span>Live Preview</span>
          </button>
          <button
            onClick={() => setActiveTab("source")}
            className={`stage-tab-btn ${activeTab === "source" ? "active" : ""}`}
          >
            <Code2 size={15} />
            <span>Source Code</span>
          </button>
          <button
            onClick={() => setActiveTab("docs")}
            className={`stage-tab-btn ${activeTab === "docs" ? "active" : ""}`}
          >
            <BookOpen size={15} />
            <span>Docs & Requirements</span>
          </button>
          <button
            onClick={() => setActiveTab("meta")}
            className={`stage-tab-btn ${activeTab === "meta" ? "active" : ""}`}
          >
            <Info size={15} />
            <span>Metadata</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="stage-content-body">
        {/* TAB 1: PREVIEW */}
        {activeTab === "preview" && (
          <div className="stage-preview-view">
            {/* Viewport and Canvas Controls */}
            <div className="stage-controls-bar">
              <div className="viewport-buttons-group">
                <button
                  onClick={() => setViewport("desktop")}
                  className={`viewport-btn ${viewport === "desktop" ? "active" : ""}`}
                  title="Desktop (100%)"
                >
                  <Monitor size={15} />
                  <span>Desktop</span>
                </button>
                <button
                  onClick={() => setViewport("laptop")}
                  className={`viewport-btn ${viewport === "laptop" ? "active" : ""}`}
                  title="Laptop (1024px)"
                >
                  <Laptop size={15} />
                  <span>1024px</span>
                </button>
                <button
                  onClick={() => setViewport("tablet")}
                  className={`viewport-btn ${viewport === "tablet" ? "active" : ""}`}
                  title="Tablet (768px)"
                >
                  <Tablet size={15} />
                  <span>Tablet</span>
                </button>
                <button
                  onClick={() => setViewport("mobile")}
                  className={`viewport-btn ${viewport === "mobile" ? "active" : ""}`}
                  title="Mobile (375px)"
                >
                  <Smartphone size={15} />
                  <span>Mobile</span>
                </button>
              </div>

              <div className="canvas-settings-group">
                <button
                  onClick={() => setBgPattern((p) => (p === "grid" ? "dots" : p === "dots" ? "plain" : "grid"))}
                  className="canvas-toggle-btn"
                  title="Toggle canvas background pattern"
                >
                  Canvas: {bgPattern}
                </button>
                <button
                  onClick={() => setPreviewKey((k) => k + 1)}
                  className="canvas-toggle-btn"
                  title="Reset and reload component preview"
                >
                  <RotateCcw size={13} />
                  <span>Reset</span>
                </button>
              </div>
            </div>

            {/* Enumerable Props Dropdowns */}
            {enumerableProps.length > 0 && (
              <div className="stage-controls-bar stage-props-bar">
                <div className="props-dropdowns-group">
                  {enumerableProps.map((def) => (
                    <label key={def.prop} className="prop-dropdown">
                      <span>{def.label}</span>
                      <select
                        value={propValues[def.prop] ?? def.default ?? def.values[0]}
                        onChange={(e) => setPropValues((prev) => ({ ...prev, [def.prop]: e.target.value }))}
                      >
                        {def.values.map((value) => (
                          <option key={value} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Canvas Stage */}
            <div className={`canvas-stage bg-${bgPattern}`}>
              <div
                className="canvas-viewport-frame"
                style={{
                  width: getViewportWidth(),
                  transition: "width 0.25s ease",
                }}
              >
                <div className="canvas-card-inner">
                  {component.isTest ? (
                    <div className="test-preview-banner">
                      <FileText size={32} style={{ color: "#6366f1", marginBottom: "8px" }} />
                      <h3>Unit Test Suite File</h3>
                      <p>
                        <code>{component.fileName}</code> contains Jest/Vitest automated assertions.
                        Switch to the <strong>Source Code</strong> tab to view test specifications.
                      </p>
                    </div>
                  ) : preview ? (
                    <ErrorBoundary key={previewKey} fallbackTitle={`Preview Error in ${component.componentName}`}>
                      {preview.render({ isDark })}
                    </ErrorBoundary>
                  ) : (
                    <div className="generic-render-placeholder">
                      <Sparkles size={32} style={{ color: "#8b5cf6", marginBottom: "8px" }} />
                      <h3>{component.componentName}</h3>
                      <p>Live component explorer</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: SOURCE CODE */}
        {activeTab === "source" && (
          <div className="stage-source-view">
            {isLoadingSource ? (
              <div className="source-loading-state">Loading source code...</div>
            ) : (
              <SourceViewer
                code={sourceCode}
                fileName={component.fileName}
                exports={component.exports}
                imports={component.imports}
              />
            )}
          </div>
        )}

        {/* TAB 3: DOCS & SHIPPING REQUIREMENTS */}
        {activeTab === "docs" && (
          <div className="stage-meta-view">
            <div className="meta-grid">
              {component.docs ? (
                <>
                  <div className="meta-card meta-card-span">
                    <h3>About</h3>
                    <p className="docs-description">
                      {component.docs.description || "No description documented yet."}
                    </p>

                    {!component.docs.requiresAuth && !component.docs.requiresProviders?.length && !component.docs.requiresEnv?.length && !component.docs.apiEndpoints?.length ? (
                      <p className="docs-safe-badge">Self-contained — no auth, providers, env, or API routes required to ship.</p>
                    ) : null}

                    <div className="docs-requirements-grid">
                      <div className="docs-req-block">
                        <h4>Auth</h4>
                        <span className={`docs-badge ${component.docs.requiresAuth ? "badge-required" : "badge-none"}`}>
                          {component.docs.requiresAuth ? "Requires authentication" : "No auth required"}
                        </span>
                      </div>

                      {component.docs.requiresProviders?.length ? (
                        <div className="docs-req-block">
                          <h4>Required Providers</h4>
                          <div className="meta-tags-wrap">
                            {component.docs.requiresProviders.map((p) => (
                              <span key={p} className="meta-chip import-chip">{p}</span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {component.docs.requiresEnv?.length ? (
                        <div className="docs-req-block">
                          <h4>Required Environment Variables</h4>
                          <div className="meta-tags-wrap">
                            {component.docs.requiresEnv.map((e) => (
                              <span key={e} className="meta-chip env-chip">{e}</span>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {component.docs.apiEndpoints?.length ? (
                        <div className="docs-req-block">
                          <h4>API Endpoints</h4>
                          <ul className="docs-endpoint-list">
                            {component.docs.apiEndpoints.map((ep) => (
                              <li key={ep}><code>{ep}</code></li>
                            ))}
                          </ul>
                        </div>
                      ) : null}

                      {component.docs.dependencies?.length ? (
                        <div className="docs-req-block">
                          <h4>Package Dependencies</h4>
                          <div className="meta-tags-wrap">
                            {component.docs.dependencies.map((d) => (
                              <span key={d} className="meta-chip export-chip">{d}</span>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {component.docs.usage ? (
                    <div className="meta-card meta-card-span">
                      <h3>Usage</h3>
                      <pre className="docs-usage-snippet"><code>{component.docs.usage}</code></pre>
                    </div>
                  ) : null}

                  {component.docs.notes?.length ? (
                    <div className="meta-card meta-card-span">
                      <h3>Shipping Notes</h3>
                      <ul className="docs-notes-list">
                        {component.docs.notes.map((n, i) => (
                          <li key={i}>{n}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="meta-card meta-card-span">
                  <h3>Documentation</h3>
                  <p className="docs-description">
                    No entry in this package{"'"}s <code>component-docs.json</code> manifest yet.
                    Add one so this component{"'"}s auth / provider / env / API requirements are visible here.
                  </p>
                </div>
              )}

              {component.packageDocs && (
                <div className="meta-card meta-card-span">
                  <h3>Package Requirements</h3>
                  {component.packageDocs.summary && (
                    <p className="docs-description">{component.packageDocs.summary}</p>
                  )}

                  {component.packageDocs.requiresEnv?.length ? (
                    <div className="docs-req-block">
                      <h4>Package Environment</h4>
                      <div className="meta-tags-wrap">
                        {component.packageDocs.requiresEnv.map((e) => (
                          <span key={e} className="meta-chip env-chip">{e}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {component.packageDocs.requiredRoutes?.length ? (
                    <div className="docs-req-block">
                      <h4>Mount These Routes</h4>
                      <ul className="docs-endpoint-list">
                        {component.packageDocs.requiredRoutes.map((ep) => (
                          <li key={ep}><code>{ep}</code></li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  {component.packageDocs.assets?.length ? (
                    <div className="docs-req-block">
                      <h4>Required Assets</h4>
                      <div className="meta-tags-wrap">
                        {component.packageDocs.assets.map((a) => (
                          <span key={a} className="meta-chip import-chip">{a}</span>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: METADATA */}
        {activeTab === "meta" && (
          <div className="stage-meta-view">
            <div className="meta-grid">
              <div className="meta-card">
                <h3>Component Overview</h3>
                <table className="meta-table">
                  <tbody>
                    <tr>
                      <td>Component</td>
                      <td><strong>{component.componentName}</strong></td>
                    </tr>
                    <tr>
                      <td>Package</td>
                      <td><code>{component.packageName}</code></td>
                    </tr>
                    <tr>
                      <td>Relative Path</td>
                      <td><code>{component.relativePath}</code></td>
                    </tr>
                    <tr>
                      <td>File Size</td>
                      <td>{(component.sizeBytes / 1024).toFixed(2)} KB ({component.sizeBytes} bytes)</td>
                    </tr>
                    <tr>
                      <td>Line Count</td>
                      <td>{component.lineCount} lines</td>
                    </tr>
                    <tr>
                      <td>Last Modified</td>
                      <td>{formattedDate}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="meta-card">
                <h3>Exported Symbols ({component.exports.length})</h3>
                {component.exports.length > 0 ? (
                  <div className="meta-tags-wrap">
                    {component.exports.map((exp) => (
                      <span key={exp} className="meta-chip export-chip">
                        {exp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="meta-empty">No explicit named exports detected.</p>
                )}
              </div>

              <div className="meta-card">
                <h3>Dependencies & Imports ({component.imports.length})</h3>
                {component.imports.length > 0 ? (
                  <div className="meta-tags-wrap">
                    {component.imports.map((imp) => (
                      <span key={imp} className="meta-chip import-chip">
                        {imp}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="meta-empty">No external imports found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

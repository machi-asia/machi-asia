"use client";

import React, { useState } from "react";
import {
  Package,
  FileCode2,
  TestTube2,
  Layers,
  Sparkles,
  ArrowRight,
  Search,
} from "lucide-react";
import { MonorepoScanResult, ComponentFile } from "@/lib/scanner";

interface DashboardProps {
  data: MonorepoScanResult;
  onSelectComponent: (comp: ComponentFile) => void;
  onSelectPackage: (pkgKey: string) => void;
}

export function Dashboard({
  data,
  onSelectComponent,
}: DashboardProps) {
  const [filterQuery, setFilterQuery] = useState("");

  const filteredComponents = data.allComponents.filter((comp) => {
    if (!filterQuery) return true;
    const q = filterQuery.toLowerCase();
    return (
      comp.componentName.toLowerCase().includes(q) ||
      comp.packageName.toLowerCase().includes(q) ||
      comp.relativePath.toLowerCase().includes(q)
    );
  });

  return (
    <div className="dashboard-container">
      {/* Hero Welcome */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <div className="hero-pill">
            <Sparkles size={14} />
            <span>Dynamic TSX Monorepo Explorer</span>
          </div>
          <h1>Component Navigation & Sandbox</h1>
          <p>
            Dynamically scans all <code>packages/*</code> in the repository. Whenever a new <code>.tsx</code> file or package is added, the navigation and sandbox update automatically in real-time.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="dashboard-stats-grid">
        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(99, 102, 241, 0.12)", color: "#6366f1" }}>
            <Package size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-number">{data.stats.totalPackages}</span>
            <span className="stat-card-label">Monorepo Packages</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}>
            <FileCode2 size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-number">{data.stats.totalTsxFiles}</span>
            <span className="stat-card-label">Total .tsx Files</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(139, 92, 246, 0.12)", color: "#8b5cf6" }}>
            <Layers size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-number">{data.stats.totalComponents}</span>
            <span className="stat-card-label">Core UI Components</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon" style={{ background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}>
            <TestTube2 size={22} />
          </div>
          <div className="stat-card-info">
            <span className="stat-card-number">{data.stats.totalTests}</span>
            <span className="stat-card-label">Unit Test Suites</span>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="dashboard-section">
        <h2 className="section-title">Packages Overview</h2>
        <div className="packages-card-grid">
          {data.packages.map((pkg) => (
            <div key={pkg.packageKey} className="package-overview-card">
              <div className="pkg-card-top">
                <div className="pkg-card-title">
                  <Package size={18} className="pkg-card-icon" />
                  <h3>@{pkg.packageKey}</h3>
                </div>
                {pkg.packageVersion && <span className="pkg-card-version">v{pkg.packageVersion}</span>}
              </div>

              <p className="pkg-card-desc">
                {pkg.packageDescription || "Monorepo library package"}
              </p>

              <div className="pkg-card-metrics">
                <span><strong>{pkg.counts.total}</strong> .tsx files</span>
                <span>&bull;</span>
                <span><strong>{pkg.counts.components}</strong> components</span>
                <span>&bull;</span>
                <span><strong>{pkg.counts.tests}</strong> tests</span>
              </div>

              <div className="pkg-card-preview-list">
                {pkg.components.slice(0, 4).map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onSelectComponent(c)}
                    className="pkg-mini-item"
                  >
                    <span>{c.componentName}</span>
                    <ArrowRight size={12} />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* All Discovered Components Table */}
      <div className="dashboard-section">
        <div className="section-header-row">
          <h2 className="section-title">All Discovered Components ({filteredComponents.length})</h2>
          <div className="table-search-input">
            <Search size={14} />
            <input
              type="text"
              placeholder="Filter components..."
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="components-table-wrap">
          <table className="components-explorer-table">
            <thead>
              <tr>
                <th>Component</th>
                <th>Package</th>
                <th>Relative Path</th>
                <th>Category</th>
                <th>Exports</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredComponents.map((comp) => (
                <tr key={comp.id} onClick={() => onSelectComponent(comp)}>
                  <td>
                    <div className="table-comp-name">
                      <FileCode2 size={15} />
                      <strong>{comp.componentName}</strong>
                    </div>
                  </td>
                  <td>
                    <span className="table-pkg-badge">@{comp.packageKey}</span>
                  </td>
                  <td>
                    <code className="table-path-text">{comp.relativePath}</code>
                  </td>
                  <td>
                    <span className="table-cat-badge">{comp.category}</span>
                  </td>
                  <td>
                    <span className="table-exports-text">
                      {comp.exports.length > 0 ? comp.exports.slice(0, 3).join(", ") : "—"}
                      {comp.exports.length > 3 ? ` +${comp.exports.length - 3}` : ""}
                    </span>
                  </td>
                  <td>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectComponent(comp);
                      }}
                      className="table-view-btn"
                    >
                      View &rarr;
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

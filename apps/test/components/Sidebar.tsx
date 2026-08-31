"use client";

import React, { useState, useMemo } from "react";
import {
  Package,
  FileCode2,
  TestTube2,
  Layout,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  RotateCw,
  Sparkles,
  ShieldCheck,
  PanelTop,
} from "lucide-react";
import { PackageGroup, ComponentFile } from "@/lib/scanner";

interface SidebarProps {
  packages: PackageGroup[];
  selectedId: string | null;
  onSelectComponent: (component: ComponentFile) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

type FilterCategory = "all" | "components" | "tests" | "pages" | "modals";

export function Sidebar({
  packages,
  selectedId,
  onSelectComponent,
  onRefresh,
  isRefreshing = false,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [collapsedPackages, setCollapsedPackages] = useState<Record<string, boolean>>({});

  const togglePackage = (pkgKey: string) => {
    setCollapsedPackages((prev) => ({
      ...prev,
      [pkgKey]: !prev[pkgKey],
    }));
  };

  // Filter packages and components based on search and category
  const filteredPackages = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return packages
      .map((pkg) => {
        const matchingComponents = pkg.components.filter((comp) => {
          // Category filter
          if (activeCategory === "components" && (comp.isTest || comp.isPlayground || comp.category === "Page / View")) {
            return false;
          }
          if (activeCategory === "tests" && !comp.isTest) {
            return false;
          }
          if (activeCategory === "pages" && comp.category !== "Page / View" && !comp.isPlayground) {
            return false;
          }
          if (activeCategory === "modals" && comp.category !== "Modal / Dialog") {
            return false;
          }

          // Search query
          if (!query) return true;
          return (
            comp.componentName.toLowerCase().includes(query) ||
            comp.relativePath.toLowerCase().includes(query) ||
            comp.packageKey.toLowerCase().includes(query) ||
            comp.exports.some((e) => e.toLowerCase().includes(query))
          );
        });

        return {
          ...pkg,
          filteredComponents: matchingComponents,
        };
      })
      .filter((pkg) => pkg.filteredComponents.length > 0 || !searchQuery);
  }, [packages, searchQuery, activeCategory]);

  const totalMatching = useMemo(() => {
    return filteredPackages.reduce((acc, p) => acc + (p.filteredComponents?.length || 0), 0);
  }, [filteredPackages]);

  const getCategoryIcon = (comp: ComponentFile) => {
    if (comp.isTest) return <TestTube2 size={14} className="icon-test" />;
    if (comp.isPlayground || comp.category === "Page / View") return <Layout size={14} className="icon-page" />;
    if (comp.category === "Modal / Dialog") return <PanelTop size={14} className="icon-modal" />;
    if (comp.category === "Provider / Gate") return <ShieldCheck size={14} className="icon-gate" />;
    return <FileCode2 size={14} className="icon-component" />;
  };

  return (
    <aside className="sidebar-container">
      {/* Search and Action Header */}
      <div className="sidebar-search-section">
        <div className="search-input-wrapper">
          <Search size={15} className="search-icon" />
          <input
            type="text"
            placeholder="Search .tsx components across packages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="clear-search-btn"
              title="Clear search"
            >
              &times;
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="filter-pills-row">
          <button
            onClick={() => setActiveCategory("all")}
            className={`filter-pill ${activeCategory === "all" ? "active" : ""}`}
          >
            All
          </button>
          <button
            onClick={() => setActiveCategory("components")}
            className={`filter-pill ${activeCategory === "components" ? "active" : ""}`}
          >
            Components
          </button>
          <button
            onClick={() => setActiveCategory("pages")}
            className={`filter-pill ${activeCategory === "pages" ? "active" : ""}`}
          >
            Pages
          </button>
          <button
            onClick={() => setActiveCategory("tests")}
            className={`filter-pill ${activeCategory === "tests" ? "active" : ""}`}
          >
            Tests
          </button>
        </div>

        <div className="sidebar-meta-status">
          <span>Found {totalMatching} .tsx files</span>
          <button
            onClick={onRefresh}
            className={`refresh-btn ${isRefreshing ? "spinning" : ""}`}
            title="Re-scan monorepo packages dynamically"
          >
            <RotateCw size={13} />
            <span>Re-scan</span>
          </button>
        </div>
      </div>

      {/* Package Tree Navigation */}
      <div className="sidebar-tree-scroll">
        {filteredPackages.map((pkg) => {
          const isCollapsed = !!collapsedPackages[pkg.packageKey];
          const components = pkg.filteredComponents || pkg.components;

          return (
            <div key={pkg.packageKey} className="package-group-block">
              {/* Package Header Button */}
              <button
                onClick={() => togglePackage(pkg.packageKey)}
                className="package-group-header"
              >
                <div className="package-header-left">
                  {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
                  <Package size={15} className="pkg-icon" />
                  <span className="pkg-name">@{pkg.packageKey}</span>
                </div>
                <span className="pkg-badge">{components.length}</span>
              </button>

              {/* Package Components List */}
              {!isCollapsed && (
                <div className="package-items-list">
                  {components.map((comp) => {
                    const isSelected = selectedId === comp.id;
                    return (
                      <button
                        key={comp.id}
                        onClick={() => onSelectComponent(comp)}
                        className={`component-tree-item ${isSelected ? "selected" : ""}`}
                        title={`${comp.componentName} (${comp.relativePath})`}
                      >
                        <div className="item-icon-col">{getCategoryIcon(comp)}</div>
                        <div className="item-details-col">
                          <span className="item-name">{comp.componentName}</span>
                          <span className="item-path">{comp.relativePath}</span>
                        </div>
                        {comp.isTest && <span className="tag-pill tag-test">test</span>}
                        {comp.category === "Page / View" && <span className="tag-pill tag-page">page</span>}
                      </button>
                    );
                  })}
                  {components.length === 0 && (
                    <div className="empty-package-notice">No matching .tsx files in this filter</div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredPackages.length === 0 && (
          <div className="no-results-box">
            <Layers size={28} style={{ opacity: 0.4, marginBottom: "8px" }} />
            <p>No components found matching &ldquo;{searchQuery}&rdquo;</p>
          </div>
        )}
      </div>

      {/* Dynamic Sync Notice in Footer */}
      <div className="sidebar-footer">
        <div className="dynamic-badge">
          <Sparkles size={13} className="sparkle-icon" />
          <span>Dynamic Monorepo Sync Active</span>
        </div>
      </div>
    </aside>
  );
}

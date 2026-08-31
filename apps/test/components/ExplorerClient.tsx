"use client";

import React, { useState, useEffect, useCallback } from "react";
import { MonorepoScanResult, ComponentFile } from "@/lib/scanner";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import { ComponentStage } from "./ComponentStage";
import { Dashboard } from "./Dashboard";

interface ExplorerClientProps {
  initialData: MonorepoScanResult;
}

export function ExplorerClient({ initialData }: ExplorerClientProps) {
  const [data, setData] = useState<MonorepoScanResult>(initialData);
  const [selectedComponent, setSelectedComponent] = useState<ComponentFile | null>(null);
  const [sourceCode, setSourceCode] = useState<string>("");
  const [isLoadingSource, setIsLoadingSource] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(false);

  // Initialize theme from system / localStorage
  useEffect(() => {
    const isDarkMode = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const savedTheme = localStorage.getItem("explorer_theme");
    if (savedTheme === "dark" || (!savedTheme && isDarkMode)) {
      setIsDark(true);
      document.documentElement.setAttribute("data-theme", "dark");
    }
  }, []);

  const handleToggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (next) {
        document.documentElement.setAttribute("data-theme", "dark");
        localStorage.setItem("explorer_theme", "dark");
      } else {
        document.documentElement.removeAttribute("data-theme");
        localStorage.setItem("explorer_theme", "light");
      }
      return next;
    });
  };

  // Re-scan monorepo dynamically
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/components", { cache: "no-store" });
      if (res.ok) {
        const freshData: MonorepoScanResult = await res.json();
        setData(freshData);

        // Update selected component if it still exists
        if (selectedComponent) {
          const updated = freshData.allComponents.find((c) => c.id === selectedComponent.id);
          if (updated) {
            setSelectedComponent(updated);
          }
        }
      }
    } catch (err) {
      console.error("Failed to re-scan packages:", err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedComponent]);

  // Load source code when selecting a component
  const handleSelectComponent = async (component: ComponentFile) => {
    setSelectedComponent(component);

    // Update URL query
    const url = new URL(window.location.href);
    url.searchParams.set("pkg", component.packageKey);
    url.searchParams.set("file", component.relativePath);
    window.history.pushState({}, "", url.toString());

    if (component.sourceCode) {
      setSourceCode(component.sourceCode);
      return;
    }

    setIsLoadingSource(true);
    try {
      const res = await fetch(`/api/component?id=${encodeURIComponent(component.id)}`, { cache: "no-store" });
      if (res.ok) {
        const fullComp: ComponentFile = await res.json();
        setSourceCode(fullComp.sourceCode || "");
      } else {
        setSourceCode("// Source code could not be loaded");
      }
    } catch {
      setSourceCode("// Failed to fetch source code");
    } finally {
      setIsLoadingSource(false);
    }
  };

  // Check URL params on initial load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pkg = params.get("pkg");
    const file = params.get("file");

    if (pkg && file) {
      const target = data.allComponents.find(
        (c) => c.packageKey === pkg && c.relativePath === file
      );
      if (target) {
        handleSelectComponent(target);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGoHome = () => {
    setSelectedComponent(null);
    const url = new URL(window.location.href);
    url.searchParams.delete("pkg");
    url.searchParams.delete("file");
    window.history.pushState({}, "", url.pathname);
  };

  return (
    <div className="app-shell">
      {/* Top Navbar */}
      <Navbar
        stats={data.stats}
        isDark={isDark}
        onToggleTheme={handleToggleTheme}
        onGoHome={handleGoHome}
      />

      {/* Body Layout: Sidebar + Stage */}
      <div className="app-body-layout">
        <Sidebar
          packages={data.packages}
          selectedId={selectedComponent?.id || null}
          onSelectComponent={handleSelectComponent}
          onRefresh={handleRefresh}
          isRefreshing={isRefreshing}
        />

        {selectedComponent ? (
          <ComponentStage
            component={selectedComponent}
            sourceCode={sourceCode}
            isLoadingSource={isLoadingSource}
            isDark={isDark}
          />
        ) : (
          <Dashboard
            data={data}
            onSelectComponent={handleSelectComponent}
            onSelectPackage={() => {}}
          />
        )}
      </div>
    </div>
  );
}

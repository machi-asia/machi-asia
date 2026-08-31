"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: "24px",
          background: "rgba(239, 68, 68, 0.08)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          borderRadius: "8px",
          maxWidth: "600px",
          margin: "0 auto",
        }}>
          <h4 style={{ color: "#ef4444", margin: "0 0 8px 0" }}>
            {this.props.fallbackTitle || "Render Error in Component Preview"}
          </h4>
          <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "var(--fg-muted, #666)" }}>
            This component could not be rendered interactively (it may require specific runtime context or active session state):
          </p>
          <pre style={{
            background: "rgba(0,0,0,0.2)",
            padding: "12px",
            borderRadius: "6px",
            fontSize: "12px",
            overflowX: "auto",
            color: "#f87171"
          }}>
            {this.state.error?.message || "Unknown error occurred"}
          </pre>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              marginTop: "12px",
              padding: "6px 14px",
              background: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            Retry Preview
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

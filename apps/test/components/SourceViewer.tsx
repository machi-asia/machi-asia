"use client";

import React, { useState } from "react";
import { Copy, Check, Code, FileText, Layers } from "lucide-react";

interface SourceViewerProps {
  code: string;
  fileName: string;
  language?: string;
  exports?: string[];
  imports?: string[];
}

export function SourceViewer({
  code,
  fileName,
  exports = [],
  imports = [],
}: SourceViewerProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code ? code.split(/\r\n|\r|\n/) : [];

  return (
    <div className="source-viewer-container">
      {/* Header bar */}
      <div className="source-viewer-header">
        <div className="source-viewer-title">
          <FileText size={16} />
          <span>{fileName}</span>
          <span className="source-viewer-meta">{lines.length} lines</span>
        </div>
        <button
          onClick={handleCopy}
          className="source-copy-btn"
          title="Copy source code"
        >
          {copied ? (
            <>
              <Check size={14} style={{ color: "#10b981" }} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>

      {/* Meta tags for exports / imports */}
      {(exports.length > 0 || imports.length > 0) && (
        <div className="source-meta-bar">
          {exports.length > 0 && (
            <div className="source-meta-group">
              <span className="source-meta-label">
                <Code size={13} /> Exports:
              </span>
              <div className="source-tags">
                {exports.map((exp) => (
                  <span key={exp} className="source-tag export-tag">
                    {exp}
                  </span>
                ))}
              </div>
            </div>
          )}

          {imports.length > 0 && (
            <div className="source-meta-group">
              <span className="source-meta-label">
                <Layers size={13} /> Imports:
              </span>
              <div className="source-tags">
                {imports.slice(0, 8).map((imp) => (
                  <span key={imp} className="source-tag import-tag">
                    {imp}
                  </span>
                ))}
                {imports.length > 8 && (
                  <span className="source-tag muted-tag">
                    +{imports.length - 8} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Code with line numbers */}
      <div className="source-code-block">
        <pre className="source-pre">
          <code>
            {lines.map((line, idx) => (
              <div key={idx} className="source-line">
                <span className="line-number">{idx + 1}</span>
                <span className="line-content">{line || " "}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check } from "lucide-react";
import { isMediaVideo, slugify } from "../lib/markdownFormatter";

export interface MarkdownRendererProps {
  variant?: "main" | "chatbot" | "compact";
  content?: string;
  children?: string;
  className?: string;
}

function extractText(node: React.ReactNode): string {
  if (!node) return "";
  if (typeof node === "string") return node;
  if (typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props && props.children) return extractText(props.children);
  }
  return "";
}

function renderChildrenWithBadges(node: React.ReactNode): React.ReactNode {
  if (!node) return node;
  if (typeof node === "string") {
    const combinedRegex = /(@[a-z0-9_-]+:"[^"]+")|(\blasagna\b)/gi;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = combinedRegex.exec(node)) !== null) {
      if (match.index > lastIndex) {
        parts.push(node.substring(lastIndex, match.index));
      }

      if (match[1]) {
        const badgeMatch = /@([a-z0-9_-]+):"([^"]+)"/i.exec(match[1]);
        if (badgeMatch) {
          const category = badgeMatch[1].toUpperCase();
          const title = badgeMatch[2];
          parts.push(
            <span key={`badge-${match.index}`} className="chatbot-badge-pill">
              <span className="chatbot-badge-category">{category}</span> {title}
            </span>
          );
        }
      } else if (match[2]) {
        const matchedWord = match[2];
        parts.push(
          <span key={`lasagna-${match.index}`} className="markdown-lasagna-glow">
            {matchedWord}
          </span>
        );
      }

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < node.length) {
      parts.push(node.substring(lastIndex));
    }

    return parts.length > 0 ? parts : node;
  }

  if (Array.isArray(node)) {
    return node.map((child, idx) => (
      <React.Fragment key={idx}>{renderChildrenWithBadges(child)}</React.Fragment>
    ));
  }

  if (React.isValidElement(node)) {
    const props = node.props as { children?: React.ReactNode };
    if (props && props.children) {
      return React.cloneElement(node, {
        ...props,
        children: renderChildrenWithBadges(props.children),
      } as React.Attributes);
    }
  }

  return node;
}

function cleanCalloutChildren(children: React.ReactNode, type: string): React.ReactNode {
  const pattern = new RegExp(`^\\s*\\[!${type}\\]\\s*`, "i");
  let found = false;

  const process = (node: React.ReactNode): React.ReactNode => {
    if (found) return node;

    if (typeof node === "string") {
      if (pattern.test(node)) {
        found = true;
        return node.replace(pattern, "").replace(/^\s+/, "");
      }
      if (node.trim() === "") return "";
    }

    if (Array.isArray(node)) {
      return node.map((child) => process(child));
    }

    if (React.isValidElement(node)) {
      const elementProps = node.props as { children?: React.ReactNode };
      if (elementProps && elementProps.children) {
        return React.cloneElement(node, {
          ...elementProps,
          children: process(elementProps.children),
        } as React.Attributes);
      }
    }

    return node;
  };

  return process(children);
}

function CodeBlock({ language, code }: { language?: string; code: string }) {
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

  return (
    <div className="markdown-code-block">
      <div className="markdown-code-header">
        <span className="markdown-code-lang">{language || "code"}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="markdown-code-copy-btn"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check size={12} />
              <span>Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="markdown-code-pre">
        <code>{code}</code>
      </pre>
    </div>
  );
}

export function MarkdownRenderer({
  variant = "chatbot",
  content,
  children,
  className = "",
}: MarkdownRendererProps) {
  const rawText = content ?? children ?? "";

  return (
    <div className={`markdown-renderer markdown-renderer--${variant} ${className}`.trim()}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return <h1 id={id}>{renderChildrenWithBadges(children)}</h1>;
          },
          h2: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return <h2 id={id}>{renderChildrenWithBadges(children)}</h2>;
          },
          h3: ({ children }) => {
            const text = extractText(children);
            const id = slugify(text);
            return <h3 id={id}>{renderChildrenWithBadges(children)}</h3>;
          },
          h4: ({ children }) => <h4>{renderChildrenWithBadges(children)}</h4>,
          h5: ({ children }) => <h5>{renderChildrenWithBadges(children)}</h5>,
          h6: ({ children }) => <h6>{renderChildrenWithBadges(children)}</h6>,
          p: ({ children }) => <p>{renderChildrenWithBadges(children)}</p>,
          hr: () => <hr className="markdown-divider" />,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children, className, ...props }) => {
            const isTask = className?.includes("task-list-item");
            return (
              <li className={isTask ? "markdown-task-item" : ""} {...props}>
                {renderChildrenWithBadges(children)}
              </li>
            );
          },
          strong: ({ children }) => <strong>{renderChildrenWithBadges(children)}</strong>,
          em: ({ children }) => <em>{renderChildrenWithBadges(children)}</em>,
          code: ({ className, children, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const rawCode = String(children).replace(/\n$/, "");
            const isMultiline = String(children).includes("\n") || match !== null;

            if (isMultiline) {
              return <CodeBlock language={match ? match[1] : ""} code={rawCode} />;
            }

            return (
              <code className="code-inline" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          blockquote: ({ children }) => {
            const text = extractText(children).trim();
            const match = text.match(/^\[!(NOTE|IMPORTANT|WARNING|TIP|CAUTION|CODE)\]/i);

            if (match) {
              const type = match[1].toUpperCase();
              const icons: Record<string, string> = {
                NOTE: "ℹ️",
                TIP: "💡",
                IMPORTANT: "⚡",
                WARNING: "⚠️",
                CAUTION: "🚨",
                CODE: "💻",
              };

              const cleaned = cleanCalloutChildren(children, type);

              return (
                <div className={`chatbot-callout chatbot-callout-${type.toLowerCase()}`}>
                  <div className="chatbot-callout-header">
                    <span className="chatbot-callout-icon">{icons[type] || "ℹ️"}</span>
                    <span className="chatbot-callout-type">{type}</span>
                  </div>
                  <div className="chatbot-callout-body">
                    {renderChildrenWithBadges(cleaned)}
                  </div>
                </div>
              );
            }

            return <blockquote>{renderChildrenWithBadges(children)}</blockquote>;
          },
          table: ({ children }) => (
            <div className="markdown-table-wrapper chatbot-table-wrap">
              <table className="markdown-table chatbot-table">{children}</table>
            </div>
          ),
          img: ({ src, alt }) => {
            if (!src) return null;
            const imgSrc = typeof src === "string" ? src : "";
            if (imgSrc && isMediaVideo(imgSrc)) {
              return (
                <span className="chatbot-msg-video-wrap" style={{ display: "block" }}>
                  <video
                    src={imgSrc}
                    controls
                    playsInline
                    preload="metadata"
                    className="chatbot-msg-video"
                  />
                  {alt && <span className="chatbot-msg-caption">{alt}</span>}
                </span>
              );
            }
            return (
              <span className="chatbot-msg-img-wrap">
                <img src={imgSrc} alt={alt ?? ""} className="chatbot-msg-img" />
                {alt && <span className="chatbot-msg-caption">{alt}</span>}
              </span>
            );
          },
          a: ({ href, children }) => {
            if (!href) return <span>{children}</span>;
            const linkText = extractText(children);
            if (
              isMediaVideo(href) &&
              (linkText.toLowerCase().includes("video") ||
                linkText.toLowerCase().includes("showcase") ||
                linkText.toLowerCase().includes("demo"))
            ) {
              return (
                <span className="chatbot-msg-video-wrap" style={{ display: "block" }}>
                  <video
                    src={href}
                    controls
                    playsInline
                    preload="metadata"
                    className="chatbot-msg-video"
                  />
                  {linkText && <span className="chatbot-msg-caption">{linkText}</span>}
                </span>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className="chatbot-link">
                {renderChildrenWithBadges(children)}
              </a>
            );
          },
        }}
      >
        {rawText}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;

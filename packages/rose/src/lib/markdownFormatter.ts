export function isMediaVideo(url: string): boolean {
  return /\.(mp4|webm|ogg|mov)($|\?)/i.test(url) || url.includes("/videos/");
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function insertBadgeToken(currentInput: string, badgeText: string): string {
  const lastSlashIndex = currentInput.lastIndexOf("/");
  if (lastSlashIndex !== -1) {
    const beforeSlash = currentInput.substring(0, lastSlashIndex);
    return `${beforeSlash}${badgeText} `;
  }
  return `${currentInput} ${badgeText} `;
}

export function shouldShowSlashMenu(text: string): boolean {
  const lastSlash = text.lastIndexOf("/");
  if (lastSlash === -1) return false;
  return lastSlash === 0 || text[lastSlash - 1] === " ";
}

export function extractSlashQuery(text: string): string {
  const lastSlash = text.lastIndexOf("/");
  if (lastSlash === -1) return "";
  if (lastSlash === 0 || text[lastSlash - 1] === " ") {
    return text.substring(lastSlash);
  }
  return "";
}

function parseGitHubCallouts(text: string): string {
  const calloutRegex = /(?:^|\n)(?:>|&gt;)\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION|CODE)\]\s*(?:\r?\n|<br\s*\/?>)?((?:(?:>|&gt;)[^\n]*(?:\r?\n|<br\s*\/?>)?)+)/gi;

  const icons: Record<string, string> = {
    NOTE: "ℹ️",
    TIP: "💡",
    IMPORTANT: "⚡",
    WARNING: "⚠️",
    CAUTION: "🚨",
    CODE: "💻",
  };

  return text.replace(calloutRegex, (_match, type, contentBlock) => {
    const typeUpper = type.toUpperCase();
    const typeLower = type.toLowerCase();
    const icon = icons[typeUpper] || "ℹ️";

    const cleanLines = contentBlock
      .split(/\r?\n|<br\s*\/?>/)
      .map((line: string) => line.replace(/^(?:>|&gt;)\s?/, "").trim())
      .filter(Boolean);

    const bodyText = cleanLines.join("\n");
    const bodyFormatted = bodyText
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/`(.+?)`/g, "<code>$1</code>");

    return `<div class="chatbot-callout chatbot-callout-${typeLower}"><div class="chatbot-callout-header"><span class="chatbot-callout-icon">${icon}</span><span class="chatbot-callout-type">${typeUpper}</span></div><div class="chatbot-callout-body">${bodyFormatted}</div></div>`;
  });
}

function parseMarkdownTables(text: string): string {
  const tableRegex = /((?:\|[^\n]+\|\r?\n?)+)/g;
  return text.replace(tableRegex, (match) => {
    const lines = match.trim().split(/\r?\n/);
    if (lines.length < 2) return match;

    const headerLine = lines[0].trim();
    const dividerLine = lines[1].trim();
    if (!/^\|(?:\s*:?-+:?\s*\|)+$/.test(dividerLine)) {
      return match;
    }

    const cleanRow = (line: string) =>
      line
        .trim()
        .replace(/^\|/, "")
        .replace(/\|$/, "")
        .split("|")
        .map((cell) => cell.trim());

    const headers = cleanRow(headerLine);
    const dataRows = lines.slice(2).map(cleanRow);

    const ths = headers
      .map((h) => `<th>${h.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</th>`)
      .join("");

    const trs = dataRows
      .map((row) => {
        const tds = row
          .map((cell) => `<td>${cell.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")}</td>`)
          .join("");
        return `<tr>${tds}</tr>`;
      })
      .join("");

    return `<div class="chatbot-table-wrap"><table class="chatbot-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>`;
  });
}

export function formatMarkdown(text: string): string {
  if (!text) return "";

  let formatted = parseGitHubCallouts(text);
  formatted = parseMarkdownTables(formatted);

  formatted = formatted
    .replace(/\blasagna\b/gi, '<span class="markdown-lasagna-glow">$1</span>')
    .replace(/@([a-z0-9_-]+):"([^"]+)"/gi, (_match, category, title) => {
      return `<span class="chatbot-badge-pill"><span class="chatbot-badge-category">${category.toUpperCase()}</span> ${title}</span>`;
    })
    .replace(/\[!\[([^\]]*)\]\(([^)]+)\)\]\(([^)]+)\)/g, (_match, alt, src, link) => {
      if (isMediaVideo(src)) {
        return `<a href="${link}" target="_blank" rel="noopener noreferrer"><div class="chatbot-msg-video-wrap"><video src="${src}" controls playsinline preload="metadata" class="chatbot-msg-video"></video></div></a>`;
      }
      return `<a href="${link}" target="_blank" rel="noopener noreferrer"><div class="chatbot-msg-img-wrap"><img src="${src}" alt="${alt}" /></div></a>`;
    })
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
      if (isMediaVideo(src)) {
        return `<div class="chatbot-msg-video-wrap"><video src="${src}" controls playsinline preload="metadata" class="chatbot-msg-video"></video>${alt ? `<span class="chatbot-msg-caption">${alt}</span>` : ""}</div>`;
      }
      return `<div class="chatbot-msg-img-wrap"><img src="${src}" alt="${alt}" /></div>`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, linkText, url) => {
      if (isMediaVideo(url) && (linkText.toLowerCase().includes("video") || linkText.toLowerCase().includes("showcase") || linkText.toLowerCase().includes("demo"))) {
        return `<div class="chatbot-msg-video-wrap"><video src="${url}" controls playsinline preload="metadata" class="chatbot-msg-video"></video>${linkText ? `<span class="chatbot-msg-caption">${linkText}</span>` : ""}</div>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="color:var(--rose-accent);text-decoration:underline;">${linkText}</a>`;
    })
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`(.+?)`/g, "<code>$1</code>")
    .replace(/^\s*[-*]\s+(.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)
    .replace(/\n/g, "<br />");

  formatted = formatted
    .replace(/(?:<br\s*\/?>\s*)+(?=<(?:div|table|ul|ol|li|h[1-6]|p)[\s>])/gi, "")
    .replace(/(<\/(?:div|table|ul|ol|li|h[1-6]|p)>)(?:\s*<br\s*\/?>)+/gi, "$1")
    .replace(/(?:<br\s*\/?>){2,}/gi, "<br />");

  return formatted;
}

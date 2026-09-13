/**
 * Hand-built SVG rendering (no dependencies). Produces a rounded dark card with:
 *   - a header showing the all-time contribution total
 *   - a table of the top repos with the user's PR and issue counts
 */

import { getTheme } from "./themes.js";

const WIDTH = 495;
const PADDING = 25;
const INNER = WIDTH - PADDING * 2;

// Column geometry.
const REPO_X = PADDING;
const REPO_MAX_WIDTH = 236;
const PR_RIGHT = 378;
const ISSUE_RIGHT = 468;

// Vertical geometry.
const LABEL_Y = 44;
const NUMBER_Y = 82;
const DIVIDER_Y = 104;
const HEADER_BG_Y = 118;
const HEADER_BG_H = 28;
const HEADER_Y = 137;
const FIRST_ROW_Y = 171;
const ROW_H = 34;
const BOTTOM_PADDING = 26;

// Octicons (16x16 viewBox) path data.
const PR_ICON =
  "M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354Z";
const ISSUE_ICON =
  "M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z";

function escapeXml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Rough text measurement (Segoe UI-ish average widths). Good enough for layout. */
function measureText(str, fontSize) {
  let width = 0;
  for (const ch of String(str)) {
    const c = ch.charCodeAt(0);
    if (c <= 32) width += 0.3;
    else if (c >= 48 && c <= 57) width += 0.55; // digits
    else if (c >= 65 && c <= 90) width += 0.72; // uppercase
    else if (c >= 97 && c <= 122) width += 0.55; // lowercase
    else width += 0.6;
  }
  return width * fontSize;
}

function truncate(str, maxWidth, fontSize) {
  if (measureText(str, fontSize) <= maxWidth) return str;
  let result = str;
  while (result.length && measureText(result + "\u2026", fontSize) > maxWidth) {
    result = result.slice(0, -1);
  }
  return result + "\u2026";
}

/** Right-aligned icon + number group anchored at the given right edge. */
function iconNumber({ right, y, icon, color, value }) {
  const label = value.toLocaleString("en-US");
  const fontSize = 13;
  const iconSize = 14;
  const gap = 6;
  const textWidth = measureText(label, fontSize);
  const textX = right - textWidth;
  const iconX = textX - gap - iconSize;
  const iconY = y - iconSize + 2;

  return `
    <svg x="${iconX}" y="${iconY}" width="${iconSize}" height="${iconSize}" viewBox="0 0 16 16" fill="${color}">
      <path d="${icon}"/>
    </svg>
    <text x="${textX}" y="${y}" fill="${color}" class="num">${label}</text>`;
}

/**
 * Render the full dashboard SVG.
 * @param {{ totalContributions: number, repos: Array<{repo:string, prs:number, issues:number}>, themeName?: string }} data
 * @returns {string} SVG markup
 */
export function renderCard({ totalContributions, repos, themeName = "catppuccin" }) {
  const theme = getTheme(themeName);
  const count = repos.length;
  const height = FIRST_ROW_Y + (count - 1) * ROW_H + BOTTOM_PADDING;

  const total = Number(totalContributions) || 0;

  const rows = repos
    .map((row, i) => {
      const y = FIRST_ROW_Y + i * ROW_H;
      const repo = truncate(escapeXml(row.repo), REPO_MAX_WIDTH, 13);
      return `
    <text x="${REPO_X}" y="${y}" fill="${theme.text}" class="repo">${repo}</text>
    ${iconNumber({ right: PR_RIGHT, y, icon: PR_ICON, color: theme.prColor, value: row.prs })}
    ${iconNumber({ right: ISSUE_RIGHT, y, icon: ISSUE_ICON, color: theme.issueColor, value: row.issues })}`;
    })
    .join("");

  return `
<svg width="${WIDTH}" height="${height}" viewBox="0 0 ${WIDTH} ${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="GitHub Dashboard">
  <style>
    .label { font: 600 14px 'Segoe UI', Ubuntu, sans-serif; }
    .big   { font: 700 34px 'Segoe UI', Ubuntu, sans-serif; }
    .head  { font: 700 12px 'Segoe UI', Ubuntu, sans-serif; }
    .repo  { font: 600 13px 'Segoe UI', Ubuntu, sans-serif; }
    .num   { font: 600 13px 'Segoe UI', Ubuntu, sans-serif; }
  </style>

  <rect x="0.5" y="0.5" width="${WIDTH - 1}" height="${height - 1}" rx="10" fill="${theme.bg}" stroke="${theme.border}"/>

  <text x="${PADDING}" y="${LABEL_Y}" fill="${theme.label}" class="label">Total Contributions</text>
  <text x="${PADDING}" y="${NUMBER_Y}" fill="${theme.number}" class="big">${total.toLocaleString("en-US")}</text>

  <line x1="${PADDING}" y1="${DIVIDER_Y}" x2="${WIDTH - PADDING}" y2="${DIVIDER_Y}" stroke="${theme.divider}" stroke-width="1"/>

  <rect x="${PADDING}" y="${HEADER_BG_Y}" width="${INNER}" height="${HEADER_BG_H}" rx="6" fill="${theme.headerBg}"/>
  <text x="${REPO_X}" y="${HEADER_Y}" fill="${theme.label}" class="head">Repository</text>
  <text x="${PR_RIGHT}" y="${HEADER_Y}" fill="${theme.label}" class="head" text-anchor="end">PRs</text>
  <text x="${ISSUE_RIGHT}" y="${HEADER_Y}" fill="${theme.label}" class="head" text-anchor="end">Issues</text>

  ${rows}
</svg>
`.trim();
}

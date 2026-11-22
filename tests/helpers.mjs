import fs from "node:fs";
import path from "node:path";

export const ORDER = ["clearbill", "ibm-batch", "taxi-pipeline", "fashion-recommender"];

/**
 * Returns the text of dist/work/<slug>/index.html relative to the project root,
 * or throws an Error "missing built page for <slug>" if the file does not exist.
 */
export function read(slug) {
  const filePath = path.resolve(import.meta.dirname, "..", "dist", "work", slug, "index.html");
  if (!fs.existsSync(filePath)) {
    throw new Error(`missing built page for ${slug}`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

/**
 * Replaces &amp;, &lt;, &gt;, &quot;, &#39;, &#x27;, &#x2F; and numeric entities
 * &#NNN; / &#xHH; with their characters.
 */
export function decode(html) {
  if (!html) return "";
  return html
    .replace(/&#x([0-9a-fA-F]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * Decode of the HTML with all tags removed and runs of whitespace collapsed to one space.
 */
export function text(html) {
  if (!html) return "";
  const noTags = html.replace(/<[^>]*>/g, " ");
  return decode(noTags).replace(/\s+/g, " ").trim();
}

/**
 * Returns the outer HTML of the first element carrying data-case-section="<name>"
 * up to its matching close tag (tracking nesting of that element's tag name),
 * or null if absent.
 */
export function section(html, name) {
  if (!html) return null;
  const escapedName = name.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
  const openRegex = new RegExp(
    `<([a-zA-Z0-9:-]+)\\b[^>]*?\\bdata-case-section=["']${escapedName}["'][^>]*>`,
    "i"
  );
  const match = openRegex.exec(html);
  if (!match) return null;

  const startIndex = match.index;
  const tagName = match[1].toLowerCase();
  const openTag = match[0];

  if (openTag.trimEnd().endsWith("/>")) {
    return openTag;
  }

  const tagRegex = new RegExp(`<(/?)${tagName}(?:\\s[^>]*?)?(/?)>`, "gi");
  tagRegex.lastIndex = startIndex + openTag.length;

  let depth = 1;
  let tagMatch;
  while ((tagMatch = tagRegex.exec(html)) !== null) {
    const isClosing = tagMatch[1] === "/";
    const isSelfClosing = tagMatch[2] === "/" || tagMatch[0].trimEnd().endsWith("/>");

    if (isClosing) {
      depth--;
      if (depth === 0) {
        return html.slice(startIndex, tagRegex.lastIndex);
      }
    } else if (!isSelfClosing) {
      depth++;
    }
  }

  return null;
}

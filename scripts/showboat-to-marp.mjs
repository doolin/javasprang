#!/usr/bin/env node

/**
 * Convert a Showboat walkthrough to a Marp slide deck.
 *
 * Usage:
 *   node scripts/showboat-to-marp.mjs docs/cicd-golden-pipeline-walkthrough.md
 *
 * Outputs: docs/cicd-golden-pipeline-walkthrough-slides.md
 *
 * Each ## heading becomes a new slide. Code blocks and output blocks
 * are preserved. The Showboat file remains the source of truth;
 * re-run this script whenever it changes.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";

const input = process.argv[2];
if (!input) {
  console.error("Usage: node scripts/showboat-to-marp.mjs <walkthrough.md>");
  process.exit(1);
}

const src = readFileSync(input, "utf8");
const lines = src.split("\n");

// Extract the title from the first # heading.
const titleLine = lines.find((l) => /^# /.test(l));
const title = titleLine ? titleLine.replace(/^# /, "") : "Walkthrough";

// Build Marp frontmatter.
const frontmatter = [
  "---",
  "marp: true",
  "theme: default",
  `title: ${title}`,
  "paginate: true",
  "---",
  "",
].join("\n");

// Filter out the showboat metadata line and HTML comments.
const content = lines
  .filter((l) => !l.startsWith("*2026") && !/^<!--/.test(l))
  .join("\n");

// Split on ## headings — each becomes a slide.
// Keep the # title as the first slide.
const sections = content.split(/(?=^## )/m);

// The first section contains the # title and intro text.
// Subsequent sections each start with ##.
const slides = sections.map((section) => section.trim()).filter(Boolean);

// Reassemble with --- separators.
const deck = frontmatter + slides.join("\n\n---\n\n") + "\n";

// Write output alongside the input file.
const outName = basename(input, ".md") + "-slides.md";
const outPath = join(dirname(input), outName);
writeFileSync(outPath, deck);
console.log(`Wrote ${outPath}`);

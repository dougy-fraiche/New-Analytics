#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const APP_DIR = path.join(ROOT, "src", "app");
const ROUTES_FILE = path.join(APP_DIR, "routes.ts");
const ALLOWED_EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx"]);
const ALLOW_COMMENT = "route-hardcode-ok";

const HARDCODED_ROUTE_PATTERN =
  /(['"`])\/(?:conversation|anomaly-investigation|conversations|automation-opportunities|observability|saved|recommended-actions|actions\/history|insights|settings|dashboard)(?:\/|:|$)[^'"`]*\1/g;

function collectFiles(dir) {
  const entries = readdirSync(dir);
  const out = [];
  for (const entry of entries) {
    const abs = path.join(dir, entry);
    const stat = statSync(abs);
    if (stat.isDirectory()) {
      out.push(...collectFiles(abs));
      continue;
    }
    if (!ALLOWED_EXTENSIONS.has(path.extname(abs))) continue;
    if (abs === ROUTES_FILE) continue;
    out.push(abs);
  }
  return out;
}

function checkFile(filePath) {
  const src = readFileSync(filePath, "utf8");
  const lines = src.split(/\r?\n/);
  const violations = [];

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];
    if (!line || line.includes(ALLOW_COMMENT)) continue;
    const trimmed = line.trim();
    if (
      trimmed.startsWith("//") ||
      trimmed.startsWith("*") ||
      trimmed.startsWith("/*") ||
      trimmed.startsWith("*/")
    ) {
      continue;
    }
    HARDCODED_ROUTE_PATTERN.lastIndex = 0;
    if (!HARDCODED_ROUTE_PATTERN.test(line)) continue;
    violations.push({
      filePath,
      line: lineIndex + 1,
      content: line.trim(),
    });
  }

  return violations;
}

const files = collectFiles(APP_DIR);
const violations = files.flatMap(checkFile);

if (violations.length > 0) {
  console.error("Hardcoded route paths found. Use ROUTES constants from src/app/routes.ts.");
  for (const violation of violations) {
    const rel = path.relative(ROOT, violation.filePath);
    console.error(`- ${rel}:${violation.line} -> ${violation.content}`);
  }
  process.exit(1);
}

console.log("Route hardcode check passed.");

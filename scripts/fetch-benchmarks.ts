/**
 * Fetches the hardcoded-benchmarks.ts from pi-free repo (master branch)
 * and extracts the HARDCODED_BENCHMARKS object into data/benchmarks.json.
 *
 * pi-free already fetches this monthly from Artificial Analysis API.
 * We consume their cached data to avoid duplicate API calls.
 */

import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const SOURCE_URL =
  "https://raw.githubusercontent.com/apmantza/pi-free/master/provider-failover/hardcoded-benchmarks.ts";

console.log("Fetching benchmarks from pi-free...");

const res = await fetch(SOURCE_URL);
if (!res.ok) throw new Error(`Failed to fetch benchmarks: ${res.status} ${res.statusText}`);

const src = await res.text();

// Extract the HARDCODED_BENCHMARKS object using a simple regex parse
// The file is a TS object literal — parse it by extracting key/value blocks
const benchmarks: Record<string, {
  intelligenceIndex: number;
  normalizedScore: number;
  codingIndex?: number;
  agenticIndex?: number;
  reasoningIndex?: number;
  contextWindow: number;
  supportsReasoning: boolean;
  supportsVision: boolean;
  lastUpdated: string;
}> = {};

// Match each entry: "key": { ... }
// The file uses consistent formatting — each entry ends before the next quoted key
const entryRe = /"([\w\-.]+)":\s*\{([^}]+)\}/g;
let match;

while ((match = entryRe.exec(src)) !== null) {
  const key = match[1];
  const body = match[2];

  function num(field: string): number | undefined {
    const m = new RegExp(field + ":\\s*([\\d.]+)").exec(body);
    return m ? parseFloat(m[1]) : undefined;
  }
  function bool(field: string): boolean {
    const m = new RegExp(field + ":\\s*(true|false)").exec(body);
    return m ? m[1] === "true" : false;
  }
  function str(field: string): string {
    const m = new RegExp(field + ':\\s*"([^"]+)"').exec(body);
    return m ? m[1] : "";
  }

  const intelligenceIndex = num("intelligenceIndex");
  const normalizedScore   = num("normalizedScore");
  const contextWindow     = num("contextWindow");
  if (intelligenceIndex == null || normalizedScore == null || contextWindow == null) continue;

  benchmarks[key] = {
    intelligenceIndex,
    normalizedScore,
    codingIndex:     num("codingIndex"),
    agenticIndex:    num("agenticIndex"),
    reasoningIndex:  num("reasoningIndex"),
    contextWindow,
    supportsReasoning: bool("supportsReasoning"),
    supportsVision:    bool("supportsVision"),
    lastUpdated:       str("lastUpdated"),
  };
}

const count = Object.keys(benchmarks).length;
if (count === 0) throw new Error("Parsed 0 benchmarks — check regex against source format");

const outPath = join(ROOT, "data", "benchmarks.json");
writeFileSync(outPath, JSON.stringify(benchmarks, null, 2));
console.log(`Saved ${count} model benchmarks to data/benchmarks.json`);

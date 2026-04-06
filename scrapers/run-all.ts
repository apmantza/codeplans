import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dataDir = join(__dirname, "../data");

const scrapers = [
  { name: "anthropic", fn: () => import("./anthropic.ts") },
  { name: "openai",    fn: () => import("./openai.ts") },
  { name: "zai",       fn: () => import("./zai.ts") },
  { name: "kimi",      fn: () => import("./kimi.ts") },
  { name: "minimax",   fn: () => import("./minimax.ts") },
  { name: "mimo",      fn: () => import("./mimo.ts") },
];

for (const { name, fn } of scrapers) {
  console.log(`\nScraping ${name}...`);
  try {
    const mod = await fn();
    const data = await mod.scrape();
    writeFileSync(
      join(dataDir, `${name}.json`),
      JSON.stringify(data, null, 2)
    );
    console.log(`  ✓ ${name} saved`);
  } catch (err) {
    console.error(`  ✗ ${name} failed:`, (err as Error).message);
  }
}

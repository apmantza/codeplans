import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = ["https://mimo.mi.com/"];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: false,
  notes: "Explicitly compatible with OpenCode, OpenClaw, Claude Code, KiloCode.",
};

// Known regular (non-intro) prices and credits
const KNOWN = [
  { name: "Lite",     price: 6,   credits: 60 },
  { name: "Standard", price: 16,  credits: 200 },
  { name: "Pro",      price: 50,  credits: 700 },
  { name: "Max",      price: 100, credits: 1600 },
] as const;

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(3000);
    try {
      await page.waitForFunction(
        () => document.body.innerText.includes("$"),
        { timeout: 10000 }
      );
    } catch { /* continue */ }
    return page.innerText("body");
  });

  const hasIntro = /first.{0,20}purchase|first.{0,20}discount|limited.{0,20}discount/i.test(text);

  // Page layout per plan: "{Name}\nFirst Purchase\n...\n$ {intro} / mo\n$ {regular}/mo\n{N} Million Credits"
  // Find the plan heading as a standalone line (preceded by newline or start) to avoid false matches
  function planData(name: string, fallback: { price: number; credits: number }) {
    // Match plan name as a heading (line by itself)
    const re = new RegExp("(?:^|\\n)" + name + "\\n", "i");
    const m = re.exec(text);
    if (!m) return fallback;
    const slice = text.slice(m.index, m.index + 500);
    // Prices: "$ 44.00 / mo" (intro) and "$ 50/mo" (regular) — take the rounded one
    const priceMatches = [...slice.matchAll(/\$\s*([\d.]+)\s*\/\s*mo/gi)];
    // Intro price has decimals in source (e.g. "$ 44.00 / mo"), regular is whole ("$ 50/mo")
    const regular = priceMatches
      .filter(m => !m[1].includes("."))
      .map(m => parseFloat(m[1]))[0] ?? fallback.price;
    // Credits: "700 Million Credits"
    const cm = slice.match(/([\d,]+)\s*Million\s*Credits/i);
    const credits = cm ? parseInt(cm[1].replace(/,/g, ""), 10) : fallback.credits;
    return { price: regular, credits };
  }

  return {
    provider: "Xiaomi MiMo",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: KNOWN.map((def) => {
      const { price, credits } = planData(def.name, def);
      return {
        name: def.name,
        price_usd_monthly: price,
        price_usd_annual: null,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: credits,
        models_included: ["MiMo-V2-Pro", "MiMo-V2-Omni", "MiMo-V2-TTS"],
        modalities: ["text", "code", "image_input", "audio", "video"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "",
        intro_pricing: hasIntro,
        intro_notes: hasIntro ? "First-purchase discount (~12% off)" : "",
      };
    }),
  };
}

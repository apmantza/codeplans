import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = ["https://platform.minimax.io/docs/guides/pricing-token-plan"];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  notes: "Officially supported in OpenClaw, Cline, Kilo, Roo, Claude Code, Cursor, Zed.",
};

// Each plan has a unique price — use price as the anchor, not the name
const KNOWN_PLANS = [
  { name: "Starter",         price: 10,  requests: 1500,  window: 5, modalities: ["text", "code"],                                        models: ["MiniMax M2.7"],           restrictions: [] },
  { name: "Plus",            price: 20,  requests: 4500,  window: 5, modalities: ["text", "code", "audio", "image_gen"],                  models: ["MiniMax M2.7"],           restrictions: ["4000 speech chars/day", "50 images/day"] },
  { name: "Max",             price: 50,  requests: 15000, window: 5, modalities: ["text", "code", "audio", "image_gen", "video", "music"], models: ["MiniMax M2.7"],           restrictions: ["11000 speech chars/day", "120 images/day", "2 videos/day", "4 songs/day"] },
  { name: "Plus Highspeed",  price: 40,  requests: 4500,  window: 5, modalities: ["text", "code", "audio", "image_gen"],                  models: ["MiniMax M2.7-Highspeed"], restrictions: ["9000 speech chars/day", "100 images/day"] },
  { name: "Max Highspeed",   price: 80,  requests: 15000, window: 5, modalities: ["text", "code", "audio", "image_gen", "video", "music"], models: ["MiniMax M2.7-Highspeed"], restrictions: ["19000 speech chars/day", "200 images/day", "3 videos/day", "7 songs/day"] },
  { name: "Ultra Highspeed", price: 150, requests: 30000, window: 5, modalities: ["text", "code", "audio", "image_gen", "video", "music"], models: ["MiniMax M2.7-Highspeed"], restrictions: ["50000 speech chars/day", "800 images/day", "5 videos/day", "15 songs/day"] },
];

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(2000);
    return page.innerText("body");
  });

  // For each known plan, verify its price is still present in the page
  // If the price changed, log a warning but keep the known data
  function verifyPrice(name: string, expected: number): number {
    const idx = text.search(new RegExp("\\b" + name.replace(/\s+/g, "\\s+") + "\\b", "i"));
    if (idx === -1) return expected;
    const slice = text.slice(idx, idx + 300);
    // Find all prices in the section and pick the one closest to expected
    const prices = [...slice.matchAll(/\$(\d+)/g)].map(m => parseInt(m[1], 10));
    if (prices.length === 0) return expected;
    // Pick price closest to expected (avoids picking up a different plan's price)
    const closest = prices.reduce((a, b) => Math.abs(a - expected) <= Math.abs(b - expected) ? a : b);
    if (closest !== expected) {
      console.warn(`  MiniMax ${name} price changed: expected $${expected}, found $${closest}`);
      return closest;
    }
    return expected;
  }

  return {
    provider: "MiniMax",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: KNOWN_PLANS.map((def) => ({
      name: def.name,
      price_usd_monthly: verifyPrice(def.name, def.price),
      price_usd_annual: null,
      requests_per_window: def.requests,
      window_hours: def.window,
      tokens_monthly: null,
      credits_monthly: null,
      models_included: def.models,
      modalities: def.modalities,
      third_party_clients: THIRD_PARTY,
      restrictions: def.restrictions,
      policy_notes: "",
      intro_pricing: false,
      intro_notes: "",
    })),
  };
}

import { withPage, today, type ProviderData, windowToMonthly } from "./base.ts";

const SOURCE_URLS = ["https://platform.minimax.io/docs/guides/pricing-token-plan"];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  pi: true,
  notes: "Officially supported in OpenClaw, Cline, Kilo, Roo, Claude Code, Cursor, Zed.",
};

const KNOWN_PLANS = [
  { name: "Starter",         price: 10,  requests: 1500,  window: 5, modalities: ["text", "code"],                                        models: ["MiniMax M2.7"],           modelIds: ["minimax-m2.7"],           restrictions: [] },
  { name: "Plus",            price: 20,  requests: 4500,  window: 5, modalities: ["text", "code", "audio", "image_gen"],                  models: ["MiniMax M2.7"],           modelIds: ["minimax-m2.7"],           restrictions: ["4000 speech chars/day", "50 images/day"] },
  { name: "Max",             price: 50,  requests: 15000, window: 5, modalities: ["text", "code", "audio", "image_gen", "video", "music"], models: ["MiniMax M2.7"],           modelIds: ["minimax-m2.7"],           restrictions: ["11000 speech chars/day", "120 images/day", "2 videos/day", "4 songs/day"] },
  { name: "Plus Highspeed",  price: 40,  requests: 4500,  window: 5, modalities: ["text", "code", "audio", "image_gen"],                  models: ["MiniMax M2.7-Highspeed"], modelIds: ["minimax-m2.7"],           restrictions: ["9000 speech chars/day", "100 images/day"] },
  { name: "Max Highspeed",   price: 80,  requests: 15000, window: 5, modalities: ["text", "code", "audio", "image_gen", "video", "music"], models: ["MiniMax M2.7-Highspeed"], modelIds: ["minimax-m2.7"],           restrictions: ["19000 speech chars/day", "200 images/day", "3 videos/day", "7 songs/day"] },
  { name: "Ultra Highspeed", price: 150, requests: 30000, window: 5, modalities: ["text", "code", "audio", "image_gen", "video", "music"], models: ["MiniMax M2.7-Highspeed"], modelIds: ["minimax-m2.7"],           restrictions: ["50000 speech chars/day", "800 images/day", "5 videos/day", "15 songs/day"] },
];

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(2000);
    return page.innerText("body");
  });

  function verifyPrice(name: string, expected: number): number {
    const idx = text.search(new RegExp("\\b" + name.replace(/\s+/g, "\\s+") + "\\b", "i"));
    if (idx === -1) return expected;
    const slice = text.slice(idx, idx + 300);
    const prices = [...slice.matchAll(/\$(\d+)/g)].map(m => parseInt(m[1], 10));
    if (prices.length === 0) return expected;
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
      category: "model_provider" as const,
      price_usd_monthly: verifyPrice(def.name, def.price),
      price_usd_annual: null,
      interactions_monthly: windowToMonthly(def.requests, def.window),
      interactions_note: `${def.requests} requests per ${def.window}h window`,
      requests_per_window: def.requests,
      window_hours: def.window,
      tokens_monthly: null,
      credits_monthly: null,
      completions_included: false,
      model_ids: def.modelIds,
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

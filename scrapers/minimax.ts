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

interface PlanDef {
  name: string;
  hint: string;
  price: number;
  requests: number;
  modalities: string[];
  restrictions: string[];
  models: string[];
}

const PLAN_DEFS: PlanDef[] = [
  { name: "Starter",        hint: "starter",        price: 10,  requests: 1500,  modalities: ["text", "code"],                                       restrictions: [],                                                                           models: ["MiniMax M2.7"] },
  { name: "Plus",           hint: "plus",            price: 20,  requests: 4500,  modalities: ["text", "code", "audio", "image_gen"],                 restrictions: ["4000 speech chars/day", "50 images/day"],                                   models: ["MiniMax M2.7"] },
  { name: "Max",            hint: "max",             price: 50,  requests: 15000, modalities: ["text", "code", "audio", "image_gen", "video", "music"],restrictions: ["11000 speech chars/day", "120 images/day", "2 videos/day", "4 songs/day"], models: ["MiniMax M2.7"] },
  { name: "Plus Highspeed", hint: "plus-highspeed",  price: 40,  requests: 4500,  modalities: ["text", "code", "audio", "image_gen"],                 restrictions: ["9000 speech chars/day", "100 images/day"],                                  models: ["MiniMax M2.7-Highspeed"] },
  { name: "Max Highspeed",  hint: "max-highspeed",   price: 80,  requests: 15000, modalities: ["text", "code", "audio", "image_gen", "video", "music"],restrictions: ["19000 speech chars/day", "200 images/day", "3 videos/day", "7 songs/day"], models: ["MiniMax M2.7-Highspeed"] },
  { name: "Ultra Highspeed",hint: "ultra-highspeed", price: 150, requests: 30000, modalities: ["text", "code", "audio", "image_gen", "video", "music"],restrictions: ["50000 speech chars/day", "800 images/day", "5 videos/day", "15 songs/day"],models: ["MiniMax M2.7-Highspeed"] },
];

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(2000);
    return page.innerText("body");
  });

  function planPrice(hint: string, fallback: number): number {
    const idx = text.toLowerCase().indexOf(hint.toLowerCase());
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 200);
    const m = slice.match(/\$(\d+)/);
    return m ? parseInt(m[1], 10) : fallback;
  }

  function planRequests(hint: string, fallback: number): number {
    const idx = text.toLowerCase().indexOf(hint.toLowerCase());
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 300);
    const m = slice.match(/([\d,]+)\s*(?:requests|req)/i);
    return m ? parseInt(m[1].replace(/,/g, ""), 10) : fallback;
  }

  return {
    provider: "MiniMax",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: PLAN_DEFS.map((def) => ({
      name: def.name,
      price_usd_monthly: planPrice(def.hint, def.price),
      price_usd_annual: null,
      requests_per_window: planRequests(def.hint, def.requests),
      window_hours: 5,
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

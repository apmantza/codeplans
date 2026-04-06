import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = ["https://mimo.mi.com/"];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: false,
  notes: "Explicitly compatible with OpenCode, OpenClaw, Claude Code.",
};

const PLAN_NAMES = ["Lite", "Standard", "Pro", "Max"];

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(5000);
    // Wait for any price to appear
    try {
      await page.waitForSelector("text=/\\$\\d+/", { timeout: 10000 });
    } catch {
      // Continue with whatever rendered
    }
    return page.innerText("body");
  });

  // Extract prices per plan — MiMo shows USD prices on the international page
  function planPrice(name: string): number | null {
    const idx = text.toLowerCase().indexOf(name.toLowerCase());
    if (idx === -1) return null;
    const slice = text.slice(idx, idx + 300);
    const m = slice.match(/\$(\d+(?:\.\d+)?)/);
    return m ? parseFloat(m[1]) : null;
  }

  // Check if intro discount is mentioned
  const hasIntro = /88%|first.{0,20}discount|limited.{0,20}discount/i.test(text);

  return {
    provider: "Xiaomi MiMo",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: PLAN_NAMES.map((name) => ({
      name,
      price_usd_monthly: planPrice(name),
      price_usd_annual: null,
      requests_per_window: null,
      window_hours: null,
      tokens_monthly: null,
      credits_monthly: null,
      models_included: ["MiMo-V2-Pro", "MiMo-V2-Omni", "MiMo-V2-TTS"],
      modalities: ["text", "code", "image_input", "audio", "video"],
      third_party_clients: THIRD_PARTY,
      restrictions: [],
      policy_notes: "",
      intro_pricing: hasIntro,
      intro_notes: hasIntro ? "88% first-purchase discount" : "",
    })),
  };
}

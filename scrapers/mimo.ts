import { withPage, today, type ProviderData } from "./base.ts";
import Anthropic from "@anthropic-ai/sdk";

const SOURCE_URLS = [
  "https://mimo.mi.com/",
  "https://platform.xiaomimimo.com/",
];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: false,
  notes: "Explicitly supported: OpenCode, OpenClaw, Claude Code. Compatible with any OpenAI-compatible client.",
};

export async function scrape(): Promise<ProviderData> {
  const pageText = await withPage(SOURCE_URLS[0], async (page) => {
    // MiMo is a React app — wait for pricing content
    await page.waitForTimeout(5000);
    try {
      await page.waitForSelector("text=/\\$|USD|Lite|Standard|Pro|Max/i", { timeout: 10000 });
    } catch {
      // Continue with whatever loaded
    }
    return page.innerText("body");
  });

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Extract all Xiaomi MiMo token subscription plans from this page. Show USD prices only. Return a JSON array with fields: name, price_usd_monthly, price_usd_annual, credits_monthly, models_included (array), modalities (array of: text/code/image_input/audio/video), restrictions (array), intro_pricing (bool), intro_notes (string). Page text:\n\n${pageText.slice(0, 8000)}`,
    }],
  });

  let plans: ProviderData["plans"] = [];
  try {
    const raw = (response.content[0] as { text: string }).text;
    const match = raw.match(/\[[\s\S]*\]/);
    if (match) plans = JSON.parse(match[0]);
  } catch {
    // Fall back to known data
  }

  plans = plans.map((p) => ({
    ...p,
    requests_per_window: null,
    window_hours: null,
    tokens_monthly: null,
    third_party_clients: THIRD_PARTY,
    policy_notes: "",
  }));

  return {
    provider: "Xiaomi MiMo",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans,
  };
}

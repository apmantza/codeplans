import { withPage, today, type ProviderData } from "./base.ts";
import Anthropic from "@anthropic-ai/sdk";

const SOURCE_URLS = [
  "https://kimi-k2.com/pricing",
  "https://platform.moonshot.ai/docs/pricing/chat",
];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  notes: "Supported via Moonshot API and OpenRouter.",
};

export async function scrape(): Promise<ProviderData> {
  const pageText = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(3000);
    return page.innerText("body");
  });

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Extract all Kimi / Moonshot subscription plans from this pricing page. Return a JSON array of plans with fields: name, price_usd_monthly, price_usd_annual, tokens_monthly, models_included (array), modalities (array of: text/code/image_input/audio/video), restrictions (array). Page text:\n\n${pageText.slice(0, 8000)}`,
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
    credits_monthly: null,
    third_party_clients: THIRD_PARTY,
    policy_notes: "",
    intro_pricing: false,
    intro_notes: "",
  }));

  return {
    provider: "Kimi (Moonshot)",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans,
  };
}

import { withPage, today, type ProviderData } from "./base.ts";
import Anthropic from "@anthropic-ai/sdk";

const SOURCE_URLS = ["https://chatgpt.com/pricing"];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  notes: "API-compatible. Third-party clients work via OpenAI API key.",
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
      content: `Extract all ChatGPT/OpenAI consumer subscription plans from this pricing page text. Return a JSON array of plans with fields: name, price_usd_monthly, price_usd_annual, models_included (array), modalities (array of: text/code/image_input/image_gen/audio/video/file_upload), restrictions (array of strings). Page text:\n\n${pageText.slice(0, 8000)}`,
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
    credits_monthly: null,
    third_party_clients: THIRD_PARTY,
    policy_notes: "",
    intro_pricing: false,
    intro_notes: "",
  }));

  return {
    provider: "OpenAI",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans,
  };
}

import { withPage, today, type ProviderData } from "./base.ts";
import Anthropic from "@anthropic-ai/sdk";

const SOURCE_URLS = [
  "https://z.ai/subscribe",
  "https://docs.z.ai/guides/overview/pricing",
];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  notes: "Explicitly supported via OpenAI-compatible API endpoint.",
};

export async function scrape(): Promise<ProviderData> {
  const pageText = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(4000);
    return page.innerText("body");
  });

  const docsText = await withPage(SOURCE_URLS[1], async (page) => {
    await page.waitForTimeout(2000);
    return page.innerText("body");
  });

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{
      role: "user",
      content: `Extract all z.ai / GLM coding subscription plans from this text. Return a JSON array of plans with fields: name, price_usd_monthly (regular price), requests_per_window, window_hours, models_included (array), modalities (array), restrictions (array), intro_pricing (bool), intro_notes (string with intro price if different). Text:\n\n${(pageText + "\n\n" + docsText).slice(0, 8000)}`,
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
    price_usd_annual: null,
    tokens_monthly: null,
    credits_monthly: null,
    third_party_clients: THIRD_PARTY,
    policy_notes: "",
  }));

  return {
    provider: "z.ai (GLM)",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans,
  };
}

import { withPage, today, type ProviderData } from "./base.ts";
import Anthropic from "@anthropic-ai/sdk";

const SOURCE_URLS = [
  "https://claude.com/pricing",
  "https://techcrunch.com/2026/04/04/anthropic-says-claude-code-subscribers-will-need-to-pay-extra-for-openclaw-support/",
];

const THIRD_PARTY = {
  supported: false,
  openclaw: false,
  cline: false,
  kilo: false,
  roo: false,
  notes: "Blocked as of April 4 2026. Subscription OAuth tokens no longer work in third-party clients. API access required separately.",
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
      content: `Extract all Claude consumer subscription plans from this pricing page text. Return a JSON array of plans with fields: name, price_usd_monthly, price_usd_annual, models_included (array), modalities (array of: text/code/image_input/image_gen/audio/video/file_upload), restrictions (array of strings). Page text:\n\n${pageText.slice(0, 8000)}`,
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

  // Ensure third_party_clients and policy_notes are set on every plan
  plans = plans.map((p) => ({
    ...p,
    requests_per_window: null,
    window_hours: null,
    tokens_monthly: null,
    credits_monthly: null,
    third_party_clients: THIRD_PARTY,
    policy_notes: "Third-party client access (OpenClaw, Cline, Kilo, Roo etc.) blocked as of April 4 2026. Users must pay API rates separately.",
    intro_pricing: false,
    intro_notes: "",
  }));

  return {
    provider: "Anthropic",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans,
  };
}

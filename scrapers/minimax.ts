import { withPage, today, type ProviderData } from "./base.ts";
import Anthropic from "@anthropic-ai/sdk";

const SOURCE_URLS = [
  "https://platform.minimax.io/docs/guides/pricing-token-plan",
  "https://platform.minimax.io/subscribe/token-plan",
];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  notes: "Officially supported in OpenClaw, Cline, Kilo, Roo, Claude Code, Cursor, Zed.",
};

export async function scrape(): Promise<ProviderData> {
  // Docs page is accessible without JS rendering
  const docsText = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(2000);
    return page.innerText("body");
  });

  const client = new Anthropic();
  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{
      role: "user",
      content: `Extract all MiniMax token subscription plans from this docs page. Include both standard and highspeed variants. Return a JSON array with fields: name, price_usd_monthly, price_usd_annual, requests_per_window, window_hours, modalities (array of: text/code/image_gen/audio/video/music), restrictions (array). Page text:\n\n${docsText.slice(0, 8000)}`,
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
    tokens_monthly: null,
    credits_monthly: null,
    models_included: ["MiniMax M2.7", "MiniMax M2.7-Highspeed"],
    third_party_clients: THIRD_PARTY,
    policy_notes: "",
    intro_pricing: false,
    intro_notes: "",
  }));

  return {
    provider: "MiniMax",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans,
  };
}

import { withPage, today, type ProviderData, tokensToMonthly } from "./base.ts";

const SOURCE_URLS = ["https://kimi-k2.com/pricing"];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  pi: true,
  notes: "Via Moonshot API and OpenRouter.",
};

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(3000);
    return page.innerText("body");
  });

  function planPrice(hint: string, fallback: number): number {
    const idx = text.toLowerCase().indexOf(hint.toLowerCase());
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 200);
    const m = slice.match(/\$(\d+)/);
    return m ? parseInt(m[1], 10) : fallback;
  }

  function planTokens(hint: string, fallback: number): number {
    const idx = text.toLowerCase().indexOf(hint.toLowerCase());
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 300);
    const m = slice.match(/(\d+)M\s*tokens/i);
    if (m) return parseInt(m[1], 10) * 1_000_000;
    const m2 = slice.match(/([\d,]+)\s*tokens/i);
    return m2 ? parseInt(m2[1].replace(/,/g, ""), 10) : fallback;
  }

  function annualPrice(hint: string, fallback: number | null): number | null {
    const idx = text.toLowerCase().indexOf(hint.toLowerCase());
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 400);
    const prices = [...slice.matchAll(/\$(\d+)/g)].map(m => parseInt(m[1], 10));
    return prices.length >= 2 ? prices[1] : fallback;
  }

  const starterTokens = planTokens("starter", 10_000_000);
  const ultraTokens   = planTokens("ultra",   70_000_000);

  return {
    provider: "Kimi (Moonshot)",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "Starter",
        category: "model_provider",
        price_usd_monthly: planPrice("starter", 9),
        price_usd_annual: annualPrice("starter", 80),
        interactions_monthly: tokensToMonthly(starterTokens),
        interactions_note: `${(starterTokens / 1_000_000).toFixed(0)}M tokens/mo ÷ 4k per interaction`,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: starterTokens,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["kimi-k2"],
        models_included: ["Kimi K2"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Overage at $0.70/1M tokens"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Ultra",
        category: "model_provider",
        price_usd_monthly: planPrice("ultra", 49),
        price_usd_annual: annualPrice("ultra", 399),
        interactions_monthly: tokensToMonthly(ultraTokens),
        interactions_note: `${(ultraTokens / 1_000_000).toFixed(0)}M tokens/mo ÷ 4k per interaction`,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: ultraTokens,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["kimi-k2"],
        models_included: ["Kimi K2"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Overage at $0.50/1M tokens"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
    ],
  };
}

import { withPage, today, type ProviderData } from "./base.ts";

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
  notes: "OpenAI-compatible API. Works with all major coding clients.",
};

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(4000);
    return page.innerText("body");
  });

  // z.ai shows intro price first, then regular
  // Pattern: "Lite ... $3 ... $6" or similar
  function extractPlanPrice(planName: string, fallback: number): number {
    const idx = text.toLowerCase().indexOf(planName.toLowerCase());
    if (idx === -1) return fallback;
    // Get prices after the plan name — take the last (regular) price
    const slice = text.slice(idx, idx + 300);
    const prices = [...slice.matchAll(/\$(\d+)/g)].map(m => parseInt(m[1], 10));
    // Intro price is lower, regular is higher — return the higher one
    return prices.length >= 2 ? Math.max(...prices) : (prices[0] ?? fallback);
  }

  function extractIntroPrice(planName: string, fallback: number): number {
    const idx = text.toLowerCase().indexOf(planName.toLowerCase());
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 300);
    const prices = [...slice.matchAll(/\$(\d+)/g)].map(m => parseInt(m[1], 10));
    return prices.length >= 2 ? Math.min(...prices) : (prices[0] ?? fallback);
  }

  function extractRequests(planName: string, fallback: number): number {
    const idx = text.toLowerCase().indexOf(planName.toLowerCase());
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 300);
    const m = slice.match(/(\d+)\s*(?:prompts|requests)/i);
    return m ? parseInt(m[1], 10) : fallback;
  }

  const liteIntro = extractIntroPrice("lite", 3);
  const liteRegular = extractPlanPrice("lite", 6);
  const proIntro = extractIntroPrice("pro", 15);
  const proRegular = extractPlanPrice("pro", 30);

  return {
    provider: "z.ai (GLM)",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "Lite",
        price_usd_monthly: liteRegular,
        price_usd_annual: null,
        requests_per_window: extractRequests("lite", 120),
        window_hours: 5,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["GLM-5", "GLM-4.7-Flash", "GLM-4.5-Flash"],
        modalities: ["text", "code"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "",
        intro_pricing: liteIntro < liteRegular,
        intro_notes: liteIntro < liteRegular ? `$${liteIntro}/mo first cycle, then $${liteRegular}/mo` : "",
      },
      {
        name: "Pro",
        price_usd_monthly: proRegular,
        price_usd_annual: null,
        requests_per_window: extractRequests("pro", 600),
        window_hours: 5,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["GLM-5", "GLM-5.1", "GLM-4.7-Flash", "GLM-4.5-Flash"],
        modalities: ["text", "code"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "",
        intro_pricing: proIntro < proRegular,
        intro_notes: proIntro < proRegular ? `$${proIntro}/mo first cycle, then $${proRegular}/mo` : "",
      },
    ],
  };
}

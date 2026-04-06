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

// Known values — scraper overrides if found
const KNOWN = {
  Lite:  { intro: 3,  regular: 6,  requests: 120 },
  Pro:   { intro: 15, regular: 30, requests: 600 },
};

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(4000);
    return page.innerText("body");
  });

  // z.ai shows both intro and regular price — intro is struck-through or shown as "was $X"
  // Pattern: look for the plan section and grab the FIRST (intro) and LAST (regular) prices
  function planPrices(name: string, fallback: { intro: number; regular: number }) {
    const idx = text.search(new RegExp("\\b" + name + "\\b", "i"));
    if (idx === -1) return fallback;
    // Grab a generous window around the plan name
    const slice = text.slice(idx, idx + 500);
    const prices = [...slice.matchAll(/\$(\d+)/g)]
      .map(m => parseInt(m[1], 10))
      .filter(p => p < 200); // ignore clearly wrong values
    if (prices.length === 0) return fallback;
    if (prices.length === 1) return { intro: prices[0], regular: prices[0] };
    // Intro is lower, regular is higher
    return {
      intro: Math.min(...prices),
      regular: Math.max(...prices),
    };
  }

  function requests(name: string, fallback: number): number {
    const idx = text.search(new RegExp("\\b" + name + "\\b", "i"));
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 400);
    const m = slice.match(/(\d+)\s*(?:prompts|requests)/i);
    return m ? parseInt(m[1], 10) : fallback;
  }

  const lite = planPrices("Lite", KNOWN.Lite);
  const pro  = planPrices("Pro",  KNOWN.Pro);

  return {
    provider: "z.ai (GLM)",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "Lite",
        price_usd_monthly: lite.regular,
        price_usd_annual: null,
        requests_per_window: requests("Lite", KNOWN.Lite.requests),
        window_hours: 5,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["GLM-5", "GLM-4.7-Flash", "GLM-4.5-Flash"],
        modalities: ["text", "code"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "",
        intro_pricing: lite.intro < lite.regular,
        intro_notes: lite.intro < lite.regular
          ? `$${lite.intro}/mo first cycle, then $${lite.regular}/mo` : "",
      },
      {
        name: "Pro",
        price_usd_monthly: pro.regular,
        price_usd_annual: null,
        requests_per_window: requests("Pro", KNOWN.Pro.requests),
        window_hours: 5,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["GLM-5", "GLM-5.1", "GLM-4.7-Flash", "GLM-4.5-Flash"],
        modalities: ["text", "code"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "",
        intro_pricing: pro.intro < pro.regular,
        intro_notes: pro.intro < pro.regular
          ? `$${pro.intro}/mo first cycle, then $${pro.regular}/mo` : "",
      },
    ],
  };
}

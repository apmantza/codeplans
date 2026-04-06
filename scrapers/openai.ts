import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = ["https://chatgpt.com/pricing"];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  notes: "Via OpenAI API key. All major clients supported.",
};

export async function scrape(): Promise<ProviderData> {
  // chatgpt.com/pricing never reaches networkidle — use domcontentloaded + fixed wait
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(5000);
    return page.innerText("body");
  }, "domcontentloaded");

  // Prices appear as "$20/month" or "$20" near plan names
  // Extract all "$N" occurrences in order — pricing pages list them sequentially
  const allPrices = [...text.matchAll(/\$(\d+)(?:\/mo|\s*per\s*month)?/gi)]
    .map(m => parseInt(m[1], 10));

  // Known fallbacks — update if scrape finds them
  const knownPrices: Record<string, number> = { Free: 0, Go: 8, Plus: 20, Pro: 200 };

  function price(name: string, fallback: number): number {
    const idx = text.search(new RegExp(name, "i"));
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 300);
    const m = slice.match(/\$(\d+)/);
    return m ? parseInt(m[1], 10) : fallback;
  }

  return {
    provider: "OpenAI",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "Free",
        price_usd_monthly: 0,
        price_usd_annual: null,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["gpt-4o-mini"],
        modalities: ["text", "code"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Limited usage"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Go",
        price_usd_monthly: price("\\bGo\\b", 8),
        price_usd_annual: null,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["gpt-4o"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Plus",
        price_usd_monthly: price("\\bPlus\\b", 20),
        price_usd_annual: null,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["gpt-4o", "o3"],
        modalities: ["text", "code", "image_input", "image_gen", "audio", "video"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Pro",
        price_usd_monthly: price("\\bPro\\b", 200),
        price_usd_annual: null,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["gpt-4o", "o3", "o3-pro"],
        modalities: ["text", "code", "image_input", "image_gen", "audio", "video"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "Unlimited access to all models.",
        intro_pricing: false,
        intro_notes: "",
      },
    ],
  };
}

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
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(3000);
    return page.innerText("body");
  });

  function price(hint: string, fallback: number): number {
    const idx = text.toLowerCase().indexOf(hint.toLowerCase());
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 200);
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
        price_usd_monthly: price("go", 8),
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
        price_usd_monthly: price("plus", 20),
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
        price_usd_monthly: price("pro", 200),
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

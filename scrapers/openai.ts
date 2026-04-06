import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = ["https://chatgpt.com/pricing"];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  pi: true,
  notes: "Via OpenAI API key. All major clients supported.",
};

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(5000);
    return page.innerText("body");
  }, "domcontentloaded");

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
        category: "model_provider",
        price_usd_monthly: 0,
        price_usd_annual: null,
        interactions_monthly: null,
        interactions_note: "Limited, unspecified",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["gpt-4o-mini"],
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
        category: "model_provider",
        price_usd_monthly: price("\\bGo\\b", knownPrices.Go),
        price_usd_annual: null,
        interactions_monthly: null,
        interactions_note: "Soft limit",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["gpt-4o-chatgpt"],
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
        category: "model_provider",
        price_usd_monthly: price("\\bPlus\\b", knownPrices.Plus),
        price_usd_annual: null,
        interactions_monthly: null,
        interactions_note: "Soft limit",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["gpt-4o-chatgpt", "gpt-5-chatgpt"],
        models_included: ["gpt-4o", "gpt-5"],
        modalities: ["text", "code", "image_input", "image_gen", "audio", "video"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Pro",
        category: "model_provider",
        price_usd_monthly: price("\\bPro\\b", knownPrices.Pro),
        price_usd_annual: null,
        interactions_monthly: null,
        interactions_note: "Unlimited access to all models",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["gpt-4o-chatgpt", "gpt-5-chatgpt", "gpt-5-codex-high"],
        models_included: ["gpt-4o", "gpt-5", "gpt-5-codex"],
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

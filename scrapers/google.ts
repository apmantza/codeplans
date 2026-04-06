import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = [
  "https://one.google.com/about/ai-premium",
  "https://aistudio.google.com/",
];

const THIRD_PARTY = {
  supported: true,
  openclaw: true,
  cline: true,
  kilo: true,
  roo: true,
  pi: true,
  notes: "Via Gemini API key (Google AI Studio). All major clients supported.",
};

const KNOWN: Record<string, number> = {
  "AI Studio Free": 0,
  "AI Premium": 20,
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
    if (m) {
      const v = parseInt(m[1], 10);
      if (v >= 0 && v <= 500) return v;
    }
    return fallback;
  }

  return {
    provider: "Google",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "AI Studio Free",
        category: "model_provider",
        price_usd_monthly: 0,
        price_usd_annual: null,
        interactions_monthly: null,
        interactions_note: "Rate-limited free tier via AI Studio",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["gemini-2.5-flash-non-reasoning", "gemini-2.5-pro"],
        models_included: ["Gemini 2.5 Flash", "Gemini 2.5 Pro (rate limited)"],
        modalities: ["text", "code", "image_input", "audio", "video"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Rate limited", "AI Studio / API only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "AI Premium",
        category: "model_provider",
        price_usd_monthly: price("AI Premium", KNOWN["AI Premium"]),
        price_usd_annual: null,
        interactions_monthly: null,
        interactions_note: "Soft limit, no hard cap published",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["gemini-2.5-pro", "gemini-2.5-flash-non-reasoning"],
        models_included: ["Gemini 2.5 Pro", "Gemini 2.5 Flash"],
        modalities: ["text", "code", "image_input", "audio", "video", "file_upload"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Google One subscription (includes 2TB storage + other perks)"],
        policy_notes: "Google One AI Premium includes Gemini Advanced in Gmail, Docs, etc. API access via AI Studio separately.",
        intro_pricing: false,
        intro_notes: "",
      },
    ],
  };
}

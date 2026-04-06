import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = ["https://cursor.com/pricing"];

const THIRD_PARTY = {
  supported: false,
  openclaw: false,
  cline: false,
  kilo: false,
  roo: false,
  pi: false,
  notes: "Cursor is a standalone IDE. Model access is bundled — not exposed via API or third-party clients.",
};

const KNOWN: Record<string, number> = {
  Hobby: 0,
  Pro: 20,
  Business: 40,
};

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(4000);
    return page.innerText("body");
  });

  function price(name: string, fallback: number): number {
    const idx = text.search(new RegExp("\\b" + name + "\\b", "i"));
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 300);
    const m = slice.match(/\$(\d+)/);
    if (m) {
      const v = parseInt(m[1], 10);
      if (v >= 0 && v <= 200) return v;
    }
    return fallback;
  }

  function fastRequests(name: string, fallback: number): number {
    const idx = text.search(new RegExp("\\b" + name + "\\b", "i"));
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 500);
    const m = slice.match(/(\d+)\s*(?:fast|premium)\s*(?:requests|uses)/i);
    return m ? parseInt(m[1], 10) : fallback;
  }

  return {
    provider: "Cursor",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "Hobby",
        category: "coding_platform",
        price_usd_monthly: 0,
        price_usd_annual: null,
        interactions_monthly: 50,
        interactions_note: "50 slow requests/mo (free tier)",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["claude-sonnet-4.6-non-reasoning-low-effort", "gpt-4o-chatgpt", "gemini-2.5-flash-non-reasoning"],
        models_included: ["Claude Sonnet", "GPT-4o", "Gemini 2.5 Flash"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["50 slow requests/mo", "Cursor IDE only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Pro",
        category: "coding_platform",
        price_usd_monthly: price("Pro", KNOWN.Pro),
        price_usd_annual: null,
        interactions_monthly: fastRequests("Pro", 500),
        interactions_note: "500 fast requests/mo + unlimited slow",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["claude-sonnet-4.6-non-reasoning-low-effort", "claude-opus-4.6-non-reasoning-high-effort", "gpt-4o-chatgpt", "gemini-2.5-pro"],
        models_included: ["Claude Sonnet", "Claude Opus", "GPT-4o", "Gemini 2.5 Pro"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["500 fast requests/mo then slow", "Cursor IDE only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Business",
        category: "coding_platform",
        price_usd_monthly: price("Business", KNOWN.Business),
        price_usd_annual: null,
        interactions_monthly: fastRequests("Business", 500),
        interactions_note: "500 fast requests/mo + unlimited slow, per user",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["claude-sonnet-4.6-non-reasoning-low-effort", "claude-opus-4.6-non-reasoning-high-effort", "gpt-4o-chatgpt", "gemini-2.5-pro"],
        models_included: ["Claude Sonnet", "Claude Opus", "GPT-4o", "Gemini 2.5 Pro"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Per-user pricing", "Team management", "Cursor IDE only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
    ],
  };
}

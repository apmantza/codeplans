import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = ["https://opencode.ai/pricing"];

const THIRD_PARTY = {
  supported: true,
  openclaw: false,
  cline: false,
  kilo: false,
  roo: false,
  pi: true,
  notes: "OpenCode is itself a terminal-based coding agent. Works with pi and other agent harnesses via its OpenAI-compatible endpoint.",
};

const KNOWN: Record<string, number> = {
  Free: 0,
  Zen: 20,
  Team: 40,
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

  function interactions(name: string, fallback: number): number {
    const idx = text.search(new RegExp("\\b" + name + "\\b", "i"));
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 400);
    const m = slice.match(/(\d+(?:,\d+)?)\s*(?:requests|interactions|messages|tasks)/i);
    return m ? parseInt(m[1].replace(/,/g, ""), 10) : fallback;
  }

  return {
    provider: "OpenCode",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "Free",
        category: "coding_platform",
        price_usd_monthly: 0,
        price_usd_annual: null,
        interactions_monthly: interactions("Free", 50),
        interactions_note: "Limited free tier",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["claude-sonnet-4.6-non-reasoning-low-effort", "gpt-4o-chatgpt"],
        models_included: ["Claude Sonnet", "GPT-4o (limited)"],
        modalities: ["text", "code"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Limited requests"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Zen",
        category: "coding_platform",
        price_usd_monthly: price("Zen", KNOWN.Zen),
        price_usd_annual: null,
        interactions_monthly: interactions("Zen", 500),
        interactions_note: "Unlimited agentic coding tasks (soft cap)",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: false,
        model_ids: ["claude-sonnet-4.6-non-reasoning-low-effort", "claude-opus-4.6-non-reasoning-high-effort", "gpt-4o-chatgpt", "gemini-2.5-pro"],
        models_included: ["Claude Sonnet", "Claude Opus", "GPT-4o", "Gemini 2.5 Pro"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: [],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
    ],
  };
}

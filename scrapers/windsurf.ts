import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = ["https://windsurf.com/pricing"];

const THIRD_PARTY = {
  supported: false,
  openclaw: false,
  cline: false,
  kilo: false,
  roo: false,
  pi: false,
  notes: "Windsurf is a standalone IDE. Model access is bundled — not exposed via third-party clients.",
};

const KNOWN: Record<string, number> = {
  Free: 0,
  Pro: 15,
  Teams: 30,
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

  function credits(name: string, fallback: number): number {
    const idx = text.search(new RegExp("\\b" + name + "\\b", "i"));
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 400);
    const m = slice.match(/(\d+)\s*(?:flow\s*)?(?:action\s*)?credits/i);
    return m ? parseInt(m[1], 10) : fallback;
  }

  // Windsurf uses "flow action credits" — 1 credit ≈ 1 fast AI interaction
  const proCredits  = credits("Pro", 500);
  const teamCredits = credits("Teams", 1000);

  return {
    provider: "Windsurf",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "Free",
        category: "coding_platform",
        price_usd_monthly: 0,
        price_usd_annual: null,
        interactions_monthly: credits("Free", 25),
        interactions_note: "~25 free flow action credits/mo",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["claude-sonnet-4.6-non-reasoning-low-effort", "gpt-4o-chatgpt"],
        models_included: ["Claude Sonnet", "GPT-4o (limited)"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Limited credits", "Windsurf IDE only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Pro",
        category: "coding_platform",
        price_usd_monthly: price("Pro", KNOWN.Pro),
        price_usd_annual: null,
        interactions_monthly: proCredits,
        interactions_note: `${proCredits} flow action credits/mo`,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["claude-sonnet-4.6-non-reasoning-low-effort", "claude-opus-4.6-non-reasoning-high-effort", "gpt-4o-chatgpt", "gemini-2.5-pro"],
        models_included: ["Claude Sonnet", "Claude Opus", "GPT-4o", "Gemini 2.5 Pro"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Windsurf IDE only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Teams",
        category: "coding_platform",
        price_usd_monthly: price("Teams", KNOWN.Teams),
        price_usd_annual: null,
        interactions_monthly: teamCredits,
        interactions_note: `${teamCredits} flow action credits/mo per user`,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["claude-sonnet-4.6-non-reasoning-low-effort", "claude-opus-4.6-non-reasoning-high-effort", "gpt-4o-chatgpt", "gemini-2.5-pro"],
        models_included: ["Claude Sonnet", "Claude Opus", "GPT-4o", "Gemini 2.5 Pro"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Per-user pricing", "Windsurf IDE only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
    ],
  };
}

import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = [
  "https://claude.com/pricing",
  "https://techcrunch.com/2026/04/04/anthropic-says-claude-code-subscribers-will-need-to-pay-extra-for-openclaw-support/",
];

const THIRD_PARTY = {
  supported: false,
  openclaw: false,
  cline: false,
  kilo: false,
  roo: false,
  notes: "Blocked as of April 4 2026. Subscription OAuth tokens no longer work in third-party clients. API access required separately.",
};

const POLICY = "Anthropic blocked subscription OAuth tokens in third-party clients (OpenClaw, Cline, Kilo, Roo etc.) on April 4 2026, citing unsustainable compute costs.";

// Known prices as fallbacks — scraped values override if found
const KNOWN: Record<string, number> = {
  Pro: 20,
  "Max 5x": 100,
  "Max 20x": 200,
  Team: 30,
};

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(4000);
    return page.innerText("body");
  });

  // Find price immediately after a plan heading — look for "$N\n" or "$N/month" pattern
  // Anthropic pricing page lists: plan name, then price, then features
  function price(planName: string, fallback: number): number {
    const re = new RegExp(planName.replace(/\s/g, "\\s*") + "[\\s\\S]{0,60}?\\$(\\d+)", "i");
    const m = text.match(re);
    if (m) {
      const v = parseInt(m[1], 10);
      // Sanity check — prices should be reasonable
      if (v >= 1 && v <= 500) return v;
    }
    return fallback;
  }

  return {
    provider: "Anthropic",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "Pro",
        price_usd_monthly: price("Pro", KNOWN.Pro),
        price_usd_annual: null,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["claude-sonnet-4-6"],
        modalities: ["text", "code", "image_input", "file_upload"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Claude.ai interface only"],
        policy_notes: POLICY,
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Max 5x",
        price_usd_monthly: price("Max", KNOWN["Max 5x"]),
        price_usd_annual: null,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["claude-sonnet-4-6", "claude-opus-4-6"],
        modalities: ["text", "code", "image_input", "file_upload"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Claude.ai interface only", "5x usage vs Pro"],
        policy_notes: POLICY,
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Max 20x",
        price_usd_monthly: KNOWN["Max 20x"],
        price_usd_annual: null,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["claude-sonnet-4-6", "claude-opus-4-6"],
        modalities: ["text", "code", "image_input", "file_upload"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Claude.ai interface only", "20x usage vs Pro"],
        policy_notes: POLICY,
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Team",
        price_usd_monthly: price("Team", KNOWN.Team),
        price_usd_annual: null,
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        models_included: ["claude-sonnet-4-6", "claude-opus-4-6"],
        modalities: ["text", "code", "image_input", "file_upload"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Claude.ai interface only", "Per-user pricing"],
        policy_notes: POLICY,
        intro_pricing: false,
        intro_notes: "",
      },
    ],
  };
}

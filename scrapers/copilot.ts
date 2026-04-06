import { withPage, today, type ProviderData } from "./base.ts";

const SOURCE_URLS = ["https://github.com/features/copilot"];

const THIRD_PARTY = {
  supported: true,
  openclaw: false,
  cline: false,
  kilo: false,
  roo: false,
  pi: false,
  notes: "Works in VS Code, JetBrains, Neovim, and other editors via official extensions. Not compatible with OpenClaw/Cline/pi-style clients.",
};

const KNOWN: Record<string, number> = {
  Free: 0,
  Pro: 10,
  "Pro+": 39,
  Business: 19,
  Enterprise: 39,
};

export async function scrape(): Promise<ProviderData> {
  const text = await withPage(SOURCE_URLS[0], async (page) => {
    await page.waitForTimeout(4000);
    return page.innerText("body");
  });

  function price(name: string, fallback: number): number {
    const idx = text.search(new RegExp("\\b" + name.replace(/\+/, "\\+") + "\\b", "i"));
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 300);
    const m = slice.match(/\$(\d+)/);
    if (m) {
      const v = parseInt(m[1], 10);
      if (v >= 0 && v <= 100) return v;
    }
    return fallback;
  }

  function premiumRequests(name: string, fallback: number): number {
    const idx = text.search(new RegExp("\\b" + name.replace(/\+/, "\\+") + "\\b", "i"));
    if (idx === -1) return fallback;
    const slice = text.slice(idx, idx + 500);
    const m = slice.match(/(\d+)\s*premium\s*(?:model\s*)?(?:requests|interactions)/i);
    return m ? parseInt(m[1], 10) : fallback;
  }

  return {
    provider: "GitHub Copilot",
    updated: today(),
    source_urls: SOURCE_URLS,
    plans: [
      {
        name: "Free",
        category: "coding_platform",
        price_usd_monthly: 0,
        price_usd_annual: null,
        interactions_monthly: premiumRequests("Free", 50),
        interactions_note: "50 premium model requests/mo + unlimited GPT-4o-mini chat",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["gpt-4o-chatgpt", "claude-sonnet-4.6-non-reasoning-low-effort"],
        models_included: ["GPT-4o", "Claude Sonnet (premium)"],
        modalities: ["text", "code"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["50 premium requests/mo", "Editor extensions only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Pro",
        category: "coding_platform",
        price_usd_monthly: price("Pro", KNOWN.Pro),
        price_usd_annual: null,
        interactions_monthly: premiumRequests("Pro", 300),
        interactions_note: "300 premium model requests/mo + unlimited standard",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["gpt-4o-chatgpt", "claude-sonnet-4.6-non-reasoning-low-effort", "gemini-2.5-pro"],
        models_included: ["GPT-4o", "Claude Sonnet", "Gemini 2.5 Pro"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["300 premium requests/mo", "Editor extensions only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Pro+",
        category: "coding_platform",
        price_usd_monthly: price("Pro+", KNOWN["Pro+"]),
        price_usd_annual: null,
        interactions_monthly: premiumRequests("Pro+", 1500),
        interactions_note: "1500 premium model requests/mo + unlimited standard",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["gpt-4o-chatgpt", "claude-opus-4.6-non-reasoning-high-effort", "claude-sonnet-4.6-non-reasoning-low-effort", "gemini-2.5-pro", "gpt-5-chatgpt"],
        models_included: ["GPT-4o", "Claude Opus", "Claude Sonnet", "Gemini 2.5 Pro", "GPT-5 (when available)"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["1500 premium requests/mo", "Editor extensions only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
      {
        name: "Business",
        category: "coding_platform",
        price_usd_monthly: price("Business", KNOWN.Business),
        price_usd_annual: null,
        interactions_monthly: premiumRequests("Business", 300),
        interactions_note: "300 premium model requests/mo per user",
        requests_per_window: null,
        window_hours: null,
        tokens_monthly: null,
        credits_monthly: null,
        completions_included: true,
        model_ids: ["gpt-4o-chatgpt", "claude-sonnet-4.6-non-reasoning-low-effort", "gemini-2.5-pro"],
        models_included: ["GPT-4o", "Claude Sonnet", "Gemini 2.5 Pro"],
        modalities: ["text", "code", "image_input"],
        third_party_clients: THIRD_PARTY,
        restrictions: ["Per-user pricing", "Editor extensions only"],
        policy_notes: "",
        intro_pricing: false,
        intro_notes: "",
      },
    ],
  };
}

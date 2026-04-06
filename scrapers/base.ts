import { chromium, type Page } from "playwright";

/** Extract a USD price like $20, $9.99, $200 from a string */
export function extractPrice(text: string, hint: string): number | null {
  const idx = text.toLowerCase().indexOf(hint.toLowerCase());
  if (idx === -1) return null;
  const slice = text.slice(Math.max(0, idx - 60), idx + 120);
  const match = slice.match(/\$(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/** Find all $N price values near a keyword */
export function extractPrices(text: string): number[] {
  return [...text.matchAll(/\$(\d+(?:\.\d+)?)/g)].map(m => parseFloat(m[1]));
}

/** Extract a number from text near a keyword */
export function extractNumber(text: string, hint: string): number | null {
  const idx = text.toLowerCase().indexOf(hint.toLowerCase());
  if (idx === -1) return null;
  const slice = text.slice(idx, idx + 80);
  const match = slice.match(/[\d,]+/);
  return match ? parseInt(match[0].replace(/,/g, ""), 10) : null;
}

export async function withPage<T>(
  url: string,
  fn: (page: Page) => Promise<T>,
  waitFor: "networkidle" | "domcontentloaded" = "networkidle"
): Promise<T> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
  });
  await page.goto(url, { waitUntil: waitFor, timeout: 30000 });
  try {
    return await fn(page);
  } finally {
    await browser.close();
  }
}

export function today(): string {
  return new Date().toISOString().split("T")[0];
}

export interface ThirdPartyClients {
  supported: boolean;
  openclaw: boolean | null;
  cline: boolean | null;
  kilo: boolean | null;
  roo: boolean | null;
  pi: boolean | null;
  notes: string;
}

export interface Plan {
  name: string;
  category: "model_provider" | "coding_platform";
  price_usd_monthly: number | null;
  price_usd_annual: number | null;
  // Normalized interaction count (one full agent turn ~4k tokens)
  interactions_monthly: number | null;
  interactions_note: string;
  // Legacy raw metrics (kept for reference)
  requests_per_window: number | null;
  window_hours: number | null;
  tokens_monthly: number | null;
  credits_monthly: number | null;
  // Completions (inline autocomplete) — separate from interactions
  completions_included: boolean;
  // AA benchmark model IDs for quality lookup
  model_ids: string[];
  models_included: string[];
  modalities: string[];
  third_party_clients: ThirdPartyClients;
  restrictions: string[];
  policy_notes: string;
  intro_pricing: boolean;
  intro_notes: string;
}

export interface ProviderData {
  provider: string;
  updated: string;
  source_urls: string[];
  plans: Plan[];
}

// Tokens per interaction assumption for normalization
export const TOKENS_PER_INTERACTION = 4000;

/** Convert windowed requests to monthly interactions */
export function windowToMonthly(requestsPerWindow: number, windowHours: number): number {
  const windowsPerMonth = (30 * 24) / windowHours;
  return Math.round(requestsPerWindow * windowsPerMonth);
}

/** Convert token budget to monthly interactions */
export function tokensToMonthly(tokens: number): number {
  return Math.round(tokens / TOKENS_PER_INTERACTION);
}

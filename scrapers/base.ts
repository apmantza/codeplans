import { chromium, type Page } from "playwright";

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
  notes: string;
}

export interface Plan {
  name: string;
  price_usd_monthly: number | null;
  price_usd_annual: number | null;
  requests_per_window: number | null;
  window_hours: number | null;
  tokens_monthly: number | null;
  credits_monthly: number | null;
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

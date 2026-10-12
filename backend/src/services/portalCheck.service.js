// Read-only public-page inspection. Never logs in, fills forms, or submits applications.
import { assertPublicUrl } from './sourceIngestion.service.js';
export async function inspectPublicPage(url) {
  const parsed = await assertPublicUrl(url);
  const { chromium } = await import('playwright');
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ javaScriptEnabled: true });
    // Revalidate navigations and subresources to reduce redirect-based SSRF risk.
    await page.route('**/*', async route => {
      try { await assertPublicUrl(route.request().url()); await route.continue(); }
      catch { await route.abort('blockedbyclient'); }
    });
    await page.goto(parsed.href, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const result = await page.evaluate(() => ({ title: document.title, url: location.href, description: document.querySelector('meta[name="description"]')?.content || '', text: document.body?.innerText?.slice(0, 5000) || '' }));
    return { ...result, readOnly: true, note: 'Read-only page inspection only; no login, form fill, or submission performed.' };
  } finally { await browser.close(); }
}

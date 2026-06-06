/**
 * take-screenshots.mjs
 *
 * Captures 3 screenshots per live project site:
 *   - home: top of page (hero/landing)
 *   - featured: mid-page scroll (~1400px down)
 *   - pricing: scroll to pricing/plans section (if found)
 *
 * Also captures a mobile viewport (390×844) of the home.
 * Also records a 10-second screen-scroll video for each site.
 *
 * Outputs:
 *   public/images/projects/{slug}-home.jpg
 *   public/images/projects/{slug}-featured.jpg
 *   public/images/projects/{slug}-pricing.jpg   (if pricing found)
 *   public/images/projects/{slug}-mobile.jpg
 *   public/videos/projects/{slug}-screen.webm
 *
 * Run: node scripts/take-screenshots.mjs
 */
import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const IMG_DIR = 'C:/WorkSpaces/Swain-Pro/public/images/projects';
const VID_DIR = 'C:/WorkSpaces/Swain-Pro/public/videos/projects';
fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(VID_DIR, { recursive: true });

const SITES = [
  { slug: 'voicetowebsite',  url: 'https://voicetowebsite.com' },
  { slug: 'myappai',         url: 'https://myappai.net' },
  { slug: 'playstorewizard', url: 'https://playstorewizard.pro' },
  { slug: 'getnexa',         url: 'https://getnexa.space' },
  { slug: '3000studios',     url: 'https://3000studios.vip' },
  { slug: 'calistique',      url: 'https://calistique.xyz' },
  { slug: 'campdreamga',     url: 'https://campdreamga.com' },
  { slug: 'campdream-store', url: 'https://campdream.store' },
  { slug: 'findmerates',     url: 'https://findmerates.com' },
  { slug: 'referrals-live',  url: 'https://referrals.live' },
  { slug: 'swain-pro',       url: 'https://swain.pro' },
  { slug: 'thecajunmenu',    url: 'https://thecajunmenu.site' },
  { slug: 'theunitedstates', url: 'https://theunitedstates.site' },
];

const DESKTOP_VP = { width: 1280, height: 800 };
const MOBILE_VP  = { width: 390,  height: 844 };

const PRICING_SELECTORS = [
  '#pricing', '[id*="pricing"]', '[id*="plans"]',
  '[class*="pricing"]', '[class*="price"]',
  'section:has-text("Pricing")', 'section:has-text("Plans")',
  'section:has-text("Choose Your Plan")',
];

async function shotJpg(page, dest, quality = 88) {
  await page.screenshot({ path: dest, type: 'jpeg', quality, fullPage: false });
  const kb = (fs.statSync(dest).size / 1024).toFixed(0);
  console.log(`    ✓ ${path.basename(dest)}  (${kb}KB)`);
}

async function tryFindPricing(page) {
  for (const sel of PRICING_SELECTORS) {
    try {
      const el = page.locator(sel).first();
      const visible = await el.isVisible({ timeout: 1500 });
      if (visible) return el;
    } catch {}
  }
  return null;
}

const browser = await chromium.launch({ headless: true });

console.log('╔════════════════════════════════════════════════════╗');
console.log('║  Project Screenshots + Screen Recordings           ║');
console.log(`║  Sites: ${SITES.length}  |  Outputs: ${IMG_DIR.replace('C:/WorkSpaces/Swain-Pro/public/', 'public/')}║`);
console.log('╚════════════════════════════════════════════════════╝\n');

for (const site of SITES) {
  console.log(`\n▸ ${site.slug}  →  ${site.url}`);

  // ── Desktop screenshots ──────────────────────────────
  const desktopCtx = await browser.newContext({
    viewport: DESKTOP_VP,
    deviceScaleFactor: 1.5,
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/121.0 Safari/537.36',
    recordVideo: {
      dir: VID_DIR,
      size: { width: 1280, height: 720 },
    },
  });
  const page = await desktopCtx.newPage();
  page.on('dialog', d => d.dismiss().catch(() => {}));

  try {
    await page.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);

    // Dismiss overlays
    try { await page.keyboard.press('Escape'); await page.waitForTimeout(300); } catch {}

    // 1. HOME screenshot
    await page.evaluate(() => window.scrollTo({ top: 0 }));
    await page.waitForTimeout(500);
    await shotJpg(page, path.join(IMG_DIR, `${site.slug}-home.jpg`));

    // For video: auto-scroll down and back up
    await page.evaluate(async () => {
      const totalH = document.documentElement.scrollHeight;
      const steps = 12;
      for (let i = 0; i <= steps; i++) {
        window.scrollTo({ top: (totalH / steps) * i, behavior: 'smooth' });
        await new Promise(r => setTimeout(r, 700));
      }
      await new Promise(r => setTimeout(r, 800));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      await new Promise(r => setTimeout(r, 500));
    });

    // 2. FEATURED screenshot (mid-page)
    await page.evaluate(() => window.scrollTo({ top: 0 }));
    const pageH = await page.evaluate(() => document.documentElement.scrollHeight);
    const featuredY = Math.min(Math.floor(pageH * 0.35), 1600);
    await page.evaluate(y => window.scrollTo({ top: y }), featuredY);
    await page.waitForTimeout(600);
    await shotJpg(page, path.join(IMG_DIR, `${site.slug}-featured.jpg`));

    // 3. PRICING screenshot (if found)
    const pricingEl = await tryFindPricing(page);
    if (pricingEl) {
      await pricingEl.scrollIntoViewIfNeeded();
      await page.waitForTimeout(600);
      await shotJpg(page, path.join(IMG_DIR, `${site.slug}-pricing.jpg`));
    } else {
      // Fallback: lower third of page
      const lowerY = Math.min(Math.floor(pageH * 0.65), 3200);
      await page.evaluate(y => window.scrollTo({ top: y }), lowerY);
      await page.waitForTimeout(600);
      await shotJpg(page, path.join(IMG_DIR, `${site.slug}-pricing.jpg`));
    }

  } catch (e) {
    console.log(`    ✗ Desktop: ${e.message.split('\n')[0]}`);
    // Placeholder screenshots
    for (const suffix of ['-home', '-featured', '-pricing']) {
      const dest = path.join(IMG_DIR, `${site.slug}${suffix}.jpg`);
      if (!fs.existsSync(dest)) {
        const exist = path.join(IMG_DIR, `${site.slug}.jpg`);
        if (fs.existsSync(exist)) fs.copyFileSync(exist, dest);
      }
    }
  }

  // Save video — grab reference before close, path available after context close
  const videoHandle = page.video();
  await page.close();
  await desktopCtx.close();
  const videoPath = videoHandle ? await videoHandle.path().catch(() => null) : null;

  // Rename the auto-named webm to our slug name
  if (videoPath && fs.existsSync(videoPath)) {
    const destVid = path.join(VID_DIR, `${site.slug}-screen.webm`);
    try { fs.renameSync(videoPath, destVid); console.log(`    ✓ ${site.slug}-screen.webm`); }
    catch { try { fs.copyFileSync(videoPath, destVid); fs.unlinkSync(videoPath); } catch {} }
  }

  // ── Mobile screenshot ────────────────────────────────
  const mobileCtx = await browser.newContext({
    viewport: MOBILE_VP,
    deviceScaleFactor: 2,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1',
    isMobile: true,
  });
  const mobilePage = await mobileCtx.newPage();
  mobilePage.on('dialog', d => d.dismiss().catch(() => {}));
  try {
    await mobilePage.goto(site.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
    await mobilePage.waitForTimeout(1800);
    try { await mobilePage.keyboard.press('Escape'); await mobilePage.waitForTimeout(300); } catch {}
    await mobilePage.evaluate(() => window.scrollTo({ top: 0 }));
    await mobilePage.waitForTimeout(400);
    await shotJpg(mobilePage, path.join(IMG_DIR, `${site.slug}-mobile.jpg`), 85);
  } catch (e) {
    console.log(`    ✗ Mobile: ${e.message.split('\n')[0]}`);
  }
  await mobilePage.close();
  await mobileCtx.close();
}

await browser.close();

console.log('\n\n╔══════════════════════════════════════════╗');
console.log('║  SCREENSHOTS COMPLETE                    ║');
const imgCount = fs.readdirSync(IMG_DIR).filter(f => f.endsWith('.jpg')).length;
const vidCount = fs.readdirSync(VID_DIR).filter(f => f.endsWith('.webm')).length;
console.log(`║  Images: ${String(imgCount).padStart(3)}  |  Videos: ${String(vidCount).padStart(3)}            ║`);
console.log('╚══════════════════════════════════════════╝');

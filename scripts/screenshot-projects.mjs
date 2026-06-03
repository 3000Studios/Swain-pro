import { chromium } from 'playwright'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, '../public/images/projects')
mkdirSync(outDir, { recursive: true })

const sites = [
  { slug: 'voicetowebsite', url: 'https://voicetowebsite.com' },
  { slug: 'myappai',        url: 'https://myappai.net' },
  { slug: 'playstorewizard', url: 'https://playstorewizard.pro' },
  { slug: 'getnexa',        url: 'https://getnexa.space' },
]

const browser = await chromium.launch()

for (const site of sites) {
  console.log(`Screenshotting ${site.url} ...`)
  const page = await browser.newPage()
  await page.setViewportSize({ width: 1280, height: 800 })
  try {
    await page.goto(site.url, { waitUntil: 'networkidle', timeout: 20000 })
    await page.waitForTimeout(1500)
  } catch {
    console.warn(`  → Timed out or error on ${site.url}, capturing anyway`)
  }
  const path = join(outDir, `${site.slug}.jpg`)
  await page.screenshot({ path, type: 'jpeg', quality: 80, fullPage: false })
  console.log(`  → Saved ${path}`)
  await page.close()
}

await browser.close()
console.log('All screenshots done.')

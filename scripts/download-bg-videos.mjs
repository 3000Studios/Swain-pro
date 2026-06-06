/**
 * Task 3: Download 50 corporate background videos from Pixabay
 * All Pixabay content is free for commercial use (no attribution required)
 * API: https://pixabay.com/api/videos/
 */
import https from 'https';
import fs from 'fs';
import path from 'path';

const API_KEY    = '48619054-246c38e73260ef5fcf7edd915';
const OUTPUT_DIR = 'C:/WorkSpaces/Swain-Pro/public/videos/bg';
const TARGET     = 50;
const MAX_SIZE   = 50 * 1024 * 1024; // 50MB

// Search queries (deduped across all)
const QUERIES = [
  'corporate background',
  'business technology abstract',
  'dark abstract background',
  'professional technology background',
  'abstract motion background',
];

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const contentLen = parseInt(res.headers['content-length'] || '0');
      if (contentLen > MAX_SIZE) {
        res.destroy();
        return reject(new Error(`Too large: ${(contentLen / 1024 / 1024).toFixed(0)}MB`));
      }
      const file = fs.createWriteStream(dest);
      let written = 0;
      res.on('data', chunk => {
        written += chunk.length;
        if (written > MAX_SIZE) {
          res.destroy(); file.close();
          try { fs.unlinkSync(dest); } catch {}
          reject(new Error('Exceeded 50MB during download'));
        }
      });
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(written)));
      file.on('error', err => { try { fs.unlinkSync(dest); } catch {} reject(err); });
    });
    req.setTimeout(120000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

async function searchPixabay(query, page = 1) {
  const q = encodeURIComponent(query);
  const url = `https://pixabay.com/api/videos/?key=${API_KEY}&q=${q}&per_page=50&page=${page}&video_type=film`;
  const r = await get(url);
  if (r.status !== 200) { console.log(`  API error ${r.status} for "${query}"`); return []; }
  const j = JSON.parse(r.body.toString());
  return j.hits || [];
}

console.log('=== TASK 3: Downloading 50 corporate background videos from Pixabay ===\n');

// Collect unique hits across all queries
const seenIds = new Set();
const allHits = [];

for (const q of QUERIES) {
  if (allHits.length >= TARGET * 2) break;
  console.log(`Searching: "${q}"...`);
  const hits = await searchPixabay(q);
  let added = 0;
  for (const h of hits) {
    if (!seenIds.has(h.id)) {
      seenIds.add(h.id);
      allHits.push(h);
      added++;
    }
  }
  console.log(`  +${added} unique hits (total pool: ${allHits.length})`);
}

console.log(`\nPool: ${allHits.length} unique videos. Downloading ${Math.min(TARGET, allHits.length)}...\n`);

let ok = 0, fail = 0;
const manifest = [];

for (let i = 0; i < allHits.length && ok < TARGET; i++) {
  const hit = allHits[i];
  const vids = hit.videos || {};

  // Pick best quality under 50MB: large → medium → small → tiny
  const candidate =
    vids.large  ||
    vids.medium ||
    vids.small  ||
    vids.tiny;

  if (!candidate || !candidate.url) {
    fail++;
    continue;
  }

  const num     = String(ok + 1).padStart(2, '0');
  const outName = `bg-corporate-${num}.mp4`;
  const dest    = path.join(OUTPUT_DIR, outName);

  const res_label = vids.large ? 'large' : vids.medium ? 'medium' : vids.small ? 'small' : 'tiny';
  const dims = `${candidate.width}x${candidate.height}`;

  process.stdout.write(`  [${num}] ${outName}  (${res_label} ${dims})  `);
  try {
    const bytes = await download(candidate.url, dest);
    console.log(`✓ ${(bytes / 1024 / 1024).toFixed(1)}MB`);
    manifest.push({
      filename:    outName,
      pixabay_id:  hit.id,
      tags:        hit.tags || '',
      resolution:  dims,
      quality:     res_label,
      duration:    hit.duration || 0,
      views:       hit.views || 0,
      downloads:   hit.downloads || 0,
      pixabay_url: hit.pageURL || '',
    });
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    fail++;
  }
}

// Write manifest
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log(`\n✅ BG videos downloaded: ${ok}/${TARGET}`);
console.log(`✗  Failed: ${fail}`);
console.log(`📄 Manifest written: ${OUTPUT_DIR}/manifest.json`);

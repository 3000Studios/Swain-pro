/**
 * Task 2: Download 50 corporate background music tracks from Incompetech (Kevin MacLeod)
 * All tracks are CC-BY 4.0 — free for commercial use with attribution
 * CDN: https://incompetech.com/music/royalty-free/mp3-royaltyfree/
 */
import https from 'https';
import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'C:/WorkSpaces/Swain-Pro/public/music';
const TARGET = 50;
const MAX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB per track
const CDN_BASE = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/';
const PIECES_URL = 'https://incompetech.com/music/royalty-free/pieces.json';

// Genre IDs → names (from Incompetech page)
const GENRE_MAP = {
  '2':'African','3':'Blues','4':'Classical','5':'Contemporary','6':'Disco',
  '7':'Electronica','8':'Funk','9':'Holiday','10':'Horror','11':'Jazz',
  '12':'Latin','13':'Modern','14':'Musical','15':'Polka','16':'Pop',
  '18':'Reggae','19':'Rock','20':'Silent Film Score','21':'Ska','22':'Soundtrack',
  '23':'Stings','24':'Unclassifiable','25':'World','26':'Urban'
};

// Feel tags that suit corporate/background music (priority order)
const GOOD_FEELS = [
  'Calm', 'Relaxed', 'Bright', 'Uplifting', 'Bouncy',
  'Grooving', 'Mystical'
];

// Genres to prefer for background music
const PREFERRED_GENRES = ['5','7','13','22','16','4','11'];

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
      if (contentLen > MAX_SIZE_BYTES) {
        res.destroy();
        return reject(new Error(`Too large: ${(contentLen / 1024 / 1024).toFixed(1)}MB`));
      }
      const file = fs.createWriteStream(dest);
      let downloaded = 0;
      res.on('data', chunk => {
        downloaded += chunk.length;
        if (downloaded > MAX_SIZE_BYTES) { res.destroy(); file.close(); fs.unlinkSync(dest); return reject(new Error('Exceeded size limit')); }
      });
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(downloaded)));
      file.on('error', err => { fs.unlinkSync(dest); reject(err); });
    });
    req.setTimeout(45000, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

// Score a track for corporate background suitability
function score(t) {
  const feels = (t.feel || '').split(',').map(f => f.trim());
  const feelScore = GOOD_FEELS.reduce((s, gf, i) => feels.includes(gf) ? s + (GOOD_FEELS.length - i) : s, 0);
  const genreScore = PREFERRED_GENRES.includes(String(t.genre)) ? 5 : 0;
  return feelScore + genreScore;
}

console.log('=== TASK 2: Downloading 50 corporate background music tracks ===\n');
console.log('Source: Incompetech / Kevin MacLeod (CC-BY 4.0)\n');

// 1. Fetch catalog
console.log('Fetching track catalog...');
const catalogRes = await get(PIECES_URL);
const allTracks = JSON.parse(catalogRes.body.toString());
console.log(`Total catalog size: ${allTracks.length} tracks`);

// 2. Filter & rank
const suitable = allTracks
  .filter(t => {
    const f = (t.feel || '').toLowerCase();
    return GOOD_FEELS.some(gf => f.includes(gf.toLowerCase()));
  })
  .map(t => ({ ...t, _score: score(t) }))
  .sort((a, b) => b._score - a._score)
  .slice(0, TARGET * 2); // grab 2x buffer for failures

console.log(`Suitable tracks found: ${suitable.length} (downloading top ${TARGET})\n`);

// Mood label map for filenames
const MOOD_LABELS = {
  'Calm':       'calm',
  'Relaxed':    'relaxed',
  'Bright':     'bright',
  'Uplifting':  'uplifting',
  'Bouncy':     'bouncy',
  'Grooving':   'groovy',
  'Mystical':   'mystic',
  'Epic':       'epic',
  'Action':     'action',
};
function primaryMood(feel) {
  const feels = (feel || '').split(',').map(f => f.trim());
  for (const gf of GOOD_FEELS) {
    if (feels.includes(gf)) return MOOD_LABELS[gf] || gf.toLowerCase();
  }
  return 'ambient';
}

// Category cycle for filename variety
const CATS = ['corporate','ambient','motivational','technology','upbeat','business'];

let ok = 0, fail = 0;
const manifest = [];

for (let i = 0; i < suitable.length && ok < TARGET; i++) {
  const t = suitable[i];
  const filename = t.filename.trim();
  if (!filename) continue;

  const num   = String(ok + 1).padStart(2, '0');
  const cat   = CATS[ok % CATS.length];
  const mood  = primaryMood(t.feel);
  const outName = `corporate-${num}-${cat}-${mood}.mp3`;
  const dest    = path.join(OUTPUT_DIR, outName);
  const url     = CDN_BASE + encodeURIComponent(filename);

  process.stdout.write(`  [${num}] ${outName.padEnd(48)} `);
  try {
    const bytes = await download(url, dest);
    console.log(`✓ ${(bytes / 1024).toFixed(0)}KB`);
    manifest.push({
      filename:    outName,
      title:       t.title.trim(),
      artist:      'Kevin MacLeod',
      duration:    t.length || '',
      bpm:         t.bpm || null,
      mood:        mood,
      genre:       GENRE_MAP[String(t.genre)] || t.genre,
      feel:        t.feel,
      license:     'CC-BY 4.0',
      source_url:  'https://incompetech.com/music/royalty-free/index.html?isrc=' + (t.isrc || ''),
    });
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    fail++;
    try { fs.unlinkSync(dest); } catch {}
  }
}

// Write manifest
fs.writeFileSync(
  path.join(OUTPUT_DIR, 'manifest.json'),
  JSON.stringify(manifest, null, 2)
);

console.log(`\n✅ Music downloaded: ${ok}/${TARGET}`);
console.log(`✗  Failed: ${fail}`);
console.log(`📄 Manifest written: ${OUTPUT_DIR}/manifest.json`);

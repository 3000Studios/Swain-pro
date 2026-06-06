/**
 * download-shared-media.mjs
 *
 * Downloads the most-downloaded top-10 music tracks (5 genres) and top-10
 * wallpaper/background videos (10 categories) from Pixabay.
 *
 * Output: C:\WorkSpaces\SharedMedia\
 *   music/
 *     jazz-background/          10 × jazz-background-01-<tags>.mp3
 *     classical-background/     10 × classical-background-01-<tags>.mp3
 *     lofi-background/          10 × lofi-background-01-<tags>.mp3
 *     ambient-background/       10 × ambient-background-01-<tags>.mp3
 *     gaming-background/        10 × gaming-background-01-<tags>.mp3
 *   videos/
 *     nature-wallpaper/         10 × nature-wallpaper-01-<tags>.mp4
 *     office-wallpaper/         10 × ...
 *     city-wallpaper/
 *     beach-wallpaper/
 *     city-night-sky/
 *     3d-abstract/
 *     3d-cool-visuals/
 *     holiday-wallpaper/
 *     aquarium-wallpaper/
 *     phone-people-wallpaper/
 *   manifest.json
 *
 * Run: node scripts/download-shared-media.mjs
 * Resume-safe: skips files that already exist on disk.
 */
import https from 'https';
import fs    from 'fs';
import path  from 'path';

// ── Config ─────────────────────────────────────────────────────────────────
const PIXABAY_KEY  = '48619054-246c38e73260ef5fcf7edd915';
const BASE         = 'C:/WorkSpaces/SharedMedia';
const PER_CAT      = 10;
const MAX_VIDEO    = 80  * 1024 * 1024;   // 80 MB per clip
const MAX_AUDIO    = 20  * 1024 * 1024;   // 20 MB per track
const TIMEOUT_MS   = 150_000;

// ── Music genres ────────────────────────────────────────────────────────────
const MUSIC_GENRES = [
  {
    id: 'jazz-background',
    label: 'Jazz Background',
    pixabayQ: 'jazz background',
    itGenres: ['11'],
    itFeels:  ['Grooving','Calm','Relaxed','Bouncy','Bright'],
  },
  {
    id: 'classical-background',
    label: 'Classical Background',
    pixabayQ: 'classical background music',
    itGenres: ['4'],
    itFeels:  ['Calm','Mystical','Bright','Epic'],
  },
  {
    id: 'lofi-background',
    label: 'Lo-Fi Background',
    pixabayQ: 'lofi chill background',
    itGenres: ['5','13','7'],
    itFeels:  ['Calm','Relaxed','Mystical','Grooving'],
  },
  {
    id: 'ambient-background',
    label: 'Ambient Background',
    pixabayQ: 'ambient background music',
    itGenres: ['7','22','5'],
    itFeels:  ['Calm','Relaxed','Mystical','Spooky'],
  },
  {
    id: 'gaming-background',
    label: 'Gaming Background',
    pixabayQ: 'gaming action music background',
    itGenres: ['22','19','10'],
    itFeels:  ['Action','Epic','Bouncy','Bright'],
  },
];

// ── Video categories ────────────────────────────────────────────────────────
const VIDEO_CATS = [
  {
    id: 'nature-wallpaper',
    label: 'Nature Wallpaper',
    queries: ['nature landscape background','forest waterfall river green'],
  },
  {
    id: 'office-wallpaper',
    label: 'Office Live Wallpaper',
    queries: ['office workspace interior','modern office building business'],
  },
  {
    id: 'city-wallpaper',
    label: 'City Live Wallpaper',
    queries: ['city timelapse urban buildings','city street downtown traffic'],
  },
  {
    id: 'beach-wallpaper',
    label: 'Beach Live Wallpaper',
    queries: ['beach ocean waves','sea sunset beach tropical'],
  },
  {
    id: 'city-night-sky',
    label: 'City Night Sky Wallpaper',
    queries: ['city night lights skyline','night city timelapse stars sky'],
  },
  {
    id: '3d-abstract',
    label: '3D Abstract Wallpaper',
    queries: ['3d abstract motion background','abstract geometric 3d render'],
  },
  {
    id: '3d-cool-visuals',
    label: '3D Cool Visuals',
    queries: ['3d visual effects particles neon','3d glow energy motion'],
  },
  {
    id: 'holiday-wallpaper',
    label: 'Holiday Wallpaper',
    queries: ['holiday christmas winter snow','christmas new year celebration lights'],
  },
  {
    id: 'aquarium-wallpaper',
    label: 'Aquarium Wallpaper',
    queries: ['aquarium fish underwater sea','coral reef fish ocean tropical'],
  },
  {
    id: 'phone-people-wallpaper',
    label: 'Phone People Wallpaper',
    queries: ['people smartphone mobile phone','person using phone technology app'],
  },
];

// ── HTTP helpers ────────────────────────────────────────────────────────────
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 SharedMedia/1.0' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks) }));
    }).on('error', reject);
  });
}

function download(url, dest, maxBytes) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest, maxBytes).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
      const len = parseInt(res.headers['content-length'] || '0');
      if (len > maxBytes) {
        res.destroy();
        return reject(new Error(`Too large: ${(len / 1024 / 1024).toFixed(0)}MB`));
      }
      const file = fs.createWriteStream(dest);
      let written = 0;
      res.on('data', chunk => {
        written += chunk.length;
        if (written > maxBytes) {
          res.destroy(); file.close();
          try { fs.unlinkSync(dest); } catch {}
          reject(new Error('Exceeded max size during stream'));
          return;
        }
      });
      res.pipe(file);
      file.on('finish', () => file.close(() => resolve(written)));
      file.on('error', err => { try { fs.unlinkSync(dest); } catch {} reject(err); });
    });
    req.setTimeout(TIMEOUT_MS, () => { req.destroy(); reject(new Error('Timeout')); });
    req.on('error', reject);
  });
}

function slugify(str) {
  return (str || '').split(',').slice(0, 3)
    .map(s => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''))
    .filter(Boolean).join('-') || 'media';
}

function pad(n) { return String(n).padStart(2, '0'); }

// ── Pixabay Video API ────────────────────────────────────────────────────────
async function searchVideos(query) {
  const q = encodeURIComponent(query);
  const url = `https://pixabay.com/api/videos/?key=${PIXABAY_KEY}&q=${q}&per_page=50&page=1&video_type=film&order=popular`;
  const r = await get(url);
  if (r.status !== 200) throw new Error(`Pixabay API returned ${r.status}`);
  const j = JSON.parse(r.body.toString());
  return (j.hits || []).sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
}

// ── Pixabay Audio API — DISABLED ─────────────────────────────────────────────
// Pixabay's image API returns previewURL (JPEG thumbnails) that look like audio
// hits but are just tiny images. No real music API endpoint is publicly accessible
// with the standard image/video key. Using Incompetech for all music.
const pixabayMusicWorks = false;

async function searchPixabayAudio(_query) {
  return null;
}

// ── Incompetech (Kevin MacLeod) fallback ─────────────────────────────────────
const CDN   = 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/';
let itCat   = null;

async function loadIncompetechCatalog() {
  if (itCat) return itCat;
  console.log('   → Fetching Incompetech catalog...');
  const r = await get('https://incompetech.com/music/royalty-free/pieces.json');
  itCat = JSON.parse(r.body.toString());
  console.log(`   → Catalog loaded: ${itCat.length} tracks`);
  return itCat;
}

async function downloadIncompetechGenre(dir, genreId, genreLabel, itGenres, itFeels) {
  const catalog = await loadIncompetechCatalog();

  const pool = catalog
    .filter(t => itGenres.includes(String(t.genre)))
    .map(t => {
      const tf    = (t.feel || '').split(',').map(f => f.trim());
      const score = itFeels.reduce((s, f, i) => tf.includes(f) ? s + (itFeels.length - i) * 2 : s, 0);
      return { ...t, _score: score };
    })
    .filter(t => t._score > 0)
    .sort((a, b) => b._score - a._score);

  const results = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < pool.length && ok < PER_CAT; i++) {
    const t = pool[i];
    if (!t.filename?.trim()) continue;

    const num      = pad(ok + 1);
    const titleSlg = t.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const fname    = `${genreId}-${num}-${titleSlg}.mp3`;
    const dest     = path.join(dir, fname);

    if (fs.existsSync(dest)) {
      process.stdout.write(`   [${num}] ${fname.slice(0, 55).padEnd(55)} ↩ skip\n`);
      results.push({ filename: fname, title: t.title, source: 'incompetech', artist: 'Kevin MacLeod', license: 'CC-BY 4.0', feel: t.feel });
      ok++;
      continue;
    }

    const url = CDN + encodeURIComponent(t.filename.trim());
    process.stdout.write(`   [${num}] ${fname.slice(0, 55).padEnd(55)} `);
    try {
      const bytes = await download(url, dest, MAX_AUDIO);
      console.log(`✓ ${(bytes / 1024).toFixed(0)}KB`);
      results.push({ filename: fname, title: t.title, source: 'incompetech', artist: 'Kevin MacLeod', license: 'CC-BY 4.0', feel: t.feel, bpm: t.bpm });
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      fail++;
    }
  }

  console.log(`   → ${ok}/${PER_CAT} downloaded, ${fail} failed  [Incompetech / Kevin MacLeod CC-BY 4.0]`);
  return results;
}

// ── MAIN ────────────────────────────────────────────────────────────────────
const manifest = { music: {}, videos: {} };

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║         SharedMedia Downloader  —  Pixabay + Incompetech        ║');
console.log('╠══════════════════════════════════════════════════════════════════╣');
console.log(`║  Output:  ${BASE.padEnd(56)}║`);
console.log(`║  Music:   ${String(MUSIC_GENRES.length).padEnd(2)} genres × ${PER_CAT} tracks = ${String(MUSIC_GENRES.length * PER_CAT).padEnd(3)} tracks             ║`);
console.log(`║  Videos:  ${String(VIDEO_CATS.length).padEnd(2)} categories × ${PER_CAT} clips  = ${String(VIDEO_CATS.length * PER_CAT).padEnd(3)} clips              ║`);
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

// ══ MUSIC ═══════════════════════════════════════════════════════════════════
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━  MUSIC  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const g of MUSIC_GENRES) {
  const dir = path.join(BASE, 'music', g.id);
  fs.mkdirSync(dir, { recursive: true });
  console.log(`🎵  ${g.label}`);

  // Pixabay music API returns image thumbnails, not audio — use Incompetech
  console.log('   Source: Incompetech / Kevin MacLeod (CC-BY 4.0)');
  manifest.music[g.id] = await downloadIncompetechGenre(dir, g.id, g.label, g.itGenres, g.itFeels);
  console.log();
}

// ══ VIDEOS ══════════════════════════════════════════════════════════════════
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━  VIDEOS  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

for (const cat of VIDEO_CATS) {
  const dir = path.join(BASE, 'videos', cat.id);
  fs.mkdirSync(dir, { recursive: true });
  console.log(`📹  ${cat.label}`);

  // Collect unique hits from all queries for this category
  const seenIds = new Set();
  const allHits = [];

  for (const query of cat.queries) {
    try {
      const hits = await searchVideos(query);
      let added = 0;
      for (const h of hits) {
        if (!seenIds.has(h.id)) {
          seenIds.add(h.id);
          allHits.push(h);
          added++;
        }
      }
      console.log(`   Query "${query}": +${added} hits`);
    } catch (e) {
      console.log(`   Query "${query}": ✗ ${e.message}`);
    }
  }

  // Sort the full pool by most downloads
  allHits.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
  console.log(`   Pool: ${allHits.length} unique videos → taking top ${PER_CAT} by downloads`);

  const results = [];
  let ok = 0, fail = 0;

  for (let i = 0; i < allHits.length && ok < PER_CAT; i++) {
    const hit  = allHits[i];
    const v    = hit.videos || {};
    const cand = v.large || v.medium || v.small || v.tiny;
    if (!cand?.url) { fail++; continue; }

    const num   = pad(ok + 1);
    const s     = slugify(hit.tags);
    const fname = `${cat.id}-${num}-${s}.mp4`;
    const dest  = path.join(dir, fname);

    if (fs.existsSync(dest)) {
      process.stdout.write(`   [${num}] ${fname.slice(0, 55).padEnd(55)} ↩ skip\n`);
      results.push({ filename: fname, source: 'pixabay', pixabay_id: hit.id });
      ok++; continue;
    }

    const ql = v.large ? 'large' : v.medium ? 'medium' : v.small ? 'small' : 'tiny';
    process.stdout.write(`   [${num}] ${fname.slice(0, 55).padEnd(55)} `);

    try {
      const bytes = await download(cand.url, dest, MAX_VIDEO);
      console.log(`✓ ${(bytes / 1024 / 1024).toFixed(1)}MB  (${cand.width}×${cand.height} ${ql})`);
      results.push({
        filename:    fname,
        category:    cat.id,
        pixabay_id:  hit.id,
        tags:        hit.tags,
        resolution:  `${cand.width}x${cand.height}`,
        quality:     ql,
        duration:    hit.duration,
        downloads:   hit.downloads,
        views:       hit.views,
        pixabay_url: hit.pageURL,
        source:      'pixabay',
      });
      ok++;
    } catch (e) {
      console.log(`✗ ${e.message}`);
      fail++;
    }
  }

  console.log(`   → ${ok}/${PER_CAT} downloaded, ${fail} failed\n`);
  manifest.videos[cat.id] = results;
}

// ── Write master manifest ────────────────────────────────────────────────────
const manifestData = {
  generated:  new Date().toISOString(),
  base:       BASE,
  attribution: {
    pixabay:     'Free for commercial use — no attribution required. https://pixabay.com/service/license/',
    incompetech: 'Kevin MacLeod — CC-BY 4.0. Attribution: "Music by Kevin MacLeod (incompetech.com) — Licensed under Creative Commons: By Attribution 4.0 License"',
  },
  structure: {
    music:  MUSIC_GENRES.map(g => ({ id: g.id, label: g.label, count: manifest.music[g.id]?.length ?? 0 })),
    videos: VIDEO_CATS.map(c => ({ id: c.id, label: c.label, count: manifest.videos[c.id]?.length ?? 0 })),
  },
  music:  manifest.music,
  videos: manifest.videos,
};

const manifestPath = path.join(BASE, 'manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2));

// ── Final summary ───────────────────────────────────────────────────────────
const totalMusic = Object.values(manifest.music).reduce((s, a) => s + a.length, 0);
const totalVideo = Object.values(manifest.videos).reduce((s, a) => s + a.length, 0);

console.log('╔══════════════════════════════════════════════════════╗');
console.log('║               DOWNLOAD COMPLETE                     ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  🎵 Music tracks : ${String(totalMusic).padStart(3)} / ${MUSIC_GENRES.length * PER_CAT}                      ║`);
console.log(`║  📹 Video clips  : ${String(totalVideo).padStart(3)} / ${VIDEO_CATS.length * PER_CAT}                     ║`);
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  📄 ${manifestPath}`);
console.log('╚══════════════════════════════════════════════════════╝');

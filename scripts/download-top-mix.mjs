/**
 * download-top-mix.mjs
 *
 * Downloads the top 10 most-downloaded CC-licensed music tracks from
 * Internet Archive (archive.org) — the largest public repository of
 * freely downloadable music. Diverse artists, different genres.
 *
 * Output: C:\WorkSpaces\SharedMedia\music\top-mix\
 *   top-mix-01-{title}-{artist}.mp3  ...through 10
 *   manifest.json (updated)
 *
 * Run: node scripts/download-top-mix.mjs
 */
import https from 'https';
import fs    from 'fs';
import path  from 'path';

const OUT_DIR    = 'C:/WorkSpaces/SharedMedia/music/top-mix';
const TARGET     = 10;
const MAX_BYTES  = 30 * 1024 * 1024;   // 30 MB per track
const TIMEOUT_MS = 120_000;
const MIN_BYTES  = 512 * 1024;         // Must be >512KB to be a real audio file

fs.mkdirSync(OUT_DIR, { recursive: true });

// ── HTTP helpers ────────────────────────────────────────────────────────────
function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 SharedMedia/1.0' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
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
      if (contentLen > MAX_BYTES) {
        res.destroy();
        return reject(new Error(`Too large: ${(contentLen / 1024 / 1024).toFixed(0)}MB`));
      }
      const file = fs.createWriteStream(dest);
      let written = 0;
      res.on('data', chunk => {
        written += chunk.length;
        if (written > MAX_BYTES) {
          res.destroy(); file.close();
          try { fs.unlinkSync(dest); } catch {}
          reject(new Error('Exceeded 30MB during stream'));
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
  return (str || 'unknown').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
}
function pad(n) { return String(n).padStart(2, '0'); }

// ── Archive.org Search ───────────────────────────────────────────────────────
async function searchArchive(query, rows = 50) {
  const q = encodeURIComponent(query);
  const url = `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title,creator,downloads,subject&sort[]=downloads+desc&rows=${rows}&page=1&output=json`;
  const r = await get(url);
  if (r.status !== 200) throw new Error(`Archive search HTTP ${r.status}`);
  const j = JSON.parse(r.body);
  return j.response?.docs || [];
}

async function getArchiveFiles(identifier) {
  const url = `https://archive.org/metadata/${identifier}`;
  const r = await get(url);
  if (r.status !== 200) return [];
  const j = JSON.parse(r.body);
  return j.files || [];
}

// ── Candidate building ───────────────────────────────────────────────────────
// Multiple search queries to ensure diverse genres/artists
const SEARCHES = [
  'mediatype:audio subject:(background music) licenseurl:(*creativecommons*) format:mp3',
  'mediatype:audio subject:(jazz) licenseurl:(*creativecommons*) format:mp3',
  'mediatype:audio subject:(ambient) licenseurl:(*creativecommons*) format:mp3',
  'mediatype:audio subject:(electronic music) licenseurl:(*creativecommons*) format:mp3',
  'mediatype:audio subject:(rock) licenseurl:(*creativecommons*) format:mp3',
  'mediatype:audio subject:(classical) licenseurl:(*creativecommons*) format:mp3',
];

console.log('╔═════════════════════════════════════════════════════════════╗');
console.log('║      Top-10 Mix Downloader — Internet Archive (CC Music)   ║');
console.log('╠═════════════════════════════════════════════════════════════╣');
console.log(`║  Output: ${OUT_DIR.padEnd(53)}║`);
console.log('║  Source: archive.org — CC licensed, diverse artists        ║');
console.log('╚═════════════════════════════════════════════════════════════╝\n');

// Collect candidate items across searches, deduped by identifier
const seenIds = new Set();
const candidates = [];

for (const q of SEARCHES) {
  process.stdout.write(`Searching: "${q.slice(0, 50)}..."  `);
  try {
    const docs = await searchArchive(q, 30);
    let added = 0;
    for (const d of docs) {
      if (!seenIds.has(d.identifier) && d.downloads > 0) {
        seenIds.add(d.identifier);
        candidates.push(d);
        added++;
      }
    }
    console.log(`+${added} unique items`);
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }
}

// Sort entire pool by downloads
candidates.sort((a, b) => (b.downloads || 0) - (a.downloads || 0));
console.log(`\nTotal candidate pool: ${candidates.length} items\n`);

// ── Download ─────────────────────────────────────────────────────────────────
const manifest = [];
let ok = 0, skip = 0;

for (let i = 0; i < candidates.length && ok < TARGET; i++) {
  const item = candidates[i];
  const creator = Array.isArray(item.creator) ? item.creator[0] : (item.creator || 'Unknown Artist');

  // Get files for this item
  let files;
  try {
    files = await getArchiveFiles(item.identifier);
  } catch (e) {
    continue;
  }

  // Find MP3 files that are original uploads (not derivatives)
  const mp3s = files.filter(f =>
    f.name?.toLowerCase().endsWith('.mp3') &&
    (f.source === 'original' || !f.source) &&
    parseFloat(f.size || 0) > MIN_BYTES / 1024  // size in bytes via API
  );

  if (mp3s.length === 0) { skip++; continue; }

  // For variety: if collection has many tracks, just pick the first (largest) MP3
  // Sort by size descending so we get the meatiest track
  mp3s.sort((a, b) => (parseFloat(b.size) || 0) - (parseFloat(a.size) || 0));
  const track = mp3s[0];

  const trackName = track.title || track.name.replace(/\.mp3$/i, '');
  const num = pad(ok + 1);
  const artistSlug = slugify(creator);
  const titleSlug  = slugify(item.title || trackName);
  const fname = `top-mix-${num}-${titleSlug}-${artistSlug}.mp3`;
  const dest  = path.join(OUT_DIR, fname);

  if (fs.existsSync(dest)) {
    const existingSize = fs.statSync(dest).size;
    if (existingSize > MIN_BYTES) {
      console.log(`[${num}] ↩ skip (exists): ${fname.slice(0, 60)}`);
      manifest.push({ filename: fname, title: item.title, creator, downloads: item.downloads, source: 'archive.org', identifier: item.identifier });
      ok++;
      continue;
    }
    fs.unlinkSync(dest); // stale/corrupt file
  }

  const downloadUrl = `https://archive.org/download/${item.identifier}/${encodeURIComponent(track.name)}`;
  process.stdout.write(`[${num}] ${fname.slice(0, 60).padEnd(60)} `);

  try {
    const bytes = await download(downloadUrl, dest);
    if (bytes < MIN_BYTES) {
      fs.unlinkSync(dest);
      console.log(`✗ Too small: ${bytes} bytes — skipping`);
      skip++;
      continue;
    }
    console.log(`✓ ${(bytes / 1024 / 1024).toFixed(1)}MB  [${item.downloads?.toLocaleString()} total downloads]`);
    manifest.push({
      filename: fname,
      title: item.title,
      track: trackName,
      creator,
      downloads: item.downloads,
      archive_url: `https://archive.org/details/${item.identifier}`,
      source: 'archive.org',
      identifier: item.identifier,
      license: 'Creative Commons (see archive item for specific license)',
    });
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message}`);
    try { fs.unlinkSync(dest); } catch {}
    skip++;
  }
}

// ── Update SharedMedia manifest ───────────────────────────────────────────────
const globalManifestPath = 'C:/WorkSpaces/SharedMedia/manifest.json';
let globalManifest = {};
try { globalManifest = JSON.parse(fs.readFileSync(globalManifestPath, 'utf8')); } catch {}

if (!globalManifest.music) globalManifest.music = {};
globalManifest.music['top-mix'] = manifest;
globalManifest.generated = new Date().toISOString();

fs.writeFileSync(globalManifestPath, JSON.stringify(globalManifest, null, 2));

// Local manifest in the folder
fs.writeFileSync(path.join(OUT_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2));

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n╔══════════════════════════════════════════════════════╗');
console.log('║                   TOP MIX COMPLETE                 ║');
console.log('╠══════════════════════════════════════════════════════╣');
console.log(`║  Tracks downloaded: ${String(ok).padStart(2)} / ${TARGET}                         ║`);
console.log(`║  Skipped/failed:    ${String(skip).padStart(2)}                              ║`);
console.log('╠══════════════════════════════════════════════════════╣');
console.log('║  Track list:                                        ║');
for (const t of manifest) {
  const line = `${t.filename.slice(0, 48)}`;
  console.log(`║    ${line.padEnd(49)}║`);
}
console.log('╚══════════════════════════════════════════════════════╝');

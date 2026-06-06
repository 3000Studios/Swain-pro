import https from 'https';
import http from 'http';

function get(url, extraHeaders = {}) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    lib.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json, */*', ...extraHeaders }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body: Buffer.concat(chunks).toString() }));
    }).on('error', reject);
  });
}

// ── 1. ccMixter (fixed — no lic param) ─────────────────────────────────────
console.log('\n=== ccMixter: top downloads ===');
try {
  const r = await get('http://ccmixter.org/api/query?f=json&search_order=num_downloads&limit=5');
  console.log('Status:', r.status);
  const j = JSON.parse(r.body);
  console.log('Type:', typeof j, Array.isArray(j) ? `array[${j.length}]` : '');
  if (Array.isArray(j) && j[0]) {
    console.log('Keys:', Object.keys(j[0]).join(', '));
    for (const t of j.slice(0,3)) {
      console.log(`  "${t.upload_name}" by ${t.user_name} — downloads: ${t.num_downloads}`);
      // Find MP3 URL in files array
      const files = t.files || [];
      const mp3 = files.find(f => f.file_type === 'mp3' || (f.file_url || '').includes('.mp3'));
      console.log('  MP3:', mp3?.file_url || mp3?.download_url || 'not found in files');
      console.log('  All file keys:', files[0] ? Object.keys(files[0]).join(', ') : 'no files');
    }
  }
} catch(e) { console.log('Error:', e.message, r?.body?.slice(0,100)); }

// ── 2. Internet Archive: CC music top downloads ─────────────────────────────
console.log('\n=== Internet Archive: CC music top downloads ===');
try {
  const r = await get('https://archive.org/advancedsearch.php?q=mediatype:audio+subject:(music)+licenseurl:(*creativecommons*)+format:mp3&fl[]=identifier,title,creator,downloads&sort[]=downloads+desc&rows=5&page=1&output=json');
  console.log('Status:', r.status);
  const j = JSON.parse(r.body);
  const docs = j.response?.docs || [];
  console.log('Total hits:', j.response?.numFound);
  for (const d of docs.slice(0,5)) {
    console.log(`  "${d.title}" by ${d.creator} — downloads: ${d.downloads}`);
    console.log('  Download base: https://archive.org/download/' + d.identifier);
  }
  // Get metadata for first item to find MP3 file
  if (docs[0]) {
    const meta = await get(`https://archive.org/metadata/${docs[0].identifier}`);
    const mj = JSON.parse(meta.body);
    const mp3s = (mj.files || []).filter(f => f.name?.endsWith('.mp3') && f.source === 'original');
    console.log(`\n  First item MP3s (${mp3s.length}):`, mp3s.slice(0,3).map(f => f.name));
    if (mp3s[0]) {
      console.log('  Full URL: https://archive.org/download/' + docs[0].identifier + '/' + encodeURIComponent(mp3s[0].name));
    }
  }
} catch(e) { console.log('Error:', e.message); }

// ── 3. Jamendo: try actual docs example ────────────────────────────────────
console.log('\n=== Jamendo API (docs example client_id) ===');
try {
  // Try multiple potential public client IDs
  for (const cid of ['b6747d04', '96d5a8f1']) {
    const r = await get(`https://api.jamendo.com/v3.0/tracks/?client_id=${cid}&format=json&limit=3&order=popularity_total&tags=background`);
    console.log(`client_id=${cid} status:`, r.status);
    const j = JSON.parse(r.body);
    console.log('  headers:', JSON.stringify(j.headers));
    if (j.results?.length > 0) {
      const t = j.results[0];
      console.log('  Sample:', t.name, '-', t.artist_name);
      console.log('  audio:', t.audio);
      console.log('  audiodownload:', t.audiodownload);
      break;
    }
  }
} catch(e) { console.log('Error:', e.message); }

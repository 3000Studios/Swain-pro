/**
 * Probe Pixabay music page to find embedded audio CDN URLs
 */
import https from 'https';

function get(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      ...extraHeaders,
    };
    https.get(url, { headers }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString() }));
    }).on('error', reject);
  });
}

console.log('=== Probing Pixabay Music Page ===\n');

// Fetch pixabay.com/music/
const r = await get('https://pixabay.com/music/');
console.log('Status:', r.status);
console.log('Content-Type:', r.headers['content-type']);
console.log('Body length:', r.body.length, 'chars\n');

// Look for CDN audio URLs
const audioMatches = r.body.match(/cdn\.pixabay\.com\/download\/audio\/[^"'\s>]+\.mp3[^"'\s]*/g);
console.log('Audio CDN URLs found:', audioMatches?.length ?? 0);
if (audioMatches) audioMatches.slice(0, 5).forEach(u => console.log(' ', u));

// Look for JSON blobs that might contain audio data
const jsonBlobs = r.body.match(/window\.\w+\s*=\s*\{[^;]{200,}/g);
console.log('\nJSON window vars found:', jsonBlobs?.length ?? 0);
if (jsonBlobs) jsonBlobs.slice(0, 2).forEach(b => console.log(' ', b.slice(0, 200)));

// Look for any previewMp3 or audio_url fields
const audioFields = r.body.match(/"(preview_mp3|audio_url|mp3_url|previewMp3|audioUrl|download_url)[^"]*":\s*"[^"]+"/g);
console.log('\nAudio field matches:', audioFields?.length ?? 0);
if (audioFields) audioFields.slice(0, 5).forEach(f => console.log(' ', f));

// Look for pixabay music API calls in scripts
const apiCalls = r.body.match(/\/api\/[^"'\s]{0,80}/g);
console.log('\nAPI call patterns:', [...new Set(apiCalls)].slice(0, 10).join('\n  '));

// Check if there's a next data JSON blob (Next.js style)
const nextData = r.body.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
if (nextData) {
  console.log('\n__NEXT_DATA__ found, length:', nextData[1].length);
  // Look for audio in it
  const nd = JSON.parse(nextData[1]);
  console.log('Props keys:', Object.keys(nd?.props || {}));
} else {
  console.log('\nNo __NEXT_DATA__ found');
}

// Check for any data-* attributes with audio
const dataAttrs = r.body.match(/data-[a-z-]+=["'][^"']*\.mp3[^"']*/g);
console.log('\ndata-* mp3 attrs:', dataAttrs?.slice(0, 5));

// Print a snippet of the body to understand structure
console.log('\n--- First 500 chars of body ---');
console.log(r.body.slice(0, 500));
console.log('\n--- Look for "music" JSON section ---');
const musicIdx = r.body.indexOf('"previewMP3"');
if (musicIdx > -1) console.log('previewMP3 context:', r.body.slice(musicIdx - 20, musicIdx + 100));
const mp3Idx = r.body.indexOf('.mp3');
if (mp3Idx > -1) console.log('.mp3 context:', r.body.slice(mp3Idx - 50, mp3Idx + 100));

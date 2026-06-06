import https from 'https';
const KEY = '48619054-246c38e73260ef5fcf7edd915';

function get(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    }).on('error', reject);
  });
}

const endpoints = [
  `https://pixabay.com/api/music/?key=${KEY}&q=background+music&per_page=3&order=popular`,
  `https://pixabay.com/api/?key=${KEY}&q=background+music&media_type=audio&per_page=3&order=popular`,
  `https://pixabay.com/api/?key=${KEY}&q=jazz+music&response_group=audio&per_page=3`,
];

for (const url of endpoints) {
  console.log('\n=== Testing:', url.replace(KEY, '***KEY***'));
  try {
    const r = await get(url);
    console.log('Status:', r.status);
    const j = JSON.parse(r.body);
    console.log('totalHits:', j.totalHits, '  hits:', j.hits?.length);
    if (j.hits?.[0]) {
      const h = j.hits[0];
      console.log('Keys:', Object.keys(h).join(', '));
      console.log('id:', h.id);
      console.log('type:', h.type);
      console.log('mediaType:', h.mediaType);
      console.log('previewURL:', h.previewURL);
      console.log('audio:', JSON.stringify(h.audio));
      console.log('download:', h.download);
      console.log('duration:', h.duration);
      console.log('tags:', h.tags?.slice(0, 60));
      // Print the full hit for inspection
      console.log('\nFull first hit:\n', JSON.stringify(h, null, 2).slice(0, 800));
    } else if (j.error) {
      console.log('API Error:', j.error);
    }
  } catch (e) {
    console.log('Error:', e.message);
  }
}

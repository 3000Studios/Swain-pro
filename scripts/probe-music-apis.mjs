/**
 * Probe multiple free music APIs to find which works best
 * for top-downloaded tracks with diverse artists
 */
import https from 'https';
import http from 'http';

function get(url) {
  const lib = url.startsWith('https') ? https : http;
  return new Promise((resolve, reject) => {
    lib.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        'Accept': 'application/json',
      }
    }, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve({ status: res.statusCode, location: res.headers.location, body: Buffer.concat(chunks).toString() }));
    }).on('error', reject);
  });
}

// --- 1. ccMixter
console.log('\n=== ccMixter API ===');
try {
  const r = await get('http://ccmixter.org/api/query?f=json&search_order=num_downloads&limit=5&lic=1&type=ccmixter');
  console.log('Status:', r.status);
  if (r.status === 200) {
    const j = JSON.parse(r.body);
    if (Array.isArray(j) && j[0]) {
      console.log('Keys:', Object.keys(j[0]).join(', '));
      console.log('Sample - title:', j[0].upload_name, '| artist:', j[0].user_name);
      console.log('audio_mp3:', j[0].files?.[0]?.download_url || j[0].download_url || 'N/A');
      console.log('Total results:', j.length);
    }
  } else {
    console.log('Body:', r.body.slice(0, 200));
  }
} catch(e) { console.log('Error:', e.message); }

// --- 2. Free Music Archive (no key)
console.log('\n=== Free Music Archive API (no key) ===');
try {
  const r = await get('https://freemusicarchive.org/api/get/tracks.json?limit=3&page=1');
  console.log('Status:', r.status);
  if (r.status === 200) {
    const j = JSON.parse(r.body);
    console.log('Keys in dataset:', Object.keys(j));
    const tracks = j.dataset || j.tracks || j;
    if (Array.isArray(tracks) && tracks[0]) {
      console.log('Track keys:', Object.keys(tracks[0]).join(', '));
      console.log('Sample:', tracks[0].track_title, '-', tracks[0].artist_name);
      console.log('MP3:', tracks[0].track_file || tracks[0].track_url);
    }
  } else {
    console.log('Body:', r.body.slice(0, 300));
  }
} catch(e) { console.log('Error:', e.message); }

// --- 3. Jamendo (public endpoint test)
console.log('\n=== Jamendo API (needs client_id) ===');
try {
  // Use their demo client_id
  const r = await get('https://api.jamendo.com/v3.0/tracks/?client_id=b6747d04&format=json&limit=3&order=popularity_total&audioformat=mp32');
  console.log('Status:', r.status);
  if (r.status === 200) {
    const j = JSON.parse(r.body);
    console.log('Results count:', j.results?.length);
    if (j.results?.[0]) {
      const t = j.results[0];
      console.log('Keys:', Object.keys(t).join(', '));
      console.log('Sample:', t.name, '-', t.artist_name);
      console.log('audio:', t.audio);
      console.log('audiodownload:', t.audiodownload);
      console.log('duration:', t.duration);
    }
  } else {
    console.log('Body:', r.body.slice(0, 200));
  }
} catch(e) { console.log('Error:', e.message); }

// --- 4. SoundCloud (public endpoint)
console.log('\n=== Internet Archive / archive.org ===');
try {
  const r = await get('https://archive.org/advancedsearch.php?q=mediatype:audio+subject:music+licenseurl:creativecommons&fl[]=identifier,title,creator,downloads,avg_rating&sort[]=downloads+desc&rows=3&page=1&output=json');
  console.log('Status:', r.status);
  if (r.status === 200) {
    const j = JSON.parse(r.body);
    const docs = j.response?.docs;
    if (docs?.[0]) {
      console.log('Sample:', docs[0].title, '-', docs[0].creator, '- downloads:', docs[0].downloads);
      console.log('Full doc keys:', Object.keys(docs[0]).join(', '));
    }
  }
} catch(e) { console.log('Error:', e.message); }

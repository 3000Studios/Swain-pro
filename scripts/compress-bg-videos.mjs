/**
 * Compress oversized bg videos to under 23MB using ffmpeg 2-pass CRF targeting.
 * Target: 23MB ceiling (safety margin under CF Pages 25MB limit).
 * Strategy: calculate bitrate from duration to hit target, scale down to 1280x720 max.
 */
import { execSync, spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const BG_DIR   = 'C:/WorkSpaces/Swain-Pro/public/videos/bg';
const LIMIT_MB = 25;
const TARGET_MB = 22;   // compress to 22MB — comfortable margin
const LIMIT_BYTES = LIMIT_MB * 1024 * 1024;

function runFFprobe(file) {
  try {
    const out = execSync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=duration,width,height,bit_rate -of json "${file}"`,
      { encoding: 'utf8' }
    );
    const j = JSON.parse(out);
    const s = j.streams[0] || {};
    return {
      duration: parseFloat(s.duration || 0),
      width:    parseInt(s.width  || 1920),
      height:   parseInt(s.height || 1080),
    };
  } catch {
    return { duration: 0, width: 1920, height: 1080 };
  }
}

function ffmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', d => stderr += d);
    proc.on('close', code => code === 0 ? resolve() : reject(new Error(`ffmpeg exit ${code}\n${stderr.slice(-400)}`)));
  });
}

// Get all files over limit
const oversized = fs.readdirSync(BG_DIR)
  .filter(f => f.endsWith('.mp4'))
  .map(f => ({ name: f, path: path.join(BG_DIR, f), size: fs.statSync(path.join(BG_DIR, f)).size }))
  .filter(f => f.size > LIMIT_BYTES)
  .sort((a, b) => b.size - a.size);

console.log(`=== Compressing ${oversized.length} oversized bg videos to <${TARGET_MB}MB ===\n`);

let ok = 0, fail = 0;

for (const file of oversized) {
  const origMB = (file.size / 1024 / 1024).toFixed(1);
  process.stdout.write(`  ${file.name}  (${origMB}MB → <${TARGET_MB}MB)  `);

  const { duration, width, height } = runFFprobe(file.path);

  if (duration < 1) {
    console.log('✗ Could not read duration — skipping');
    fail++;
    continue;
  }

  // Target bitrate in kbps: (targetMB * 8 * 1024) / duration
  // Subtract ~128kbps for audio
  const targetVideoBitrateK = Math.floor((TARGET_MB * 8 * 1024) / duration) - 128;
  const videoBitrate = Math.max(300, targetVideoBitrateK); // floor at 300k

  // Scale: max 1280 wide, keep aspect
  const scaleFilter = width > 1280
    ? 'scale=1280:-2:flags=lanczos'
    : 'scale=trunc(iw/2)*2:trunc(ih/2)*2'; // ensure even dims, no resize

  const tmp = file.path + '.tmp.mp4';

  try {
    // Single-pass CRF with bitrate ceiling — fast and reliable for background videos
    await ffmpeg([
      '-y', '-i', file.path,
      '-vf', scaleFilter,
      '-c:v', 'libx264',
      '-b:v', `${videoBitrate}k`,
      '-maxrate', `${videoBitrate * 2}k`,
      '-bufsize', `${videoBitrate * 4}k`,
      '-preset', 'fast',
      '-profile:v', 'high',
      '-level', '4.0',
      '-c:a', 'aac', '-b:a', '128k',
      '-movflags', '+faststart',
      tmp,
    ]);

    const newSize = fs.statSync(tmp).size;
    const newMB   = (newSize / 1024 / 1024).toFixed(1);

    if (newSize >= LIMIT_BYTES) {
      // Still too big — do a second pass with lower bitrate
      const fallbackK = Math.max(250, Math.floor(videoBitrate * 0.7));
      const tmp2 = file.path + '.tmp2.mp4';
      await ffmpeg([
        '-y', '-i', file.path,
        '-vf', 'scale=1280:-2:flags=lanczos',
        '-c:v', 'libx264',
        '-b:v', `${fallbackK}k`,
        '-maxrate', `${fallbackK * 2}k`,
        '-bufsize', `${fallbackK * 4}k`,
        '-preset', 'fast',
        '-c:a', 'aac', '-b:a', '96k',
        '-movflags', '+faststart',
        tmp2,
      ]);
      fs.unlinkSync(tmp);
      fs.renameSync(tmp2, tmp);
      const finalSize = fs.statSync(tmp).size;
      const finalMB   = (finalSize / 1024 / 1024).toFixed(1);
      console.log(`✓ ${finalMB}MB (fallback pass)`);
    } else {
      console.log(`✓ ${newMB}MB`);
    }

    // Replace original with compressed
    fs.unlinkSync(file.path);
    fs.renameSync(tmp, file.path);
    ok++;
  } catch (e) {
    console.log(`✗ ${e.message.split('\n')[0]}`);
    try { fs.unlinkSync(tmp); } catch {}
    fail++;
  }
}

// Final verification
console.log('\n=== Verification ===');
const stillOver = fs.readdirSync(BG_DIR)
  .filter(f => f.endsWith('.mp4'))
  .map(f => ({ name: f, size: fs.statSync(path.join(BG_DIR, f)).size }))
  .filter(f => f.size > LIMIT_BYTES);

if (stillOver.length === 0) {
  console.log('✅ All bg videos are now under 25MB');
} else {
  stillOver.forEach(f => console.log(`  ⚠️  Still over: ${f.name} ${(f.size/1024/1024).toFixed(1)}MB`));
}

console.log(`\n✅ Compressed: ${ok}/${oversized.length}`);
console.log(`✗  Failed: ${fail}`);

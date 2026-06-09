import { chromium } from 'playwright';
const url = process.argv[2] || 'https://swain.pro/';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1366, height: 900 } });
const errs = [];
p.on('console', m => { if (m.type()==='error') errs.push('CONSOLE: '+m.text()); });
p.on('pageerror', e => errs.push('PAGEERR: '+e.message));
await p.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(e=>errs.push('GOTO: '+e.message));
await p.waitForTimeout(2500);
const info = await p.evaluate(() => {
  const q = s => document.querySelector(s);
  const r = el => el ? (()=>{const b=el.getBoundingClientRect();const c=getComputedStyle(el);return {w:Math.round(b.width),h:Math.round(b.height),vis:c.visibility,disp:c.display,op:c.opacity,z:c.zIndex,pos:c.position};})() : null;
  return {
    header: r(q('header.header-blur')),
    footer: r(q('footer')),
    main: r(q('#main-content')),
    bridgeCanvas: !!q('canvas[style*="z-index: 45"], canvas[style*="zIndex"]') || document.querySelectorAll('canvas').length,
    canvasCount: document.querySelectorAll('canvas').length,
    bodyH: document.body.scrollHeight,
    headerText: q('header.header-blur')?.innerText?.slice(0,60),
  };
});
console.log('ERRORS:', errs.length ? errs.join('\n') : 'none');
console.log('INFO:', JSON.stringify(info,null,2));
await p.screenshot({ path: '/tmp/top.png' });
await p.evaluate(()=>window.scrollTo(0, document.body.scrollHeight));
await p.waitForTimeout(1500);
await p.screenshot({ path: '/tmp/bottom.png' });
await b.close();

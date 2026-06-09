import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 390, height: 844 }, isMobile:true, hasTouch:true, deviceScaleFactor:2 });
const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('https://swain.pro/', {waitUntil:'networkidle', timeout:45000}).catch(e=>errs.push('GOTO '+e.message));
await p.waitForTimeout(2500);
const info = await p.evaluate(()=>{
  const q=s=>document.querySelector(s); const r=el=>el?(()=>{const b=el.getBoundingClientRect();const c=getComputedStyle(el);return{w:Math.round(b.width),h:Math.round(b.height),vis:c.visibility,op:c.opacity};})():null;
  return {header:r(q('header.header-blur')), footer:r(q('footer')), canvases:document.querySelectorAll('canvas').length};
});
console.log('MOBILE ERRORS:', errs.length?errs.join(' | '):'none');
console.log('MOBILE INFO:', JSON.stringify(info));
await p.screenshot({path:'C:/tmp/m_top.png'});
await b.close();

import { useEffect, useRef } from 'react'

/** Perspective wireframe grid — a synthwave plane receding to a horizon, its
 *  vertices displaced by travelling sine waves that bulge toward the cursor. */

export default function WaveGridBg({ light = false }: { light?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)').matches

    const lineRGB = light ? '96,109,243' : '130,247,255'
    const glowRGB = light ? '130,247,255' : '183,156,255'

    let W = 0, H = 0, raf = 0, t = 0
    const mouse = { x: -9999, y: -9999, active: false, pressure: 0 }
    const bursts: { x: number; y: number; life: number; size: number }[] = []
    const COLS = 26, ROWS = 16

    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H }
    const onMove = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) { mouse.x = x; mouse.y = y; mouse.active = true }
      else mouse.active = false
      if ('pressure' in e) mouse.pressure = e.pressure || 0
    }
    const onPointerMove = (e: PointerEvent) => onMove(e)
    const onMouseMove = (e: MouseEvent) => onMove(e)
    const onPointerDown = (e: PointerEvent) => {
      onMove(e)
      bursts.push({ x: mouse.x, y: mouse.y, life: 1, size: coarse ? 28 : 18 })
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('resize', resize)
    resize()

    // map grid (col,row) → screen point with perspective + wave displacement
    const pt = (c: number, r: number) => {
      const fx = c / COLS, fr = r / ROWS
      const persp = 0.32 + fr * 0.68
      const x = (fx - 0.5) * W * persp + W / 2
      let y = H * 0.42 + fr * H * 0.62
      const wave = Math.sin(fx * 7 + t * 0.03) * 14 * fr + Math.cos(fr * 6 - t * 0.04) * 10 * fr
      y += wave
      if (mouse.active) {
        const dx = x - mouse.x, dy = y - mouse.y
        const d2 = dx * dx + dy * dy
        if (d2 < 180 * 180) {
          const push = ((180 - Math.sqrt(d2)) / 180) ** 2 * (mouse.pressure > 0 ? 56 : 44)
          y -= push
          if (Math.sqrt(d2) < 40 && bursts.length < 5 && t % 8 === 0) bursts.push({ x, y, life: 1, size: 24 })
        }
      }
      return { x, y }
    }

    let onScreen = true
    const draw = () => {
      if (!onScreen) { raf = 0; return }
      t++
      ctx.clearRect(0, 0, W, H)
      ctx.lineWidth = light ? 1.5 : 1
      ctx.globalCompositeOperation = 'source-over'
      ctx.fillStyle = light ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.08)'
      ctx.fillRect(0, 0, W, H)
      const scrollBand = (window.scrollY % 600) / 600
      ctx.globalAlpha = 0.4 + scrollBand * 0.25
      // glowing ridge that tracks the cursor column when active
      const glowCol = mouse.active ? (mouse.x / W) * COLS : -99
      // horizontal lines
      for (let r = 0; r <= ROWS; r++) {
        ctx.beginPath()
        for (let c = 0; c <= COLS; c++) { const p = pt(c, r); c === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y) }
        ctx.strokeStyle = `rgba(${lineRGB},${(light ? 0.24 : 0.05) + (r / ROWS) * (light ? 0.52 : 0.22)})`
        ctx.stroke()
      }
      // vertical lines — the one nearest the cursor lights up in saturated blue
      for (let c = 0; c <= COLS; c++) {
        ctx.beginPath()
        for (let r = 0; r <= ROWS; r++) { const p = pt(c, r); r === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y) }
        const near = Math.max(0, 1 - Math.abs(c - glowCol) / 2.5)
        if (near > 0.05) {
          ctx.strokeStyle = `rgba(${glowRGB},${0.18 + near * (light ? 0.55 : 0.45)})`
          ctx.lineWidth = (light ? 1.7 : 1) + near * 1.6
        } else {
          ctx.strokeStyle = `rgba(${lineRGB},${(light ? 0.16 : 0.05) + (c / COLS) * (light ? 0.28 : 0.14)})`
          ctx.lineWidth = light ? 1.7 : 1
        }
        ctx.stroke()
      }
      ctx.globalCompositeOperation = 'lighter'
      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        b.life -= 0.03
        b.size += 1.2
        if (b.life <= 0) { bursts.splice(i, 1); continue }
        ctx.strokeStyle = `rgba(${glowRGB},${b.life * 0.6})`
        ctx.lineWidth = 1.2 + (1 - b.life) * 3
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.size, 0, Math.PI * 2)
        ctx.stroke()
        ctx.fillStyle = `rgba(${glowRGB},${b.life * 0.06})`
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.size * 0.55, 0, Math.PI * 2)
        ctx.fill()
      }
      if (reduce) { raf = 0; return }
      raf = requestAnimationFrame(draw)
    }
    const io = new IntersectionObserver((es) => {
      const vis = es[0]?.isIntersecting ?? true
      if (vis && !onScreen) { onScreen = true; if (!raf) raf = requestAnimationFrame(draw) }
      else if (!vis) { onScreen = false; cancelAnimationFrame(raf); raf = 0 }
    }, { threshold: 0 })
    io.observe(canvas)
    const onVis = () => {
      if (document.hidden) { cancelAnimationFrame(raf); raf = 0 }
      else if (onScreen && !raf) raf = requestAnimationFrame(draw)
    }
    document.addEventListener('visibilitychange', onVis)
    draw()

    return () => {
      cancelAnimationFrame(raf); io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
}

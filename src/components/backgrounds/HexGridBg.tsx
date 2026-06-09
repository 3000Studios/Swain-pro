import { useEffect, useRef } from 'react'

/** Hex honeycomb — a field of hexagons that ignite gold as the cursor sweeps
 *  past, with a slow ambient shimmer travelling diagonally across the grid. */

export default function HexGridBg({ light = false }: { light?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // On light sections paint dark ink + saturated amber so the grid actually
    // reads against cream; on dark sections keep the soft champagne gold.
    const baseRGB = light ? '64,52,28' : '200,169,110'
    const glowRGB = light ? '184,120,28' : '200,169,110'
    const baseA = light ? 0.18 : 0.06
    const glowMul = light ? 0.72 : 0.55
    const fillMul = light ? 0.20 : 0.16
    const shimAmp = light ? 0.24 : 0.12

    let W = 0, H = 0, raf = 0, t = 0
    const mouse = { x: -9999, y: -9999, active: false }
    const R = 26                               // hex radius
    const hw = Math.sqrt(3) * R                 // horizontal spacing
    const vh = 1.5 * R                          // vertical spacing

    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H }
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) { mouse.x = x; mouse.y = y; mouse.active = true }
      else mouse.active = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    resize()

    const hex = (cx: number, cy: number, glow: number) => {
      ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const a = Math.PI / 180 * (60 * i - 30)
        const x = cx + R * 0.92 * Math.cos(a), y = cy + R * 0.92 * Math.sin(a)
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.closePath()
      ctx.strokeStyle = `rgba(${baseRGB},${baseA + glow * glowMul})`
      ctx.lineWidth = (light ? 1 : 0.8) + glow
      ctx.stroke()
      if (glow > 0.25) {
        ctx.fillStyle = `rgba(${glowRGB},${glow * fillMul})`
        ctx.fill()
      }
    }

    let onScreen = true
    const draw = () => {
      if (!onScreen) { raf = 0; return }
      t++
      ctx.clearRect(0, 0, W, H)
      let row = 0
      for (let cy = 0; cy < H + R; cy += vh, row++) {
        const off = row % 2 ? hw / 2 : 0
        for (let cx = off; cx < W + hw; cx += hw) {
          const shimmer = shimAmp * (0.5 + 0.5 * Math.sin((cx + cy) * 0.012 - t * 0.04))
          let glow = reduce ? (light ? 0.16 : 0.1) : shimmer
          if (mouse.active) {
            const dx = cx - mouse.x, dy = cy - mouse.y
            const d2 = dx * dx + dy * dy
            if (d2 < 140 * 140) glow = Math.max(glow, ((140 - Math.sqrt(d2)) / 140) ** 1.5)
          }
          hex(cx, cy, glow)
        }
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
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
}

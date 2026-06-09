import { useEffect, useRef } from 'react'

/** Liquid plasma — drifting metaball blobs composited with 'lighter' so they
 *  bleed into molten gold/violet light. The cursor drags an extra hot blob. */

type Blob = { x: number; y: number; vx: number; vy: number; r: number; hue: number }

export default function PlasmaBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0, H = 0, raf = 0
    let blobs: Blob[] = []
    const mouse = { x: -9999, y: -9999, active: false }

    const build = () => {
      blobs = Array.from({ length: 7 }, (_, i) => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
        r: Math.min(W, H) * (0.18 + Math.random() * 0.16),
        hue: i % 2 ? 268 : 42,
      }))
    }
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; build() }
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) { mouse.x = x; mouse.y = y; mouse.active = true }
      else mouse.active = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    resize()

    const paint = (x: number, y: number, r: number, hue: number, sat: number, light: number, alpha: number) => {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, `hsla(${hue},${sat}%,${light}%,${alpha})`)
      g.addColorStop(1, `hsla(${hue},${sat}%,${light}%,0)`)
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
    }

    let onScreen = true
    const render = () => {
      ctx.fillStyle = 'rgb(8,7,5)'
      ctx.fillRect(0, 0, W, H)
      ctx.globalCompositeOperation = 'lighter'
      for (const b of blobs) paint(b.x, b.y, b.r, b.hue, 70, b.hue === 42 ? 42 : 38, 0.5)
      if (mouse.active) paint(mouse.x, mouse.y, Math.min(W, H) * 0.22, 48, 90, 55, 0.6)
      ctx.globalCompositeOperation = 'source-over'
    }
    const draw = () => {
      if (!onScreen) { raf = 0; return }
      for (const b of blobs) {
        b.x += b.vx; b.y += b.vy
        if (b.x < -b.r) b.x = W + b.r; if (b.x > W + b.r) b.x = -b.r
        if (b.y < -b.r) b.y = H + b.r; if (b.y > H + b.r) b.y = -b.r
      }
      render()
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

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0, opacity: 0.7 }} />
}

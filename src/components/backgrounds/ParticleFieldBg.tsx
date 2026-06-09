import { useEffect, useRef } from 'react'

/** Flow-field particles — thousands of motes drift along a Perlin-ish noise
 *  field, leaving faint gold trails. The cursor carves a vortex through them. */

type P = { x: number; y: number; vx: number; vy: number; life: number }

export default function ParticleFieldBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0, H = 0, raf = 0, t = 0
    let ps: P[] = []
    const mouse = { x: -9999, y: -9999, active: false }

    // cheap pseudo-noise angle field
    const field = (x: number, y: number, tm: number) =>
      (Math.sin(x * 0.0042 + tm * 0.0008) + Math.cos(y * 0.0042 - tm * 0.0006) +
       Math.sin((x + y) * 0.0025 + tm * 0.0011)) * 1.4

    const spawn = (): P => ({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, life: 40 + Math.random() * 160 })
    const build = () => { ps = Array.from({ length: Math.min(520, Math.floor((W * H) / 2600)) }, spawn) }
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; ctx.clearRect(0, 0, W, H); build() }
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) { mouse.x = x; mouse.y = y; mouse.active = true }
      else mouse.active = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    resize()

    let onScreen = true
    const draw = () => {
      if (!onScreen) { raf = 0; return }
      t++
      // fade previous frame for trails
      ctx.fillStyle = 'rgba(8,7,5,0.14)'
      ctx.fillRect(0, 0, W, H)

      for (const p of ps) {
        const a = field(p.x, p.y, t)
        p.vx += Math.cos(a) * 0.12
        p.vy += Math.sin(a) * 0.12
        if (mouse.active) {
          const dx = p.x - mouse.x, dy = p.y - mouse.y
          const d2 = dx * dx + dy * dy
          if (d2 < 150 * 150 && d2 > 1) {
            const d = Math.sqrt(d2), f = (150 - d) / 150
            // tangential swirl + slight push out
            p.vx += (-dy / d) * f * 0.9 + (dx / d) * f * 0.3
            p.vy += (dx / d) * f * 0.9 + (dy / d) * f * 0.3
          }
        }
        p.vx *= 0.92; p.vy *= 0.92
        p.x += p.vx; p.y += p.vy; p.life--

        if (p.x < 0 || p.x > W || p.y < 0 || p.y > H || p.life <= 0) {
          Object.assign(p, spawn())
          continue
        }
        const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 3)
        ctx.fillStyle = `hsla(${42 + sp * 18},80%,${55 + sp * 25}%,${0.25 + sp * 0.5})`
        ctx.fillRect(p.x, p.y, 1.6, 1.6)
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

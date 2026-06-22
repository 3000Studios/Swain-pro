import { useEffect, useRef } from 'react'

/**
 * Live mouse-reactive header wallpaper.
 * A constellation of gold particles drifts behind the nav bar, wired together
 * by light when they're close. The cursor is a magnet — particles lean toward
 * it, links brighten near it, and a gold comet-trail follows the pointer across
 * the bar. GPU-light (≈64px tall surface), pauses when the tab is hidden,
 * static single-frame under reduced-motion.
 */
export default function HeaderAura() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 2)
    let w = 0, h = 0
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width; h = r.height
      canvas.width = Math.max(1, w * DPR)
      canvas.height = Math.max(1, h * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      build()
    }

    type P = { x: number; y: number; vx: number; vy: number; r: number }
    let pts: P[] = []
    const build = () => {
      const count = Math.max(14, Math.min(40, Math.floor(w / 34)))
      pts = Array.from({ length: count }, () => ({
        x: Math.random() * w, y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.25,
        r: 0.8 + Math.random() * 1.8,
      }))
    }

    const mouse = { x: -9999, y: -9999, active: false }
    const trail: { x: number; y: number; life: number }[] = []
    const bursts: { x: number; y: number; life: number; r: number }[] = []
    const onMove = (e: PointerEvent | MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      // react while the pointer is anywhere over the header band
      if (x >= 0 && x <= r.width && y >= -8 && y <= r.height + 8) {
        mouse.x = x; mouse.y = Math.max(0, Math.min(h, y)); mouse.active = true
        trail.push({ x: mouse.x, y: mouse.y, life: 1 })
        if (trail.length > 18) trail.shift()
      } else { mouse.active = false }
    }
    const onPointerMove = (e: PointerEvent) => onMove(e)
    const onMouseMove = (e: MouseEvent) => onMove(e)
    const onPointerDown = (e: PointerEvent) => {
      onMove(e)
      bursts.push({ x: mouse.x, y: mouse.y, life: 1, r: 0 })
    }
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('pointerdown', onPointerDown, { passive: true })

    const resize0 = resize
    resize0()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    let raf = 0, running = true
    const draw = () => {
      if (!running) return
      ctx.clearRect(0, 0, w, h)

      // update + draw links
      ctx.lineCap = 'round'
      for (const p of pts) {
        if (!reduce) {
          p.x += p.vx; p.y += p.vy
          if (p.x < 0 || p.x > w) p.vx *= -1
          if (p.y < 0 || p.y > h) p.vy *= -1
          // magnet toward cursor
          if (mouse.active) {
            const dx = mouse.x - p.x, dy = mouse.y - p.y
            const d2 = dx * dx + dy * dy
            if (d2 < 160 * 160) {
              const f = (1 - Math.sqrt(d2) / 160) * 0.06
              p.vx += dx * f * 0.02; p.vy += dy * f * 0.02
            }
          }
          // gentle damping so they don't fly off
          p.vx *= 0.99; p.vy *= 0.99
        }
      }
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i], b = pts[j]
          const dx = a.x - b.x, dy = a.y - b.y
          const d = Math.hypot(dx, dy)
          if (d > 92) continue
          const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2
          const near = mouse.active ? Math.max(0, 1 - Math.hypot(mx - mouse.x, my - mouse.y) / 150) : 0
          ctx.strokeStyle = `rgba(${230 - near * 30},${190 + near * 30},${120 + near * 60},${(1 - d / 92) * (0.22 + near * 0.55)})`
          ctx.lineWidth = 0.6 + near * 1.2
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        }
      }
      // nodes
      ctx.shadowColor = 'rgba(200,169,110,0.8)'
      for (const p of pts) {
        const near = mouse.active ? Math.max(0, 1 - Math.hypot(p.x - mouse.x, p.y - mouse.y) / 140) : 0
        ctx.shadowBlur = 4 + near * 8
        ctx.fillStyle = `rgba(${235},${200 + near * 40},${140 + near * 80},${0.55 + near * 0.45})`
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + near * 1.6, 0, Math.PI * 2); ctx.fill()
      }
      ctx.shadowBlur = 0

      // comet trail following the pointer
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i]
        t.life -= 0.05
        if (t.life <= 0) continue
        ctx.fillStyle = `rgba(255,214,140,${t.life * 0.5})`
        ctx.beginPath(); ctx.arc(t.x, t.y, t.life * 5 + 1, 0, Math.PI * 2); ctx.fill()
      }
      while (trail.length && trail[0].life <= 0) trail.shift()

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        b.life -= 0.035
        b.r += 1.8
        if (b.life <= 0) { bursts.splice(i, 1); continue }
        ctx.strokeStyle = `rgba(130,247,255,${b.life * 0.55})`
        ctx.lineWidth = 1 + (1 - b.life) * 2
        ctx.beginPath()
        ctx.arc(b.x, b.y, 8 + b.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      if (reduce) { running = false; return }
      raf = requestAnimationFrame(draw)
    }

    raf = requestAnimationFrame(draw)
    const onVis = () => {
      running = !document.hidden
      if (running && !raf) raf = requestAnimationFrame(draw)
      else if (!running) { cancelAnimationFrame(raf); raf = 0 }
    }
    document.addEventListener('visibilitychange', onVis)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.92,
        zIndex: 0,
      }}
    />
  )
}

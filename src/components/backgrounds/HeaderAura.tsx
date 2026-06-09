import { useEffect, useRef } from 'react'

/**
 * Liquid-gold plasma ribbon behind the fixed header bar.
 * Tiny surface (≈64px tall), always visible, GPU-light.
 */
export default function HeaderAura() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5)
    let w = 0, h = 0
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      w = r.width; h = r.height
      canvas.width = Math.max(1, w * DPR)
      canvas.height = Math.max(1, h * DPR)
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // Three drifting gold blobs that get composited into flowing ribbons
    const blobs = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random(), y: Math.random(),
      a: Math.random() * Math.PI * 2,
      sp: 0.0006 + i * 0.0002,
      r: 60 + i * 30,
    }))

    let raf = 0, t = 0, running = true
    const draw = () => {
      if (!running) return
      t += 1
      ctx.clearRect(0, 0, w, h)
      ctx.globalCompositeOperation = 'lighter'
      for (const b of blobs) {
        b.a += b.sp * 16
        const cx = (0.5 + 0.5 * Math.cos(b.a + b.x * 6)) * w
        const cy = (0.5 + 0.5 * Math.sin(b.a * 1.3 + b.y * 6)) * h
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, b.r)
        g.addColorStop(0, 'rgba(200,169,110,0.30)')
        g.addColorStop(0.5, 'rgba(160,130,70,0.12)')
        g.addColorStop(1, 'rgba(200,169,110,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(cx, cy, b.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'
      raf = requestAnimationFrame(draw)
    }

    if (!reduce) {
      raf = requestAnimationFrame(draw)
      const onVis = () => {
        running = !document.hidden
        if (running && !raf) { raf = requestAnimationFrame(draw) }
        if (!running) { cancelAnimationFrame(raf); raf = 0 }
      }
      document.addEventListener('visibilitychange', onVis)
      return () => {
        cancelAnimationFrame(raf)
        ro.disconnect()
        document.removeEventListener('visibilitychange', onVis)
      }
    } else {
      // static single pass
      draw(); running = false; cancelAnimationFrame(raf)
      return () => ro.disconnect()
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
        opacity: 0.55,
        zIndex: 0,
      }}
    />
  )
}

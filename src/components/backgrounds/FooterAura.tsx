import { useEffect, useRef } from 'react'

/**
 * Premium footer wallpaper: layered aurora waves + rising gold embers
 * + a faint starfield. Only animates while the footer is on screen.
 */
export default function FooterAura() {
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

    const stars = Array.from({ length: 60 }, () => ({
      x: Math.random(), y: Math.random(),
      r: Math.random() * 1.3 + 0.3,
      tw: Math.random() * Math.PI * 2,
    }))
    const bursts: { x: number; y: number; life: number; r: number }[] = []

    type Ember = { x: number; y: number; vy: number; r: number; life: number; max: number }
    const embers: Ember[] = []
    const spawnEmber = (): Ember => ({
      x: Math.random() * w,
      y: h + 10,
      vy: 0.25 + Math.random() * 0.6,
      r: 0.6 + Math.random() * 1.8,
      life: 0,
      max: 200 + Math.random() * 200,
    })

    let raf = 0, t = 0
    let onScreen = true
    let running = true

    const wave = (yBase: number, amp: number, len: number, phase: number, color: string) => {
      ctx.beginPath()
      ctx.moveTo(0, h)
      for (let x = 0; x <= w; x += 8) {
        const y = yBase + Math.sin((x / len) + phase) * amp + Math.sin((x / (len * 0.4)) + phase * 1.7) * amp * 0.4
        ctx.lineTo(x, y)
      }
      ctx.lineTo(w, h)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
    }

    const draw = () => {
      if (!running || !onScreen) { raf = 0; return }
      t += 1
      ctx.clearRect(0, 0, w, h)

      // starfield
      for (const s of stars) {
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.03 + s.tw))
        ctx.fillStyle = `rgba(200,180,140,${a})`
        ctx.beginPath()
        ctx.arc(s.x * w, s.y * h * 0.7, s.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // aurora waves (back to front)
      wave(h * 0.62, 16, 120, t * 0.012, 'rgba(120,95,55,0.18)')
      wave(h * 0.74, 20, 160, t * 0.016 + 1.5, 'rgba(160,130,70,0.16)')
      wave(h * 0.86, 24, 200, t * 0.02 + 3, 'rgba(200,169,110,0.14)')

      // embers
      if (embers.length < 48 && t % 6 === 0) embers.push(spawnEmber())
      ctx.globalCompositeOperation = 'lighter'
      for (let i = embers.length - 1; i >= 0; i--) {
        const e = embers[i]
        e.life += 1
        e.y -= e.vy
        e.x += Math.sin((e.life + e.y) * 0.02) * 0.3
        const k = 1 - e.life / e.max
        if (k <= 0 || e.y < -10) { embers.splice(i, 1); continue }
        const g = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, e.r * 3)
        g.addColorStop(0, `rgba(220,190,120,${0.6 * k})`)
        g.addColorStop(1, 'rgba(220,190,120,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(e.x, e.y, e.r * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalCompositeOperation = 'source-over'

      for (let i = bursts.length - 1; i >= 0; i--) {
        const b = bursts[i]
        b.life -= 0.03
        b.r += 1.7
        if (b.life <= 0) { bursts.splice(i, 1); continue }
        ctx.strokeStyle = `rgba(130,247,255,${b.life * 0.45})`
        ctx.lineWidth = 1 + (1 - b.life) * 2.5
        ctx.beginPath()
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }

    const kick = () => { if (!raf && running && onScreen) raf = requestAnimationFrame(draw) }
    const onPointerDown = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      bursts.push({ x: e.clientX - r.left, y: e.clientY - r.top, life: 1, r: 0 })
      kick()
    }

    const io = new IntersectionObserver(
      (entries) => { onScreen = entries[0]?.isIntersecting ?? false; kick() },
      { threshold: 0 }
    )
    io.observe(canvas)

    const onVis = () => { running = !document.hidden; if (running) kick(); else { cancelAnimationFrame(raf); raf = 0 } }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pointerdown', onPointerDown, { passive: true })

    if (reduce) { onScreen = true; draw(); cancelAnimationFrame(raf); raf = 0; running = false }
    else kick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointerdown', onPointerDown)
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
        zIndex: 0,
      }}
    />
  )
}

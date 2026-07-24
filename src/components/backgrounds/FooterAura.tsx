import { useEffect, useRef } from 'react'

/**
 * Premium footer wallpaper: layered aurora waves + rising, interactive bubbles
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

    type Bubble = {
      x: number; y: number; vx: number; vy: number; r: number; life: number; max: number; hue: number
    }
    const bubbles: Bubble[] = []
    const pointer = { x: -1000, y: -1000, active: false }
    const spawnBubble = (): Bubble => ({
      x: Math.random() * w,
      y: h + 36,
      vx: (Math.random() - 0.5) * 0.22,
      vy: -(0.22 + Math.random() * 0.5),
      r: 8 + Math.random() * 22,
      life: 0,
      max: 460 + Math.random() * 320,
      hue: Math.random() > 0.55 ? 190 : 268,
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

      // Bubbles rise from beneath the footer, react to pointer/touch, then drift out above it.
      if (bubbles.length < 20 && t % 16 === 0) bubbles.push(spawnBubble())
      ctx.globalCompositeOperation = 'lighter'
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const bubble = bubbles[i]
        bubble.life += 1
        bubble.vx += Math.sin((bubble.life + bubble.y) * 0.025) * 0.008
        if (pointer.active) {
          const dx = bubble.x - pointer.x
          const dy = bubble.y - pointer.y
          const distance = Math.hypot(dx, dy) || 1
          const reach = bubble.r + 116
          if (distance < reach) {
            const force = ((reach - distance) / reach) * 0.7
            bubble.vx += (dx / distance) * force
            bubble.vy += (dy / distance) * force
          }
        }
        bubble.vx *= 0.986
        bubble.vy = Math.min(-0.15, bubble.vy * 0.994)
        bubble.x += bubble.vx
        bubble.y += bubble.vy
        const k = Math.min(1, bubble.life / 40, (bubble.max - bubble.life) / 100)
        if (k <= 0 || bubble.y < -bubble.r * 2) { bubbles.splice(i, 1); continue }
        if (bubble.x < -bubble.r || bubble.x > w + bubble.r) bubble.vx *= -0.8
        const g = ctx.createRadialGradient(
          bubble.x - bubble.r * 0.3, bubble.y - bubble.r * 0.35, bubble.r * 0.1,
          bubble.x, bubble.y, bubble.r
        )
        g.addColorStop(0, `hsla(${bubble.hue}, 100%, 92%, ${0.38 * k})`)
        g.addColorStop(0.28, `hsla(${bubble.hue}, 88%, 68%, ${0.18 * k})`)
        g.addColorStop(0.72, `hsla(${bubble.hue}, 90%, 58%, ${0.06 * k})`)
        g.addColorStop(1, `hsla(${bubble.hue}, 90%, 58%, 0)`)
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2)
        ctx.fill()
        ctx.strokeStyle = `hsla(${bubble.hue}, 100%, 82%, ${0.34 * k})`
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.arc(bubble.x, bubble.y, bubble.r * 0.82, 0, Math.PI * 2)
        ctx.stroke()
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
    const updatePointer = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
      pointer.active = pointer.x >= 0 && pointer.x <= r.width && pointer.y >= 0 && pointer.y <= r.height
    }
    const onPointerDown = (e: PointerEvent) => {
      updatePointer(e)
      if (!pointer.active) return
      bursts.push({ x: pointer.x, y: pointer.y, life: 1, r: 0 })
      kick()
    }
    const onPointerMove = (e: PointerEvent) => { updatePointer(e); kick() }
    const onPointerLeave = (e: PointerEvent) => { updatePointer(e) }

    const io = new IntersectionObserver(
      (entries) => { onScreen = entries[0]?.isIntersecting ?? false; kick() },
      { threshold: 0 }
    )
    io.observe(canvas)

    const onVis = () => { running = !document.hidden; if (running) kick(); else { cancelAnimationFrame(raf); raf = 0 } }
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('pointerdown', onPointerDown, { passive: true })
    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('pointerout', onPointerLeave, { passive: true })

    if (reduce) { onScreen = true; draw(); cancelAnimationFrame(raf); raf = 0; running = false }
    else kick()

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerout', onPointerLeave)
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

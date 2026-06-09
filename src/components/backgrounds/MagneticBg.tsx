import { useEffect, useRef } from 'react'

type Particle = {
  x: number; y: number; ox: number; oy: number
  vx: number; vy: number
  size: number; charge: number; hue: number
}

export default function MagneticBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0, raf = 0, t = 0
    let particles: Particle[] = []
    const mouse = { x: -9999, y: -9999, active: false }
    const POLE_STRENGTH = 320  // radius of magnetic effect

    const makeParticles = () => {
      const count = Math.min(380, Math.floor((W * H) / 5200))
      particles = Array.from({ length: count }, () => {
        const ox = Math.random() * W
        const oy = Math.random() * H
        return {
          x: ox, y: oy, ox, oy,
          vx: 0, vy: 0,
          size: 1.2 + Math.random() * 2.8,
          charge: Math.random() < 0.5 ? 1 : -1,
          hue: 40 + Math.random() * 30,
        }
      })
    }

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
      makeParticles()
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.x = x; mouse.y = y; mouse.active = true
      } else {
        mouse.x = -9999; mouse.y = -9999; mouse.active = false
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    resize()

    let onScreen = true
    const draw = () => {
      if (!onScreen) { raf = 0; return }
      t++
      ctx.clearRect(0, 0, W, H)

      // Magnetic field haze at cursor
      if (mouse.active) {
        for (let ring = 0; ring < 3; ring++) {
          const r = 60 + ring * 55
          const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, r)
          g.addColorStop(0, `rgba(200,169,110,${0.04 - ring * 0.01})`)
          g.addColorStop(1, 'rgba(200,169,110,0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Sort by size for depth effect
      const sorted = [...particles].sort((a, b) => a.size - b.size)

      // Draw field lines between close particles
      ctx.lineWidth = 0.4
      for (let i = 0; i < sorted.length; i++) {
        const p = sorted[i]
        for (let j = i + 1; j < sorted.length; j++) {
          const q = sorted[j]
          const dx = q.x - p.x, dy = q.y - p.y
          const d2 = dx * dx + dy * dy
          if (d2 > 2500) continue  // 50px threshold
          const d = Math.sqrt(d2)
          const strength = (1 - d / 50) * 0.3
          ctx.strokeStyle = `rgba(200,169,110,${strength})`
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke()
        }
      }

      // Physics + draw particles
      for (const p of particles) {
        // Spring back to rest (gentle)
        p.vx += (p.ox - p.x) * 0.008
        p.vy += (p.oy - p.y) * 0.008

        if (mouse.active) {
          const dx = mouse.x - p.x, dy = mouse.y - p.y
          const d2 = dx * dx + dy * dy
          if (d2 < POLE_STRENGTH * POLE_STRENGTH && d2 > 1) {
            const d = Math.sqrt(d2)
            // Positive charges get pulled, negative get a slight orbital push
            const forceMag = ((POLE_STRENGTH - d) / POLE_STRENGTH) ** 1.5 * 3.8
            if (p.charge === 1) {
              p.vx += (dx / d) * forceMag
              p.vy += (dy / d) * forceMag
            } else {
              // Orbit tangentially
              p.vx += (-dy / d) * forceMag * 0.6 + (dx / d) * forceMag * 0.4
              p.vy += (dx / d) * forceMag * 0.6 + (dy / d) * forceMag * 0.4
            }

            // Repel when very close — stops clumping
            if (d < 40) {
              p.vx -= (dx / d) * (40 - d) * 0.35
              p.vy -= (dy / d) * (40 - d) * 0.35
            }
          }
        }

        // Damp
        p.vx *= 0.82; p.vy *= 0.82
        p.x += p.vx; p.y += p.vy

        // Draw
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        const proximity = mouse.active ? Math.max(0, 1 - md / POLE_STRENGTH) : 0
        const brightness = 45 + proximity * 40
        const alpha = 0.25 + proximity * 0.65

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size + proximity * 2, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue},${70 + proximity * 25}%,${brightness}%,${alpha})`
        ctx.fill()

        // Glow on close particles
        if (proximity > 0.4) {
          const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 5)
          g.addColorStop(0, `rgba(200,169,110,${proximity * 0.3})`)
          g.addColorStop(1, 'rgba(200,169,110,0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 5, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Draw pulsing magnetic rings around cursor
      if (mouse.active) {
        const pulseR = 20 + (t % 90) * 2
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, pulseR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(200,169,110,${0.3 * (1 - (t % 90) / 90)})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

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
    document.addEventListener("visibilitychange", onVis)
    draw()

    return () => {
      cancelAnimationFrame(raf)
      io.disconnect()
      document.removeEventListener("visibilitychange", onVis)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
    />
  )
}

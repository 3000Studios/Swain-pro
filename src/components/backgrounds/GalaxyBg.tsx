import { useEffect, useRef } from 'react'

type Star = {
  x: number; y: number; ox: number; oy: number
  vx: number; vy: number
  size: number; brightness: number; hue: number
  twinklePhase: number
}

export default function GalaxyBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0, raf = 0, t = 0
    let stars: Star[] = []
    const mouse = { x: -9999, y: -9999, active: false }
    const GRAV_R = 300
    const GRAV_STRENGTH = 2.8

    const makeStars = () => {
      const count = Math.min(1200, Math.floor((W * H) / 600)) // slightly fewer stars for clean constellation look
      stars = Array.from({ length: count }, () => {
        const ox = Math.random() * W, oy = Math.random() * H
        // Hues: 43 (gold/yellow) or 210 (slate grey/blue) or 60 (ivory)
        const hues = [43, 210, 60]
        return {
          x: ox, y: oy, ox, oy, vx: 0, vy: 0,
          size: Math.random() < 0.05 ? 2.0 + Math.random() * 1.5 : 0.6 + Math.random() * 1.2,
          brightness: 0.25 + Math.random() * 0.75,
          hue: hues[Math.floor(Math.random() * hues.length)],
          twinklePhase: Math.random() * Math.PI * 2,
        }
      })
    }

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
      makeStars()
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

      // Ambient Slate/Gold corporate space blobs
      const nebulae = [
        { x: W * 0.25, y: H * 0.35, r: W * 0.25, h: 43, s: 60 },  // gold
        { x: W * 0.7, y: H * 0.55, r: W * 0.22, h: 210, s: 40 },  // slate grey
        { x: W * 0.5, y: H * 0.2, r: W * 0.18, h: 43, s: 50 },
      ]
      for (const nb of nebulae) {
        const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r)
        g.addColorStop(0, `hsla(${nb.h},${nb.s}%,25%,0.035)`)
        g.addColorStop(0.5, `hsla(${nb.h},${nb.s}%,15%,0.02)`)
        g.addColorStop(1, 'hsla(0,0%,0%,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }

      // Gravitational gold vortex glow
      if (mouse.active) {
        const gv = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, GRAV_R)
        gv.addColorStop(0, 'rgba(212,175,55,0.06)')
        gv.addColorStop(0.4, 'rgba(100,116,139,0.03)')
        gv.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = gv
        ctx.fillRect(0, 0, W, H)
      }

      // Physics + draw
      for (const s of stars) {
        const twinkle = 0.7 + Math.sin(t * 0.04 + s.twinklePhase) * 0.3

        if (mouse.active) {
          const dx = mouse.x - s.x, dy = mouse.y - s.y
          const d2 = dx * dx + dy * dy
          if (d2 < GRAV_R * GRAV_R && d2 > 1) {
            const d = Math.sqrt(d2)
            const gravForce = ((GRAV_R - d) / GRAV_R) ** 1.4 * GRAV_STRENGTH

            // Pull in + orbital tangent — creates spiraling vortex
            const tanX = -dy / d, tanY = dx / d
            s.vx += (dx / d) * gravForce * 0.55 + tanX * gravForce * 0.7
            s.vy += (dy / d) * gravForce * 0.55 + tanY * gravForce * 0.7
          }
        }

        // Slow return to rest when far from cursor
        s.vx += (s.ox - s.x) * 0.004
        s.vy += (s.oy - s.y) * 0.004
        s.vx *= 0.88; s.vy *= 0.88
        s.x += s.vx; s.y += s.vy

        const mdx = s.x - mouse.x, mdy = s.y - mouse.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        const proximity = mouse.active ? Math.max(0, 1 - md / GRAV_R) : 0

        const alpha = s.brightness * twinkle * (0.4 + proximity * 0.5)

        // Bright geometric star core
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size * (1 + proximity * 0.6), 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${s.hue},${50 + proximity * 30}%,${75 + proximity * 15}%,${alpha})`
        ctx.fill()

        // Larger stars get a soft gold halo
        if (s.size > 1.8 || proximity > 0.5) {
          const haloR = s.size * 3.5 + proximity * 6
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR)
          g.addColorStop(0, `rgba(212, 175, 55, ${alpha * 0.3})`)
          g.addColorStop(1, 'rgba(212, 175, 55, 0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Draw geometric constellation line links
      ctx.lineWidth = 0.3
      const numConstellation = Math.min(150, stars.length)
      for (let i = 0; i < numConstellation; i++) {
        const s1 = stars[i]
        for (let j = i + 1; j < numConstellation; j++) {
          const s2 = stars[j]
          const dx = s2.x - s1.x, dy = s2.y - s1.y
          const d2 = dx * dx + dy * dy
          if (d2 < 6400) { // 80px connection radius
            const d = Math.sqrt(d2)
            const alpha = (1 - d / 80) * 0.16
            ctx.strokeStyle = `rgba(212, 175, 55, ${alpha})`
            ctx.beginPath(); ctx.moveTo(s1.x, s1.y); ctx.lineTo(s2.x, s2.y); ctx.stroke()
          }
        }
      }

      // Event horizon gold ring at cursor
      if (mouse.active) {
        const ringR = 12 + Math.sin(t * 0.08) * 4
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(212,175,55,0.4)'
        ctx.lineWidth = 0.8
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, ringR * 2, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(212,175,55,0.15)'
        ctx.lineWidth = 0.5
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

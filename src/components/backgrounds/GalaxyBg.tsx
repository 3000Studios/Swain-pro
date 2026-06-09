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
      const count = Math.min(2200, Math.floor((W * H) / 420))
      stars = Array.from({ length: count }, () => {
        const ox = Math.random() * W, oy = Math.random() * H
        return {
          x: ox, y: oy, ox, oy, vx: 0, vy: 0,
          size: Math.random() < 0.04 ? 2.2 + Math.random() * 1.4 : 0.5 + Math.random() * 1.2,
          brightness: 0.2 + Math.random() * 0.8,
          hue: Math.random() < 0.3 ? 200 + Math.random() * 60 : (Math.random() < 0.5 ? 30 + Math.random() * 20 : 270 + Math.random() * 40),
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

    const draw = () => {
      t++
      ctx.clearRect(0, 0, W, H)

      // Deep space nebula blobs
      const nebulae = [
        { x: W * 0.2, y: H * 0.3, r: W * 0.3, h: 260, s: 80 },
        { x: W * 0.75, y: H * 0.6, r: W * 0.25, h: 300, s: 70 },
        { x: W * 0.5, y: H * 0.15, r: W * 0.2, h: 220, s: 60 },
      ]
      for (const nb of nebulae) {
        const g = ctx.createRadialGradient(nb.x, nb.y, 0, nb.x, nb.y, nb.r)
        g.addColorStop(0, `hsla(${nb.h},${nb.s}%,35%,0.04)`)
        g.addColorStop(0.5, `hsla(${nb.h},${nb.s}%,25%,0.025)`)
        g.addColorStop(1, 'hsla(0,0%,0%,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }

      // Gravitational vortex glow
      if (mouse.active) {
        const gv = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, GRAV_R)
        gv.addColorStop(0, 'rgba(180,130,255,0.08)')
        gv.addColorStop(0.4, 'rgba(100,80,200,0.04)')
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

        const alpha = s.brightness * twinkle * (0.5 + proximity * 0.5)

        // Bright core
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.size * (1 + proximity * 0.8), 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${s.hue},${60 + proximity * 30}%,${80 + proximity * 15}%,${alpha})`
        ctx.fill()

        // Larger stars get a soft halo
        if (s.size > 1.8 || proximity > 0.5) {
          const haloR = s.size * 3.5 + proximity * 6
          const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, haloR)
          g.addColorStop(0, `hsla(${s.hue},80%,90%,${alpha * 0.4})`)
          g.addColorStop(1, 'hsla(0,0%,0%,0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(s.x, s.y, haloR, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Event horizon ring at cursor
      if (mouse.active) {
        const ringR = 12 + Math.sin(t * 0.08) * 4
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, ringR, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(200,160,255,0.4)'
        ctx.lineWidth = 1
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(mouse.x, mouse.y, ringR * 2, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(200,160,255,0.15)'
        ctx.lineWidth = 0.6
        ctx.stroke()
      }

      raf = requestAnimationFrame(draw)
    }
    draw()

    return () => {
      cancelAnimationFrame(raf)
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

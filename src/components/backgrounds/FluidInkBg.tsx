import { useEffect, useRef } from 'react'

type InkDrop = {
  x: number; y: number; vx: number; vy: number
  r: number; maxR: number
  hue: number; alpha: number
  life: number; maxLife: number
}

type InkTrail = {
  x: number; y: number; size: number; hue: number; alpha: number; age: number
}

export default function FluidInkBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0, raf = 0, t = 0
    const drops: InkDrop[] = []
    const trails: InkTrail[] = []
    const mouse = { x: -9999, y: -9999, px: -9999, py: -9999, active: false }

    // Palette of ink colors (dark, rich, contrast against ivory bg)
    const INK_HUES = [220, 250, 270, 40, 200, 280, 30]

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }

    const spawnDrop = (x: number, y: number, vx: number, vy: number) => {
      const hue = INK_HUES[Math.floor(Math.random() * INK_HUES.length)]
      const maxR = 18 + Math.random() * 40
      drops.push({ x, y, vx, vy, r: 0, maxR, hue, alpha: 0.55 + Math.random() * 0.35, life: 0, maxLife: 90 + Math.random() * 60 })
      if (drops.length > 40) drops.splice(0, drops.length - 40)
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.active = true

        // Trail particle at mouse pos
        if (mouse.active && (Math.hypot(x - mouse.px, y - mouse.py) > 8)) {
          const hue = INK_HUES[Math.floor(Math.random() * INK_HUES.length)]
          trails.push({ x, y, size: 2 + Math.random() * 5, hue, alpha: 0.5, age: 0 })

          // Spawn ink drop on fast movement
          const speed = Math.hypot(x - mouse.px, y - mouse.py)
          if (speed > 18) {
            const vx = (x - mouse.px) * 0.03
            const vy = (y - mouse.py) * 0.03
            spawnDrop(x, y, vx + (Math.random() - 0.5) * 0.5, vy + (Math.random() - 0.5) * 0.5)
          }
          mouse.px = x; mouse.py = y
        }

        mouse.x = x; mouse.y = y
      } else {
        mouse.x = -9999; mouse.y = -9999; mouse.active = false
      }
    }

    // Occasional ambient drips even without mouse
    let nextAmbient = 120

    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    resize()

    const draw = () => {
      t++
      ctx.clearRect(0, 0, W, H)

      // Ambient drops every now and then
      if (t >= nextAmbient) {
        spawnDrop(
          Math.random() * W,
          Math.random() * H,
          (Math.random() - 0.5) * 0.3,
          (Math.random() - 0.5) * 0.3,
        )
        nextAmbient = t + 60 + Math.floor(Math.random() * 80)
      }

      // Draw ink drops (expanding circles with feathered edge)
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i]
        d.life++
        d.r = d.maxR * Math.min(1, d.life / 25)
        d.vx *= 0.97; d.vy *= 0.97
        d.x += d.vx; d.y += d.vy
        const fade = d.life > d.maxLife * 0.6 ? 1 - (d.life - d.maxLife * 0.6) / (d.maxLife * 0.4) : 1
        const a = d.alpha * fade

        if (d.life > d.maxLife || a < 0.01) { drops.splice(i, 1); continue }

        // Feathered ink blob
        const g = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r)
        g.addColorStop(0, `hsla(${d.hue},65%,25%,${a * 0.7})`)
        g.addColorStop(0.5, `hsla(${d.hue},60%,30%,${a * 0.45})`)
        g.addColorStop(0.8, `hsla(${d.hue},55%,35%,${a * 0.2})`)
        g.addColorStop(1, `hsla(${d.hue},50%,40%,0)`)
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2); ctx.fill()

        // Ink texture — small satellite drops
        if (d.r > 15 && d.life < 30) {
          for (let k = 0; k < 3; k++) {
            const sa = (k / 3) * Math.PI * 2 + d.life * 0.2
            const sr = d.r * 0.6 + Math.random() * d.r * 0.4
            const sx = d.x + Math.cos(sa) * sr
            const sy = d.y + Math.sin(sa) * sr
            ctx.beginPath(); ctx.arc(sx, sy, 1.5 + Math.random() * 2, 0, Math.PI * 2)
            ctx.fillStyle = `hsla(${d.hue},60%,28%,${a * 0.35})`
            ctx.fill()
          }
        }
      }

      // Draw trails
      for (let i = trails.length - 1; i >= 0; i--) {
        const tr = trails[i]
        tr.age++
        const fade = 1 - tr.age / 40
        if (fade <= 0) { trails.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(tr.x, tr.y, tr.size * fade, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${tr.hue},60%,28%,${tr.alpha * fade * 0.4})`
        ctx.fill()
      }

      // Cursor ink splatter effect
      if (mouse.active && mouse.x > 0) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 22)
        const hue = INK_HUES[Math.floor((t * 0.02) % INK_HUES.length)]
        g.addColorStop(0, `hsla(${hue},65%,25%,0.12)`)
        g.addColorStop(1, 'hsla(0,0%,0%,0)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 22, 0, Math.PI * 2); ctx.fill()
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

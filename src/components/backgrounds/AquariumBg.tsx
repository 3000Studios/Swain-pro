import { useEffect, useRef } from 'react'

type Fish = {
  x: number; y: number; vx: number; vy: number
  size: number; hue: number; phase: number; depth: number
}
type Ripple = { x: number; y: number; r: number; life: number }

export default function AquariumBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0, raf = 0, t = 0
    let fish: Fish[] = []
    const ripples: Ripple[] = []
    const mouse = { x: -9999, y: -9999, px: -9999, py: -9999 }

    const makeFish = (): Fish => ({
      x: Math.random() * W,
      y: H * 0.15 + Math.random() * H * 0.7,
      vx: (Math.random() - 0.5) * 1.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: 9 + Math.random() * 16,
      hue: 190 + Math.random() * 40,
      phase: Math.random() * Math.PI * 2,
      depth: 0.4 + Math.random() * 0.6,
    })

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
      fish = Array.from({ length: 14 }, makeFish)
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        if (Math.hypot(x - mouse.px, y - mouse.py) > 20) {
          ripples.push({ x, y, r: 0, life: 1 })
          mouse.px = x; mouse.py = y
        }
        mouse.x = x; mouse.y = y
      } else {
        mouse.x = -9999; mouse.y = -9999
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    resize()

    const drawFish = (f: Fish) => {
      ctx.save()
      ctx.translate(f.x, f.y)
      const speed = Math.hypot(f.vx, f.vy)
      ctx.rotate(Math.atan2(f.vy, f.vx))
      const wobble = Math.sin(t * 0.07 + f.phase) * 0.18 * Math.min(1, speed * 0.8)
      ctx.rotate(wobble)

      const alpha = f.depth * 0.55
      ctx.fillStyle = `hsla(${f.hue},70%,55%,${alpha})`

      // Body
      ctx.beginPath()
      ctx.ellipse(0, 0, f.size, f.size * 0.38, 0, 0, Math.PI * 2)
      ctx.fill()

      // Tail fin
      ctx.beginPath()
      ctx.moveTo(-f.size * 0.75, 0)
      ctx.lineTo(-f.size * 1.55, -f.size * 0.45)
      ctx.lineTo(-f.size * 1.55,  f.size * 0.45)
      ctx.closePath()
      ctx.fill()

      // Dorsal fin
      ctx.beginPath()
      ctx.moveTo(f.size * 0.1, -f.size * 0.38)
      ctx.quadraticCurveTo(0, -f.size * 0.75, -f.size * 0.3, -f.size * 0.38)
      ctx.closePath()
      ctx.fill()

      // Eye
      ctx.beginPath()
      ctx.arc(f.size * 0.55, -f.size * 0.08, f.size * 0.1, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0,0,0,${alpha * 0.8})`
      ctx.fill()

      ctx.restore()
    }

    let raf2 = 0

    const draw = () => {
      t++
      ctx.clearRect(0, 0, W, H)

      // Water gradient
      const bg = ctx.createLinearGradient(0, 0, 0, H)
      bg.addColorStop(0, 'rgba(10,140,200,0.07)')
      bg.addColorStop(1, 'rgba(0,80,150,0.13)')
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)

      // Caustic patches
      for (let i = 0; i < 5; i++) {
        const cx = W * (i / 4) + Math.sin(t * 0.009 + i) * 90
        const cy = H * 0.08 + Math.cos(t * 0.007 + i * 1.9) * 50
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, 130)
        g.addColorStop(0, 'rgba(0,200,255,0.04)')
        g.addColorStop(1, 'rgba(0,200,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }

      // Tsunami wave at mouse X — build-up of sine distortion
      ctx.beginPath()
      ctx.moveTo(0, H)
      for (let x = 0; x <= W; x += 3) {
        let y = H * 0.5 + Math.sin(x * 0.018 + t * 0.035) * 10 + Math.sin(x * 0.007 - t * 0.02) * 15
        const distX = Math.abs(x - mouse.x)
        if (distX < 280 && mouse.x > 0) {
          const waveFactor = (1 - distX / 280) ** 2
          y += Math.sin((x - mouse.x) * 0.045 - t * 0.08) * waveFactor * 55
          y -= waveFactor * 18
        }
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.lineTo(W, H); ctx.closePath()
      ctx.fillStyle = 'rgba(0,160,230,0.055)'
      ctx.fill()

      // Second wave layer
      ctx.beginPath()
      for (let x = 0; x <= W; x += 4) {
        let y = H * 0.55 + Math.sin(x * 0.013 - t * 0.028) * 8 + Math.sin(x * 0.022 + t * 0.019) * 6
        const distX = Math.abs(x - mouse.x)
        if (distX < 220 && mouse.x > 0) {
          const wf = (1 - distX / 220) ** 2
          y += Math.sin((x - mouse.x) * 0.035 - t * 0.065) * wf * 35
        }
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
      }
      ctx.lineTo(W, H); ctx.closePath()
      ctx.fillStyle = 'rgba(0,140,210,0.04)'
      ctx.fill()

      // Ripple rings
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i]
        rp.r += 3.5; rp.life -= 0.02
        if (rp.life <= 0) { ripples.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0,200,255,${rp.life * 0.35})`
        ctx.lineWidth = 1.5
        ctx.stroke()
        if (rp.r > 25) {
          ctx.beginPath()
          ctx.arc(rp.x, rp.y, rp.r * 0.55, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(0,200,255,${rp.life * 0.18})`
          ctx.lineWidth = 1
          ctx.stroke()
        }
      }

      // Bubbles
      for (let i = 0; i < 8; i++) {
        const bx = ((W * (i / 7)) + Math.sin(t * 0.025 + i * 2.3) * 30)
        const by = H - ((t * 0.55 + i * (H / 8)) % H)
        const br = 1.5 + i * 0.4
        ctx.beginPath()
        ctx.arc(bx, by, br, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(0,200,255,0.22)'
        ctx.lineWidth = 0.7
        ctx.stroke()
        // Shine
        ctx.beginPath()
        ctx.arc(bx - br * 0.3, by - br * 0.3, br * 0.3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.2)'
        ctx.fill()
      }

      // Fish AI
      for (const f of fish) {
        // Flee mouse
        const dx = f.x - mouse.x, dy = f.y - mouse.y
        const d = Math.hypot(dx, dy)
        if (d < 160 && d > 0) {
          f.vx += (dx / d) * 0.9
          f.vy += (dy / d) * 0.5
        }
        // Gentle random drift
        f.vx += (Math.random() - 0.5) * 0.08
        f.vy += (Math.random() - 0.5) * 0.035
        // Damp
        f.vx *= 0.975; f.vy *= 0.975
        // Speed limits
        const sp = Math.hypot(f.vx, f.vy)
        if (sp > 3.2) { f.vx = f.vx / sp * 3.2; f.vy = f.vy / sp * 3.2 }
        if (sp < 0.4) { f.vx *= 1.15; f.vy *= 1.15 }
        // Boundaries
        f.x += f.vx; f.y += f.vy
        if (f.x < -60)  f.x = W + 60
        if (f.x > W + 60) f.x = -60
        if (f.y < 20) { f.y = 20; f.vy = Math.abs(f.vy) }
        if (f.y > H - 20) { f.y = H - 20; f.vy = -Math.abs(f.vy) }

        drawFish(f)
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

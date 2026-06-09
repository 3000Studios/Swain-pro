import { useEffect, useRef } from 'react'

type Bolt = {
  points: { x: number; y: number }[]
  alpha: number
  hue: number
  width: number
}

function buildBolt(
  x1: number, y1: number,
  x2: number, y2: number,
  roughness: number,
  minSeg: number,
): { x: number; y: number }[] {
  if (Math.hypot(x2 - x1, y2 - y1) < minSeg) return [{ x: x1, y: y1 }, { x: x2, y: y2 }]

  const mx = (x1 + x2) * 0.5 + (Math.random() - 0.5) * roughness
  const my = (y1 + y2) * 0.5 + (Math.random() - 0.5) * roughness

  return [
    ...buildBolt(x1, y1, mx, my, roughness * 0.6, minSeg),
    ...buildBolt(mx, my, x2, y2, roughness * 0.6, minSeg).slice(1),
  ]
}

export default function LightningBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0, raf = 0, t = 0
    const bolts: Bolt[] = []
    const mouse = { x: W * 0.5, y: H * 0.5, active: false }

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
      mouse.x = W * 0.5; mouse.y = H * 0.5
    }

    const spawnBolt = () => {
      // Pick a random edge origin
      const side = Math.floor(Math.random() * 4)
      let ox: number, oy: number
      if (side === 0) { ox = Math.random() * W; oy = 0 }
      else if (side === 1) { ox = W; oy = Math.random() * H }
      else if (side === 2) { ox = Math.random() * W; oy = H }
      else { ox = 0; oy = Math.random() * H }

      const roughness = 80 + Math.random() * 120
      const pts = buildBolt(ox, oy, mouse.x, mouse.y, roughness, 12)

      const bolt: Bolt = { points: pts, alpha: 0.85, hue: 260 + Math.random() * 40, width: 1 + Math.random() * 1.8 }
      bolts.push(bolt)

      // Branches off main bolt
      if (Math.random() < 0.65 && pts.length > 4) {
        const branchIdx = Math.floor(pts.length * 0.3 + Math.random() * pts.length * 0.4)
        const bp = pts[branchIdx]
        const bex = bp.x + (Math.random() - 0.5) * 200
        const bey = bp.y + (Math.random() - 0.5) * 200
        bolts.push({
          points: buildBolt(bp.x, bp.y, bex, bey, 50, 10),
          alpha: 0.5,
          hue: bolt.hue + 20,
          width: bolt.width * 0.5,
        })
      }
      if (bolts.length > 18) bolts.splice(0, bolts.length - 18)
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.x = x; mouse.y = y; mouse.active = true
      } else {
        mouse.active = false
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    resize()

    // Periodically spawn bolts
    let nextBolt = 0

    let onScreen = true
    const draw = () => {
      if (!onScreen) { raf = 0; return }
      t++
      ctx.clearRect(0, 0, W, H)

      // Subtle plasma haze
      if (mouse.active) {
        const g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 120)
        g.addColorStop(0, 'rgba(120,60,255,0.06)')
        g.addColorStop(1, 'rgba(120,60,255,0)')
        ctx.fillStyle = g
        ctx.fillRect(0, 0, W, H)
      }

      // Spawn rhythm — faster on mouse activity
      if (t >= nextBolt) {
        spawnBolt()
        nextBolt = t + (mouse.active ? 8 + Math.floor(Math.random() * 18) : 25 + Math.floor(Math.random() * 40))
      }

      // Draw + fade bolts
      for (let i = bolts.length - 1; i >= 0; i--) {
        const b = bolts[i]
        b.alpha *= 0.91
        if (b.alpha < 0.03) { bolts.splice(i, 1); continue }

        // Outer glow pass
        ctx.lineWidth = b.width * 4
        ctx.strokeStyle = `hsla(${b.hue},90%,75%,${b.alpha * 0.15})`
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.beginPath()
        ctx.moveTo(b.points[0].x, b.points[0].y)
        for (let k = 1; k < b.points.length; k++) ctx.lineTo(b.points[k].x, b.points[k].y)
        ctx.stroke()

        // Mid glow
        ctx.lineWidth = b.width * 2
        ctx.strokeStyle = `hsla(${b.hue},80%,80%,${b.alpha * 0.35})`
        ctx.beginPath()
        ctx.moveTo(b.points[0].x, b.points[0].y)
        for (let k = 1; k < b.points.length; k++) ctx.lineTo(b.points[k].x, b.points[k].y)
        ctx.stroke()

        // Core
        ctx.lineWidth = b.width
        ctx.strokeStyle = `hsla(${b.hue - 20},100%,92%,${b.alpha})`
        ctx.beginPath()
        ctx.moveTo(b.points[0].x, b.points[0].y)
        for (let k = 1; k < b.points.length; k++) ctx.lineTo(b.points[k].x, b.points[k].y)
        ctx.stroke()
      }

      // Strike corona at mouse
      if (mouse.active && bolts.length > 0) {
        const corona = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 28)
        corona.addColorStop(0, 'rgba(200,160,255,0.18)')
        corona.addColorStop(1, 'rgba(200,160,255,0)')
        ctx.fillStyle = corona
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 28, 0, Math.PI * 2); ctx.fill()
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

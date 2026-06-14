import { useEffect, useRef } from 'react'

/** Neural network — nodes wired by synapses. Signals fire along edges; the
 *  cursor becomes a live neuron that excites nearby nodes and lights their links. */

type Node = { x: number; y: number; vx: number; vy: number; r: number; pulse: number }
type Edge = { a: number; b: number; signal: number }

export default function NeuralNetBg({ light = false }: { light?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Clean corporate palette: Slate Grey and 24k Gold
    const edgeRGB = light ? '100,116,139' : '212,175,55'
    const sigRGB = '212,175,55'
    const edgeBaseMul = light ? 3.0 : 1
    const edgeNearMul = light ? 0.5 : 0.45

    let W = 0, H = 0, raf = 0, t = 0
    let nodes: Node[] = []
    let edges: Edge[] = []
    const mouse = { x: -9999, y: -9999, active: false }

    const build = () => {
      const count = Math.min(90, Math.floor((W * H) / 16000))
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        r: 1.4 + Math.random() * 2.2, pulse: 0,
      }))
      edges = []
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x, dy = nodes[i].y - nodes[j].y
          if (dx * dx + dy * dy < 165 * 165) edges.push({ a: i, b: j, signal: 0 })
        }
      }
    }
    const resize = () => { W = canvas.offsetWidth; H = canvas.offsetHeight; canvas.width = W; canvas.height = H; build() }
    const onMove = (e: MouseEvent) => {
      const r = canvas.getBoundingClientRect()
      const x = e.clientX - r.left, y = e.clientY - r.top
      if (x >= 0 && x <= r.width && y >= 0 && y <= r.height) { mouse.x = x; mouse.y = y; mouse.active = true }
      else mouse.active = false
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    resize()

    let onScreen = true
    const draw = () => {
      if (!onScreen) { raf = 0; return }
      t++
      ctx.clearRect(0, 0, W, H)

      // drift + fire random signals
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy
        if (n.x < 0 || n.x > W) n.vx *= -1
        if (n.y < 0 || n.y > H) n.vy *= -1
        if (n.pulse > 0) n.pulse -= 0.03
      }
      if (!reduce && t % 18 === 0 && edges.length) {
        const e = edges[Math.floor(Math.random() * edges.length)]
        e.signal = 1; nodes[e.a].pulse = 1
      }
      // cursor excites nearby nodes
      if (mouse.active) {
        for (const n of nodes) {
          const dx = n.x - mouse.x, dy = n.y - mouse.y
          if (dx * dx + dy * dy < 130 * 130) n.pulse = Math.max(n.pulse, 0.9)
        }
      }

      // edges
      for (const e of edges) {
        const a = nodes[e.a], b = nodes[e.b]
        const dx = a.x - b.x, dy = a.y - b.y
        const d = Math.sqrt(dx * dx + dy * dy)
        const near = mouse.active
          ? Math.max(0, 1 - Math.min(Math.hypot((a.x + b.x) / 2 - mouse.x, (a.y + b.y) / 2 - mouse.y), 200) / 200)
          : 0
        const base = (1 - d / 165) * 0.16 * edgeBaseMul
        ctx.strokeStyle = `rgba(${edgeRGB},${base + near * edgeNearMul})`
        ctx.lineWidth = (light ? 1.05 : 0.5) + near
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
        if (e.signal > 0) {
          const sx = b.x + (a.x - b.x) * e.signal, sy = b.y + (a.y - b.y) * e.signal
          ctx.fillStyle = `rgba(${sigRGB},${e.signal})`
          ctx.beginPath(); ctx.arc(sx, sy, light ? 2.8 : 2.2, 0, Math.PI * 2); ctx.fill()
          e.signal -= 0.04
          if (e.signal <= 0) nodes[e.b].pulse = 1
        }
      }
      // nodes
      for (const n of nodes) {
        const g = light ? 30 - n.pulse * 6 : 50 + n.pulse * 45
        ctx.beginPath(); ctx.arc(n.x, n.y, n.r + n.pulse * 2.5, 0, Math.PI * 2)
        ctx.fillStyle = light
          ? `rgba(100, 116, 139, ${0.4 + n.pulse * 0.45})`
          : `rgba(212, 175, 55, ${0.3 + n.pulse * 0.55})`
        ctx.fill()
        if (n.pulse > 0.3) {
          const rg = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 6)
          const halo = '212,175,55'
          rg.addColorStop(0, `rgba(${halo},${n.pulse * (light ? 0.22 : 0.3)})`); rg.addColorStop(1, `rgba(${halo},0)`)
          ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(n.x, n.y, n.r * 6, 0, Math.PI * 2); ctx.fill()
        }
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
    document.addEventListener('visibilitychange', onVis)
    draw()

    return () => {
      cancelAnimationFrame(raf); io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }} />
}

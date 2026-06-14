import { useEffect, useRef } from 'react'

type Node = { x: number; y: number; ox: number; oy: number; vx: number; vy: number }

export default function SpiderWebBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0, raf = 0, cols = 0, rows = 0
    const SPACING = 88
    let nodes: Node[] = []
    const mouse = { x: -9999, y: -9999 }

    const rebuild = () => {
      cols = Math.ceil(W / SPACING) + 2
      rows = Math.ceil(H / SPACING) + 2
      nodes = []
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const ox = c * SPACING - SPACING * 0.5
          const oy = r * SPACING - SPACING * 0.5
          // Deterministic jitter so web looks organic not robotic
          const jx = Math.sin(r * 7.3 + c * 2.9) * 13
          const jy = Math.cos(r * 5.1 + c * 11.7) * 13
          nodes.push({ x: ox + jx, y: oy + jy, ox: ox + jx, oy: oy + jy, vx: 0, vy: 0 })
        }
      }
    }

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
      rebuild()
    }

    const onMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouse.x = x; mouse.y = y
      } else {
        mouse.x = -9999; mouse.y = -9999
      }
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('resize', resize)
    resize()

    const SPRING = 0.055
    const DAMP   = 0.79
    const SNAP_R = 210

    let onScreen = true
    const draw = () => {
      if (!onScreen) { raf = 0; return }
      ctx.clearRect(0, 0, W, H)

      // Physics
      for (const n of nodes) {
        n.vx = (n.vx + (n.ox - n.x) * SPRING) * DAMP
        n.vy = (n.vy + (n.oy - n.y) * SPRING) * DAMP
        const dx = mouse.x - n.x, dy = mouse.y - n.y
        const d2 = dx * dx + dy * dy
        if (d2 < SNAP_R * SNAP_R && d2 > 1) {
          const d = Math.sqrt(d2)
          const f = ((SNAP_R - d) / SNAP_R) * 5
          n.vx += (dx / d) * f
          n.vy += (dy / d) * f
        }
        n.x += n.vx; n.y += n.vy
      }

      // Threads & Low-Poly Geometric Triangles
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i]
        const r = Math.floor(i / cols)
        const c = i % cols
        const mdx = n.x - mouse.x, mdy = n.y - mouse.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        const mp = Math.max(0, 1 - md / 280)

        // Draw low-poly filled triangles for a premium geometric look
        if (c < cols - 1 && r < rows - 1) {
          const n1 = nodes[i + 1]
          const n2 = nodes[i + cols]
          const n3 = nodes[i + cols + 1]
          
          if (n1 && n2) {
            ctx.beginPath()
            ctx.moveTo(n.x, n.y)
            ctx.lineTo(n1.x, n1.y)
            ctx.lineTo(n2.x, n2.y)
            ctx.closePath()
            // Alternate filled metallic colors based on index
            const alpha = (0.015 + mp * 0.05)
            ctx.fillStyle = i % 2 === 0 
              ? `rgba(100, 116, 139, ${alpha * 0.8})` // Slate grey fill
              : `rgba(212, 175, 55, ${alpha * 0.5})`  // Gold inlay fill
            ctx.fill()
          }

          if (n1 && n2 && n3) {
            ctx.beginPath()
            ctx.moveTo(n1.x, n1.y)
            ctx.lineTo(n3.x, n3.y)
            ctx.lineTo(n2.x, n2.y)
            ctx.closePath()
            const alpha = (0.01 + mp * 0.04)
            ctx.fillStyle = i % 3 === 0 
              ? `rgba(240, 240, 240, ${alpha * 0.3})` // Ivory white glow
              : `rgba(212, 175, 55, ${alpha * 0.4})`  // Gold glow
            ctx.fill()
          }
        }

        const drawLine = (n2: Node, base: number, lw: number) => {
          const mx = (n.x + n2.x) * 0.5 - mouse.x
          const my = (n.y + n2.y) * 0.5 - mouse.y
          const lineMp = Math.max(0, 1 - Math.sqrt(mx * mx + my * my) / 280)
          ctx.strokeStyle = `rgba(212, 175, 55, ${base + lineMp * 0.45})` // 24k gold outlines
          ctx.lineWidth = lw + lineMp * 1.0
          ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(n2.x, n2.y); ctx.stroke()
        }

        if (c < cols - 1 && i + 1 < nodes.length)             drawLine(nodes[i + 1],       0.08, 0.4)
        if (r < rows - 1 && i + cols < nodes.length)           drawLine(nodes[i + cols],     0.08, 0.4)
        if (c < cols - 1 && r < rows - 1 && i + cols + 1 < nodes.length) drawLine(nodes[i + cols + 1], 0.03, 0.3)
      }

      // Nodes
      for (const n of nodes) {
        const mdx = n.x - mouse.x, mdy = n.y - mouse.y
        const md = Math.sqrt(mdx * mdx + mdy * mdy)
        const glow = Math.max(0, 1 - md / 220)

        if (glow > 0.25) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, 3 + glow * 8)
          g.addColorStop(0, `rgba(212, 175, 55, ${glow * 0.3})`)
          g.addColorStop(1, 'rgba(212, 175, 55, 0)')
          ctx.fillStyle = g
          ctx.beginPath(); ctx.arc(n.x, n.y, 3 + glow * 8, 0, Math.PI * 2); ctx.fill()
        }

        ctx.beginPath()
        ctx.arc(n.x, n.y, 1.0 + glow * 1.8, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 175, 55, ${0.15 + glow * 0.75})`
        ctx.fill()
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
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
    />
  )
}

import { useEffect, useRef } from 'react'

type Polyhedron = {
  x: number; y: number; ox: number; oy: number
  vx: number; vy: number
  size: number
  vertices: { x: number; y: number; z: number }[]
  edges: [number, number][]
  angleX: number; angleY: number; angleZ: number
  spinX: number; spinY: number; spinZ: number
  color: string
}

export default function LavaBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0, raf = 0, t = 0
    let models: Polyhedron[] = []
    const mouse = { x: -9999, y: -9999, active: false }

    const createCube = (size: number): { vertices: any[], edges: [number, number][] } => {
      const v = [
        { x: -1, y: -1, z: -1 }, { x: 1, y: -1, z: -1 },
        { x: 1, y: 1, z: -1 }, { x: -1, y: 1, z: -1 },
        { x: -1, y: -1, z: 1 }, { x: 1, y: -1, z: 1 },
        { x: 1, y: 1, z: 1 }, { x: -1, y: 1, z: 1 }
      ].map(pt => ({ x: pt.x * size, y: pt.y * size, z: pt.z * size }))
      const e: [number, number][] = [
        [0, 1], [1, 2], [2, 3], [3, 0], // back
        [4, 5], [5, 6], [6, 7], [7, 4], // front
        [0, 4], [1, 5], [2, 6], [3, 7]  // links
      ]
      return { vertices: v, edges: e }
    }

    const createTetrahedron = (size: number): { vertices: any[], edges: [number, number][] } => {
      const v = [
        { x: 1, y: 1, z: 1 }, { x: -1, y: -1, z: 1 },
        { x: -1, y: 1, z: -1 }, { x: 1, y: -1, z: -1 }
      ].map(pt => ({ x: pt.x * size * 1.2, y: pt.y * size * 1.2, z: pt.z * size * 1.2 }))
      const e: [number, number][] = [
        [0, 1], [0, 2], [0, 3],
        [1, 2], [1, 3], [2, 3]
      ]
      return { vertices: v, edges: e }
    }

    const createOctahedron = (size: number): { vertices: any[], edges: [number, number][] } => {
      const v = [
        { x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 },
        { x: 1, y: 0, z: 0 }, { x: -1, y: 0, z: 0 },
        { x: 0, y: 0, z: 1 }, { x: 0, y: 0, z: -1 }
      ].map(pt => ({ x: pt.x * size * 1.3, y: pt.y * size * 1.3, z: pt.z * size * 1.3 }))
      const e: [number, number][] = [
        [0, 2], [0, 3], [0, 4], [0, 5],
        [1, 2], [1, 3], [1, 4], [1, 5],
        [2, 4], [4, 3], [3, 5], [5, 2]
      ]
      return { vertices: v, edges: e }
    }

    const buildModels = () => {
      const count = Math.min(15, Math.floor(W / 120))
      models = Array.from({ length: count }, (_, i) => {
        const ox = Math.random() * W
        const oy = Math.random() * H
        const size = 18 + Math.random() * 22
        
        // Pick random geometric geometry shape
        const shapeType = i % 3
        const geom = shapeType === 0 ? createCube(size) : (shapeType === 1 ? createTetrahedron(size) : createOctahedron(size))
        
        const colors = [
          'rgba(212, 175, 55, ',  // 24k gold outlines
          'rgba(100, 116, 139, ', // slate grey outlines
          'rgba(250, 249, 246, '  // ivory white outlines
        ]

        return {
          x: ox, y: oy, ox, oy,
          vx: 0, vy: 0,
          size,
          vertices: geom.vertices,
          edges: geom.edges,
          angleX: Math.random() * Math.PI,
          angleY: Math.random() * Math.PI,
          angleZ: Math.random() * Math.PI,
          spinX: (Math.random() - 0.5) * 0.015,
          spinY: (Math.random() - 0.5) * 0.015,
          spinZ: (Math.random() - 0.5) * 0.015,
          color: colors[i % colors.length]
        }
      })
    }

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
      buildModels()
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

    // 3D projection rendering helper
    const project = (v: { x: number, y: number, z: number }, ax: number, ay: number, az: number) => {
      // Rotation X
      let y1 = v.y * Math.cos(ax) - v.z * Math.sin(ax)
      let z1 = v.y * Math.sin(ax) + v.z * Math.cos(ax)
      // Rotation Y
      let x2 = v.x * Math.cos(ay) + z1 * Math.sin(ay)
      let z2 = -v.x * Math.sin(ay) + z1 * Math.cos(ay)
      // Rotation Z
      let x3 = x2 * Math.cos(az) - y1 * Math.sin(az)
      let y3 = x2 * Math.sin(az) + y1 * Math.cos(az)
      
      // Simple perspective
      const d = 160
      const scale = d / (d + z2)
      return { x: x3 * scale, y: y3 * scale }
    }

    let onScreen = true
    const draw = () => {
      if (!onScreen) { raf = 0; return }
      t++
      ctx.clearRect(0, 0, W, H)

      // Background ambient gold tint
      const gradient = ctx.createLinearGradient(0, H * 0.5, 0, H)
      gradient.addColorStop(0, 'rgba(8,8,8,0)')
      gradient.addColorStop(1, 'rgba(212,175,55,0.02)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, W, H)

      for (const m of models) {
        // Drift ambiently
        m.x += Math.sin(t * 0.005 + m.size) * 0.15
        m.y += Math.cos(t * 0.004 + m.size) * 0.15
        m.angleX += m.spinX
        m.angleY += m.spinY
        m.angleZ += m.spinZ

        // Respond to mouse coordinate gravity
        let alpha = 0.07
        if (mouse.active) {
          const dx = mouse.x - m.x, dy = mouse.y - m.y
          const dist = Math.hypot(dx, dy)
          if (dist < 280) {
            const force = (280 - dist) / 280
            // Shift model slightly away or towards mouse
            m.x += (dx / dist) * force * 1.5
            m.y += (dy / dist) * force * 1.5
            m.angleX += m.spinX * 3 * force
            m.angleY += m.spinY * 3 * force
            alpha += force * 0.35
          }
        }

        // Return to home position gently
        m.x += (m.ox - m.x) * 0.003
        m.y += (m.oy - m.y) * 0.003

        // Project and draw edges
        const projected = m.vertices.map(v => project(v, m.angleX, m.angleY, m.angleZ))

        ctx.strokeStyle = m.color + alpha + ')'
        ctx.lineWidth = 1.0
        
        for (const [i1, i2] of m.edges) {
          const p1 = projected[i1]
          const p2 = projected[i2]
          if (p1 && p2) {
            ctx.beginPath()
            ctx.moveTo(m.x + p1.x, m.y + p1.y)
            ctx.lineTo(m.x + p2.x, m.y + p2.y)
            ctx.stroke()
          }
        }

        // Draw vertices
        ctx.fillStyle = `rgba(212, 175, 55, ${alpha + 0.1})`
        for (const pt of projected) {
          ctx.beginPath()
          ctx.arc(m.x + pt.x, m.y + pt.y, 2.5, 0, Math.PI * 2)
          ctx.fill()
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

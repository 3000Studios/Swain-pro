import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  opacity: number
  pulsePhase: number
  isNode: boolean
}

export default function NeuralCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const PARTICLE_COUNT = 65
    const CONNECTION_DISTANCE = 160
    const MOUSE_ATTRACT_RADIUS = 200
    const MOUSE_ATTRACT_FORCE = 0.00035
    const COLORS = ['#00d4ff', '#8b5cf6', '#00d4ff', '#00d4ff', '#7c3aed']

    let animId: number
    let mouse = { x: -9999, y: -9999 }
    let particles: Particle[] = []

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }

    const init = () => {
      particles = Array.from({ length: PARTICLE_COUNT }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        radius: Math.random() * 2 + 1,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        opacity: Math.random() * 0.5 + 0.3,
        pulsePhase: Math.random() * Math.PI * 2,
        isNode: Math.random() < 0.2,
      }))
    }

    const hexToRgb = (hex: string) => {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
    }

    const animate = (time: number) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((p) => {
        // Mouse attraction
        const dx = mouse.x - p.x
        const dy = mouse.y - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < MOUSE_ATTRACT_RADIUS) {
          const force = (1 - dist / MOUSE_ATTRACT_RADIUS) * MOUSE_ATTRACT_FORCE
          p.vx += dx * force
          p.vy += dy * force
        }

        // Velocity damping
        p.vx *= 0.99
        p.vy *= 0.99

        // Clamp speed
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
        if (speed > 0.8) {
          p.vx = (p.vx / speed) * 0.8
          p.vy = (p.vy / speed) * 0.8
        }

        p.x += p.vx
        p.y += p.vy

        // Wrap
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        p.pulsePhase += 0.02
      })

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < CONNECTION_DISTANCE) {
            const alpha = (1 - dist / CONNECTION_DISTANCE) * 0.25
            const rgb = hexToRgb(a.color)
            ctx.beginPath()
            ctx.strokeStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`
            ctx.lineWidth = 0.8
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.stroke()
          }
        }
      }

      // Draw particles
      particles.forEach((p) => {
        const pulse = Math.sin(p.pulsePhase) * 0.3 + 0.7
        const rgb = hexToRgb(p.color)
        const r = p.isNode ? p.radius * 2.5 : p.radius

        // Glow for nodes
        if (p.isNode) {
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 4)
          grd.addColorStop(0, `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity * pulse * 0.6})`)
          grd.addColorStop(1, 'rgba(0,0,0,0)')
          ctx.beginPath()
          ctx.fillStyle = grd
          ctx.arc(p.x, p.y, r * 4, 0, Math.PI * 2)
          ctx.fill()
        }

        // Particle
        ctx.beginPath()
        ctx.arc(p.x, p.y, r * pulse, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${rgb.r},${rgb.g},${rgb.b},${p.opacity * pulse})`
        ctx.fill()
      })

      animId = requestAnimationFrame(animate)
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mouse.x = e.clientX - rect.left
      mouse.y = e.clientY - rect.top
    }

    const handleMouseLeave = () => {
      mouse.x = -9999
      mouse.y = -9999
    }

    const ro = new ResizeObserver(() => {
      resize()
      init()
    })
    ro.observe(canvas)

    resize()
    init()
    animId = requestAnimationFrame(animate)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      aria-hidden="true"
      style={{ opacity: 0.6 }}
    />
  )
}

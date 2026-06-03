import { useEffect, useRef } from 'react'

interface Shard {
  x: number; y: number; vx: number; vy: number
  size: number; hue: number; angle: number; spin: number
  attracted: boolean; dead: boolean; opacity: number
}

interface TrailPt { x: number; y: number; hue: number }

interface Laser {
  charging: boolean
  chargeStart: number
  fired: boolean
  origin: { x: number; y: number }
  target: { x: number; y: number } | null
  targetEl: Element | null
  progress: number
  sparkTime: number
}

const SPRING = 0.18
const DAMPING = 0.72
const SHARD_COUNT = 45
const MAX_TRAIL = 600
const MAX_SPARK_TIME = 2.2
const CHARGE_MS = 700

function mkShard(W: number, H: number): Shard {
  return {
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 1.2,
    vy: (Math.random() - 0.5) * 1.2,
    size: Math.random() * 5 + 2.5,
    hue: Math.random() * 360,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.08,
    attracted: false,
    dead: false,
    opacity: 0.6 + Math.random() * 0.4,
  }
}

function getNearestCard(ox: number, oy: number): Element | null {
  const cards = Array.from(document.querySelectorAll('.card, article, .btn-primary'))
  let nearest: Element | null = null
  let minDist = Infinity
  cards.forEach(card => {
    const r = card.getBoundingClientRect()
    if (r.top > window.innerHeight + 60 || r.bottom < -60) return
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    const d = Math.hypot(cx - ox, cy - oy)
    if (d < minDist) { minDist = d; nearest = card }
  })
  return nearest
}

export default function PhysicsCursor() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Touch devices: no custom cursor
    if (window.matchMedia('(pointer: coarse)').matches) return

    const ctx = canvas.getContext('2d')!

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // Hide native cursor
    document.body.classList.add('cursor-physics')

    // State refs (mutable, no re-renders)
    let W = window.innerWidth, H = window.innerHeight
    let realX = W / 2, realY = H / 2
    let curX = realX, curY = realY
    let velX = 0, velY = 0
    let hue = 180
    let collected = 0
    const trail: TrailPt[] = []
    const shards: Shard[] = Array.from({ length: SHARD_COUNT }, () => mkShard(W, H))

    const laser: Laser = {
      charging: false, chargeStart: 0, fired: false,
      origin: { x: 0, y: 0 }, target: null, targetEl: null,
      progress: 0, sparkTime: 0,
    }

    window.addEventListener('resize', () => { W = window.innerWidth; H = window.innerHeight })

    const onMove = (e: MouseEvent) => { realX = e.clientX; realY = e.clientY }
    window.addEventListener('mousemove', onMove)

    const onDown = (e: MouseEvent) => {
      if (e.button !== 2) return
      laser.charging = true
      laser.chargeStart = performance.now()
      laser.fired = false
      laser.origin = { x: curX, y: curY }
    }

    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      if (!laser.charging) return
      const heldMs = performance.now() - laser.chargeStart
      if (heldMs < 150) return
      // Fire
      laser.charging = false
      laser.fired = true
      laser.progress = 0
      laser.origin = { x: curX, y: curY }
      laser.targetEl = getNearestCard(curX, curY)
      if (laser.targetEl) {
        const r = laser.targetEl.getBoundingClientRect()
        laser.target = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
      } else {
        // Shoot in velocity direction or upward
        const mag = Math.hypot(velX, velY) || 1
        const dx = velX / mag || 0
        const dy = velY / mag || -1
        const dist = 500
        laser.target = { x: curX + dx * dist, y: curY + dy * dist }
      }
    }

    const onUp = (e: MouseEvent) => {
      if (e.button !== 2) laser.charging = false
    }

    window.addEventListener('mousedown', onDown)
    window.addEventListener('contextmenu', onContextMenu)
    window.addEventListener('mouseup', onUp)

    const drawDiamond = (x: number, y: number, s: number) => {
      ctx.beginPath()
      ctx.moveTo(x, y - s)
      ctx.lineTo(x + s * 0.6, y)
      ctx.lineTo(x, y + s)
      ctx.lineTo(x - s * 0.6, y)
      ctx.closePath()
    }

    let raf = 0

    const frame = () => {
      raf = requestAnimationFrame(frame)
      ctx.clearRect(0, 0, W, H)

      // Spring physics cursor
      velX = velX * DAMPING + (realX - curX) * SPRING
      velY = velY * DAMPING + (realY - curY) * SPRING
      curX += velX
      curY += velY

      hue = (hue + 0.5) % 360

      // ── TRAIL ──────────────────────────────────────────────────
      const maxLen = Math.min(collected * 14, MAX_TRAIL)
      trail.unshift({ x: curX, y: curY, hue })
      if (trail.length > maxLen + 1) trail.length = maxLen + 1

      if (trail.length > 2) {
        const lineW = 1.5 + collected * 0.08
        for (let i = 1; i < trail.length; i++) {
          const t = 1 - i / trail.length
          ctx.save()
          ctx.strokeStyle = `hsla(${trail[i].hue}, 100%, 65%, ${t * 0.75})`
          ctx.shadowColor = `hsla(${trail[i].hue}, 100%, 70%, ${t * 0.4})`
          ctx.shadowBlur = 4
          ctx.lineWidth = lineW * t + 0.5
          ctx.lineCap = 'round'
          ctx.beginPath()
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
          ctx.lineTo(trail[i].x, trail[i].y)
          ctx.stroke()
          ctx.restore()
        }
      }

      // ── SHARDS ─────────────────────────────────────────────────
      shards.forEach((s, idx) => {
        if (s.dead) return

        const dx = curX - s.x
        const dy = curY - s.y
        const dist = Math.hypot(dx, dy)

        if (!s.attracted && dist < 110) s.attracted = true

        if (s.attracted) {
          const force = 0.08
          s.vx += dx * force * (1 / Math.max(dist, 1))
          s.vy += dy * force * (1 / Math.max(dist, 1))
          s.vx *= 0.88
          s.vy *= 0.88
          if (dist < 18) {
            s.dead = true
            collected = Math.min(collected + 1, SHARD_COUNT)
            // Respawn after delay
            setTimeout(() => {
              shards[idx] = mkShard(W, H)
              shards[idx].opacity = 0
            }, 3000 + Math.random() * 4000)
            return
          }
        } else {
          s.x += s.vx
          s.y += s.vy
          s.vx *= 0.998
          s.vy *= 0.998
          if (s.x < -20) { s.x = W + 10; s.y = Math.random() * H }
          if (s.x > W + 20) { s.x = -10; s.y = Math.random() * H }
          if (s.y < -20) { s.y = H + 10; s.x = Math.random() * W }
          if (s.y > H + 20) { s.y = -10; s.x = Math.random() * W }
        }
        s.x += s.vx
        s.y += s.vy
        s.angle += s.spin

        // Fade in
        if (s.opacity < 0.6) s.opacity = Math.min(s.opacity + 0.02, 0.6 + Math.random() * 0.4)

        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.angle)
        ctx.globalAlpha = s.opacity * (s.attracted ? 0.9 : 0.6)
        ctx.shadowColor = `hsl(${s.hue}, 100%, 70%)`
        ctx.shadowBlur = s.attracted ? 12 : 6
        ctx.fillStyle = `hsl(${s.hue}, 100%, 70%)`
        ctx.strokeStyle = `hsl(${s.hue}, 100%, 85%)`
        ctx.lineWidth = 0.5
        drawDiamond(0, 0, s.size)
        ctx.fill()
        ctx.stroke()
        ctx.restore()
      })

      // ── CURSOR SPHERE ───────────────────────────────────────────
      const r = 18 + collected * 0.3 + (laser.charging ? Math.min((performance.now() - laser.chargeStart) / CHARGE_MS, 1) * 10 : 0)
      const cx = curX, cy = curY

      // Outer glow ring
      ctx.save()
      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, 0.4)`
      ctx.lineWidth = 1
      ctx.shadowColor = `hsl(${hue}, 100%, 70%)`
      ctx.shadowBlur = 15
      ctx.beginPath()
      ctx.arc(cx, cy, r + 8, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()

      // Sphere body
      const grad = ctx.createRadialGradient(cx - r * 0.3, cy - r * 0.3, 0, cx, cy, r)
      grad.addColorStop(0, `hsla(${hue}, 100%, 95%, 0.9)`)
      grad.addColorStop(0.35, `hsla(${hue}, 100%, 65%, 0.75)`)
      grad.addColorStop(0.75, `hsla(${(hue + 50) % 360}, 80%, 45%, 0.4)`)
      grad.addColorStop(1, `hsla(${(hue + 100) % 360}, 60%, 20%, 0)`)

      ctx.save()
      ctx.shadowColor = `hsla(${hue}, 100%, 70%, 0.9)`
      ctx.shadowBlur = 22
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Specular highlight
      ctx.save()
      ctx.globalAlpha = 0.6
      const specGrad = ctx.createRadialGradient(cx - r * 0.4, cy - r * 0.4, 0, cx - r * 0.4, cy - r * 0.4, r * 0.45)
      specGrad.addColorStop(0, 'rgba(255,255,255,0.8)')
      specGrad.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = specGrad
      ctx.beginPath()
      ctx.arc(cx, cy, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // ── LASER CHARGE RING ───────────────────────────────────────
      if (laser.charging) {
        const charge = Math.min((performance.now() - laser.chargeStart) / CHARGE_MS, 1)
        const spinAngle = performance.now() * 0.005
        ctx.save()
        ctx.translate(cx, cy)

        // Charge arc
        ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${0.5 + charge * 0.5})`
        ctx.lineWidth = 2 + charge * 2
        ctx.shadowColor = `hsl(${hue}, 100%, 70%)`
        ctx.shadowBlur = 15 + charge * 20
        ctx.beginPath()
        ctx.arc(0, 0, r + 20, spinAngle, spinAngle + Math.PI * 2 * charge)
        ctx.stroke()

        // Energy nodes
        for (let i = 0; i < 6; i++) {
          const a = spinAngle + (i / 6) * Math.PI * 2
          const nr = r + 20
          ctx.fillStyle = `hsla(${hue + i * 20}, 100%, 80%, ${charge})`
          ctx.shadowBlur = 10
          ctx.beginPath()
          ctx.arc(Math.cos(a) * nr, Math.sin(a) * nr, 2.5, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.restore()
      }

      // ── LASER BEAM ─────────────────────────────────────────────
      if (laser.fired && laser.target) {
        laser.progress = Math.min(laser.progress + 0.06, 1)
        const endX = laser.origin.x + (laser.target.x - laser.origin.x) * laser.progress
        const endY = laser.origin.y + (laser.target.y - laser.origin.y) * laser.progress

        // Wide glow
        ctx.save()
        ctx.strokeStyle = `rgba(0, 212, 255, 0.25)`
        ctx.lineWidth = 18
        ctx.lineCap = 'round'
        ctx.shadowColor = '#00d4ff'
        ctx.shadowBlur = 30
        ctx.beginPath()
        ctx.moveTo(laser.origin.x, laser.origin.y)
        ctx.lineTo(endX, endY)
        ctx.stroke()

        // Core beam
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2.5
        ctx.shadowBlur = 15
        ctx.beginPath()
        ctx.moveTo(laser.origin.x, laser.origin.y)
        ctx.lineTo(endX, endY)
        ctx.stroke()
        ctx.restore()

        if (laser.progress >= 1) {
          laser.fired = false
          if (laser.targetEl) laser.sparkTime = MAX_SPARK_TIME
        }
      }

      // ── DIAMOND SPARKLE ─────────────────────────────────────────
      if (laser.sparkTime > 0 && laser.targetEl) {
        laser.sparkTime -= 1 / 60
        const tr = laser.targetEl.getBoundingClientRect()
        const tp = laser.sparkTime / MAX_SPARK_TIME  // 1→0 as it fades
        const elapsed = 1 - tp

        // Glowing border around the hit element
        ctx.save()
        ctx.strokeStyle = `rgba(255, 255, 255, ${tp * 0.9})`
        ctx.lineWidth = 2 + tp * 4
        ctx.shadowColor = `hsl(${hue}, 100%, 70%)`
        ctx.shadowBlur = 25 * tp
        if (ctx.roundRect) {
          ctx.beginPath()
          ctx.roundRect(tr.left, tr.top, tr.width, tr.height, 12)
          ctx.stroke()
        }
        ctx.restore()

        // Diamond sparkles bursting outward
        const sparkleCount = 24
        const maxDist = elapsed * 100
        for (let i = 0; i < sparkleCount; i++) {
          const a = (i / sparkleCount) * Math.PI * 2
          const d = maxDist * (0.5 + Math.random() * 0.5)
          const sx = tr.left + tr.width / 2 + Math.cos(a) * d
          const sy = tr.top + tr.height / 2 + Math.sin(a) * d
          const sr = tp * 5 * (0.5 + Math.random() * 0.5)
          ctx.save()
          ctx.globalAlpha = tp
          ctx.translate(sx, sy)
          ctx.rotate(a + elapsed * 3)
          ctx.fillStyle = `hsl(${(hue + i * 8) % 360}, 100%, 85%)`
          ctx.shadowColor = `hsl(${(hue + i * 8) % 360}, 100%, 70%)`
          ctx.shadowBlur = 8
          drawDiamond(0, 0, sr)
          ctx.fill()
          ctx.restore()
        }

        if (laser.sparkTime <= 0) laser.targetEl = null
      }
    }

    frame()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mousedown', onDown)
      window.removeEventListener('contextmenu', onContextMenu)
      window.removeEventListener('mouseup', onUp)
      window.removeEventListener('resize', resize)
      document.body.classList.remove('cursor-physics')
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      aria-hidden="true"
    />
  )
}

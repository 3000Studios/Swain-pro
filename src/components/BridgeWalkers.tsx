import { useEffect, useRef } from 'react'

/**
 * BridgeWalkers — a rope-ladder bridge runs down the left gutter of the whole
 * page. 10 little humans drop into the header on load and descend through every
 * section toward the footer. Click on a plank near a human's feet and that human
 * drops to the next section, changes color, and speeds up. The first to reach
 * the footer climbs a podium and starts dancing & cheering with confetti.
 *
 * Single fixed full-viewport canvas. pointer-events:none so it never blocks the
 * page — clicks are read from a window listener and matched to plank hotspots.
 * Pauses when the tab is hidden and disables itself under reduced-motion.
 */

const COLORS = [
  'rgb(200,169,110)', // gold (start)
  '#ff5d73', '#5dd6ff', '#7CFF8A', '#c08bff',
  '#ffd45d', '#ff9d4d', '#5dffd6', '#ff5df0', '#9dff5d',
]
const COUNT = 10
const RUNG = 66            // px between ladder rungs (doc space)
const LANE_W = 48          // ladder width

type State = 'walk' | 'fall' | 'dance'

interface Human {
  id: number
  y: number          // document-space vertical position (feet)
  xo: number         // horizontal offset within the lane (0..1)
  speed: number      // base descend px/frame
  boost: number      // permanent speed multiplier
  fastUntil: number  // doc-y below which the human is in a fast "drop"
  color: number      // index into COLORS
  phase: number      // limb animation phase
  state: State
  danceSeed: number
  podX: number       // resolved screen x while dancing
}

interface Confetti {
  x: number; y: number; vx: number; vy: number
  c: string; life: number; max: number; rot: number; vr: number
}

export default function BridgeWalkers() {
  const ref = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // Skip on small touch screens — keeps mobile snappy and uncluttered.
    if (window.matchMedia('(max-width: 640px)').matches) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const DPR = Math.min(window.devicePixelRatio || 1, 1.5)
    let vw = 0, vh = 0
    const resize = () => {
      vw = window.innerWidth
      vh = window.innerHeight
      canvas.width = Math.floor(vw * DPR)
      canvas.height = Math.floor(vh * DPR)
      canvas.style.width = vw + 'px'
      canvas.style.height = vh + 'px'
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0)
      measure()
    }

    // ── layout / measurements ────────────────────────────
    let laneX = 60
    let docHeight = 0
    let footerTop = 0
    let platforms: number[] = []   // doc-y of each section divider (clickable boards)

    const measure = () => {
      laneX = Math.max(40, Math.min(vw * 0.07, 130))
      docHeight = Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
      const footer = document.querySelector('footer')
      footerTop = footer
        ? footer.getBoundingClientRect().top + window.scrollY
        : docHeight - 320
      const secs = Array.from(document.querySelectorAll('main section, main article'))
      const tops = secs.map((s) => s.getBoundingClientRect().top + window.scrollY)
      tops.push(footerTop)
      platforms = Array.from(new Set(tops.filter((t) => t > 40))).sort((a, b) => a - b)
    }

    const nextPlatformBelow = (y: number) => {
      for (const p of platforms) if (p > y + 8) return p
      return footerTop
    }

    // ── humans ───────────────────────────────────────────
    const humans: Human[] = Array.from({ length: COUNT }, (_, i) => ({
      id: i,
      y: -RUNG * (i * 1.5 + 2),          // staggered so they "drop in" on load
      xo: (i % 5) / 4,                    // spread across the lane
      speed: 0.45 + (i % 3) * 0.08,
      boost: 1,
      fastUntil: -1,
      color: 0,
      phase: Math.random() * Math.PI * 2,
      state: 'walk',
      danceSeed: Math.random() * Math.PI * 2,
      podX: 0,
    }))
    let firstArrived = false

    const confetti: Confetti[] = []
    const burstConfetti = (x: number, y: number, n = 14) => {
      for (let i = 0; i < n; i++) {
        confetti.push({
          x, y,
          vx: (Math.random() - 0.5) * 4,
          vy: -Math.random() * 5 - 1.5,
          c: COLORS[1 + Math.floor(Math.random() * (COLORS.length - 1))],
          life: 0, max: 70 + Math.random() * 40,
          rot: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.4,
        })
      }
    }

    // ── interaction: click near a human's feet ───────────
    const onPointer = (clientX: number, clientY: number) => {
      const docY = clientY + window.scrollY
      let best: Human | null = null
      let bestD = 56 // hit radius (px)
      for (const hmn of humans) {
        if (hmn.state === 'dance') continue
        const sx = laneX + LANE_W * hmn.xo + 8
        const sy = hmn.y - window.scrollY
        const d = Math.hypot(clientX - sx, clientY - sy)
        if (d < bestD) { bestD = d; best = hmn }
      }
      if (best) {
        best.color = (best.color + 1) % COLORS.length      // change colors
        best.boost = Math.min(best.boost + 0.6, 4)          // move faster (permanent)
        best.fastUntil = nextPlatformBelow(best.y)          // fall to next section
        burstConfetti(laneX + LANE_W * best.xo + 8, best.y - window.scrollY, 8)
      }
    }
    const clickHandler = (e: MouseEvent) => onPointer(e.clientX, e.clientY)
    window.addEventListener('click', clickHandler)

    // ── drawing helpers ──────────────────────────────────
    const drawBridge = () => {
      const top = window.scrollY
      const x1 = laneX, x2 = laneX + LANE_W
      // ropes
      ctx.strokeStyle = 'rgba(160,130,70,0.5)'
      ctx.lineWidth = 3
      ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, vh); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x2, 0); ctx.lineTo(x2, vh); ctx.stroke()
      // rungs (only those visible)
      const firstRung = Math.floor(top / RUNG) * RUNG
      for (let dy = firstRung; dy < top + vh + RUNG; dy += RUNG) {
        const sy = dy - top
        const isBoard = platforms.some((p) => Math.abs(p - dy) < RUNG / 2)
        if (isBoard) {
          ctx.fillStyle = 'rgba(200,169,110,0.32)'
          ctx.fillRect(x1 - 8, sy - 4, LANE_W + 16, 8)
          ctx.strokeStyle = 'rgba(200,169,110,0.7)'
          ctx.lineWidth = 1.5
          ctx.strokeRect(x1 - 8, sy - 4, LANE_W + 16, 8)
        } else {
          ctx.strokeStyle = 'rgba(140,115,65,0.4)'
          ctx.lineWidth = 4
          ctx.beginPath(); ctx.moveTo(x1, sy); ctx.lineTo(x2, sy); ctx.stroke()
        }
      }
    }

    const drawHuman = (sx: number, sy: number, color: string, phase: number, state: State) => {
      ctx.save()
      ctx.translate(sx, sy)
      const swing = Math.sin(phase)
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 2.4
      ctx.lineCap = 'round'
      // glow
      ctx.shadowColor = color
      ctx.shadowBlur = 8

      if (state === 'fall') ctx.rotate(swing * 0.5)
      const bob = state === 'dance' ? Math.abs(Math.sin(phase * 1.6)) * -4 : 0

      // head
      ctx.beginPath()
      ctx.arc(0, -16 + bob, 4, 0, Math.PI * 2)
      ctx.fill()
      // body
      ctx.beginPath()
      ctx.moveTo(0, -12 + bob); ctx.lineTo(0, -2 + bob); ctx.stroke()

      // arms
      ctx.beginPath()
      if (state === 'dance') {
        ctx.moveTo(0, -9 + bob); ctx.lineTo(-5, -16 + bob - swing * 3)
        ctx.moveTo(0, -9 + bob); ctx.lineTo(5, -16 + bob + swing * 3)
      } else if (state === 'fall') {
        ctx.moveTo(0, -9); ctx.lineTo(-6, -15)
        ctx.moveTo(0, -9); ctx.lineTo(6, -15)
      } else {
        ctx.moveTo(0, -9); ctx.lineTo(-5, -5 + swing * 2)
        ctx.moveTo(0, -9); ctx.lineTo(5, -5 - swing * 2)
      }
      ctx.stroke()

      // legs
      ctx.beginPath()
      if (state === 'dance') {
        ctx.moveTo(0, -2 + bob); ctx.lineTo(-4, 4 + bob + swing * 2)
        ctx.moveTo(0, -2 + bob); ctx.lineTo(4, 4 + bob - swing * 2)
      } else if (state === 'fall') {
        ctx.moveTo(0, -2); ctx.lineTo(-5, 3)
        ctx.moveTo(0, -2); ctx.lineTo(5, 3)
      } else {
        ctx.moveTo(0, -2); ctx.lineTo(-4, 5 + swing * 3)
        ctx.moveTo(0, -2); ctx.lineTo(4, 5 - swing * 3)
      }
      ctx.stroke()
      ctx.restore()
    }

    const drawPodium = () => {
      const sy = footerTop - window.scrollY
      if (sy > vh || sy < -120) return
      const px = laneX + LANE_W + 46
      ctx.save()
      ctx.shadowColor = 'rgba(200,169,110,0.5)'
      ctx.shadowBlur = 16
      ctx.fillStyle = 'rgba(200,169,110,0.85)'
      ctx.fillRect(px - 26, sy + 8, 52, 26)   // podium top tier
      ctx.fillStyle = 'rgba(160,130,70,0.8)'
      ctx.fillRect(px - 38, sy + 22, 24, 18)  // left tier
      ctx.fillRect(px + 14, sy + 22, 24, 18)  // right tier
      ctx.restore()
    }

    // ── main loop ────────────────────────────────────────
    let raf = 0
    let running = true
    let t = 0
    const podBaseX = () => laneX + LANE_W + 46

    const frame = () => {
      if (!running) { raf = 0; return }
      t++
      if (t % 45 === 0) measure()        // keep up with lazy-loaded media height
      ctx.clearRect(0, 0, vw, vh)

      drawBridge()
      drawPodium()

      let danceCount = 0
      for (const hmn of humans) {
        if (hmn.state === 'dance') {
          danceCount++
          hmn.phase += 0.18 + hmn.boost * 0.02
          const sx = hmn.podX
          const sy = footerTop - window.scrollY + 2
          drawHuman(sx, sy, COLORS[hmn.color], hmn.phase + hmn.danceSeed, 'dance')
          if (t % 22 === 0) burstConfetti(sx, sy - 18, 6)
          continue
        }

        // descend
        const fast = hmn.y < hmn.fastUntil
        const v = hmn.speed * hmn.boost * (fast ? 4 : 1)
        hmn.y += v
        hmn.phase += 0.06 + v * 0.12
        if (fast && hmn.y >= hmn.fastUntil) hmn.fastUntil = -1

        if (hmn.y >= footerTop) {
          hmn.state = 'dance'
          // line dancers up along the podium
          const slot = danceCount
          hmn.podX = podBaseX() + (slot - 1.0) * 16 + (hmn.id % 2 ? 6 : -6)
          if (!firstArrived) { firstArrived = true; burstConfetti(hmn.podX, footerTop - window.scrollY, 40) }
          continue
        }

        const sy = hmn.y - window.scrollY
        if (sy > -30 && sy < vh + 30) {
          const sx = laneX + LANE_W * hmn.xo + 8
          drawHuman(sx, sy, COLORS[hmn.color], hmn.phase, fast ? 'fall' : 'walk')
        }
      }

      // confetti
      for (let i = confetti.length - 1; i >= 0; i--) {
        const c = confetti[i]
        c.life++; c.vy += 0.12; c.x += c.vx; c.y += c.vy; c.rot += c.vr
        const k = 1 - c.life / c.max
        if (k <= 0) { confetti.splice(i, 1); continue }
        ctx.save()
        ctx.globalAlpha = k
        ctx.translate(c.x, c.y)
        ctx.rotate(c.rot)
        ctx.fillStyle = c.c
        ctx.fillRect(-2.5, -2.5, 5, 5)
        ctx.restore()
      }

      raf = requestAnimationFrame(frame)
    }

    const kick = () => { if (!raf && running) raf = requestAnimationFrame(frame) }

    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('load', measure)
    const onVis = () => {
      running = !document.hidden
      if (running) kick(); else { cancelAnimationFrame(raf); raf = 0 }
    }
    document.addEventListener('visibilitychange', onVis)
    kick()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('load', measure)
      window.removeEventListener('click', clickHandler)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [])

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 45,
      }}
    />
  )
}

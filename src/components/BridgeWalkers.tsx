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
const WARP_FRAMES = 46     // how long a black-hole warp takes

type State = 'walk' | 'fall' | 'warp' | 'dance'

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
  warp: number       // warp countdown (frames); >0 while being sucked through a black hole
  warpFrom: number   // doc-y where the warp started
  warpTo: number     // doc-y the black hole spits them out at
  danceSeed: number
  podX: number       // resolved screen x while dancing
}

interface Vortex {
  docY: number       // document-space center
  xo: number         // lane offset of the human it belongs to
  age: number        // frames (can start negative to delay the exit portal)
  max: number
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
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Lighter on small touch screens: fewer walkers, lower DPR — still alive.
    const isMobile = window.matchMedia('(max-width: 640px)').matches
    const count = isMobile ? 5 : COUNT
    const DPR = Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5)
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
    const humans: Human[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      y: 90 + i * 78,                     // spread down the first screens — visible immediately
      xo: (i % 5) / 4,                    // spread across the lane
      speed: 0.45 + (i % 3) * 0.08,
      boost: 1,
      fastUntil: -1,
      color: 0,
      phase: Math.random() * Math.PI * 2,
      state: 'walk',
      warp: 0,
      warpFrom: 0,
      warpTo: 0,
      danceSeed: Math.random() * Math.PI * 2,
      podX: 0,
    }))
    let firstArrived = false
    const vortexes: Vortex[] = []

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
      // banner hotspot wins — it's the lead-gen CTA
      if (bannerHot) {
        const b = bannerHot
        if (clientX >= b.x && clientX <= b.x + b.w && clientY >= b.y && clientY <= b.y + b.h) {
          window.location.href = '/contact'
          return
        }
      }
      let best: Human | null = null
      let bestD = 64 // hit radius (px)
      for (const hmn of humans) {
        if (hmn.state === 'dance' || hmn.state === 'warp') continue
        const sx = laneX + LANE_W * hmn.xo + 8
        const sy = hmn.y - window.scrollY
        const d = Math.hypot(clientX - sx, clientY - sy)
        if (d < bestD) { bestD = d; best = hmn }
      }
      if (best) {
        // Click = open a BLACK HOLE under their feet. They spiral in, the floor
        // drops, and they warp down to the next section, faster and recolored.
        best.color = (best.color + 1) % COLORS.length
        best.boost = Math.min(best.boost + 0.5, 4)
        const dest = nextPlatformBelow(best.y)
        best.warpFrom = best.y
        best.warpTo = dest
        best.warp = WARP_FRAMES
        best.state = 'warp'
        vortexes.push({ docY: best.y, xo: best.xo, age: 0, max: 56 })       // entry hole
        vortexes.push({ docY: dest, xo: best.xo, age: -WARP_FRAMES, max: 56 }) // exit hole
        burstConfetti(laneX + LANE_W * best.xo + 8, best.y - window.scrollY, 12)
      }
    }
    const clickHandler = (e: MouseEvent) => onPointer(e.clientX, e.clientY)
    window.addEventListener('click', clickHandler)

    // ── drawing helpers ──────────────────────────────────
    const drawBridge = () => {
      const top = window.scrollY
      const x1 = laneX, x2 = laneX + LANE_W
      // ropes — brighter, with a soft gold glow so they're clearly visible
      ctx.save()
      ctx.shadowColor = 'rgba(200,169,110,0.5)'
      ctx.shadowBlur = 6
      ctx.strokeStyle = 'rgba(210,178,118,0.85)'
      ctx.lineWidth = 3.5
      ctx.beginPath(); ctx.moveTo(x1, 0); ctx.lineTo(x1, vh); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(x2, 0); ctx.lineTo(x2, vh); ctx.stroke()
      ctx.restore()
      // rungs (only those visible)
      const firstRung = Math.floor(top / RUNG) * RUNG
      for (let dy = firstRung; dy < top + vh + RUNG; dy += RUNG) {
        const sy = dy - top
        const isBoard = platforms.some((p) => Math.abs(p - dy) < RUNG / 2)
        if (isBoard) {
          ctx.fillStyle = 'rgba(200,169,110,0.5)'
          ctx.fillRect(x1 - 8, sy - 4, LANE_W + 16, 8)
          ctx.strokeStyle = 'rgba(220,185,120,0.9)'
          ctx.lineWidth = 1.5
          ctx.strokeRect(x1 - 8, sy - 4, LANE_W + 16, 8)
        } else {
          ctx.strokeStyle = 'rgba(170,140,80,0.6)'
          ctx.lineWidth = 4
          ctx.beginPath(); ctx.moveTo(x1, sy); ctx.lineTo(x2, sy); ctx.stroke()
        }
      }
    }

    // checkered finish line drawn across the lane at the footer top
    const drawFinishLine = () => {
      const sy = footerTop - window.scrollY
      if (sy > vh + 20 || sy < -40) return
      const x1 = laneX - 10, w = LANE_W + 64, cell = 9
      const rows = 2
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c * cell < w; c++) {
          ctx.fillStyle = (r + c) % 2 ? '#0b0b0b' : '#e9dcc0'
          ctx.fillRect(x1 + c * cell, sy - 12 + r * cell, cell, cell)
        }
      }
      ctx.fillStyle = 'rgba(200,169,110,0.95)'
      ctx.font = '700 10px ui-sans-serif, system-ui, sans-serif'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText('FINISH', x1, sy - 16)
    }

    const drawHuman = (sx: number, sy: number, color: string, phase: number, state: State) => {
      ctx.save()
      ctx.translate(sx, sy)
      ctx.scale(1.4, 1.4)               // bigger so they're clearly visible
      const swing = Math.sin(phase)
      ctx.strokeStyle = color
      ctx.fillStyle = color
      ctx.lineWidth = 2.2
      ctx.lineCap = 'round'
      // glow
      ctx.shadowColor = color
      ctx.shadowBlur = 11

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

    // ── black hole / warp portal ─────────────────────────
    const drawVortex = (sx: number, sy: number, age: number, max: number) => {
      if (age < 0) return
      const k = Math.min(1, age / max)
      const env = Math.sin(k * Math.PI)                 // 0→1→0 grow/shrink
      const R = 10 + env * 34
      ctx.save()
      ctx.translate(sx, sy)
      // dark gravitational well
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, R)
      g.addColorStop(0, `rgba(0,0,0,${0.9 * env})`)
      g.addColorStop(0.55, `rgba(28,12,40,${0.5 * env})`)
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2); ctx.fill()
      // swirling gold accretion arms
      const spin = age * 0.35
      for (let arm = 0; arm < 3; arm++) {
        ctx.beginPath()
        for (let a = 0; a <= Math.PI * 4; a += 0.25) {
          const rr = R * (a / (Math.PI * 4))
          const x = Math.cos(a + spin + arm * 2.094) * rr
          const y = Math.sin(a + spin + arm * 2.094) * rr * 0.62  // squashed = lying flat
          a === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
        }
        ctx.strokeStyle = `rgba(200,169,110,${0.85 * env})`
        ctx.lineWidth = 1.8
        ctx.shadowColor = 'rgba(200,169,110,0.7)'
        ctx.shadowBlur = 10
        ctx.stroke()
      }
      // event-horizon ring
      ctx.beginPath(); ctx.ellipse(0, 0, R * 0.92, R * 0.58, 0, 0, Math.PI * 2)
      ctx.strokeStyle = `rgba(120,200,255,${0.6 * env})`
      ctx.lineWidth = 2
      ctx.stroke()
      ctx.restore()
    }

    // a human spiralling into / out of the warp — spins and shrinks at mid-point
    const drawHumanWarp = (sx: number, sy: number, color: string, k: number) => {
      const env = Math.sin(k * Math.PI)                 // shrink toward the middle of the warp
      const scale = Math.max(0.05, 1 - env)
      const spin = k * Math.PI * 10
      ctx.save()
      ctx.translate(sx, sy)
      ctx.rotate(spin)
      ctx.scale(scale, scale)
      ctx.translate(-sx, -sy)
      drawHuman(sx, sy, color, k * 12, 'fall')
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

    // ── podium lead-gen banner (appears once someone is dancing) ──
    // Screen-space hotspot; clicks routed to /contact via the window listener.
    let bannerHot: { x: number; y: number; w: number; h: number } | null = null
    const drawBanner = (anchorX: number, podSy: number) => {
      const label = 'Made by Mr. Swain — want one? →'
      ctx.save()
      ctx.font = '600 12px ui-sans-serif, system-ui, sans-serif'
      const padX = 11
      const w = ctx.measureText(label).width + padX * 2
      const h = 24
      // sit the pill just above the podium, nudged right so it clears the lane
      let x = anchorX + 30
      let y = podSy - 34
      if (x + w > vw - 12) x = vw - 12 - w   // keep on screen
      if (y < 6) y = 6
      bannerHot = { x, y, w, h }
      // pill
      const r = h / 2
      ctx.beginPath()
      ctx.moveTo(x + r, y)
      ctx.arcTo(x + w, y, x + w, y + h, r)
      ctx.arcTo(x + w, y + h, x, y + h, r)
      ctx.arcTo(x, y + h, x, y, r)
      ctx.arcTo(x, y, x + w, y, r)
      ctx.closePath()
      ctx.fillStyle = 'rgba(18,16,12,0.82)'
      ctx.shadowColor = 'rgba(200,169,110,0.55)'
      ctx.shadowBlur = 14
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.strokeStyle = 'rgba(200,169,110,0.8)'
      ctx.lineWidth = 1
      ctx.stroke()
      ctx.fillStyle = 'rgb(200,169,110)'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, x + padX, y + h / 2 + 0.5)
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
      drawFinishLine()
      drawPodium()

      // black-hole portals (behind the humans)
      for (let i = vortexes.length - 1; i >= 0; i--) {
        const v = vortexes[i]
        v.age++
        if (v.age > v.max) { vortexes.splice(i, 1); continue }
        const sx = laneX + LANE_W * v.xo + 8
        const sy = v.docY - window.scrollY
        if (sy > -60 && sy < vh + 60) drawVortex(sx, sy, v.age, v.max)
      }

      let danceCount = 0
      for (const hmn of humans) {
        if (hmn.state === 'warp') {
          hmn.warp--
          const k = 1 - hmn.warp / WARP_FRAMES        // 0 → 1
          const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2
          hmn.y = hmn.warpFrom + (hmn.warpTo - hmn.warpFrom) * ease
          const sx = laneX + LANE_W * hmn.xo + 8
          const sy = hmn.y - window.scrollY
          if (sy > -40 && sy < vh + 40) drawHumanWarp(sx, sy, COLORS[hmn.color], k)
          if (hmn.warp <= 0) {
            hmn.state = 'walk'
            burstConfetti(sx, sy, 10)
          }
          continue
        }
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

      // lead-gen banner once a dancer is on the podium and it's on screen
      bannerHot = null
      const podSy = footerTop - window.scrollY
      if (danceCount > 0 && podSy < vh && podSy > -120) {
        drawBanner(podBaseX(), podSy)
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

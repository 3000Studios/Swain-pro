import { useEffect, useRef } from 'react'

type Ember = {
  x: number; y: number; vx: number; vy: number
  life: number; maxLife: number
  size: number; hue: number
}

type LavaPool = {
  x: number; y: number; r: number; maxR: number; life: number; maxLife: number
}

export default function LavaBg() {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!

    let W = 0, H = 0, raf = 0, t = 0
    const embers: Ember[] = []
    const pools: LavaPool[] = []
    const mouse = { x: -9999, y: -9999, active: false }

    const resize = () => {
      W = canvas.offsetWidth; H = canvas.offsetHeight
      canvas.width = W; canvas.height = H
    }

    const spawnEmber = (x: number, y: number, intense = false) => {
      const hue = intense ? 20 + Math.random() * 30 : 10 + Math.random() * 50
      embers.push({
        x, y,
        vx: (Math.random() - 0.5) * (intense ? 3 : 1.5),
        vy: -(0.8 + Math.random() * (intense ? 4 : 2.5)),
        life: 0,
        maxLife: 40 + Math.random() * (intense ? 80 : 50),
        size: 1.5 + Math.random() * (intense ? 4.5 : 2.5),
        hue,
      })
    }

    const spawnPool = (x: number, y: number) => {
      const maxR = 30 + Math.random() * 60
      pools.push({ x, y, r: 0, maxR, life: 0, maxLife: 120 + Math.random() * 80 })
      if (pools.length > 12) pools.splice(0, pools.length - 12)
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

    let poolTimer = 0

    const draw = () => {
      t++
      ctx.clearRect(0, 0, W, H)

      // Lava ground glow — base layer
      const groundGrad = ctx.createLinearGradient(0, H * 0.65, 0, H)
      groundGrad.addColorStop(0, 'rgba(200,60,0,0)')
      groundGrad.addColorStop(0.6, 'rgba(200,50,0,0.06)')
      groundGrad.addColorStop(1, 'rgba(180,40,0,0.12)')
      ctx.fillStyle = groundGrad
      ctx.fillRect(0, 0, W, H)

      // Spawn base embers from bottom edge
      if (t % 2 === 0) {
        for (let i = 0; i < 3; i++) {
          spawnEmber(Math.random() * W, H + 5)
        }
      }

      // Spawn embers at mouse (intensely)
      if (mouse.active && mouse.x > 0) {
        for (let i = 0; i < 5; i++) {
          spawnEmber(mouse.x + (Math.random() - 0.5) * 40, mouse.y + (Math.random() - 0.5) * 20, true)
        }
        // Spawn lava pool at mouse periodically
        poolTimer++
        if (poolTimer > 15) {
          spawnPool(mouse.x + (Math.random() - 0.5) * 60, mouse.y + 10 + Math.random() * 30)
          poolTimer = 0
        }
      }

      if (embers.length > 700) embers.splice(0, embers.length - 700)

      // Draw lava pools
      for (let i = pools.length - 1; i >= 0; i--) {
        const p = pools[i]
        p.life++
        p.r = p.maxR * Math.min(1, (p.life / 20) ** 0.5)
        const fade = p.life > p.maxLife * 0.6 ? 1 - (p.life - p.maxLife * 0.6) / (p.maxLife * 0.4) : 1
        if (p.life > p.maxLife || fade < 0.02) { pools.splice(i, 1); continue }

        // Lava pool glow
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r)
        g.addColorStop(0, `rgba(255,120,0,${fade * 0.35})`)
        g.addColorStop(0.4, `rgba(220,60,0,${fade * 0.2})`)
        g.addColorStop(0.75, `rgba(160,30,0,${fade * 0.1})`)
        g.addColorStop(1, 'rgba(100,0,0,0)')
        ctx.fillStyle = g
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill()

        // Cracked lava surface
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r * 0.4, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255,80,0,${fade * 0.2})`
        ctx.fill()
      }

      // Draw embers (fire particles)
      for (let i = embers.length - 1; i >= 0; i--) {
        const em = embers[i]
        em.life++
        em.x += em.vx + Math.sin(em.life * 0.12 + em.x * 0.02) * 0.5
        em.vy += 0.03  // slight gravity
        em.y += em.vy
        em.size *= 0.992

        const progress = em.life / em.maxLife
        if (progress >= 1 || em.size < 0.4) { embers.splice(i, 1); continue }

        // Color: bright yellow → orange → red → dark red as it ages
        const hue = em.hue + progress * 15
        const lum = 65 - progress * 35
        const sat = 100 - progress * 20
        const alpha = (1 - progress) * 0.8

        ctx.beginPath()
        ctx.arc(em.x, em.y, em.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${hue},${sat}%,${lum}%,${alpha})`
        ctx.fill()

        // Glow on larger embers
        if (em.size > 2 && progress < 0.5) {
          const eg = ctx.createRadialGradient(em.x, em.y, 0, em.x, em.y, em.size * 3.5)
          eg.addColorStop(0, `hsla(${hue},100%,70%,${alpha * 0.4})`)
          eg.addColorStop(1, 'hsla(0,0%,0%,0)')
          ctx.fillStyle = eg
          ctx.beginPath(); ctx.arc(em.x, em.y, em.size * 3.5, 0, Math.PI * 2); ctx.fill()
        }
      }

      // Intense heat distortion glow at mouse
      if (mouse.active && mouse.x > 0) {
        const pulse = 0.7 + Math.sin(t * 0.15) * 0.3
        const mg = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, 90)
        mg.addColorStop(0, `rgba(255,100,0,${0.14 * pulse})`)
        mg.addColorStop(0.5, `rgba(200,50,0,${0.07 * pulse})`)
        mg.addColorStop(1, 'rgba(150,0,0,0)')
        ctx.fillStyle = mg
        ctx.fillRect(0, 0, W, H)
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

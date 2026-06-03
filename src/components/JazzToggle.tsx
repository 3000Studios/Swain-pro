import { useEffect, useRef, useState } from 'react'

export default function JazzToggle() {
  const [playing, setPlaying] = useState(false)
  const [hint, setHint] = useState(true)
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const schedulerRef = useRef<number | null>(null)
  const nextNoteRef = useRef(0)
  const preferenceKey = 'swainpro-jazz'

  const CHORDS = [
    [60, 64, 67, 71], [62, 65, 69, 72], [65, 69, 72, 76],
    [67, 71, 74, 77], [64, 67, 71, 74], [57, 60, 64, 67],
    [62, 66, 69, 73], [60, 63, 67, 70],
  ]

  const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12)

  const playNote = (freq: number, when: number, dur: number, g: number) => {
    const ctx = ctxRef.current!
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    const flt = ctx.createBiquadFilter()
    osc.type = 'triangle'
    osc.frequency.value = freq
    flt.type = 'lowpass'
    flt.frequency.value = 1400 + Math.random() * 400
    flt.Q.value = 0.4
    env.gain.setValueAtTime(0, when)
    env.gain.linearRampToValueAtTime(g, when + 0.06)
    env.gain.exponentialRampToValueAtTime(g * 0.55, when + dur * 0.45)
    env.gain.exponentialRampToValueAtTime(0.0001, when + dur)
    osc.connect(flt)
    flt.connect(env)
    env.connect(gainRef.current!)
    osc.start(when)
    osc.stop(when + dur + 0.12)
  }

  const scheduleNotes = () => {
    const ctx = ctxRef.current!
    const LOOK = 0.15
    const BEAT = 0.52 + Math.random() * 0.28

    while (nextNoteRef.current < ctx.currentTime + LOOK) {
      const chord = CHORDS[Math.floor(Math.random() * CHORDS.length)]
      const when = nextNoteRef.current
      chord.forEach((note, i) => {
        const f = midiToFreq(note - 12 + Math.floor(Math.random() * 2))
        playNote(f, when + i * 0.04, BEAT * 3.5, 0.035)
      })
      if (Math.random() < 0.45) {
        const mel = chord[Math.floor(Math.random() * chord.length)] + 12
        playNote(midiToFreq(mel), when + BEAT * 0.5, BEAT * 0.85, 0.055)
      }
      if (Math.random() < 0.2) {
        const bass = chord[0] - 12
        playNote(midiToFreq(bass), when, BEAT * 2, 0.045)
      }
      nextNoteRef.current += BEAT
    }
    schedulerRef.current = window.setTimeout(scheduleNotes, 80)
  }

  const start = async () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
      gainRef.current = ctxRef.current.createGain()
      gainRef.current.gain.value = 0
      gainRef.current.connect(ctxRef.current.destination)
    }
    if (ctxRef.current.state === 'suspended') await ctxRef.current.resume()
    nextNoteRef.current = ctxRef.current.currentTime + 0.1
    // Fade in
    gainRef.current!.gain.setValueAtTime(0, ctxRef.current.currentTime)
    gainRef.current!.gain.linearRampToValueAtTime(0.18, ctxRef.current.currentTime + 1.5)
    scheduleNotes()
    setPlaying(true)
    setHint(false)
    localStorage.setItem(preferenceKey, '1')
  }

  const stop = () => {
    if (schedulerRef.current) clearTimeout(schedulerRef.current)
    if (ctxRef.current && gainRef.current) {
      gainRef.current.gain.linearRampToValueAtTime(0, ctxRef.current.currentTime + 0.8)
      setTimeout(() => ctxRef.current?.suspend(), 900)
    }
    setPlaying(false)
    localStorage.setItem(preferenceKey, '0')
  }

  const toggle = () => (playing ? stop() : start())

  useEffect(() => {
    const saved = localStorage.getItem(preferenceKey)
    if (saved === '0') { setHint(false); return }

    // Auto-start on first user gesture (satisfies browser autoplay policy)
    const onGesture = () => {
      document.removeEventListener('pointerdown', onGesture)
      document.removeEventListener('keydown', onGesture)
      document.removeEventListener('scroll', onGesture)
      start()
    }
    document.addEventListener('pointerdown', onGesture, { once: true })
    document.addEventListener('keydown', onGesture, { once: true })
    document.addEventListener('scroll', onGesture, { once: true, passive: true })

    return () => {
      document.removeEventListener('pointerdown', onGesture)
      document.removeEventListener('keydown', onGesture)
      document.removeEventListener('scroll', onGesture)
      if (schedulerRef.current) clearTimeout(schedulerRef.current)
      ctxRef.current?.close()
    }
  }, [])

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-medium transition-all duration-300"
      style={{
        background: playing ? 'rgba(0,212,255,0.15)' : 'rgba(13,15,23,0.9)',
        border: `1px solid ${playing ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: playing ? 'var(--color-cyan)' : 'var(--color-muted)',
        backdropFilter: 'blur(10px)',
        boxShadow: playing ? '0 0 20px rgba(0,212,255,0.2)' : 'none',
      }}
      aria-label={playing ? 'Stop ambient jazz music' : 'Play ambient jazz music'}
    >
      {playing ? (
        <>
          <span className="flex gap-0.5 items-end h-3" aria-hidden="true">
            {[1, 3, 2, 4, 2].map((h, i) => (
              <span
                key={i}
                className="w-0.5 rounded-full"
                style={{
                  height: `${h * 3}px`,
                  background: 'currentColor',
                  animation: 'bar-bounce 0.6s ease infinite alternate',
                  animationDelay: `${i * 0.12}s`,
                }}
              />
            ))}
          </span>
          <span>Jazz</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          </svg>
          <span>{hint ? '♪ Jazz' : 'Jazz'}</span>
        </>
      )}
      <style>{`
        @keyframes bar-bounce {
          from { transform: scaleY(0.4); }
          to { transform: scaleY(1.2); }
        }
      `}</style>
    </button>
  )
}

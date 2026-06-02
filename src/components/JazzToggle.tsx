import { useEffect, useRef, useState } from 'react'

// Generative ambient jazz using WebAudio API
// No external files required — procedurally generated
export default function JazzToggle() {
  const [playing, setPlaying] = useState(false)
  const ctxRef = useRef<AudioContext | null>(null)
  const gainRef = useRef<GainNode | null>(null)
  const schedulerRef = useRef<number | null>(null)
  const nextNoteRef = useRef(0)
  const preferenceKey = 'swainpro-jazz'

  // Jazz chord voicings (MIDI note numbers, C4=60)
  const CHORDS = [
    [60, 64, 67, 71],   // Cmaj7
    [62, 65, 69, 72],   // Dm7
    [65, 69, 72, 76],   // Fmaj7
    [67, 71, 74, 77],   // G7
    [64, 67, 71, 74],   // Em7
    [57, 60, 64, 67],   // Am7
    [62, 66, 69, 73],   // D7
    [60, 63, 67, 70],   // Cm7
  ]

  const midiToFreq = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12)

  const playNote = (freq: number, when: number, duration: number, gainVal: number) => {
    const ctx = ctxRef.current!
    const osc = ctx.createOscillator()
    const env = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'triangle'
    osc.frequency.value = freq

    filter.type = 'lowpass'
    filter.frequency.value = 1200
    filter.Q.value = 0.5

    env.gain.setValueAtTime(0, when)
    env.gain.linearRampToValueAtTime(gainVal, when + 0.05)
    env.gain.exponentialRampToValueAtTime(gainVal * 0.6, when + duration * 0.4)
    env.gain.exponentialRampToValueAtTime(0.0001, when + duration)

    osc.connect(filter)
    filter.connect(env)
    env.connect(gainRef.current!)
    osc.start(when)
    osc.stop(when + duration + 0.1)
  }

  const scheduleNotes = () => {
    const ctx = ctxRef.current!
    const LOOK_AHEAD = 0.15
    const BEAT_DURATION = 0.55 + Math.random() * 0.3

    while (nextNoteRef.current < ctx.currentTime + LOOK_AHEAD) {
      const chord = CHORDS[Math.floor(Math.random() * CHORDS.length)]
      const when = nextNoteRef.current

      // Chord pad — soft, held notes
      chord.forEach((note, i) => {
        const freq = midiToFreq(note - 12 + Math.floor(Math.random() * 2))
        playNote(freq, when + i * 0.04, BEAT_DURATION * 3.5, 0.04)
      })

      // Occasional single note melody
      if (Math.random() < 0.4) {
        const melNote = chord[Math.floor(Math.random() * chord.length)] + 12
        playNote(midiToFreq(melNote), when + BEAT_DURATION * 0.5, BEAT_DURATION * 0.8, 0.06)
      }

      nextNoteRef.current += BEAT_DURATION
    }

    schedulerRef.current = window.setTimeout(scheduleNotes, 80)
  }

  const start = async () => {
    if (!ctxRef.current) {
      ctxRef.current = new AudioContext()
      gainRef.current = ctxRef.current.createGain()
      gainRef.current.gain.value = 0.18
      gainRef.current.connect(ctxRef.current.destination)
    }

    if (ctxRef.current.state === 'suspended') {
      await ctxRef.current.resume()
    }

    nextNoteRef.current = ctxRef.current.currentTime
    scheduleNotes()
    setPlaying(true)
    localStorage.setItem(preferenceKey, '1')
  }

  const stop = () => {
    if (schedulerRef.current) clearTimeout(schedulerRef.current)
    ctxRef.current?.suspend()
    setPlaying(false)
    localStorage.setItem(preferenceKey, '0')
  }

  const toggle = () => (playing ? stop() : start())

  useEffect(() => {
    // Never auto-play — check pref but still require user gesture
    return () => {
      if (schedulerRef.current) clearTimeout(schedulerRef.current)
      ctxRef.current?.close()
    }
  }, [])

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-medium transition-all duration-300"
      style={{
        background: playing
          ? 'rgba(0,212,255,0.15)'
          : 'rgba(13,15,23,0.9)',
        border: `1px solid ${playing ? 'rgba(0,212,255,0.4)' : 'rgba(255,255,255,0.1)'}`,
        color: playing ? 'var(--color-cyan)' : 'var(--color-muted)',
        backdropFilter: 'blur(10px)',
      }}
      aria-label={playing ? 'Stop ambient jazz music' : 'Play ambient jazz music'}
      title={playing ? 'Stop ambient music' : 'Play ambient jazz (WebAudio)'}
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
                  animation: `bar-bounce 0.6s ease infinite alternate`,
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
            <path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
          </svg>
          <span>Jazz</span>
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

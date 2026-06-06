import { useEffect, useRef, useState } from 'react'

const ALL_TRACKS: string[] = [
  '/music/corporate-01-corporate-calm.mp3',
  '/music/corporate-02-ambient-calm.mp3',
  '/music/corporate-03-motivational-calm.mp3',
  '/music/corporate-04-technology-calm.mp3',
  '/music/corporate-05-upbeat-calm.mp3',
  '/music/corporate-06-business-calm.mp3',
  '/music/corporate-07-corporate-calm.mp3',
  '/music/corporate-08-ambient-calm.mp3',
  '/music/corporate-09-motivational-relaxed.mp3',
  '/music/corporate-10-technology-calm.mp3',
  '/music/corporate-11-upbeat-calm.mp3',
  '/music/corporate-12-business-calm.mp3',
  '/music/corporate-13-corporate-calm.mp3',
  '/music/corporate-14-ambient-calm.mp3',
  '/music/corporate-15-motivational-calm.mp3',
  '/music/corporate-16-technology-calm.mp3',
  '/music/corporate-17-upbeat-calm.mp3',
  '/music/corporate-18-business-calm.mp3',
  '/music/corporate-19-corporate-calm.mp3',
  '/music/corporate-20-ambient-calm.mp3',
  '/music/corporate-21-motivational-calm.mp3',
  '/music/corporate-22-technology-calm.mp3',
  '/music/corporate-23-upbeat-calm.mp3',
  '/music/corporate-24-business-calm.mp3',
  '/music/corporate-25-corporate-relaxed.mp3',
  '/music/corporate-26-ambient-relaxed.mp3',
  '/music/corporate-27-motivational-relaxed.mp3',
  '/music/corporate-28-technology-relaxed.mp3',
  '/music/corporate-29-upbeat-relaxed.mp3',
  '/music/corporate-30-business-relaxed.mp3',
  '/music/corporate-31-corporate-relaxed.mp3',
  '/music/corporate-32-ambient-relaxed.mp3',
  '/music/corporate-33-motivational-relaxed.mp3',
  '/music/corporate-34-technology-relaxed.mp3',
  '/music/corporate-35-upbeat-relaxed.mp3',
  '/music/corporate-36-business-relaxed.mp3',
  '/music/corporate-37-corporate-relaxed.mp3',
  '/music/corporate-38-ambient-relaxed.mp3',
  '/music/corporate-39-motivational-relaxed.mp3',
  '/music/corporate-40-technology-relaxed.mp3',
  '/music/corporate-41-upbeat-relaxed.mp3',
  '/music/corporate-42-business-bright.mp3',
  '/music/corporate-43-corporate-bright.mp3',
  '/music/corporate-44-ambient-bright.mp3',
  '/music/corporate-45-motivational-bright.mp3',
  '/music/corporate-46-technology-relaxed.mp3',
  '/music/corporate-47-upbeat-calm.mp3',
  '/music/corporate-48-business-calm.mp3',
  '/music/corporate-49-corporate-relaxed.mp3',
  '/music/corporate-50-ambient-relaxed.mp3',
]

function randTrackIdx(exclude: number): number {
  let n = Math.floor(Math.random() * ALL_TRACKS.length)
  while (n === exclude) n = Math.floor(Math.random() * ALL_TRACKS.length)
  return n
}

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const trackIdxRef = useRef<number>(-1)
  const preferenceKey = 'swainpro-music'

  const loadTrack = (audio: HTMLAudioElement, idx: number) => {
    trackIdxRef.current = idx
    audio.src = ALL_TRACKS[idx]
    audio.load()
  }

  const doPlay = async (audio: HTMLAudioElement) => {
    try {
      audio.volume = 0.32
      await audio.play()
      setPlaying(true)
      localStorage.setItem(preferenceKey, '1')
    } catch {}
  }

  const doPause = () => {
    audioRef.current?.pause()
    setPlaying(false)
    localStorage.setItem(preferenceKey, '0')
  }

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    playing ? doPause() : doPlay(audio)
  }

  useEffect(() => {
    const startIdx = randTrackIdx(-1)
    const audio = new Audio()
    audio.volume = 0.32
    audio.preload = 'auto'
    audioRef.current = audio

    loadTrack(audio, startIdx)

    audio.addEventListener('ended', () => {
      const next = randTrackIdx(trackIdxRef.current)
      loadTrack(audio, next)
      audio.play().catch(() => {})
    })

    if (localStorage.getItem(preferenceKey) === '0') return

    audio.play()
      .then(() => {
        setPlaying(true)
        localStorage.setItem(preferenceKey, '1')
      })
      .catch(() => {
        const unlock = () => doPlay(audio)
        document.addEventListener('pointerdown', unlock, { once: true })
        document.addEventListener('keydown', unlock, { once: true })
      })

    return () => {
      audio.pause()
      audio.src = ''
    }
  }, [])

  return (
    <button
      onClick={toggle}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-medium transition-all duration-300"
      style={{
        background: playing ? 'rgba(200,169,110,0.12)' : 'rgba(13,15,23,0.9)',
        border: `1px solid ${playing ? 'rgba(200,169,110,0.45)' : 'rgba(255,255,255,0.1)'}`,
        color: playing ? 'var(--color-gold)' : 'var(--color-muted)',
        backdropFilter: 'blur(10px)',
        boxShadow: playing ? '0 0 24px rgba(200,169,110,0.3)' : 'none',
      }}
      aria-label={playing ? 'Pause background music' : 'Play background music'}
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
          <span>Music</span>
        </>
      ) : (
        <>
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M9 18V5l12-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm12-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
          </svg>
          <span>Music</span>
        </>
      )}
      <style>{`
        @keyframes bar-bounce {
          from { transform: scaleY(0.4); }
          to   { transform: scaleY(1.2); }
        }
      `}</style>
    </button>
  )
}

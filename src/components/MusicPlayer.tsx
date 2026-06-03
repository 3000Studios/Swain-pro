import { useEffect, useRef, useState } from 'react'

export default function MusicPlayer() {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const preferenceKey = 'swainpro-music'

  const play = async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      audio.volume = 0.32
      await audio.play()
      setPlaying(true)
      localStorage.setItem(preferenceKey, '1')
    } catch {}
  }

  const pause = () => {
    audioRef.current?.pause()
    setPlaying(false)
    localStorage.setItem(preferenceKey, '0')
  }

  const toggle = () => (playing ? pause() : play())

  useEffect(() => {
    const audio = new Audio('/audio/profile-music.mp3')
    audio.loop = true
    audio.preload = 'auto'
    audioRef.current = audio

    const saved = localStorage.getItem(preferenceKey)
    if (saved === '0') return

    const onGesture = () => {
      document.removeEventListener('pointerdown', onGesture)
      document.removeEventListener('keydown', onGesture)
      play()
    }
    document.addEventListener('pointerdown', onGesture, { once: true })
    document.addEventListener('keydown', onGesture, { once: true })

    return () => {
      document.removeEventListener('pointerdown', onGesture)
      document.removeEventListener('keydown', onGesture)
      audio.pause()
      audio.src = ''
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
          to { transform: scaleY(1.2); }
        }
      `}</style>
    </button>
  )
}

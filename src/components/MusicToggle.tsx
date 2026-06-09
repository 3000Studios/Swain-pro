import { useEffect, useRef, useState } from 'react'

// Auto-discover every mp3 in src/audio — drop a new file in and it joins the
// rotation automatically, no code change needed.
const TRACK_MAP = import.meta.glob('../audio/*.mp3', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

const TRACKS: string[] = Object.values(TRACK_MAP)

const VOLUME = 0.5
const PREF_KEY = 'swainpro-music'

function randIdx(exclude: number): number {
  if (TRACKS.length <= 1) return 0
  let n = Math.floor(Math.random() * TRACKS.length)
  while (n === exclude) n = Math.floor(Math.random() * TRACKS.length)
  return n
}

export default function MusicToggle() {
  const [playing, setPlaying] = useState(false)
  const [hover, setHover] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const idxRef = useRef<number>(-1)

  const load = (audio: HTMLAudioElement, idx: number) => {
    idxRef.current = idx
    audio.src = TRACKS[idx]
    audio.load()
  }

  const play = async (audio: HTMLAudioElement) => {
    try {
      audio.volume = VOLUME
      await audio.play()
      setPlaying(true)
      localStorage.setItem(PREF_KEY, '1')
    } catch {
      /* autoplay blocked — waits for a gesture */
    }
  }

  const pause = () => {
    audioRef.current?.pause()
    setPlaying(false)
    localStorage.setItem(PREF_KEY, '0')
  }

  const toggle = () => {
    const audio = audioRef.current
    if (!audio || TRACKS.length === 0) return
    playing ? pause() : play(audio)
  }

  useEffect(() => {
    if (TRACKS.length === 0) return

    const audio = new Audio()
    audio.volume = VOLUME
    audio.preload = 'auto'
    audioRef.current = audio

    load(audio, randIdx(-1))

    // Random rotation: when a track ends, jump to a different random one
    const onEnded = () => {
      load(audio, randIdx(idxRef.current))
      audio.play().catch(() => {})
    }
    audio.addEventListener('ended', onEnded)

    // Respect an explicit pause preference from a prior visit
    if (localStorage.getItem(PREF_KEY) === '0') {
      return () => {
        audio.removeEventListener('ended', onEnded)
        audio.pause()
        audio.src = ''
      }
    }

    // Try immediate autoplay; if the browser blocks it, unlock on first gesture
    audio
      .play()
      .then(() => {
        setPlaying(true)
        localStorage.setItem(PREF_KEY, '1')
      })
      .catch(() => {
        const unlock = () => play(audio)
        document.addEventListener('pointerdown', unlock, { once: true })
        document.addEventListener('keydown', unlock, { once: true })
      })

    return () => {
      audio.removeEventListener('ended', onEnded)
      audio.pause()
      audio.src = ''
    }
  }, [])

  if (TRACKS.length === 0) return null

  const gold = 'rgb(200,169,110)'

  return (
    <button
      onClick={toggle}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="music-toggle relative grid place-items-center w-9 h-9 rounded-full shrink-0"
      style={{
        background: playing ? 'rgba(200,169,110,0.14)' : 'rgba(255,255,255,0.04)',
        border: `1px solid ${playing ? 'rgba(200,169,110,0.5)' : 'rgba(255,255,255,0.12)'}`,
        boxShadow: playing
          ? '0 0 18px rgba(200,169,110,0.45)'
          : hover
          ? '0 0 14px rgba(200,169,110,0.35)'
          : 'none',
        transition: 'background .3s ease, border-color .3s ease, box-shadow .3s ease',
      }}
      aria-label={playing ? 'Pause background music' : 'Play background music'}
      aria-pressed={playing}
      title={playing ? 'Mute music' : 'Play music'}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-[18px] h-[18px]"
        aria-hidden="true"
        style={{
          color: playing ? gold : hover ? gold : 'var(--color-muted)',
          // The "fall over": when off the speaker tips onto its side.
          transform: playing
            ? 'rotate(0deg) translateY(0)'
            : 'rotate(74deg) translateY(2px)',
          transformOrigin: '50% 85%',
          transition:
            'transform .5s cubic-bezier(.34,1.56,.64,1), color .3s ease',
        }}
      >
        {/* Speaker body */}
        <path
          fill="currentColor"
          d="M4 9v6h4l5 4V5L8 9H4z"
        />
        {/* Sound waves — visible & animated only while playing */}
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          style={{
            opacity: playing ? 1 : 0,
            transition: 'opacity .3s ease',
          }}
        >
          <path d="M16.5 8.5a5 5 0 0 1 0 7" className="mt-wave mt-wave-1" />
          <path d="M19 6a8.5 8.5 0 0 1 0 12" className="mt-wave mt-wave-2" />
        </g>
        {/* Mute slash — visible only when off */}
        <line
          x1="3" y1="3" x2="21" y2="21"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          style={{
            opacity: playing ? 0 : 0.85,
            transition: 'opacity .3s ease',
          }}
        />
      </svg>

      <style>{`
        .mt-wave { transform-origin: 14px 12px; }
        .music-toggle:hover .mt-wave { animation: mt-pulse 1.1s ease-in-out infinite; }
        .mt-wave-2 { animation-delay: .15s; }
        @keyframes mt-pulse {
          0%, 100% { opacity: .5; }
          50%      { opacity: 1; }
        }
      `}</style>
    </button>
  )
}

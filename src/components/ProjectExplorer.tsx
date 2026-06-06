import { useState, useEffect, useRef } from 'react'
import type { Project } from '../data/projects'

const CATEGORY_LABELS: Record<string, string> = {
  all:        'All Projects',
  ai:         'AI & LLM',
  automation: 'Automation',
  web:        'Web / Edge',
  python:     'Python',
  business:   'Business Tools',
  tools:      'Dev Tools',
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  live:     { label: 'Live',    color: '#34D399' },
  active:   { label: 'Active',  color: '#C8A96E' },
  'in-dev': { label: 'In Dev',  color: '#FBBF24' },
  archived: { label: 'Archive', color: '#A78BFA' },
}

const CATEGORY_COLORS: Record<string, string> = {
  ai:         '#C8A96E',
  automation: '#A78BFA',
  web:        '#34D399',
  python:     '#FBBF24',
  business:   '#60A5FA',
  tools:      '#A78BFA',
}

type ShotTab = 'home' | 'featured' | 'pricing'

interface Props { projects: Project[] }

function ProjectCard({ project }: { project: Project }) {
  const [active, setActive]       = useState(false)   // card flipped / video playing
  const [pinned, setPinned]       = useState(false)   // stays active after hover leaves
  const [activeShot, setActiveShot] = useState<ShotTab>('home')
  const [videoFailed, setVideoFailed] = useState(false)
  const [videoLoaded, setVideoLoaded] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const slug = project.slug
  // Derive screenshot paths from slug naming convention
  const shot = (tab: ShotTab) => `/images/projects/${slug}-${tab}.jpg`
  // Video: use custom promoVideo or fall back to Playwright screen recording
  const videoSrc = project.promoVideo || `/videos/projects/${slug}-screen.webm`
  const hasPromo = Boolean(project.promoVideo)

  const isActive = active || pinned
  const status   = STATUS_META[project.status] ?? STATUS_META.active
  const catColor = CATEGORY_COLORS[project.category] ?? '#C8A96E'

  // Play/pause video when active state changes
  useEffect(() => {
    const v = videoRef.current
    if (!v || videoFailed) return
    if (isActive) {
      v.play().catch(() => setVideoFailed(true))
    } else {
      v.pause()
      v.currentTime = 0
    }
  }, [isActive, videoFailed])

  const handlePointerEnter = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setActive(true)
  }
  const handlePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setActive(false)
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Tab buttons stopPropagation — this only fires on card body
    // Clicking pins/unpins on both mouse and touch
    e.stopPropagation()
    setPinned(p => !p)
  }

  const switchTab = (e: React.MouseEvent, tab: ShotTab) => {
    e.stopPropagation()
    setActiveShot(tab)
  }

  return (
    <div
      className="flip-container"
      onPointerEnter={handlePointerEnter}
      onPointerLeave={handlePointerLeave}
      aria-label={`${project.name} project card`}
    >
      <div
        className={`flip-card${isActive ? ' is-flipped' : ''}`}
        onClick={handleCardClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setPinned(p => !p)
          }
        }}
        tabIndex={0}
        role="button"
        aria-pressed={isActive}
        aria-label={`${project.name} — ${isActive ? 'showing live site' : 'tap to preview'}`}
      >

        {/* ══════════════════════════════════════
            FRONT FACE
        ══════════════════════════════════════ */}
        <div className="flip-front" aria-hidden={isActive}>

          {/* Subtle screenshot hint on front */}
          <img
            src={project.screenshot || shot('home')}
            alt=""
            aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'top center',
              opacity: 0.06, borderRadius: 'inherit',
              pointerEvents: 'none',
            }}
          />

          {/* Badge row */}
          <div style={{ display: 'flex', gap: '6px', marginBottom: '14px', flexWrap: 'wrap', position: 'relative', zIndex: 2 }}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: '5px',
              padding: '4px 10px', borderRadius: '100px', fontSize: '0.6rem',
              fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: `${status.color}18`, color: status.color,
              border: `1px solid ${status.color}30`,
            }}>
              <span style={{
                width: '5px', height: '5px', borderRadius: '50%', background: status.color,
                animation: project.status === 'live' ? 'pulse-dot 2s ease infinite' : 'none',
                flexShrink: 0,
              }}/>
              {status.label}
            </span>
            <span style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '4px 10px', borderRadius: '100px', fontSize: '0.6rem',
              fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase',
              background: `${catColor}14`, color: catColor,
              border: `1px solid ${catColor}28`,
            }}>
              {CATEGORY_LABELS[project.category] ?? project.category}
            </span>
            {project.featured && (
              <span style={{
                display: 'inline-flex', alignItems: 'center',
                padding: '4px 10px', borderRadius: '100px', fontSize: '0.6rem',
                fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: 'rgba(251,191,36,0.1)', color: '#FBBF24',
                border: '1px solid rgba(251,191,36,0.2)',
              }}>★ Featured</span>
            )}
          </div>

          {/* Project name */}
          <h3 style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'clamp(1.2rem, 3.5vw, 1.6rem)',
            lineHeight: 1.1, letterSpacing: '-0.02em', marginBottom: '10px',
            background: 'linear-gradient(130deg, #D4B87A 0%, #C8A96E 50%, #A8894E 100%)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text', position: 'relative', zIndex: 2,
          }}>
            {project.name}
          </h3>

          {/* Description */}
          <p style={{
            fontSize: 'clamp(0.7rem, 2vw, 0.8rem)', lineHeight: 1.62,
            color: 'rgba(240,235,227,0.52)',
            marginBottom: '14px', flex: 1,
            position: 'relative', zIndex: 2,
            display: '-webkit-box',
            WebkitLineClamp: 5,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            {project.description}
          </p>

          {/* Tech pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '14px', position: 'relative', zIndex: 2 }}>
            {project.tech.slice(0, 5).map(t => (
              <span key={t} style={{
                padding: '4px 9px', borderRadius: '5px',
                fontSize: 'clamp(0.52rem, 1.5vw, 0.62rem)',
                fontFamily: 'var(--font-mono)',
                color: 'rgba(200,169,110,0.55)',
                background: 'rgba(200,169,110,0.07)',
                border: '1px solid rgba(200,169,110,0.14)',
                whiteSpace: 'nowrap',
              }}>{t}</span>
            ))}
            {project.tech.length > 5 && (
              <span style={{
                padding: '4px 9px', borderRadius: '5px',
                fontSize: 'clamp(0.52rem, 1.5vw, 0.62rem)',
                fontFamily: 'var(--font-mono)',
                color: 'rgba(200,169,110,0.3)',
                background: 'rgba(200,169,110,0.04)',
                border: '1px solid rgba(200,169,110,0.08)',
              }}>+{project.tech.length - 5}</span>
            )}
          </div>

          {/* Footer */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 'auto', position: 'relative', zIndex: 2,
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.62rem',
              color: 'rgba(200,169,110,0.35)',
            }}>
              {project.year}
            </span>
            <span style={{
              fontSize: '0.58rem', letterSpacing: '0.08em',
              fontFamily: 'var(--font-mono)',
              color: 'rgba(240,235,227,0.22)',
            }}>
              {isActive ? '← tap to close' : 'hover / tap →'}
            </span>
          </div>

          {/* Gold corner glow */}
          <div style={{
            position: 'absolute', top: 0, right: 0, width: '65px', height: '65px',
            background: 'linear-gradient(225deg, rgba(200,169,110,0.18) 0%, transparent 65%)',
            borderTopRightRadius: 'inherit', pointerEvents: 'none', zIndex: 1,
          }}/>
        </div>

        {/* ══════════════════════════════════════
            BACK FACE
        ══════════════════════════════════════ */}
        <div className="flip-back" aria-hidden={!isActive}>

          {/* ── Background layers ── */}

          {/* 1. Screenshot base */}
          <img
            src={shot(activeShot)}
            alt={`${project.name} ${activeShot} screenshot`}
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'top center',
              borderRadius: 'inherit',
              transition: 'opacity 0.4s ease',
            }}
            onError={(e) => {
              // fallback to original screenshot
              const el = e.currentTarget as HTMLImageElement
              if (project.screenshot && el.src !== project.screenshot) {
                el.src = project.screenshot
              }
            }}
          />

          {/* 2. Video layer */}
          {!videoFailed && (
            <video
              ref={videoRef}
              src={videoSrc}
              muted
              loop
              playsInline
              preload="none"
              aria-hidden="true"
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover',
                borderRadius: 'inherit',
                opacity: videoLoaded ? (hasPromo ? 1 : 0.72) : 0,
                transition: 'opacity 0.8s ease',
              }}
              onCanPlay={() => setVideoLoaded(true)}
              onError={() => setVideoFailed(true)}
            />
          )}

          {/* 3. Gradient overlay for readability */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 'inherit',
            background: 'linear-gradient(to top, rgba(11,11,11,0.97) 0%, rgba(11,11,11,0.65) 40%, rgba(11,11,11,0.15) 100%)',
            pointerEvents: 'none',
          }}/>

          {/* ── Screenshot switcher tabs ── */}
          <div
            style={{
              position: 'absolute', top: '12px', left: '12px', right: '12px',
              display: 'flex', gap: '6px', zIndex: 10,
            }}
            onClick={e => e.stopPropagation()}
          >
            {(['home', 'featured', 'pricing'] as ShotTab[]).map(tab => (
              <button
                key={tab}
                onClick={e => switchTab(e, tab)}
                aria-pressed={activeShot === tab}
                style={{
                  padding: '5px 11px', borderRadius: '6px',
                  fontSize: '0.55rem', fontFamily: 'var(--font-mono)',
                  fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em',
                  border: '1px solid rgba(200,169,110,0.35)',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                  background: activeShot === tab ? 'rgba(200,169,110,0.9)' : 'rgba(0,0,0,0.55)',
                  color: activeShot === tab ? '#0B0B0B' : 'rgba(240,235,227,0.75)',
                  cursor: 'pointer',
                  transition: 'background 0.2s ease, color 0.2s ease',
                  minHeight: '28px',
                  touchAction: 'manipulation',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Content overlay ── */}
          <div style={{
            position: 'relative', zIndex: 2,
            padding: '1.25rem',
            height: '100%',
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            gap: '8px',
          }}>
            {/* Category */}
            <p style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.58rem',
              color: 'var(--color-gold)', letterSpacing: '0.16em',
              textTransform: 'uppercase', margin: 0,
            }}>
              {CATEGORY_LABELS[project.category] ?? project.category}
            </p>

            {/* Name */}
            <h3 style={{
              fontFamily: 'var(--font-display)', fontWeight: 800,
              fontSize: 'clamp(1.1rem, 3.5vw, 1.4rem)',
              color: 'var(--color-text)', margin: 0,
              lineHeight: 1.15,
            }}>
              {project.name}
            </h3>

            {/* Short description snippet */}
            <p style={{
              fontSize: '0.7rem', lineHeight: 1.5,
              color: 'rgba(240,235,227,0.6)',
              margin: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {project.longDescription}
            </p>

            {/* Action buttons */}
            <div
              style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}
              onClick={e => e.stopPropagation()}
            >
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '10px 18px', borderRadius: '8px', minHeight: '44px',
                    background: 'var(--color-gold)', color: 'var(--color-onyx)',
                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase', textDecoration: 'none',
                    transition: 'opacity 0.2s ease',
                    touchAction: 'manipulation',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                  aria-label={`Visit ${project.name}`}
                >
                  <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                  </svg>
                  Visit Site
                </a>
              )}
              {project.github && (
                <a
                  href={project.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '10px 14px', borderRadius: '8px', minHeight: '44px',
                    background: 'rgba(255,255,255,0.07)',
                    border: '1px solid rgba(255,255,255,0.14)',
                    color: 'rgba(240,235,227,0.75)',
                    fontSize: '0.72rem', fontWeight: 600, letterSpacing: '0.04em',
                    textDecoration: 'none',
                    transition: 'background 0.2s ease',
                    touchAction: 'manipulation',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.14)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                  aria-label={`${project.name} source code on GitHub`}
                >
                  <svg width="13" height="13" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Code
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%,100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.4; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}

export default function ProjectExplorer({ projects }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const filterRef = useRef<HTMLDivElement>(null)

  const categories = ['all', ...Array.from(new Set(projects.map(p => p.category)))]
  const filtered   = activeCategory === 'all' ? projects : projects.filter(p => p.category === activeCategory)

  return (
    <div>
      {/* ── Filter bar ── */}
      <div
        ref={filterRef}
        role="tablist"
        aria-label="Filter projects by category"
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '2rem',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarWidth: 'none',
          paddingBottom: '4px',
          paddingLeft: '2px',
          paddingRight: '2px',
        }}
      >
        {categories.map(cat => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              flexShrink: 0,
              padding: '9px 16px',
              borderRadius: '100px',
              fontSize: '0.68rem',
              fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              background: activeCategory === cat ? 'rgba(200,169,110,0.12)' : 'transparent',
              color: activeCategory === cat ? 'var(--color-gold)' : 'rgba(240,235,227,0.45)',
              border: activeCategory === cat
                ? '1px solid rgba(200,169,110,0.45)'
                : '1px solid rgba(255,255,255,0.09)',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              whiteSpace: 'nowrap',
              touchAction: 'manipulation',
              minHeight: '36px',
              outline: 'none',
            }}
            onMouseEnter={e => {
              if (activeCategory !== cat) {
                e.currentTarget.style.color = 'rgba(200,169,110,0.7)'
                e.currentTarget.style.borderColor = 'rgba(200,169,110,0.25)'
              }
            }}
            onMouseLeave={e => {
              if (activeCategory !== cat) {
                e.currentTarget.style.color = 'rgba(240,235,227,0.45)'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)'
              }
            }}
            onFocus={e => { e.currentTarget.style.outline = '2px solid var(--color-gold)' }}
            onBlur={e => { e.currentTarget.style.outline = 'none' }}
          >
            {CATEGORY_LABELS[cat] ?? cat}
            {activeCategory === cat && filtered.length > 0 && (
              <span style={{ marginLeft: '7px', opacity: 0.45, fontSize: '0.58rem' }}>
                ({filtered.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Project grid ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))',
        gap: 'clamp(14px, 3vw, 24px)',
      }}>
        {filtered.map((project, i) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>

      <style>{`
        /* Hide scrollbar on filter bar */
        [role="tablist"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

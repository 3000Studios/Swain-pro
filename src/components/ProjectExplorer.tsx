import { useState } from 'react'
import type { Project } from '../data/projects'

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All Projects',
  ai: 'AI & LLM',
  automation: 'Automation',
  web: 'Web / Edge',
  python: 'Python',
  business: 'Business Tools',
  tools: 'Dev Tools',
}

const STATUS_COLORS: Record<string, string> = {
  live: 'badge-emerald',
  active: 'badge-cyan',
  'in-dev': 'badge-amber',
  archived: 'badge-purple',
}

const CATEGORY_COLORS: Record<string, string> = {
  ai: 'badge-cyan',
  automation: 'badge-purple',
  web: 'badge-emerald',
  python: 'badge-amber',
  business: 'badge-cyan',
  tools: 'badge-purple',
}

interface Props {
  projects: Project[]
}

export default function ProjectExplorer({ projects }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  const categories = ['all', ...Array.from(new Set(projects.map(p => p.category)))]

  const filtered = activeCategory === 'all'
    ? projects
    : projects.filter(p => p.category === activeCategory)

  return (
    <div>
      {/* Filter bar */}
      <div
        className="flex flex-wrap gap-2 mb-8"
        role="tablist"
        aria-label="Filter projects by category"
      >
        {categories.map(cat => (
          <button
            key={cat}
            role="tab"
            aria-selected={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-semibold font-mono uppercase tracking-wider transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-cyan)] ${
              activeCategory === cat
                ? 'bg-[var(--color-cyan-dim)] text-[var(--color-cyan)] border border-[rgba(0,212,255,0.3)]'
                : 'bg-[var(--color-card)] text-[var(--color-muted)] border border-[var(--color-border)] hover:text-[var(--color-text)] hover:border-[rgba(255,255,255,0.12)]'
            }`}
          >
            {CATEGORY_LABELS[cat] ?? cat}
            {activeCategory === cat && (
              <span className="ml-2 text-[10px] opacity-70">({filtered.length})</span>
            )}
          </button>
        ))}
      </div>

      {/* Project grid */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
        role="tabpanel"
      >
        {filtered.map(project => (
          <article
            key={project.slug}
            className={`card p-5 cursor-pointer transition-all duration-300 ${expanded === project.slug ? 'md:col-span-2 lg:col-span-2 border-[var(--color-border-glow)]' : ''}`}
            onClick={() => setExpanded(expanded === project.slug ? null : project.slug)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setExpanded(expanded === project.slug ? null : project.slug)
              }
            }}
            tabIndex={0}
            role="button"
            aria-expanded={expanded === project.slug}
            aria-label={`${project.name} — ${project.description}. Click to ${expanded === project.slug ? 'collapse' : 'expand'}.`}
          >
            {/* Card header */}
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`badge ${STATUS_COLORS[project.status] ?? 'badge-cyan'}`}>
                    {project.status}
                  </span>
                  <span className={`badge ${CATEGORY_COLORS[project.category] ?? 'badge-cyan'}`}>
                    {CATEGORY_LABELS[project.category] ?? project.category}
                  </span>
                  {project.featured && (
                    <span className="badge badge-amber">Featured</span>
                  )}
                </div>
                <h3 className="font-semibold text-[var(--color-text)] text-base leading-tight">
                  {project.name}
                </h3>
              </div>
              {project.stars && project.stars > 0 && (
                <div className="flex items-center gap-1 text-[var(--color-amber)] text-xs shrink-0">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                  {project.stars}
                </div>
              )}
            </div>

            <p className="text-sm text-[var(--color-dim)] leading-relaxed mb-4">
              {expanded === project.slug ? project.longDescription : project.description}
            </p>

            {/* Expanded details */}
            {expanded === project.slug && (
              <div className="mt-2 mb-4 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-[var(--color-muted)] uppercase tracking-wider mb-2">Highlights</p>
                  <ul className="space-y-1.5">
                    {project.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-dim)]">
                        <span className="text-[var(--color-cyan)] mt-0.5">▸</span>
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Tech stack */}
            <div className="flex flex-wrap gap-1.5 mb-4">
              {project.tech.slice(0, expanded === project.slug ? undefined : 4).map(t => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded text-[10px] font-mono font-medium text-[var(--color-muted)] bg-white/5 border border-[var(--color-border)]"
                >
                  {t}
                </span>
              ))}
              {!expanded && project.tech.length > 4 && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono text-[var(--color-muted)] bg-white/5 border border-[var(--color-border)]">
                  +{project.tech.length - 4}
                </span>
              )}
            </div>

            {/* Links */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                {project.url && (
                  <a
                    href={project.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-cyan)] hover:underline"
                    aria-label={`Visit ${project.name} live site`}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/>
                    </svg>
                    Live
                  </a>
                )}
                {project.github && (
                  <a
                    href={project.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-muted)] hover:text-[var(--color-text)] hover:underline"
                    aria-label={`View ${project.name} source code on GitHub`}
                  >
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                    </svg>
                    Code
                  </a>
                )}
              </div>
              <span className="text-xs text-[var(--color-muted)]">{project.year}</span>
            </div>

            {/* Expand hint */}
            <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex items-center justify-center">
              <span className="text-[10px] text-[var(--color-muted)] flex items-center gap-1">
                <svg
                  className={`w-3 h-3 transition-transform duration-300 ${expanded === project.slug ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
                </svg>
                {expanded === project.slug ? 'Collapse' : 'Expand details'}
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import type { CSSProperties } from 'react'
import type { Project } from '../data/projects'

const CATEGORY_LABELS: Record<string, string> = {
  all: 'All projects',
  ai: 'AI & LLM',
  automation: 'Automation',
  web: 'Web / Edge',
  python: 'Python',
  business: 'Business tools',
  tools: 'Dev tools',
}

const STATUS_META: Record<Project['status'], { label: string; color: string }> = {
  live: { label: 'Live', color: '#46f2c2' },
  active: { label: 'Active', color: '#82f7ff' },
  'in-dev': { label: 'In development', color: '#ffd27a' },
  archived: { label: 'Archived', color: '#b79cff' },
}

const CATEGORY_COLORS: Record<Project['category'], string> = {
  ai: '#b79cff',
  automation: '#ffd27a',
  web: '#46f2c2',
  python: '#82f7ff',
  business: '#ff9fb9',
  tools: '#9ca8bb',
}

interface Props {
  projects: Project[]
}

function ProjectCard({ project }: { project: Project }) {
  const [expanded, setExpanded] = useState(false)
  const status = STATUS_META[project.status]
  const accent = CATEGORY_COLORS[project.category]
  const preview = project.screenshot ?? `/images/projects/${project.slug}-home.jpg`

  return (
    <article
      className="projects-card"
      style={{ '--project-accent': accent } as CSSProperties}
    >
      <div className="projects-card__visual">
        <img
          src={preview}
          alt={`${project.name} website preview`}
          loading="lazy"
          onError={(event) => {
            event.currentTarget.style.display = 'none'
          }}
        />
        <div className="projects-card__visual-shade" aria-hidden="true" />
        <div className="projects-card__badges">
          <span className="projects-card__status" style={{ color: status.color }}>
            <span style={{ backgroundColor: status.color }} aria-hidden="true" />
            {status.label}
          </span>
          <span className="projects-card__category">{CATEGORY_LABELS[project.category]}</span>
        </div>
      </div>

      <div className="projects-card__body">
        <div>
          <p className="projects-card__year">{project.year}</p>
          <h3>{project.name}</h3>
          <p className="projects-card__description">{project.description}</p>
        </div>

        {expanded && (
          <div className="projects-card__details">
            <p>{project.longDescription}</p>
            <ul>
              {project.highlights.slice(0, 3).map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="projects-card__tech" aria-label={`${project.name} technology`}>
          {project.tech.slice(0, 4).map((technology) => (
            <span key={technology}>{technology}</span>
          ))}
          {project.tech.length > 4 && <span>+{project.tech.length - 4}</span>}
        </div>

        <div className="projects-card__actions">
          <button
            type="button"
            className="projects-card__details-button"
            onClick={() => setExpanded((isExpanded) => !isExpanded)}
            aria-expanded={expanded}
          >
            {expanded ? 'Hide details' : 'View details'}
          </button>
          {project.url && (
            <a href={project.url} target="_blank" rel="noopener noreferrer">
              Visit project <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

export default function ProjectExplorer({ projects }: Props) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const categories = ['all', ...Array.from(new Set(projects.map((project) => project.category)))]
  const filtered =
    activeCategory === 'all'
      ? projects
      : projects.filter((project) => project.category === activeCategory)

  return (
    <div className="projects-explorer">
      <div className="projects-explorer__filters" role="tablist" aria-label="Filter projects by category">
        {categories.map((category) => {
          const count =
            category === 'all'
              ? projects.length
              : projects.filter((project) => project.category === category).length

          return (
            <button
              key={category}
              type="button"
              role="tab"
              aria-selected={activeCategory === category}
              className={activeCategory === category ? 'is-active' : ''}
              onClick={() => setActiveCategory(category)}
            >
              {CATEGORY_LABELS[category] ?? category} <span>{count}</span>
            </button>
          )
        })}
      </div>

      <p className="projects-explorer__count" aria-live="polite">
        Showing {filtered.length} {filtered.length === 1 ? 'project' : 'projects'}
      </p>

      <div className="projects-explorer__grid">
        {filtered.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </div>
  )
}

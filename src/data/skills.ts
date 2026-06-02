export interface Skill {
  name: string
  level: number
  category: string
}

export interface SkillCategory {
  label: string
  icon: string
  color: string
  skills: Skill[]
}

export const skillCategories: SkillCategory[] = [
  {
    label: 'AI & LLM Integration',
    icon: '🧠',
    color: 'cyan',
    skills: [
      { name: 'LLM Integration (GPT-4, Claude, Gemini)', level: 95, category: 'ai' },
      { name: 'LangChain / Agent Orchestration', level: 90, category: 'ai' },
      { name: 'Prompt Engineering & Optimization', level: 95, category: 'ai' },
      { name: 'AI Workflow Design', level: 92, category: 'ai' },
      { name: 'RAG Pipelines & Vector Stores', level: 82, category: 'ai' },
      { name: 'Multi-Agent Systems', level: 85, category: 'ai' },
    ],
  },
  {
    label: 'Development',
    icon: '💻',
    color: 'purple',
    skills: [
      { name: 'Python', level: 90, category: 'dev' },
      { name: 'TypeScript / JavaScript', level: 88, category: 'dev' },
      { name: 'React / Next.js / Astro', level: 85, category: 'dev' },
      { name: 'Node.js / REST APIs', level: 87, category: 'dev' },
      { name: 'Flask / FastAPI', level: 80, category: 'dev' },
      { name: 'SQL / Pandas / Data Analysis', level: 80, category: 'dev' },
    ],
  },
  {
    label: 'Automation & DevOps',
    icon: '⚙️',
    color: 'emerald',
    skills: [
      { name: 'Cloudflare Workers / Pages', level: 90, category: 'ops' },
      { name: 'Workflow Automation / RPA', level: 88, category: 'ops' },
      { name: 'Wrangler / Cloudflare CLI', level: 88, category: 'ops' },
      { name: 'GitHub / Git Workflows', level: 85, category: 'ops' },
      { name: 'Document Automation', level: 87, category: 'ops' },
      { name: 'Firebase / Supabase', level: 78, category: 'ops' },
    ],
  },
  {
    label: 'Business & Platforms',
    icon: '📊',
    color: 'amber',
    skills: [
      { name: 'Requirements Gathering / User Stories', level: 95, category: 'biz' },
      { name: 'Agile / Scrum / Kanban', level: 92, category: 'biz' },
      { name: 'Salesforce CRM', level: 82, category: 'biz' },
      { name: 'Power BI / Dashboard Development', level: 82, category: 'biz' },
      { name: 'Jira / Azure DevOps', level: 88, category: 'biz' },
      { name: 'Stakeholder Management', level: 90, category: 'biz' },
    ],
  },
]

export const coreCompetencies = [
  'LLM System Architecture',
  'AI Agent Development',
  'Workflow Automation',
  'Python Automation Scripting',
  'LangChain Orchestration',
  'Prompt Engineering',
  'Cloudflare Edge Deployment',
  'Business Requirements Analysis',
  'CRM Automation',
  'Dashboard Engineering',
  'Technical Project Management',
  'End-to-End AI Integration',
]

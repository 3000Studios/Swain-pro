export interface Project {
  slug: string
  name: string
  description: string
  longDescription: string
  tech: string[]
  category: 'ai' | 'automation' | 'web' | 'python' | 'business' | 'tools'
  status: 'live' | 'active' | 'in-dev' | 'archived'
  url?: string
  github?: string
  stars?: number
  featured: boolean
  year: string
  highlights: string[]
}

export const projects: Project[] = [
  {
    slug: 'voicetowebsite',
    name: 'VoiceToWebsite',
    description: 'Voice-activated website generator — speak your vision, ship a site.',
    longDescription: 'Full-stack AI platform that converts voice commands and natural language into complete, deployed websites. Built on Cloudflare Workers with a TypeScript/React frontend, integrating GPT-4 for code generation and Wrangler for zero-friction deployment.',
    tech: ['TypeScript', 'React', 'Cloudflare Workers', 'GPT-4', 'Vite', 'Wrangler'],
    category: 'ai',
    status: 'live',
    url: 'https://voicetowebsite.com',
    github: 'https://github.com/3000Studios/VtoW',
    featured: true,
    year: '2025–2026',
    highlights: [
      'Voice-to-code pipeline using Whisper + GPT-4',
      'Real-time preview in browser sandbox',
      'One-click Cloudflare Pages deployment',
      'Multi-template library with AI customization',
    ],
  },
  {
    slug: 'myappai',
    name: 'MyAppAI',
    description: 'AI-powered SaaS platform for rapid app ideation and deployment.',
    longDescription: 'Multi-tenant SaaS application that leverages LLMs to scaffold full-stack applications from high-level product descriptions. Includes billing, auth, and AI-assisted code review pipelines.',
    tech: ['TypeScript', 'React', 'Node.js', 'OpenAI API', 'Firebase', 'Cloudflare Pages'],
    category: 'ai',
    status: 'live',
    url: 'https://myappai.net',
    github: 'https://github.com/3000Studios/myappai',
    stars: 1,
    featured: true,
    year: '2025–2026',
    highlights: [
      'LLM-driven app scaffolding from product specs',
      'Multi-provider AI routing (OpenAI, Gemini, Groq)',
      'Firebase Auth + Stripe billing integration',
      'Cloudflare edge deployment pipeline',
    ],
  },
  {
    slug: 'playstorewizard',
    name: 'PlayStoreWizard Pro',
    description: 'AI-powered Google Play Store optimization and ASO automation tool.',
    longDescription: 'Automated App Store Optimization platform that uses LLMs to generate, test, and iterate on Google Play Store listings. Analyzes competitor keywords, generates A/B test variants, and tracks ranking improvements.',
    tech: ['TypeScript', 'React', 'Python', 'OpenAI API', 'Cloudflare Pages'],
    category: 'automation',
    status: 'live',
    url: 'https://playstorewizard.pro',
    github: 'https://github.com/3000Studios/playstorewizard.pro',
    featured: true,
    year: '2025–2026',
    highlights: [
      'Automated keyword research and competitor analysis',
      'AI-generated store listing copy with A/B variants',
      'Ranking tracker with weekly automated reports',
      'Bulk optimization for multi-app portfolios',
    ],
  },
  {
    slug: 'youtuneai',
    name: 'YouTuneAI',
    description: 'AI-powered digital platform with GPT-driven admin, live e-commerce, and automated content.',
    longDescription: 'Full production digital platform for music/content creators featuring AI-generated content workflows, integrated e-commerce, streaming capabilities, and a GPT-driven admin dashboard for autonomous content operations.',
    tech: ['HTML', 'JavaScript', 'OpenAI API', 'Stripe', 'Node.js'],
    category: 'ai',
    status: 'active',
    github: 'https://github.com/3000Studios/YouTuneAiCOM',
    stars: 1,
    featured: true,
    year: '2025',
    highlights: [
      'GPT-driven content automation and scheduling',
      'Integrated Stripe e-commerce with AI upsell logic',
      'Platinum/marble high-end visual design system',
      'Revenue-flow automation and analytics dashboard',
    ],
  },
  {
    slug: 'agent-make-money',
    name: 'AgentMakeMoney',
    description: 'Autonomous AI agent tasked with identifying and executing real revenue opportunities.',
    longDescription: 'Experimental TypeScript project deploying an autonomous LLM agent with tool access — web search, API calls, and data analysis — tasked with discovering and executing legitimate micro-revenue opportunities. Research into agentic financial reasoning.',
    tech: ['TypeScript', 'LangChain', 'OpenAI API', 'Node.js', 'REST APIs'],
    category: 'ai',
    status: 'active',
    github: 'https://github.com/3000Studios/AgentMakeMoney-',
    featured: false,
    year: '2025',
    highlights: [
      'Autonomous agent with multi-tool execution',
      'Web scraping + opportunity discovery pipeline',
      'Financial reasoning chains with guardrails',
      'Logging and audit trail for agent decisions',
    ],
  },
  {
    slug: 'transcriberpro3k',
    name: 'TranscriberPro3K',
    description: 'High-accuracy AI audio transcription service with speaker diarization.',
    longDescription: 'Audio transcription platform integrating OpenAI Whisper and ElevenLabs for multi-speaker identification, real-time processing, and export to multiple formats. Designed for business meeting transcription and content workflows.',
    tech: ['TypeScript', 'Whisper API', 'ElevenLabs', 'Node.js', 'React'],
    category: 'ai',
    status: 'active',
    github: 'https://github.com/3000Studios/TranscriberPro3K',
    featured: false,
    year: '2025',
    highlights: [
      'Multi-speaker diarization with 95%+ accuracy',
      'Real-time transcription with timestamp markers',
      'Export to DOCX, SRT, JSON, plain text',
      'Batch processing for large audio libraries',
    ],
  },
  {
    slug: 'getnexa',
    name: 'GetNexa Arcade',
    description: 'Free browser games platform with multiplayer and leaderboards on Cloudflare Workers.',
    longDescription: 'High-performance browser gaming platform built entirely on Cloudflare infrastructure. Features multiplayer capabilities using Workers and Durable Objects, global leaderboards with KV, and zero-latency game delivery via Pages.',
    tech: ['TypeScript', 'Cloudflare Workers', 'Durable Objects', 'KV', 'Cloudflare Pages'],
    category: 'web',
    status: 'live',
    url: 'https://getnexa.space',
    github: 'https://github.com/3000Studios/getnexa',
    featured: false,
    year: '2025',
    highlights: [
      'Cloudflare Durable Objects for real-time multiplayer state',
      'Global KV leaderboard system',
      'Zero cold-start edge deployment',
      'Progressive Web App with offline mode',
    ],
  },
  {
    slug: '3000studios-next',
    name: '3000Studios ShadowOS Stack',
    description: 'AI-powered Next.js UI system with monetization engine, voice control, and affiliate injection.',
    longDescription: 'Official 3000 Studios production stack — a Next.js + TypeScript system template featuring voice-controlled navigation, AI-generated UI components, automated affiliate link injection, and a full monetization automation layer.',
    tech: ['TypeScript', 'Next.js', 'React', 'OpenAI API', 'Stripe', 'Vercel'],
    category: 'tools',
    status: 'active',
    github: 'https://github.com/3000Studios/3000studios-next',
    stars: 1,
    featured: false,
    year: '2024–2025',
    highlights: [
      'Voice-controlled UI navigation system',
      'AI component generation from design descriptions',
      'Automated affiliate link injection pipeline',
      'Full monetization stack (Stripe + PayPal + ads)',
    ],
  },
  {
    slug: 'openint',
    name: 'OpenInt',
    description: 'Python AI integration toolkit for connecting LLMs to business data pipelines.',
    longDescription: 'Python library and CLI for connecting large language models to enterprise data sources including databases, APIs, and document repositories. Provides standardized connectors, prompt templates, and output parsers for business automation workflows.',
    tech: ['Python', 'LangChain', 'OpenAI API', 'FastAPI', 'SQLAlchemy', 'Pandas'],
    category: 'python',
    status: 'active',
    github: 'https://github.com/3000Studios/OpenInt',
    featured: false,
    year: '2025',
    highlights: [
      'Standardized LLM connector for 10+ data sources',
      'LangChain-compatible chain and agent templates',
      'FastAPI wrapper for rapid service deployment',
      'Built-in prompt caching and cost tracking',
    ],
  },
  {
    slug: 'project-planner',
    name: 'Project Planner AI',
    description: 'TypeScript project management tool with AI-assisted sprint planning and estimation.',
    longDescription: 'Full-stack project management application with LLM-powered sprint planning, automated story point estimation, and risk analysis. Built for small engineering teams needing intelligent planning without enterprise bloat.',
    tech: ['TypeScript', 'React', 'Node.js', 'OpenAI API', 'PostgreSQL'],
    category: 'business',
    status: 'active',
    github: 'https://github.com/3000Studios/Project-Planner',
    featured: false,
    year: '2025',
    highlights: [
      'AI sprint planning from backlog analysis',
      'Automated story point estimation',
      'Risk identification and mitigation suggestions',
      'Agile velocity tracking with ML prediction',
    ],
  },
]

export const featuredProjects = projects.filter(p => p.featured)
export const categories = ['all', 'ai', 'automation', 'web', 'python', 'business', 'tools'] as const

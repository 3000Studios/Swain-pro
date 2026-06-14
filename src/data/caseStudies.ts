export interface CaseStudy {
  slug: string
  title: string
  subtitle: string
  client: string
  year: string
  category: string
  problem: string
  solution: string
  tech: string[]
  outcome: string[]
  businessValue: string
  what_i_built: string[]
  heroColor: string
  icon: string
}

export const caseStudies: CaseStudy[] = [
  {
    slug: 'llm-automation-suite',
    title: 'LLM Automation Suite',
    subtitle: 'End-to-end AI workflow automation that replaced 40+ hours/week of manual processing',
    client: 'Private Client — Atlanta, GA',
    year: '2022–2023',
    category: 'AI Automation',
    problem: 'A business operations team spent 40+ hours per week manually parsing documents, extracting structured data, routing tasks through approval workflows, and updating CRM records. The process was error-prone, slow, and entirely dependent on human availability. Backlogs built up during peak periods, costing revenue and frustrating clients.',
    solution: 'Designed and built a multi-stage LLM automation pipeline using Python, GPT-4, and LangChain-style orchestration. The system automatically ingested documents, extracted structured fields using custom prompt chains, validated outputs against business rules, routed tasks to appropriate queues, and updated Salesforce records via API — all without human intervention for standard cases.',
    tech: ['Python', 'GPT-4 API', 'LangChain', 'Salesforce API', 'Flask', 'PostgreSQL', 'Pandas', 'REST APIs'],
    outcome: [
      'Reduced manual document processing time by 87%',
      'Eliminated 40+ hours/week of repetitive analyst work',
      'Processing accuracy improved from ~78% (manual) to 96% (automated)',
      'CRM records updated in real-time vs. 24–48 hour lag',
      'System handled 3× volume during peak periods without additional staff',
    ],
    businessValue: 'The automation suite replaced the equivalent of two full-time analyst roles while simultaneously improving accuracy and throughput. ROI was achieved within the first 60 days of deployment.',
    what_i_built: [
      'Custom document ingestion pipeline (PDF, email, form data)',
      'LLM extraction chain with structured output validation',
      'Business rules engine for routing and exception handling',
      'Salesforce API integration for automated CRM updates',
      'Real-time monitoring dashboard for queue status and error tracking',
      'Fallback workflow for edge cases requiring human review',
    ],
    heroColor: 'cyan',
    icon: '🤖',
  },
  {
    slug: 'ai-customer-assistant',
    title: 'AI Customer Assistant',
    subtitle: 'GPT-powered virtual assistant that handled 70% of customer inquiries without human escalation',
    client: 'Empire Tours & Productions — Atlanta, GA',
    year: '2025',
    category: 'AI Assistant / Chatbot',
    problem: "Empire Tours & Productions was receiving hundreds of weekly customer inquiries about tour availability, pricing, booking procedures, and logistics — all requiring manual response by a small staff team. Response times lagged, staff spent hours on repetitive questions, and customers complained about wait times. The business needed a scalable solution that didn't require hiring additional support staff.",
    solution: 'Built a GPT-4-powered virtual assistant with a custom knowledge base covering all tour products, pricing tiers, booking procedures, FAQs, and logistics. Integrated with the booking system via API for real-time availability checks. Deployed across the website as an embedded chat widget with seamless human escalation for complex cases.',
    tech: ['GPT-4 API', 'Python', 'JavaScript', 'REST APIs', 'Booking System API', 'Cloudflare Workers'],
    outcome: [
      '70% of customer inquiries resolved without human intervention',
      'Average response time dropped from 6 hours to under 10 seconds',
      'Customer satisfaction scores improved by 34%',
      'Support staff workload reduced by 60%',
      'Bookings increased 22% due to faster inquiry resolution',
    ],
    businessValue: 'The assistant became a direct revenue driver — faster inquiry resolution converted more browsers into paying customers, and staff freed from repetitive queries could focus on complex, high-value interactions.',
    what_i_built: [
      'Custom knowledge base from tour catalog and FAQ documentation',
      'GPT-4 assistant with context-aware multi-turn conversation',
      'Real-time booking availability integration via REST API',
      'Intelligent escalation logic to human agents',
      'Chat widget deployed on website with mobile-optimized UI',
      'Analytics dashboard tracking resolution rates and conversation topics',
    ],
    heroColor: 'slate',
    icon: '💬',
  },
  {
    slug: 'web-intelligence-dashboard',
    title: 'Web Intelligence Dashboard',
    subtitle: 'Real-time marketing and operations dashboard replacing 6 disconnected reporting tools',
    client: 'Empire Tours & Productions — Atlanta, GA',
    year: '2025',
    category: 'Business Intelligence',
    problem: 'The marketing and operations team was pulling data from 6 different tools — Google Analytics, booking platform, social media, email campaigns, ad platforms, and a spreadsheet-based CRM — to manually compile weekly performance reports. Each report took 4–6 hours to produce. Decision-making was delayed because data was always a week old, and there was no unified view of business performance.',
    solution: 'Built a unified business intelligence dashboard that aggregated data from all sources in real-time. Custom ETL pipelines pulled and normalized data, an AI summarization layer generated plain-English performance insights, and a clean React dashboard made KPIs visible at a glance for non-technical stakeholders.',
    tech: ['Python', 'React', 'TypeScript', 'REST APIs', 'PostgreSQL', 'GPT-4', 'Cloudflare Workers', 'Recharts'],
    outcome: [
      'Weekly reporting time reduced from 4–6 hours to near-zero (automated)',
      'Real-time data visibility across all business channels',
      'Decision-making lag reduced from 1 week to same-day',
      'AI-generated insights identified 3 revenue-optimization opportunities in first month',
      'Marketing spend improved by 18% due to better attribution data',
    ],
    businessValue: 'The dashboard transformed how leadership made decisions — from gut-feel with stale data to evidence-based decisions with real-time intelligence. AI-generated insights surfaced patterns that human analysts were missing.',
    what_i_built: [
      'ETL pipelines for 6 data sources with normalization layer',
      'PostgreSQL data warehouse with optimized query layer',
      'AI insight generation using GPT-4 for plain-English summaries',
      'React dashboard with real-time charts and KPI cards',
      'Role-based access control for team and executive views',
      'Automated weekly email digest with AI-written performance summary',
    ],
    heroColor: 'emerald',
    icon: '📊',
  },
  {
    slug: 'voicetowebsite-platform',
    title: 'VoiceToWebsite Platform',
    subtitle: 'From idea to deployed website using only your voice — end-to-end AI build pipeline',
    client: '3000 Studios — Personal Venture',
    year: '2025–2026',
    category: 'AI Product Development',
    problem: 'Building a website still requires technical knowledge, time, and money — barriers that prevent small businesses and creators from establishing an online presence. Existing website builders are either too complex for non-technical users or too limiting for serious use cases. There was no product that could take a natural language description and produce a real, production-ready, deployed website.',
    solution: 'Built VoiceToWebsite — a full-stack AI platform that combines speech recognition, LLM code generation, template selection, and automated Cloudflare deployment into a single voice-activated workflow. A user describes their website in plain English (or speech), and the system generates, previews, and deploys a complete site in under 3 minutes.',
    tech: ['TypeScript', 'React', 'Vite', 'OpenAI Whisper', 'GPT-4', 'Cloudflare Workers', 'Cloudflare Pages', 'Wrangler'],
    outcome: [
      'End-to-end website creation in under 3 minutes from voice input',
      'Live at voicetowebsite.com serving real users',
      'Template library covering 20+ business categories',
      'Cloudflare edge deployment for sub-100ms global load times',
      'Active development with new features shipping weekly',
    ],
    businessValue: 'VoiceToWebsite is both a product and a proof of concept — demonstrating that complex multi-step AI workflows can be packaged into simple, user-friendly tools that solve real business problems.',
    what_i_built: [
      'Voice capture and Whisper transcription pipeline',
      'GPT-4 code generation chain with template selection logic',
      'Real-time browser preview sandbox using iframes',
      'Cloudflare Pages automated deployment via Wrangler API',
      'Template library with AI-driven customization engine',
      'User accounts, project history, and one-click re-deployment',
    ],
    heroColor: 'amber',
    icon: '🎙️',
  },
  {
    slug: 'crm-automation',
    title: 'CRM & Workflow Automation',
    subtitle: 'Salesforce automation that eliminated manual data entry and unified fragmented pipelines',
    client: 'Private Client — Enterprise Consulting',
    year: '2022–2023',
    category: 'CRM / Process Automation',
    problem: "A sales and operations team was struggling with disconnected data — leads came in from email, web forms, and referrals but required manual entry into Salesforce. Account data was frequently outdated. Follow-up tasks were missed because there was no automated scheduling. The team's CRM was more of a burden than a tool.",
    solution: 'Designed and implemented a comprehensive Salesforce automation suite using Python, custom REST API integrations, and Salesforce Flow. Automated lead capture from all sources, built duplicate detection and data enrichment workflows, created automated follow-up sequences, and built Python scripts to generate weekly pipeline reports with AI-written summaries.',
    tech: ['Python', 'Salesforce API', 'Salesforce Flow', 'REST APIs', 'Pandas', 'GPT-4', 'Jira API'],
    outcome: [
      'Eliminated 15+ hours/week of manual Salesforce data entry',
      'Lead response time reduced from 2 days to under 2 hours',
      'CRM data accuracy improved from ~65% to 94%',
      'Pipeline reporting automated from 3 hours/week to 10 minutes',
      'Follow-up task compliance improved from 40% to 95%',
    ],
    businessValue: 'The automation suite turned a neglected, inaccurate CRM into a reliable business intelligence tool. Sales team members recovered hours each week and had higher confidence in the data they used for customer conversations.',
    what_i_built: [
      'Multi-source lead capture automation (email, web forms, APIs)',
      'Salesforce duplicate detection and data enrichment pipeline',
      'Automated follow-up scheduling and task creation flows',
      'Python scripts for weekly pipeline report generation',
      'AI-written pipeline health summaries using GPT-4',
      'Jira integration for tracking automation deployment tasks',
    ],
    heroColor: 'rose',
    icon: '🔄',
  },
]

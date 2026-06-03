export interface Domain {
  name: string
  url: string
  description: string
  category: string
  status: 'live' | 'in-dev' | 'owned'
  tech?: string[]
  icon: string
}

export const domains: Domain[] = [
  {
    name: 'VoiceToWebsite',
    url: 'https://voicetowebsite.com',
    description: 'Voice-activated AI website generator. Speak your idea, ship a production site.',
    category: 'AI SaaS',
    status: 'live',
    tech: ['TypeScript', 'React', 'Cloudflare', 'GPT-4'],
    icon: '🎙️',
  },
  {
    name: 'PlayStoreWizard Pro',
    url: 'https://playstorewizard.pro',
    description: 'AI-driven App Store Optimization for Google Play — keyword research, listing copy, rank tracking.',
    category: 'AI Tools',
    status: 'live',
    tech: ['TypeScript', 'React', 'Cloudflare'],
    icon: '🧙',
  },
  {
    name: 'FindMeRates',
    url: 'https://findmerates.com',
    description: 'AI-powered rate comparison platform for financial products and services.',
    category: 'FinTech',
    status: 'live',
    tech: ['TypeScript', 'React', 'Cloudflare Pages'],
    icon: '💰',
  },
  {
    name: 'Referrals.live',
    url: 'https://referrals.live',
    description: 'Real-time referral tracking and affiliate management platform.',
    category: 'Growth Tools',
    status: 'live',
    tech: ['TypeScript', 'Cloudflare Workers'],
    icon: '🔗',
  },
  {
    name: 'GetNexa.space',
    url: 'https://getnexa.space',
    description: 'Browser gaming arcade on Cloudflare — free multiplayer games with global leaderboards.',
    category: 'Gaming',
    status: 'live',
    tech: ['TypeScript', 'Cloudflare Workers', 'Durable Objects'],
    icon: '🎮',
  },
  {
    name: 'TheUnitedStates.site',
    url: 'https://theunitedstates.site',
    description: 'Civic information and government data portal built on Cloudflare edge.',
    category: 'Civic Tech',
    status: 'live',
    tech: ['TypeScript', 'Cloudflare Pages'],
    icon: '🇺🇸',
  },
  {
    name: 'Calistique.xyz',
    url: 'https://calistique.xyz',
    description: 'Fitness and calisthenics tracking platform with AI-generated workout programming.',
    category: 'Health Tech',
    status: 'live',
    tech: ['JavaScript', 'Cloudflare Pages'],
    icon: '💪',
  },
  {
    name: '3000Studios.vip',
    url: 'https://3000studios.vip',
    description: '3000 Studios flagship — AI development studio, tools, and automation services.',
    category: 'Agency / Studio',
    status: 'live',
    tech: ['TypeScript', 'React', 'Cloudflare'],
    icon: '🏢',
  },
  {
    name: 'Swain.pro',
    url: 'https://swain.pro',
    description: "Mr. Swain's professional portfolio — AI developer, automation engineer, LLM systems builder.",
    category: 'Portfolio',
    status: 'live',
    tech: ['Astro', 'TypeScript', 'Tailwind CSS', 'Cloudflare Pages'],
    icon: '⚡',
  },
]

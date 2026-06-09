# Swain.Pro — Agent Instructions

## Overview
- **Domain:** swain.pro
- **Stack:** Astro 5 + React 19 + TypeScript + Tailwind CSS 4 + Three.js
- **Deploy:** Cloudflare Pages
- **Package Manager:** npm

## Key Commands
```bash
npm install
npm run dev              # astro dev
npm run build            # astro build
npm run preview          # astro preview
npm run check            # astro check
npm run lint             # tsc --noEmit
```

## Deploy
```bash
npx wrangler pages deploy dist --project-name swain-pro
```

## Structure
- `src/` — Astro pages, components, layouts
- `public/` — Static assets
- `functions/` — Cloudflare Pages Functions
- `scripts/` — Helper scripts

## Constraints
- Deploy through Cloudflare Pages only — project name: `swain-pro`
- Secrets from global.env, never hardcode
- **SharedMedia symlink:** A `shared-media` symlink may exist in the project. **Remove the symlink before building** — Astro/Vite will fail or produce broken output if it follows the symlink into the SharedMedia CDN folder. Use direct URLs to the SharedMedia CDN Worker instead of local symlinks.
- Three.js is used for 3D visuals — keep bundle size in check with tree-shaking

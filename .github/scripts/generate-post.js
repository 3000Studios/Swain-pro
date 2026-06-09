/**
 * Content Automation — Swain.Pro
 * Generates an SEO blog post about software engineering, web development,
 * AI automation, and tech portfolio topics, then appends it to
 * src/data/blog.ts (the blogPosts array).
 */

const fs = require('fs');
const path = require('path');

const BLOG_FILE = path.join(__dirname, '..', '..', 'src', 'data', 'blog.ts');
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('GEMINI_API_KEY is not set');
  process.exit(1);
}

const CATEGORIES = [
  'AI Strategy',
  'AI Engineering',
  'Python & Automation',
  'CRM & Automation',
  'Career & Strategy',
  'Web Development',
  'Cloud Infrastructure',
  'Music Production',
];

const TOPICS = [
  'How to build a production-ready API with Cloudflare Workers and D1',
  'Deploying AI models at the edge: Cloudflare Workers AI vs traditional hosting',
  'Building type-safe full-stack apps with TypeScript, React, and Hono',
  'Music production meets code: automating mix workflows with Python',
  'The freelance software engineer playbook: winning clients without an agency',
  'Modern CI/CD pipelines for solo developers on Cloudflare Pages',
  'How to use Claude and GPT APIs together in a multi-model workflow',
  'Building a personal brand as a software engineer in {year}',
  'RAG pipelines explained: building search over your own documents',
  'Monitoring production AI systems: metrics that actually matter',
  'Web scraping ethically: building data pipelines with Python and Playwright',
  'How to price freelance AI automation projects',
  'Serverless databases compared: D1 vs Turso vs PlanetScale vs Neon',
  'Building real-time dashboards with React, WebSockets, and edge functions',
  'Why every developer should understand prompt engineering',
  'Automating music distribution with APIs and Python scripts',
  'How to audit and optimize Cloudflare Workers for cost and performance',
  'Building AI-powered internal tools for small businesses',
  'The technical interview is broken: a better way to hire engineers',
  'From side project to SaaS: shipping a product as a solo founder',
];

async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.8, maxOutputTokens: 4096 },
    }),
  });
  const data = await res.json();
  if (!data.candidates || !data.candidates[0]) {
    console.error('Gemini response error:', JSON.stringify(data, null, 2));
    return null;
  }
  return data.candidates[0].content.parts[0].text;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function escapeBacktick(str) {
  return str.replace(/\\/g, '\\\\').replace(/`/g, '\\`').replace(/\$/g, '\\$');
}

async function main() {
  const source = fs.readFileSync(BLOG_FILE, 'utf-8');

  // Extract existing slugs
  const slugRegex = /slug:\s*'([^']+)'/g;
  const existingSlugs = new Set();
  let m;
  while ((m = slugRegex.exec(source)) !== null) {
    existingSlugs.add(m[1]);
  }

  // Extract existing titles
  const titleRegex = /title:\s*'([^']+)'/g;
  const existingTitles = new Set();
  while ((m = titleRegex.exec(source)) !== null) {
    existingTitles.add(m[1].toLowerCase());
  }

  const year = new Date().getFullYear();
  const availableTopics = TOPICS
    .map((t) => t.replace('{year}', String(year)))
    .filter((t) => !existingTitles.has(t.toLowerCase()));

  if (availableTopics.length === 0) {
    console.log('All seed topics already used. Skipping.');
    return;
  }

  const topic = availableTopics[Math.floor(Math.random() * availableTopics.length)];
  const category = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)];

  const prompt = `You are a senior software engineer and AI consultant writing for your professional portfolio blog at swain.pro.

Write a blog post about: "${topic}"

Requirements:
- SEO-optimized title (may differ slightly from the topic)
- 1-2 sentence description for the blog card
- Estimated read time in format "X min read"
- Tags array (3-5 relevant tags)
- Full article content in markdown format with ## headings, **bold**, code examples where relevant
- Content must be practical, opinionated, first-person perspective
- Write like an experienced practitioner sharing real knowledge
- No fabricated statistics

Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "title": "string",
  "description": "string",
  "readTime": "string",
  "tags": ["string"],
  "content": "markdown content here with ## headings"
}`;

  const raw = await callGemini(prompt);
  if (!raw) {
    console.log('No response from Gemini. Skipping.');
    return;
  }

  let post;
  try {
    const cleaned = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    post = JSON.parse(cleaned);
  } catch (e) {
    console.error('Failed to parse Gemini response:', raw);
    return;
  }

  const slug = slugify(post.title);
  if (existingSlugs.has(slug)) {
    console.log(`Slug "${slug}" already exists. Skipping.`);
    return;
  }

  const date = new Date().toISOString().split('T')[0];
  const escapedContent = escapeBacktick(post.content);
  const escapedTitle = post.title.replace(/'/g, "\\'");
  const escapedDesc = post.description.replace(/'/g, "\\'");

  const newEntry = `  {
    slug: '${slug}',
    title: '${escapedTitle}',
    description: '${escapedDesc}',
    date: '${date}',
    readTime: '${post.readTime || '8 min read'}',
    category: '${category}',
    tags: [${post.tags.map((t) => `'${t.replace(/'/g, "\\'")}'`).join(', ')}],
    content: \`
${escapedContent}
    \`,
  },`;

  // Insert before the closing ] of the blogPosts array
  const closingPattern = /\n]\s*$/;
  if (!closingPattern.test(source)) {
    console.error('Could not find insertion point in blog.ts');
    return;
  }

  const updated = source.replace(closingPattern, `\n${newEntry}\n]\n`);
  fs.writeFileSync(BLOG_FILE, updated, 'utf-8');
  console.log(`Generated blog post: "${post.title}" (slug: ${slug})`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

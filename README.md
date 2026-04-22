# Conversational Analytics App

Interactive frontend prototype for a conversational analytics product, including Explore, Copilot, Observability, Knowledge Performance, dashboards, and automation workflows.

Original design source: [Figma file](https://www.figma.com/design/0lJEhJQauHHlVhd391jUyI/Conversational-Analytics-App--WIP-)

## Tech Stack

- React 18 + TypeScript
- React Router
- Vite
- Tailwind CSS v4
- Radix UI primitives
- ECharts + React Flow

## Getting Started

### Prerequisites

- Node.js 18+ (recommended: current LTS)
- npm

### Install and run

```bash
npm install
npm run dev
```

Local dev server: `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start Vite dev server
- `npm run preview` - Preview the built app
- `npm run lint` - Run ESLint (Vite + React + TypeScript config)
- `npm run check:routes` - Fail on hardcoded route strings outside route constants
- `npm run typecheck` - Run TypeScript checks without emitting files
- `npm run e2e:smoke` - Run route-level Playwright smoke tests
- `npm run build` - Create production bundle in `dist/`

## App Sections (Route Overview)

- `/` - Explore
- `/conversations` - All conversations
- `/automation-opportunities` - Automation opportunities and flow views
- `/observability` - Observability landing
- `/observability/ai-agents` - AI agents
- `/observability/copilot/*` - Copilot tabs (overview, auto-summary, task assist, rules engine, real-time summary, generative responses)
- `/observability/knowledge-performance/*` - Knowledge performance tabs
- `/saved` - Saved folders and dashboards
- `/recommended-actions` - Recommended actions
- `/actions/history` - Actions history
- `/insights` - All insights
- `/settings` - Settings

## Deployment (Vercel)

This project is configured as an SPA with rewrite fallback in [`vercel.json`](./vercel.json):

- Static assets are served from the filesystem
- All other routes rewrite to `index.html` for client-side routing

Build command:

```bash
npm run build
```

When adding backend behavior for Vercel, follow the repo guidance in `AGENTS.md`:

- Treat server functions as stateless/ephemeral
- Keep secrets in Vercel environment variables
- Prefer current Vercel Marketplace data services over discontinued native KV/Postgres
- Keep region placement close to data sources

## Project Structure

```text
src/
  app/
    components/    UI pages and reusable components
    contexts/      Cross-app React context providers
    data/          Mock/sample data for dashboards and flows
    hooks/         Reusable app hooks
    lib/           App utilities and orchestration helpers
    routes.ts      Centralized route constants
  styles/          Global styles and font imports
public/            Static assets
docs/              Project docs and audits
```

Conventions and mock-data alignment rules: [docs/PROTOTYPE_CONVENTIONS.md](./docs/PROTOTYPE_CONVENTIONS.md)

# Prototype Conventions

This project is a UX prototype. The current app behavior is the source of truth.

## Product Constraints

- Light mode only (`ThemeProvider` is forced to `"light"`).
- Data and interactions are mock-first and optimized for visual and state flows, not backend parity.
- Historical timestamps and action logs are intentionally static prototype fixtures.

## Routing Conventions

- Use shared route constants from [`src/app/routes.ts`](../src/app/routes.ts).
- Avoid hardcoded route strings in components and data modules.
- Run `npm run check:routes` to detect route hardcoding.
- If a literal route is truly needed, annotate that line with `route-hardcode-ok`.

## Shared Mock Data Conventions

- Recommended action execution state lives in [`src/app/data/action-activity.ts`](../src/app/data/action-activity.ts).
- Cross-page automation labels, ids, and top-insight copy live in [`src/app/data/automation-opportunity-references.ts`](../src/app/data/automation-opportunity-references.ts).
- Reuse these sources when referencing the same action/opportunity in multiple views (Explore, Automation Opportunities, AI summary, notifications, history).

## Quality Gates

- `npm run lint` for Vite/React linting.
- `npm run typecheck` for TypeScript checks.
- `npm run check:routes` for route-constant enforcement.
- `npm run e2e:smoke` for route-level Playwright smoke tests.

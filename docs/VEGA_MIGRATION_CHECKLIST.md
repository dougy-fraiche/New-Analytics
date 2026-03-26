# Vega Migration Checklist

Use this checklist when adding or updating UI after moving to `radix-vega`.

## Theme Tokens

- **C26 Figma palette** (Tali design system) is defined in `src/styles/tailwind.css` as OKLCH variables: primary steps `--primary-0`…`--primary-900`, neutrals `--neutral-*`, semantic `--success*`, `--warning*`, `--error*`, and accent ramps `--accent-yellow-*`, `--accent-blue-*`, `--accent-magenta-*`, `--accent-teal-*`. Tailwind utilities follow `--color-*` in `@theme inline` (e.g. `bg-primary-500`, `text-neutral-700`, `bg-success`, `border-warning`, `bg-accent-teal-300`). Shadcn semantics (`--primary`, `--background`, …) are **bridged** to those roles in `:root` / `.dark`.
- Canonical design tokens live in `src/styles/tailwind.css` only. To refresh the baseline from the **bIodPIO** preset (Vite), run `npx shadcn@latest init --preset bIodPIO --template vite -y -f --no-reinstall`, then re-merge the **C26 palette + bridge + `@theme`** and app-only pieces (base typography, `animate-folder-flash`, destructive/input/switch if the CLI omits them) in that same file.
- Keep semantic token values in `src/styles/tailwind.css` only (`:root`, `.dark`, `@theme inline`, plus app typography/animations in the same file).
- Do not duplicate `:root` / `.dark` token blocks elsewhere.
- Prefer semantic utilities (`bg-background`, `text-foreground`, `border-border`) over raw color literals.

## Component Styling

- Use UI primitives in `src/app/components/ui` as the source of truth.
- Avoid hardcoded colors such as `bg-white`, `text-white`, `bg-green-*`, `text-red-*`.
- Keep feature-level class overrides layout-focused (spacing/size), not full state restyling.
- Add or extend variants in primitives instead of repeating visual rules in feature components.

## Charts and Data Visuals

- Use chart palette tokens (`text-chart-*`, `var(--chart-*)`) for trend/series semantics.
- Keep ECharts options token-based for labels, borders, and grid lines.
- Ensure dark mode remains transparent on chart canvases inside card surfaces.

## Imported / Design-Derived Screens

- Set root containers to semantic surfaces (`bg-background`, `text-foreground`).
- Replace literal hex values with semantic variables where practical.
- Prefer CSS variable fallbacks that point to semantic tokens.

## Validation Before Merge

- Check edited files with lints.
- Run `npm run build`.
- Verify key flows in light and dark modes:
  - navigation/header
  - chat input controls
  - dialogs/forms
  - tables
  - chart widgets

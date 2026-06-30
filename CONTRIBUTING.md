# ArchDraw Design System Enforcement Guide

To maintain design system integrity, all UI components, dashboard chrome elements, navigation shells, inputs, buttons, and landing page elements must use the centralized Tailwind CSS v4 custom color classes.

## Color Palette Tokens

Always use these semantic classes rather than ad-hoc hex values (`#5e6ad2`, `#828fff`, etc.) or raw HSL bindings (`hsl(var(--card))`).

| Semantic Token | Tailwind Class | Light Mode Value | Dark Mode Value |
| :--- | :--- | :--- | :--- |
| Canvas / Page | `bg-surface-page` | `#f7f7f5` | `#090b0d` |
| Sidebar / Drawer | `bg-surface-panel` | `#ffffff` | `#121620` |
| Node / Card Wrapper | `bg-surface-card` | `#ffffff` | `#1e2235` |
| Secondary Border | `border-border` | `#e4e4df` | `#202327` |
| Heavy Separator / Ring | `border-border-strong` | `#cbd5e1` | `#3f444c` |
| Title / Primary Text | `text-text-primary` | `#1c1c1a` | `#f7f8f8` |
| Body / Secondary Text | `text-text-secondary` | `#575752` | `#d0d6e0` |
| Subtext / Muted | `text-text-muted` | `#8a8f98` | `#8a8f98` |
| Brand Primary CTA | `bg-accent` / `text-accent` | `#5e6ad2` | `#5e6ad2` |
| Brand Hover State | `bg-accent-hover` / `text-accent-hover` | `#4752b4` | `#828fff` |
| Subtle Interactive Bg | `bg-accent-bg` | `rgba(94, 106, 210, 0.08)` | `rgba(130, 143, 255, 0.12)` |
| Subtle Interactive Text | `text-accent-text` | `#5e6ad2` | `#828fff` |

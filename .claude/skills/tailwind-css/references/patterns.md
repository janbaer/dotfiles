# Tailwind CSS — Detailed Patterns Reference

This file supplements the main SKILL.md with deeper examples and edge-case
guidance. Read relevant sections as needed.

---

## Table of Contents

1. [Component Variant Patterns](#1--component-variant-patterns)
2. [Class Ordering Deep Dive](#2--class-ordering-deep-dive)
3. [@theme Token Design](#3--theme-token-design)
4. [@utility Examples](#4--utility-examples)
5. [Dark Mode Architecture](#5--dark-mode-architecture)
6. [Responsive & Container Query Patterns](#6--responsive--container-query-patterns)
7. [Common Anti-Patterns Catalogue](#7--common-anti-patterns-catalogue)
8. [Svelte 5 Specific Patterns](#8--svelte-5-specific-patterns)

---

## 1 · Component Variant Patterns

### Simple variant prop (Svelte 5)

```svelte
<script>
  let { variant = 'primary', size = 'md', class: extraClass = '', ...rest } = $props();

  const base = 'inline-flex items-center justify-center rounded-lg font-mono font-medium disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary:   'bg-primary text-primary-foreground hover:opacity-90 transition-opacity',
    secondary: 'border border-border text-foreground hover:bg-muted transition-colors',
    ghost:     'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
    danger:    'bg-red-600 text-white hover:opacity-90 transition-opacity',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs gap-1',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2',
  };
</script>

<button class="{base} {variantStyles[variant]} {sizeStyles[size]} {extraClass}" {...rest}>
  <slot />
</button>
```

### Icon button variant

```svelte
<script>
  let { variant = 'neutral', size = 'md', ...rest } = $props();

  const base = 'flex items-center justify-center rounded-lg transition-colors';

  const variantStyles = {
    neutral: 'text-muted-foreground hover:text-foreground hover:bg-muted',
    danger:  'text-muted-foreground hover:text-red-500 hover:bg-red-500/10',
  };

  const sizeStyles = {
    sm: 'h-7 w-7 rounded-md p-1.5',
    md: 'h-8 w-8',
    lg: 'h-10 w-10',
  };
</script>

<button class="{base} {variantStyles[variant]} {sizeStyles[size]}" {...rest}>
  <slot />
</button>
```

### Card component with slot regions

```svelte
<script>
  let { class: extraClass = '' } = $props();
</script>

<div class="rounded-xl border border-border bg-card {extraClass}">
  <slot />
</div>
```

### Composing class strings with a helper

When you use many conditional classes, a helper like `cn()` keeps things clean.
A minimal implementation without external dependencies:

```js
// lib/utils.js
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
```

Usage:

```svelte
<script>
  import { cn } from '$lib/utils.js';
  let { active = false } = $props();
</script>

<div class={cn(
  'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
  active
    ? 'bg-primary/10 text-primary'
    : 'text-muted-foreground hover:bg-muted'
)}>
  <slot />
</div>
```

---

## 2 · Class Ordering Deep Dive

The canonical order from the official Prettier plugin follows this sequence.
When writing classes by hand, aim for this grouping:

```
┌─────────────────────────────────────────────────────────┐
│ 1. Custom / third-party classes                         │
│    select2-dropdown, prose, container                   │
├─────────────────────────────────────────────────────────┤
│ 2. Layout / Display / Position                          │
│    relative, absolute, fixed, sticky                    │
│    block, flex, grid, inline-flex, hidden               │
│    z-10, order-first                                    │
├─────────────────────────────────────────────────────────┤
│ 3. Flex / Grid children                                 │
│    flex-col, flex-row, items-center, justify-between    │
│    col-span-2, row-start-1                              │
├─────────────────────────────────────────────────────────┤
│ 4. Box model — sizing                                   │
│    h-8, w-full, min-h-screen, max-w-md                  │
│    shrink-0, grow                                       │
├─────────────────────────────────────────────────────────┤
│ 5. Box model — spacing                                  │
│    m-4, mx-auto, -mt-6, p-3, px-4, py-2, gap-3         │
├─────────────────────────────────────────────────────────┤
│ 6. Borders & outlines                                   │
│    border, border-border, rounded-lg, outline-none      │
│    ring-2, ring-ring                                    │
├─────────────────────────────────────────────────────────┤
│ 7. Background                                           │
│    bg-card, bg-primary/10, bg-gradient-to-r             │
├─────────────────────────────────────────────────────────┤
│ 8. Typography                                           │
│    font-mono, text-sm, font-bold, text-foreground       │
│    leading-relaxed, tracking-wide, text-left            │
├─────────────────────────────────────────────────────────┤
│ 9. Visual effects                                       │
│    shadow-md, opacity-50, backdrop-blur                 │
│    transition-colors, duration-200                      │
├─────────────────────────────────────────────────────────┤
│ 10. Pseudo-class variants (grouped by type)             │
│     hover:bg-muted, focus:ring-2, active:bg-muted       │
│     disabled:opacity-50, disabled:cursor-not-allowed    │
├─────────────────────────────────────────────────────────┤
│ 11. Dark mode variant                                   │
│     dark:bg-red-950/20, dark:border-red-800             │
├─────────────────────────────────────────────────────────┤
│ 12. Responsive variants (small → large)                 │
│     sm:px-8, md:flex-row, lg:grid-cols-4, xl:gap-8     │
└─────────────────────────────────────────────────────────┘
```

**Overrides always come after the general class:**
`p-4 pt-2` (not `pt-2 p-4`) — the specific override must follow the general
value so the cascade works as intended.

---

## 3 · @theme Token Design

### Color tokens with HSL channel variables

This pattern lets you toggle themes by changing CSS variable values on `:root`
and `.dark` while keeping all Tailwind utility classes functional.

```css
@import "tailwindcss";

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-border: hsl(var(--border));
}
```

In `index.html` or a base CSS file:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --primary: 222 47% 31%;
  --primary-foreground: 210 40% 98%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --muted: 210 40% 96%;
  --muted-foreground: 215 16% 47%;
  --border: 214 32% 91%;
}

.dark {
  --background: 222 47% 6%;
  --foreground: 210 40% 98%;
  --primary: 217 91% 60%;
  --primary-foreground: 222 47% 6%;
  --card: 222 47% 9%;
  --card-foreground: 210 40% 98%;
  --muted: 217 33% 17%;
  --muted-foreground: 215 20% 65%;
  --border: 217 33% 17%;
}
```

### Typography tokens

```css
@theme {
  --font-family-sans: "IBM Plex Sans", ui-sans-serif, sans-serif;
  --font-family-mono: "JetBrains Mono", ui-monospace, monospace;
}
```

---

## 4 · @utility Examples

### Simple atomic utility

```css
/* A reusable scrollbar-hidden utility */
@utility scrollbar-hidden {
  scrollbar-width: none;
  &::-webkit-scrollbar { display: none; }
}
```

Usage: `<div class="scrollbar-hidden overflow-y-auto">` — and `md:scrollbar-hidden` works too.

### Utility with @apply (acceptable inside @utility)

```css
@utility tag-chip {
  @apply inline-flex items-center gap-1 rounded-full bg-primary/10
         px-2 font-mono text-xs text-primary;
}
```

### Utility for complex CSS properties

```css
@utility clip-blob {
  clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
}
```

These are ideal for CSS properties that have no Tailwind utility or that would
require unwieldy arbitrary values every time.

---

## 5 · Dark Mode Architecture

### Recommended: CSS variables + `dark:` variant

Define color values as CSS custom properties and toggle them via a `.dark` class
on the `<html>` element. This way, most of your markup contains no `dark:`
prefixes at all — colors just work.

```html
<!-- No dark: needed — bg-background resolves to the right color -->
<div class="bg-background text-foreground">
```

### When `dark:` is still useful

For one-off adjustments that differ beyond the token system:

```html
<div class="border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
```

Keep these rare. If you find many `dark:` overrides, promote the values to
theme tokens.

---

## 6 · Responsive & Container Query Patterns

### Mobile-first stacking

```html
<div class="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">
  <aside class="w-full md:w-64 lg:w-80">...</aside>
  <main class="flex-1">...</main>
</div>
```

### Targeting a single breakpoint range

Use stacked responsive modifiers to limit a style to a specific range:

```html
<!-- Red background ONLY at the md breakpoint -->
<div class="md:max-lg:bg-red-500">
```

### Container queries

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row @md:items-center gap-4">
    <img class="w-full @md:w-48 rounded-lg" />
    <div class="flex-1">...</div>
  </div>
</div>
```

Container queries make components layout-agnostic — they respond to their own
container rather than the viewport, which makes them truly reusable.

---

## 7 · Common Anti-Patterns Catalogue

| Anti-Pattern | Problem | Fix |
|---|---|---|
| `bg-${color}-500` | Purged in production | Use a complete-string lookup map |
| Repeating 15+ identical classes in 5 templates | Maintenance nightmare | Extract to a component |
| `@layer components { .btn { @apply ... } }` in v4 | Variants don't work | Use `@utility` or a component |
| `bg-[#ff6b35]` in 10 places | Magic value, no design system | Promote to `@theme` token |
| `@apply` for everything | Defeats utility-first benefits | Reserve for third-party overrides |
| `pt-4 pr-4 pb-4 pl-4` | Verbose | Use `p-4` |
| `lg:flex flex-col justify-center` | Misleading — base vs responsive unclear | `lg:flex lg:flex-col lg:justify-center` |
| `<div>` with click handler | Inaccessible | Use `<button>` |
| Inline style for one-off color | Misses variant support | Use arbitrary value `bg-[#hex]` or token |
| Sass with Tailwind v4 | Unsupported, breaks builds | Remove preprocessor |

---

## 8 · Svelte 5 Specific Patterns

### Props with class forwarding

Allow parent components to add extra classes:

```svelte
<script>
  let { class: className = '', ...rest } = $props();
</script>

<div class="rounded-xl border border-border bg-card {className}" {...rest}>
  <slot />
</div>
```

### Reactive class expressions with `$derived`

```svelte
<script>
  let { active = false } = $props();

  const classes = $derived(
    active
      ? 'bg-primary/10 text-primary border-primary'
      : 'text-muted-foreground border-transparent hover:bg-muted'
  );
</script>

<div class="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm border transition-colors {classes}">
  <slot />
</div>
```

### Snippet-based component composition

For components that need to render different slot structures:

```svelte
<script>
  let { icon, children } = $props();
</script>

<button class="flex items-center gap-2 rounded-lg px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
  {#if icon}
    {@render icon()}
  {/if}
  {@render children()}
</button>
```

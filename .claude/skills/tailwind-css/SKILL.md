---
name: tailwind-css
description: >
  Best practices and rules for writing optimal Tailwind CSS code in modern
  projects (v4+). Use this skill whenever the user asks you to write, generate,
  review, refactor, or restructure HTML/JSX/Svelte/Vue markup that uses Tailwind
  CSS utility classes. Also trigger when the user mentions Tailwind class
  ordering, component extraction, @apply migration, design tokens, @theme, or
  @utility — even if they don't explicitly say "Tailwind". Trigger for any
  front-end styling task in a project that already uses Tailwind CSS.
---

# Tailwind CSS — Optimal Code Rules

This skill defines a hierarchy of rules for writing, generating, and
refactoring Tailwind CSS code. Rules are ranked by priority so you know which
ones are non-negotiable and where there is room for pragmatism.

For deeper reference on specific topics, see `references/patterns.md`.

---

## 1 · Rule Hierarchy

| Priority | Label | Meaning |
|----------|-------|---------|
| 🔴 | **MUST** | Violation will cause bugs, broken builds, or purge failures. |
| 🟡 | **SHOULD** | Strong recommendation. Deviate only with a clear reason. |
| 🟢 | **PREFER** | Best-practice default. OK to skip for one-offs or prototypes. |

---

## 2 · MUST Rules (Non-Negotiable)

### 2.1 — Never construct class names dynamically

Tailwind scans templates at build time for complete class literals. If a class
name is assembled via string concatenation or interpolation, the compiler cannot
detect it and the class will be purged in production.

```svelte
<!-- 🔴 BAD — class is invisible to the compiler -->
<div class="bg-{color}-500">

<!-- ✅ GOOD — full literals, conditionally applied -->
<div class={color === 'red' ? 'bg-red-500' : 'bg-blue-500'}>
```

When many variants exist, use a lookup map that contains complete strings:

```js
const bgColor = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
};
```

### 2.2 — Always use complete class strings in conditional logic

Helper functions like `cn()`, `clsx()`, or CVA variants are fine, but every
class that appears inside them must be a full, unbroken string literal.

### 2.3 — Use `@utility` instead of `@layer components` for custom classes (v4)

In Tailwind v4, classes defined inside `@layer components` do not integrate with
the variant system. Variants like `hover:my-class` or `md:my-class` will
silently fail.

```css
/* 🔴 BAD — variants won't work in v4 */
@layer components {
  .tag-chip { @apply rounded-full bg-primary/10 px-2 text-xs; }
}

/* ✅ GOOD — full variant support */
@utility tag-chip {
  @apply rounded-full bg-primary/10 px-2 text-xs;
}
```

Use `@utility` whenever you need a reusable class that must work with Tailwind
variants. Reserve `@layer components` only for overriding third-party library
styles where variant support is not needed.

### 2.4 — Do not use Sass, Less, or Stylus with Tailwind v4

Tailwind v4 is its own preprocessor. Mixing it with Sass/Less/Stylus causes
unpredictable build failures and is explicitly unsupported.

### 2.5 — Do not use `@apply` inside `<style>` blocks in Svelte/Vue/Astro

These `<style>` blocks are processed separately from the main CSS pipeline. If
`@apply` is needed in a component `<style>` block, it requires a `@reference`
import, which adds complexity and fragility. Instead, apply utilities directly
in the markup.

```svelte
<!-- 🔴 BAD — requires @reference, fragile -->
<style>
  @reference "../app.css";
  button { @apply bg-primary text-white; }
</style>

<!-- ✅ GOOD — direct utilities in markup -->
<button class="bg-primary text-white"><slot /></button>
```

---

## 3 · SHOULD Rules (Strong Recommendations)

### 3.1 — Extract repeated class patterns into framework components

This is the single most impactful practice for maintainability. When the same
combination of utility classes appears in multiple places, create a component
(Svelte, React, Vue, etc.) instead of a CSS class with `@apply`.

The design system lives in your components, not in a CSS file.

**Proactive extraction — the parameterizability test:**
When reviewing any component, ask: *"Could this block of markup be rendered
with different prop values?"* If yes, extract a component **immediately** —
even if it currently appears only once. Structural UI patterns (dialogs, modals,
confirmation flows, cards with action buttons) almost always recur. Extract
before the second instance forces you to, not after.

```svelte
<!-- Button.svelte — one source of truth for all button styles -->
<script>
  let { variant = 'primary', ...rest } = $props();

  const base = [
    'inline-flex items-center justify-center rounded-lg',
    'px-4 py-2 font-mono text-sm font-medium',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' ');

  const variants = {
    primary:   'bg-primary text-primary-foreground hover:opacity-90 transition-opacity',
    secondary: 'border border-border text-foreground hover:bg-muted transition-colors',
    ghost:     'text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
    danger:    'bg-red-600 text-white hover:opacity-90 transition-opacity',
  };
</script>

<button class="{base} {variants[variant]}" {...rest}>
  <slot />
</button>
```

**Why this matters:** Components give you type-safe props, variant logic, slot
composition, and IDE support — none of which are available through CSS classes.
The class strings are co-located with the markup, so changes are safe and local.

### 3.2 — Use `@apply` sparingly and only as a last resort

`@apply` is still supported in v4, but it should be treated as a migration tool,
not a primary pattern. Valid uses:

- Overriding styles from a third-party library you cannot control.
- Base element resets in `@layer base` (e.g., styling prose content).
- Inside `@utility` definitions for genuinely atomic, reusable helpers.

Invalid uses (prefer component extraction instead):

- Creating "component classes" like `.btn-primary`, `.card`, `.dialog`.
- Avoiding long class strings (that's what components are for).
- Making CSS "look cleaner" (readability in CSS is traded for worse
  maintainability).

### 3.3 — Follow the recommended class order

Tailwind's official Prettier plugin (`prettier-plugin-tailwindcss`) defines a
canonical class order. Follow this order even if you don't use the plugin.

The order follows the Concentric CSS model (outside → inside):

1. **Custom / third-party classes** (always first, e.g., `select2-dropdown`)
2. **Layout & positioning** (`relative`, `flex`, `grid`, `block`, `hidden`)
3. **Box model sizing** (`h-8`, `w-full`, `min-h-screen`)
4. **Spacing** (`m-4`, `p-2`, `gap-3`)
5. **Borders** (`border`, `rounded-lg`)
6. **Backgrounds** (`bg-white`, `bg-primary`)
7. **Typography** (`text-sm`, `font-mono`, `font-bold`, `text-foreground`)
8. **Visual effects** (`shadow-md`, `opacity-50`, `transition-colors`)
9. **State variants** (`hover:`, `focus:`, `disabled:`)
10. **Responsive variants** (`sm:`, `md:`, `lg:`, `xl:`) — smallest to largest

### 3.4 — Use shorthand utilities when available

```html
<!-- 🟡 SHOULD — use shorthand -->
<div class="mx-2 py-4">

<!-- Avoid — unnecessarily verbose -->
<div class="ml-2 mr-2 pt-4 pb-4">
```

### 3.5 — Prefix all breakpoint-specific utilities consistently

Every utility that only applies at a specific breakpoint must carry its prefix.
This makes it immediately clear which styles are responsive.

```html
<!-- ✅ GOOD — clear which styles are lg-only -->
<div class="block lg:flex lg:flex-col lg:justify-center">

<!-- 🟡 Misleading — flex-col and justify-center look like base styles -->
<div class="block lg:flex flex-col justify-center">
```

### 3.6 — Define design tokens via `@theme`, not hardcoded values

Avoid scattering magic values throughout your markup. When a color, font, or
spacing value is used more than once, it should be a theme token.

```css
/* ✅ GOOD — tokens in @theme, consumed as utilities */
@theme {
  --color-brand: oklch(0.65 0.19 260);
  --font-family-sans: "IBM Plex Sans", ui-sans-serif, sans-serif;
}

/* Then in markup: bg-brand, font-sans */
```

### 3.7 — Prefer `color-mix()` and CSS variables over arbitrary values

```html
<!-- 🟡 Arbitrary color — no design-system connection -->
<div class="bg-[#ff6b35]">

<!-- ✅ GOOD — uses theme token with opacity modifier -->
<div class="bg-primary/80">
```

If a one-off arbitrary value appears more than twice, promote it to a theme
token.

---

## 4 · PREFER Rules (Best Practice Defaults)

### 4.1 — Keep class strings readable

When a class string exceeds ~10 utilities, consider:

- Splitting into a component (first choice).
- Using `@utility` for a subset of the classes.
- Grouping logically with line breaks in the template (Svelte/JSX).

```svelte
<!-- Grouped for readability -->
<button
  class="
    inline-flex items-center justify-center gap-2
    rounded-lg bg-primary px-4 py-2
    font-mono text-sm font-medium text-primary-foreground
    hover:opacity-90 transition-opacity
    disabled:opacity-50 disabled:cursor-not-allowed
  "
>
  <slot />
</button>
```

### 4.2 — Use semantic color tokens over raw palette colors

```html
<!-- 🟢 Prefer semantic tokens -->
<div class="bg-card text-card-foreground border-border">

<!-- Less maintainable — raw palette -->
<div class="bg-white text-gray-900 border-gray-200 dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700">
```

Semantic tokens (defined in `@theme` and toggled via CSS variables on `:root` /
`.dark`) let you switch themes without touching any markup.

### 4.3 — Mobile-first responsive design

Write base styles for mobile, then layer on overrides for larger screens:

```html
<div class="flex flex-col gap-4 md:flex-row md:gap-6 lg:gap-8">
```

### 4.4 — Use container queries for component-level responsiveness

When a component's layout should depend on its container width rather than the
viewport, use Tailwind's `@container` support:

```html
<div class="@container">
  <div class="flex flex-col @lg:flex-row">...</div>
</div>
```

### 4.5 — Handle dark mode via CSS variables and the `dark:` variant

Define light/dark values as CSS custom properties on `:root` / `.dark`, then
reference them via `@theme`. This avoids doubling every utility with a `dark:`
variant in your markup.

### 4.6 — Accessibility is not optional

Tailwind does not generate semantic HTML or ARIA attributes. Always:

- Use proper HTML elements (`<button>`, `<nav>`, `<main>`, not styled `<div>`s).
- Add `aria-label`, `aria-expanded`, `role` where needed.
- Ensure color contrast ratios meet WCAG AA (4.5:1 for text).
- Test with keyboard navigation.

---

## 5 · Migration Pattern: `@apply` → Components

When refactoring an existing codebase that uses `@layer components` with
`@apply`, follow this process:

1. **Identify all classes** in `@layer components`.
2. **Group by usage pattern:**
   - Classes used in multiple templates → Svelte/React component
   - Classes used in exactly one template → inline the utilities directly
   - Truly atomic helpers (1–3 properties) → `@utility`
3. **Create components** with variant props where the old CSS had variants
   (e.g., `.btn-primary`, `.btn-danger` → `<Button variant="primary">`).
4. **Delete the old `@layer components` block** once all references are migrated.
5. **Keep `@theme` intact** — token definitions are correct and recommended.

### Example migration

**Before** (CSS with @apply):
```css
@layer components {
  .btn-primary {
    @apply inline-flex items-center justify-center rounded-lg bg-primary
           px-4 py-2 font-mono text-sm font-medium text-primary-foreground
           hover:opacity-90 transition-opacity
           disabled:opacity-50 disabled:cursor-not-allowed;
  }
  .btn-danger {
    @apply inline-flex items-center justify-center rounded-lg bg-red-600
           px-4 py-2 font-mono text-sm font-medium text-white
           hover:opacity-90 transition-opacity
           disabled:opacity-50 disabled:cursor-not-allowed;
  }
}
```

**After** (Svelte component):
```svelte
<!-- Button.svelte -->
<script>
  let { variant = 'primary', ...rest } = $props();

  const base = 'inline-flex items-center justify-center rounded-lg px-4 py-2 font-mono text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed';

  const styles = {
    primary: 'bg-primary text-primary-foreground hover:opacity-90 transition-opacity',
    danger:  'bg-red-600 text-white hover:opacity-90 transition-opacity',
  };
</script>

<button class="{base} {styles[variant]}" {...rest}><slot /></button>
```

---

## 6 · Quick Reference: Decision Tree

```
Reviewing existing component markup?
└─ "Could this block render with different prop values?"
   └─ YES → Extract a component NOW, even with just 1 current instance
      Structural patterns that always warrant proactive extraction:
      · Dialog / modal (overlay + card + title + message + actions)
      · Confirmation flow (message + cancel/confirm button pair)
      · Card with action buttons
      · Any layout where only content changes across usages

Need to reuse a set of styles?
├─ Used across multiple components?
│  └─ YES → Create a framework component (Svelte/React/Vue)
│
├─ Used in one component but in a loop or multiple elements?
│  └─ YES → Extract to a local const / helper in that component
│
├─ Truly atomic (1–3 CSS properties)?
│  └─ YES → Consider @utility
│
├─ Overriding a third-party library?
│  └─ YES → @apply in a targeted selector is acceptable
│
└─ None of the above
   └─ Just use utility classes directly in the markup
```

---

## 7 · Linting & Tooling Recommendations

- **`prettier-plugin-tailwindcss`** — Auto-sorts classes in the canonical order.
- **`eslint-plugin-tailwindcss`** — Catches invalid class names, duplicate
  classes, and enforces ordering.
- **Tailwind CSS IntelliSense** (VS Code) — Autocompletion, linting, and hover
  previews for all utilities. Set `rootFontSize` if your project uses a
  non-default base font size.
- **`prettier-plugin-classnames`** — Wraps long class strings based on
  Prettier's `printWidth` so they don't trail off-screen.

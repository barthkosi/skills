---
name: interface-design
description: Core interface design principles covering padding and gap-only spacing, concentric border radii, base colors and opacity-based depth, typography, mobile-first layouts, motion, stylesheet rules, and local dev servers.
---

# Interface Design

## 1. Core Principles
- Spacing: Default to `gap` on parent flex or grid containers for all spacing between nested or sibling elements. Never add directional `padding` (such as `padding-top`) to a child element to separate it from a sibling. Reserve `padding` for internal container inset and for vertical spacing on top-level page sections (such as between a hero section and a features section). Do not use margins for spacing between elements.
- Proximity: Group related elements tightly. Increase spacing as relation decreases.
- Elevation: No shadows. Depth is communicated through color and contrast layering instead of box-shadows or drop-shadows.
- Scale: Start small with minimum spacing and padding at 4px to 8px. Scale up only when required.
- Padding ceiling: Keep container padding between 4px and 20px.
- Concentric radii: Outer radius = inner radius + padding. Avoid arbitrary corner values.
- No unrequested eyebrow text or section tags: Do not add eyebrow labels, release pills, badges, or tags above hero headings or section headings unless explicitly requested. Lead directly with the heading.

## 2. Color System & Base Palette
- **Base Background (Examples)**: Pure white (`#ffffff`) in light mode or dark gray (`#121212`) in dark mode as baseline examples. Use tinted backgrounds when appropriate or requested.
- **Base Text (Examples)**: High-contrast dark text (such as `#0d0d0d` or `#111111`) in light mode or pure white (`#ffffff`) in dark mode. Specific hex values are examples rather than fixed rules.
- **Text Hierarchy**: Base color with opacity tiers (for example, `100%` primary, `85%` secondary/body, `60%` tertiary). You may reduce secondary or raise tertiary opacity as long as colors pass WCAG contrast ratio checks.
- **Surfaces**: Derive secondary and tertiary surfaces by layering black or white at `2%` to `4%` opacity over the base color.
- **Contrast**: Maintain palette derivation from one or two base colors with consistent contrast relationships across light and dark surfaces.

## 3. Spacing System
- **Base Unit**: Start from `0px`, `2px`, `4px`, `8px`, and scale in `4px` increments (`12`, `16`, `20`, `24`, `28`). `6px` is acceptable in rare cases. Avoid multiples of `5` (never use `5px`, `10px`, or `15px`).
- **Mobile-First**: Define smallest usable gaps on mobile screens, then scale upward for desktop viewports.
- **Section Spacing (Web Applications vs. Landing Pages)**:
  - **Web Applications**: Spacing rarely exceeds `24px` to `28px`, even between major desktop sections.
  - **Landing Pages**: Instead of setting `gap` between landing page sections, apply vertical section `padding` that scales mobile-first with viewport size (for example, starting at `32px` on mobile, `40px` on tablet, and `48px`, `64px`, `96px`, or up to `120px` on desktop depending on the layout; these values are flexible examples rather than hard rules).
- **Grouped Small Text**: `0px` to `2px` gap (for example, `14px` label over `12px` caption) so lines stay visually paired.
- **Coupled Elements and Outward Scaling**: Increase `gap` as items scale outward from tightly coupled items to broader groups, progressing in `4px` increments (`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `28px`).
- **Radius Scaling**: Step border radius in proportion to padding increments.

## 4. Typography
- **Headings**: `-4%` (`-0.04em`) letter spacing. Start with `100%` (`1.0`) unitless line height for large display text around `64px` and above, and `120%` (`1.2`) unitless line height for standard headings. Sizes adapt to the UI: web applications can use a compact scale (`36px`, `32px`, `28px`, `24px`, `20px`, `18px`, `16px`). Keep `h5` around `18px` to `24px`, and note that small headings such as `16px` do not always need to scale up across breakpoints.
- **Labels**: `-2%` (`-0.02em`) letter spacing, `100%` to `120%` (`1` to `1.2`) unitless line height. Supports even (`12px`, `14px`, `16px`, `18px`) or odd (`11px`, `13px`, `15px`, `17px`) scales.
- **Body**: `0%` letter spacing, `140%` to `160%` (`1.4` to `1.6`) unitless line height, with `150%` (`1.5`) as the default sweet spot. Supports even (`14px`, `16px`, `18px`) or odd (`11px`, `13px`, `15px`, `17px`) scales. When using odd pixel sizes for body and labels, prefer odd pixel sizes for headings as well.
- Line height: Use `100%` (`1.0`) for large display text (`~64px+`), `120%` (`1.2`) for standard headings and short single-line text blocks, and `150%` (`1.5`) for multi-line paragraphs. Keep line heights unitless.
- Stacked pairs: Pair tight line heights with small spacing gaps so grouped text reads as a single unit.
- **Font Loading**: In Next.js projects, define typefaces once in `layout.tsx` using `next/font/google` with `variable` (`--font-heading`, `--font-body`), apply their `.variable` classes to `<html>`, and map CSS tokens in `typography.css` to those slot variables.
- **Rendering**: Enable `antialiased` font smoothing (`-webkit-font-smoothing: antialiased`), `text-rendering: geometricPrecision`, and `font-optical-sizing: auto` on `body` so text renders crisply.

## 5. Layout & Grid
- **Breakpoints**: Tailwind CSS sm, md, and lg specifications scaled mobile-first.
- **Content Max-Width**: 1600px ceiling.
- **Sidebar Layouts**: Main content maintains the 1600px ceiling. Sidebars sit at the outer viewport edge.
- **Page Padding (Application UI)**: Desktop 16px to 32px, tablet 16px to 24px, mobile 16px to 20px (hard cap).
- **Page Padding (Landing Pages)**: Desktop 32px to 120px, tablet flexible, mobile 16px to 20px.

## 6. Code & Stylesheet Rules
- **HTML, CSS, and JavaScript**:
  - **Per-Element CSS Files**: Create a dedicated CSS file for each new element or component (for example, `nav.css` for navigation, `cards.css` for cards) instead of adding component styles to `styles.css`.
  - **Global Stylesheet Scope**: Use `styles.css` (or `style.css`) only for document-wide rules such as root canvas background, scrollbar styling, `scrollbar-gutter: stable`, font smoothing, and base resets.
- **React with Tailwind CSS**:
  - **Inline Utility Styling**: Style elements inline using Tailwind utility classes with mobile-first breakpoint overrides (`sm:`, `md:`, `lg:`).
  - **No Unapproved CSS Files**: Never create a new CSS file without explicit permission from the user.
  - **Preserve Default Stylesheets**: Avoid editing the default CSS file (`globals.css`, `global.css`, `index.css`) except for document-wide rules such as `scrollbar-gutter: stable`, root canvas background, or scrollbar styling.
- **Root Canvas & Scrollbar**: Set the page background color on `<html>` (and sync `<meta name="theme-color">` via a shared theme utility when page backgrounds change) so overscroll matches the page without disabling mobile pull-to-refresh. Set `scrollbar-gutter: stable` on `html`.

## 7. Motion & Interaction
- Keep motion fast and minimal.
- Skip animation on high-frequency utility interactions such as modal toggles and context menus.
- **Default Easing**: `cubic-bezier(0.16, 1, 0.3, 1)` for snappy settle.
- **Default Duration**: 0.3s.

## 8. States
- **Disabled**: 40% opacity with no additional decor.

## 9. Local Development Server
- **Auto-Reload**: Default to `npx live-server` or an equivalent hot-reloading development server for local web projects.
- Avoid basic static servers (such as `python -m http.server`) that lack live reload functionality.

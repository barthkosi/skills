---
name: fig-pull
description: Recreate a Figma node in code (HTML/CSS, or React with Tailwind) with 100% layer accuracy, so that re-importing the page into Figma gives the same frames, auto layout, padding, gaps and fill/hug/fixed sizing. Use when the user points at a Figma node (figma.com/design/... ?node-id=...) and asks to create, recreate, build or pull it into code.
---

# fig-pull

The user points at a Figma node. Recreate it in code so it matches **structurally**, not just visually. The user re-imports the page into Figma with a plugin and compares layer by layer. Looking identical is not enough.

## Ground rules

- **Every value comes from Figma.** Never fill a gap with a guess about CSS or about how the import plugin behaves. If Figma doesn't give a value, say so.
- **Only read the node the user pointed at.** Don't read the user's imports or other nodes unless asked.
- **Never run or propose test imports.** The user imports the result themselves.
- **Don't add anything Figma doesn't have**: no extra wrappers, margins, or "safety" sizes.
- **Never use deprecated CSS**, even when Figma's code export does.
- **Don't carry over the export's `word-break: break-word`** on text. It's deprecated and isn't a Figma setting. Text with a fill or fixed width already wraps onto the next line at spaces without it.
- **Report differences honestly.** When a measurement can't match exactly (see Verify), say so. Don't hide it with a fixed size.
- **No comments** in the code: no CSS comments, JSX comments or HTML comments. They bloat the file.
- **Never create new CSS files, design tokens, theme values or config on your own.** If something is missing (a font family with no utility, a color you think should be a token, a breakpoint the project lacks), stop and ask permission first.

## Mandatory rule: ask instead of guessing

**Never guess an unresolved implementation choice. STOP and ask the user before implementing it.** Read the requested node and existing project first; if that evidence and the user's explicit instructions do not settle the choice, explain the uncertainty and wait for their answer. Do not proceed with an assumed default, temporary workaround, or a choice announced only in a progress update.

- This applies to theme selection, behavior, missing values, conflicting evidence, unsupported mappings, and any other ambiguity. A request to recreate a Figma frame does not authorize resolving these choices on the user's behalf.
- **Always ask before selecting, forcing, or overriding a theme unless the user has already explicitly authorized that exact behavior.** A dark or light Figma screenshot, resolved variable mode, or matching project palette is not authorization.
- Do not add a theme attribute such as `data-theme="dark"`, a `dark` class, a theme provider override, fixed theme colors, or a change to saved/system theme preferences merely to match a Figma render.
- Preserve the app's existing theme mechanism while awaiting a decision. If the design and the app's active theme differ, ask: "Should this page follow the app's current theme, or explicitly use the Figma frame's theme?" Do not silently choose either as the intended final behavior.
- An explicit answer authorizes that specific choice; do not ask the same question again unless new evidence introduces a different conflict.

## Mandatory rule: preserve project variables

**Never bypass an existing project variable, semantic utility, or typography class with a hardcoded equivalent. This is a requirement, not a preference.** Visual equality in one theme is not enough: preserve the design system's semantic meaning and theme behavior.

- Inspect existing CSS variables, utility classes, typography classes, and theme definitions before implementing. Custom classes outside Tailwind's `@theme` also count.
- Map Figma variable/style bindings to their corresponding project variables/classes. When the matching class exists, you MUST use it: for example, `content-primary`, `content-secondary`, `bg-primary`, `bg-secondary`, and `bg-tertiary`. In plain CSS, use the corresponding existing `var(--...)`.
- Never replace those mappings with literals such as `text-[#141414]`, `text-[#141414]/80`, `bg-white`, or `bg-[#141414]/4`. Never choose an unrelated token merely because its current resolved value matches.
- **STOP before implementing any unresolved mapping and ask the user** if a variable/class is missing, multiple mappings are plausible, Figma and project values disagree, theme behavior differs, or any other problem prevents confident compliance. State the Figma property/binding, the project candidates, and the exact decision needed. Do not guess, silently hardcode, invent a token, override a variable, or proceed with a temporary fallback while awaiting an answer.
- A generic request to recreate a design does not authorize an exception. Only an explicit user instruction resolving that specific conflict may authorize a different mapping or literal value.
- Raw geometry without a Figma token/style binding (for example, a fixed frame width or fractional stroke width) may still use exact arbitrary values when no matching project utility exists. This does not authorize hardcoded colors or bypassing existing tokens for spacing, radius, or typography.

## Mandatory rule: preserve layout sizing modes (never hardcode Hug)

**Never replace Hug sizing with a fixed pixel measurement. This is a requirement, not a preference.**

- When a Figma frame, button, container, or text layer is set to `HUG` (`layoutSizingHorizontal: HUG` or `layoutSizingVertical: HUG`), you MUST use `w-fit`, `h-fit`, or `fit-content`.
- Never hardcode the computed or rendered pixel dimensions (e.g. `w-[30px]`, `h-[40px]`, `w-[54px]`) on an element whose Figma sizing is `HUG`.
- The rendered size of a Hug element must compute purely from its internal content, children sizing, padding, border, and gaps. Hardcoding the resolved pixel bounding box breaks auto layout, responsiveness, dynamic content, and localization.
- In React + Tailwind, a frame with Hug on both axes MUST use `w-fit h-fit` (alongside the frame's `p-*` and `gap-*`), never explicit `w-[*]` or `h-[*]`. Fixed pixel classes (e.g. `w-[320px]`) are permitted ONLY when Figma's explicit sizing mode for that axis is `FIXED`.

## 0. Check the project

Before building, find out what the target project uses:
- **React + Tailwind** (`react` and `tailwindcss` in `package.json`): build a component styled **only** with Tailwind classes inline in `className`. Follow [React + Tailwind](#react--tailwind) below.
  - Note the **Tailwind version** (v3 or v4), since class names and the spacing scale differ.
  - Note the project's **existing theme** (`tailwind.config.*`, or `@theme` in the CSS for v4): spacing, colors, fonts, radius. Existing matching tokens/classes MUST be used, including custom semantic CSS utilities outside `@theme`. None may be added without explicit user approval. Follow the mandatory variable rule above.
- **Plain HTML/CSS** (like this repo): follow the CSS tables below as written.

## 1. Read the node

The code export (`get_design_context`) is **not enough on its own**. It has dropped real settings before:
- `clipsContent` on a root frame
- the `gap` on a frame with a single child
- sizing modes (fill / hug / fixed), which it doesn't state reliably

So do both of these:

1. **`get_design_context`** on the node, as the visual reference and for Figma's own code mapping. Load the `figma-design-to-code` guidance first, as the Figma server requires.
2. **A read-only `use_figma` script** that walks the node and returns every property below. Load the `figma-use` guidance first. Switch to the node's page with `await figma.setCurrentPageAsync(page)`, because `getNodeByIdAsync` returns null for nodes on other pages.

Per node, collect:
- type, name, id, x, y, width, height, visible
- `layoutMode`, padding (top/right/bottom/left), `itemSpacing`, `primaryAxisAlignItems`, `counterAxisAlignItems`, `layoutWrap`, `counterAxisSpacing`
- `layoutSizingHorizontal`, `layoutSizingVertical`, `layoutPositioning`
- min/max width and height
- `clipsContent`
- fills, strokes (weight per side, align), corner radius (per corner), effects, opacity
- text: characters, fontName, fontSize, lineHeight, letterSpacing, fill color, textAlignHorizontal/Vertical, textCase, textDecoration, `textAutoResize`, textTruncation

Use the script in [read-node.js](read-node.js), replacing `NODE_ID` with the id.

## 2. Build it

One element per Figma layer, in the same order and nesting. Each frame is a `div`; each text layer is a `p` (or a heading where it really is one).

### Meaningful implementation names

Preserve Figma's layer order, nesting, sizing, and styling; layer names are inspection metadata, not names that must be copied into code.

- Do not copy generated, misspelled, or nonsensical layer names such as `Frame 72`, `Group 4`, or `Dektop` into component names, identifiers, or attributes.
- Name components, variables, and any necessary identifiers by their actual purpose and the project's naming conventions: for example, `PluginsPage`, `ExtensionsSection`, `ExtensionCard`, or `extension-actions`. Infer these names from visible content and structure; do not change the visible UI copy.
- Omit `data-name` and `data-node-id` attributes by default. Do not add attributes, IDs, classes, wrappers, or ARIA labels merely to give every Figma layer a name.
- If an attribute is genuinely required by existing application behavior, accessibility, or tests, use a meaningful value appropriate to that purpose. Preserve raw Figma names/IDs only when the user explicitly requests traceability or an existing integration requires them.
- Keep the Figma-to-code correspondence in inspection results or verification reports when needed; it does not require shipping Figma metadata in the DOM. Meaningful naming never permits changing the layer hierarchy or adding elements.

### Auto layout

| Figma | CSS |
|---|---|
| `layoutMode: VERTICAL` | `display: flex; flex-direction: column` |
| `layoutMode: HORIZONTAL` | `display: flex; flex-direction: row` |
| padding | `padding` on that same element |
| `itemSpacing` | `gap`, **always written**, even when it's 0 or the frame has one child |
| `primaryAxisAlignItems` MIN / CENTER / MAX / SPACE_BETWEEN | `justify-content: flex-start / center / flex-end / space-between` |
| `counterAxisAlignItems` MIN / CENTER / MAX | `align-items: flex-start / center / flex-end` |
| `clipsContent: true` | `overflow: clip` |
| corner radius | `border-radius` |
| stroke, align **INSIDE** | `border: <weight>px solid <color>`. With the reset's `box-sizing: border-box` it counts toward layout like Figma's, so children sit at padding + stroke. The browser rounds a border under 1px to a whole device pixel (0.8px renders as 1px at 1× zoom), so report the difference. |

Not covered yet: strokes aligned **CENTER** or **OUTSIDE**. Take Figma's code export value and **tell the user** it hasn't been confirmed.

**Spacing is only ever padding on a frame or gap between its children. Never margins.** Margins that add up to the same spacing still count as wrong.

### Sizing (per axis)

> [!IMPORTANT]
> Never substitute resolved pixel dimensions for Hug sizing. If Figma specifies Hug, write `fit-content` (or `w-fit` / `h-fit`). The final pixel size must result naturally from padding, gap, and children.

| Figma | CSS |
|---|---|
| **Fixed** | the px value, e.g. `width: 500px` |
| **Hug** | `fit-content`, written out explicitly, e.g. `width: fit-content; height: fit-content` |
| **Fill**, across a frame (width in a vertical frame) | `width: 100%` |
| **Fill**, along a horizontal frame's direction (width) | `flex: 1 0 0; min-width: 1px` (Figma's own export) |

Not covered yet: fill **height** (in a horizontal frame, or along a vertical one). Take Figma's code export value and **tell the user** it hasn't been confirmed.

### Text

| Figma | CSS |
|---|---|
| fontName family / style | `font-family`, `font-weight` (Medium = 500, etc.) |
| fontSize | `font-size` in px |
| lineHeight PERCENT 100 | `line-height: 1` (percent ÷ 100, unitless) |
| lineHeight PIXELS | `line-height` in px |
| letterSpacing PIXELS | `letter-spacing` in px |
| letterSpacing PERCENT | `letter-spacing` in em (percent ÷ 100) |
| fill | `color` |
| `textAutoResize: WIDTH_AND_HEIGHT` (hug) | `width: fit-content; height: fit-content; white-space: nowrap` |
| `textAutoResize: HEIGHT` | width per its sizing mode (fill or fixed); text wraps |

Keep text styles on the text layer itself. Where several texts share a parent, the export sometimes moves their font, color and spacing up onto the parent frame. Don't follow it, because frames have no text properties in Figma.
### Page

- **If the user points at a screen** (a full page frame such as "Desktop"), that frame **is the `body`**. Put its own settings on `body` (layout, padding, gap, fill, clipping) and put its children straight inside. Give it **no fixed width or height** and no wrapper `div`. One exception: if a child **fills height** (`height: 100%`), give the body `height: 100dvh`. Otherwise the percentage has nothing to resolve against and the child collapses to its content.
- **If the user points at a component or section**, put the node in the center of the page: `body { min-height: 100vh; display: flex; align-items: center; justify-content: center; }`.
- Use the project's existing global stylesheet for fonts and the reset (one that zeroes margins and padding and sets `box-sizing: border-box`), e.g. `style.css` in the meji-meji repo. If the project has none, **ask** before adding one.

### Several viewports (Mobile / Tablet / Desktop)

When the user points at a page holding several screen frames for one design:
- **Read every viewport frame** with the property script, then list what changes between them, setting by setting.
- **Mobile first.** The base CSS is the smallest frame. Each larger frame gets a `min-width` media query that holds **only the settings that change**.
- **A layer hidden in a viewport** (`visible: false`) gets `display: none` there. Its layout stays in the rule (e.g. `display: none` at base, `display: flex` in the query where it shows).
- **Breakpoints are Tailwind's**, not the Figma frame widths:

  | Figma frame | Media query | Tailwind |
  |---|---|---|
  | Mobile (e.g. 393) | none; it's the base CSS | (default) |
  | Tablet (usually 810) | `@media (min-width: 768px)` | `md` |
  | Desktop (usually 1440 or wider) | `@media (min-width: 1024px)` | `lg` |

  If a page has a viewport that doesn't fit these three, ask which breakpoint it belongs to.
- Verify at each frame's exact width and height.

### React + Tailwind

Every rule in the tables above is still the rule. It's just written as Tailwind classes, inline in `className` on the element for that Figma layer:
- No `<style>` blocks, no CSS files, no CSS modules, no `@apply`.
- No new tokens or theme entries. If one seems needed, ask first.

```jsx
<div className="flex flex-col justify-start items-start gap-6 px-6 py-4 w-[320px] h-full overflow-clip bg-tertiary">
```

**Values.** You MUST use the existing project token/class when its semantic mapping and value match Figma. Never round to the nearest scale step or replace a matching token with a literal. If the mapping is missing, ambiguous, or conflicting, STOP and ask as required above. Exact arbitrary geometry is allowed only under the unbound-geometry exception above.
- Default 4px spacing scale: 16 → `gap-4`, 24 → `gap-6`, 36 → `p-9`, but 0.8 → `border-[0.8px]`.
- A color with no confirmed project variable/class → STOP and ask. There is no automatic hardcoded-color fallback.

| Figma | Tailwind |
|---|---|
| VERTICAL / HORIZONTAL | `flex flex-col` / `flex flex-row` |
| padding | `p-*`, or `px-* py-*`, or `pt-* pr-* pb-* pl-*` |
| `itemSpacing` | `gap-*`, always written, including `gap-0` |
| main axis MIN / CENTER / MAX / SPACE_BETWEEN | `justify-start` / `justify-center` / `justify-end` / `justify-between` |
| cross axis MIN / CENTER / MAX | `items-start` / `items-center` / `items-end` |
| `clipsContent: true` | `overflow-clip` |
| corner radius | `rounded-*` if exact, else `rounded-[12px]` |
| stroke, INSIDE | Exact stroke width plus the confirmed existing border-color utility; STOP and ask if the color mapping is unresolved |
| fill (background) | MUST use the confirmed existing semantic class, e.g. `bg-primary` or `bg-tertiary`; otherwise STOP and ask |
| **Fixed** width / height | `w-[320px]` / `h-[1024px]`, or a scale class if exact |
| **Hug** | `w-fit h-fit` |
| **Fill** across a frame | `w-full` |
| **Fill** along a horizontal frame | `flex-[1_0_0] min-w-px` |
| **Fill** height | `h-full` (not confirmed yet, see Sizing) |
| hidden in a viewport | `hidden`, then e.g. `md:flex` where it shows |
| font family | the project's existing font utility for that family. If there isn't one, **ask** |
| font weight | `font-medium` (500), etc. |
| font size | `text-[32px]`, or a scale class if exact |
| line height | `leading-[1.2]` (percent) / `leading-[38.4px]` (pixels) |
| letter spacing | `tracking-[-0.02em]` (percent) / `tracking-[-0.64px]` (pixels) |
| text color | MUST use the confirmed existing semantic class, e.g. `content-primary` or `content-secondary`; otherwise STOP and ask |
| text align LEFT / CENTER / RIGHT | `text-left` / `text-center` / `text-right` |
| hug text (`WIDTH_AND_HEIGHT`) | `w-fit h-fit whitespace-nowrap` |

**Viewports.** Mobile is the unprefixed classes. Tablet changes go under `md:` and Desktop changes under `lg:`, holding only what changes: e.g. `p-4 md:p-5 lg:p-9`.

**Screens.** A component doesn't own `<body>`. Put the screen frame's classes on the outermost element the page component renders, with no fixed width or height. If a child fills height, add `h-dvh` there. Ask before editing `body`, layout files or global CSS.
## 3. Verify

Before visual verification, audit every color, typography style, and token-bound value against the confirmed project mappings. A hardcoded replacement for an existing mapping is a failure even when screenshots match. Resolve violations before claiming completion; STOP and ask for any unresolved mapping.

Open the page in the browser and measure every layer's x, y, width and height relative to its parent. Compare each against the Figma values from step 1.

- Report the comparison as a table: layer, Figma, code.
- **Text measurements can differ by fractions of a pixel**, because the browser renders glyphs slightly differently. With hug text, that difference carries up into hug parents. Report it; don't fix it with a fixed width, because that would break the hug.
- Anything else that doesn't match is a bug in the build. Fix it from the Figma values.

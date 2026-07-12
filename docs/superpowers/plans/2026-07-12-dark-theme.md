# Dark Theme (Functional) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the existing `ThemeContext` (light/dark) actually change the visual appearance of the whole RahulOS simulator — taskbar, Start Menu, window chrome, and the content of every app — instead of only `Credits.tsx` reacting to it as today.

**Architecture:** A small set of CSS custom properties (some new, some retrofitting existing theme-agnostic bevel variables in `index.css`) get dark-mode overrides under `:root[data-theme="dark"]`. `ThemeContext` gains a `useEffect` that stamps `data-theme` onto `document.documentElement`. Every component that hardcodes a light-mode color for a "chrome"/"content" surface (window backgrounds, taskbar, cards, text) switches that specific value to the matching CSS variable string; "document" surfaces (PDF pages, the Paint canvas, gameplay tile colors, the Minesweeper board, the retro LED counter) are deliberately left untouched, matching how those are fixed-color artifacts, not theme-reactive chrome. Full spec: `docs/superpowers/specs/2026-07-12-dark-theme-design.md`.

**Tech Stack:** React 17, TypeScript, plain CSS (no new packages).

## Global Constraints

- Match existing code style: inline `style={...}` objects typed via `StyleSheetCSS`, `Colors` from `inner/src/constants/colors.ts` for non-theme-reactive colors.
- No test framework — verification is `cd inner && npx tsc --noEmit` per task, `npm run build` + live Playwright pass on the final task.
- Do not modify `outer/`. No new npm dependencies.
- **PDF pages stay their native color** — only `CertificateViewer.tsx`'s own chrome (toolbar, surrounding grey area) themes.
- **Doom/Oregon Trail/Scrabble are DOS-emulated and cannot be re-themed** — only their `<Window>` chrome (handled by Task 2) follows the theme; no changes to those 3 files.
- **Minesweeper's board/counter and Wordle's tile colors are fixed gameplay colors** (matching real Minesweeper/Wordle, which don't reskin their core board even in a "dark mode") — only each game's outer container chrome themes.
- **`ShutdownSequence.tsx` is out of scope** — it's a fixed dark teal splash screen already, not theme-reactive chrome, and must not be touched.
- **`PersonalizationSettings.tsx`'s light/dark preview swatches are out of scope** — they intentionally show literal white/black regardless of current theme, since they're previewing the *choice*, not reflecting the *current* theme.
- Every task's changes must be visually reviewed against both light and dark mode (a value that isn't wrapped in a real dark-appropriate color is worse than leaving it alone).

---

### Task 1: CSS variable infrastructure + `ThemeContext` wiring

**Files:**
- Modify: `inner/src/index.css`
- Modify: `inner/src/contexts/ThemeContext.tsx`

**Interfaces:**
- Produces these CSS custom properties, consumed by every later task's inline styles as string values (e.g. `'var(--os-bg)'`): `--os-bg`, `--os-text`, `--os-text-muted`, `--os-chrome-bg`. Also produces dark-mode overrides for the pre-existing `--button-highlight`, `--button-face`, `--button-shadow`, `--window-frame`, `--surface`, `--surface-hover` (already consumed today by `.site-button`/`.big-button-container`/`input` — no component changes needed for those, they go dark automatically once this task lands).
- Produces the `document.documentElement.dataset.theme = theme` side effect in `ThemeContext`, which is what activates every `[data-theme="dark"]` CSS rule.

- [ ] **Step 1** In `inner/src/index.css`, replace the existing `:root { ... }` block (lines 112-126) with a version that adds the 4 new light-mode variable defaults, and add a `:root[data-theme="dark"]` block right after it with dark equivalents for all 10 variables:

```css
:root {
    --button-highlight: #ffffff;
    --button-face: #747474;
    --button-shadow: #808080;
    --window-frame: #2b2b2b;
    --surface: #c0c0c0;
    --surface-hover: #e9e9e9;
    --os-bg: #ffffff;
    --os-text: #000000;
    --os-text-muted: #666666;
    --os-chrome-bg: #c3c6ca;
    --border-field: inset -1px -1px var(--button-highlight),
        inset 1px 1px var(--button-shadow), inset -2px -2px var(--button-face),
        inset 2px 2px var(--window-frame);
    --border-raised-outer: inset -1px -1px var(--window-frame),
        inset 1px 1px var(--button-highlight);
    --border-raised-inner: inset -2px -2px var(--button-shadow),
        inset 2px 2px var(--button-face);
}

:root[data-theme='dark'] {
    --button-highlight: #6d6d6d;
    --button-face: #4a4a4a;
    --button-shadow: #2a2a2a;
    --window-frame: #000000;
    --surface: #3a3a3a;
    --surface-hover: #505050;
    --os-bg: #1e1e1e;
    --os-text: #e8e8e8;
    --os-text-muted: #a8a8a8;
    --os-chrome-bg: #3a3a3a;
}
```

- [ ] **Step 2** In `inner/src/index.css`, replace the `html, body { background-color: #fff; }` rule (lines 10-12) with:

```css
html, body {
    background-color: var(--os-bg);
    color: var(--os-text);
}
```

- [ ] **Step 3** In `inner/src/contexts/ThemeContext.tsx`, add the import and the effect. Add `useEffect` to the existing `import React, { createContext, useCallback, useContext, useState } from 'react';` line:

```ts
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';
```

Then inside `ThemeProvider`, right after the `setTheme` callback definition (before the `return` statement), add:

```ts
    useEffect(() => {
        document.documentElement.dataset.theme = theme;
    }, [theme]);
```

- [ ] **Step 4** `cd inner && npx tsc --noEmit` clean. Start the dev server (`npm start`) and confirm in a browser: with no other tasks done yet, toggling Settings → Personalization → dark already darkens every `.site-button`/`.big-button-container`/`input` element and the raw white page background behind everything (most content will still look light because no component has been switched to the new `--os-*` vars yet — that's expected, later tasks handle that). Commit: "Add dark-mode CSS variables and wire ThemeContext to set data-theme".

---

### Task 2: OS chrome (Window, Toolbar, ContextMenu, Button, DragIndicator)

**Files:**
- Modify: `inner/src/components/os/Window.tsx`
- Modify: `inner/src/components/os/Toolbar.tsx`
- Modify: `inner/src/components/os/ContextMenu.tsx`
- Modify: `inner/src/components/os/Button.tsx`
- Modify: `inner/src/components/os/DragIndicator.tsx`

**Interfaces:**
- Consumes Task 1's CSS variables as string values in existing `StyleSheetCSS` objects. No new props/exports.

- [ ] **Step 1** In `inner/src/components/os/Window.tsx`, change the `window` and `content` style entries (around line 386-390 and 450-459):

```ts
    window: {
        backgroundColor: 'var(--os-chrome-bg)',
        position: 'absolute',
    },
```

```ts
    content: {
        flex: 1,
        width: '100%',
        boxSizing: 'border-box',

        position: 'relative',
        overflowX: 'hidden',
        backgroundColor: 'var(--os-bg)',
    },
```

(Leave `windowBorderOuter`/`windowBorderInner`/`contentOuter`/`contentInner`'s bevel border colors and `topBar`'s `Colors.blue` untouched — those are structural 3D-bevel edges and the fixed Windows-blue accent, not surfaces that should darken.)

- [ ] **Step 2** In `inner/src/components/os/Toolbar.tsx`, change these 5 style entries:

`toolbarOuter` (around line 475-484):
```ts
    toolbarOuter: {
        boxSizing: 'border-box',
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 32,
        background: 'var(--os-chrome-bg)',
        borderTop: '1px solid var(--os-chrome-bg)',
        zIndex: 100000,
    },
```

`startWindow` (around line 513-526), only the `background` line changes:
```ts
        background: 'var(--os-chrome-bg)',
```

`searchInput` (around line 556-566):
```ts
    searchInput: {
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        backgroundColor: 'var(--os-bg)',
        color: 'var(--os-text)',
        padding: '3px 6px',
        fontFamily: 'MSSerif',
        fontSize: 12,
    },
```

`noResults` (around line 572-577), only the `color` line changes:
```ts
        color: 'var(--os-text-muted)',
```

`gamesFlyout` (around line 586-596), only the `background` line changes:
```ts
        background: 'var(--os-chrome-bg)',
```

(Leave `verticalStartContainer`'s `Colors.darkGray`, `startMenuLine`'s `Colors.white`, and all `activeTabOuter`/`activeTabInner`/bevel border colors untouched — structural accents/bevels, not flat chrome surfaces.)

- [ ] **Step 3** In `inner/src/components/os/ContextMenu.tsx`, change the `container` style's `backgroundColor` (around line 114-125):

```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

- [ ] **Step 4** In `inner/src/components/os/Button.tsx`, change the `outerBorder` style's `background` (around line 68-76):

```ts
        background: 'var(--os-chrome-bg)',
```

(Leave the `isHovering` inline `{ backgroundColor: Colors.darkGray }` hover-state untouched — interaction feedback accent.)

- [ ] **Step 5** In `inner/src/components/os/DragIndicator.tsx`, change both `backgroundColor: Colors.white` occurrences (lines 61 and 75) to:

```ts
        backgroundColor: 'var(--os-bg)',
```

- [ ] **Step 6** `cd inner && npx tsc --noEmit` clean. Commit: "Theme OS chrome: window/taskbar/context-menu/button/drag-indicator backgrounds".

---

### Task 3: Native apps group A (Notepad, Calculator, Paint, My Computer)

**Files:**
- Modify: `inner/src/components/applications/Notepad.tsx`
- Modify: `inner/src/components/applications/Calculator.tsx`
- Modify: `inner/src/components/applications/Paint.tsx`
- Modify: `inner/src/components/applications/MyComputer.tsx`

**Interfaces:**
- Consumes Task 1's CSS variables.

- [ ] **Step 1** In `inner/src/components/applications/Notepad.tsx`, change the `textArea` style's `backgroundColor`/`color` (around line 110-123):

```ts
        backgroundColor: 'var(--os-bg)',
        color: 'var(--os-text)',
```

- [ ] **Step 2** In `inner/src/components/applications/Calculator.tsx`, change 3 lines:

`container` (around line 179-186), only `backgroundColor`:
```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

`display` (around line 187-197), only `backgroundColor`:
```ts
        backgroundColor: 'var(--os-bg)',
```

`displayText` (around line 198-203), only `color`:
```ts
        color: 'var(--os-text)',
```

- [ ] **Step 3** In `inner/src/components/applications/Paint.tsx`, change only the `canvasWrapper` style's `backgroundColor` (around line 231-239):

```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

(Leave `canvas`'s `backgroundColor: Colors.white` untouched — a paint canvas is a document/artwork surface like a PDF page, not chrome. Leave the color-palette swatches, the brush-size dot, and `brushButtonSelected` untouched — literal user-facing colors and selection-state accent.)

- [ ] **Step 4** In `inner/src/components/applications/MyComputer.tsx`, change both `backgroundColor: Colors.white` occurrences to `'var(--os-bg)'`:

`treePane` (around line 252-261):
```ts
        backgroundColor: 'var(--os-bg)',
```

`gridPane` (around line 283-292):
```ts
        backgroundColor: 'var(--os-bg)',
```

(Leave `treeRowSelected`'s `Colors.blue` untouched — selection accent.)

- [ ] **Step 5** `cd inner && npx tsc --noEmit` clean. Commit: "Theme Notepad, Calculator, Paint chrome, and My Computer panes".

---

### Task 4: Native apps group B (CertificateViewer, Credits, Settings)

**Files:**
- Modify: `inner/src/components/applications/CertificateViewer.tsx`
- Modify: `inner/src/components/applications/Credits.tsx`
- Modify: `inner/src/components/applications/Settings.tsx`

**Interfaces:**
- Consumes Task 1's CSS variables. Removes `Credits.tsx`'s `useTheme()` usage (no longer needed — CSS now handles it), but does **not** remove `ThemeContext`/`useTheme` itself (still used by `PersonalizationSettings.tsx` and now `ThemeContext.tsx`'s own effect).

- [ ] **Step 1** In `inner/src/components/applications/CertificateViewer.tsx`, change the `content` style's `backgroundColor` (around line 271-282) — this is the grey area surrounding the rendered PDF page, not the page itself:

```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

- [ ] **Step 2** In `inner/src/components/applications/Credits.tsx`, remove the now-unnecessary theme import and hook call, and replace the inline conditional styling. Remove this import line:

```ts
import { useTheme } from '../../contexts/ThemeContext';
```

Remove this line from inside the component body:

```ts
    const { theme } = useTheme();
```

Replace the JSX block that currently reads:

```tsx
                style={Object.assign({}, styles.credits, {
                    backgroundColor: theme === 'dark' ? 'black' : 'white',
                    color: theme === 'dark' ? 'white' : 'black',
                })}
```

with:

```tsx
                style={Object.assign({}, styles.credits, {
                    backgroundColor: 'var(--os-bg)',
                    color: 'var(--os-text)',
                })}
```

- [ ] **Step 3** In `inner/src/components/applications/Settings.tsx`, change the `content` style's `backgroundColor` (around line 63-68):

```ts
        backgroundColor: 'var(--os-bg)',
```

- [ ] **Step 4** `cd inner && npx tsc --noEmit` clean. Commit: "Theme CertificateViewer chrome, simplify Credits to use CSS vars, theme Settings content".

---

### Task 5: Settings sub-panels (DisplaySettings, ExplorerChrome, SettingsTile)

**Files:**
- Modify: `inner/src/components/settings/DisplaySettings.tsx`
- Modify: `inner/src/components/settings/ExplorerChrome.tsx`

**Interfaces:**
- Consumes Task 1's CSS variables. `PersonalizationSettings.tsx` and `SettingsTile.tsx` need **no changes** — the former's swatches are intentional theme-choice previews (see Global Constraints), the latter's only color usage is the `Colors.blue`/`Colors.white` selection-highlight accent pair, which stays fixed across themes like every other selection accent in this plan.

- [ ] **Step 1** In `inner/src/components/settings/DisplaySettings.tsx`, change the `hint` style's `color` (around line 144-149):

```ts
        color: 'var(--os-text-muted)',
```

- [ ] **Step 2** In `inner/src/components/settings/ExplorerChrome.tsx`, change 5 lines:

`container` (around line 399-404), only `backgroundColor`:
```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

`menuDropdown` (around line 421-434), only `backgroundColor`:
```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

`addressBox` (around line 522-532), only `backgroundColor`:
```ts
        backgroundColor: 'var(--os-bg)',
```

`addressDropdownButton` (around line 541-551), only `backgroundColor`:
```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

`aboutDialog` (around line 568-576), only `backgroundColor`:
```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

(Leave `menuItemActive`'s `Colors.blue`/`Colors.white`, `toolbarSeparator`'s `Colors.darkGray`, and `aboutTitleBar`/`aboutTitleText`'s blue-titlebar pair untouched — selection/accent colors and the fixed Windows-blue title bar, consistent with `Window.tsx`'s own `topBar`.)

- [ ] **Step 3** `cd inner && npx tsc --noEmit` clean. Commit: "Theme Display settings hint text and Control Panel Explorer chrome".

---

### Task 6: Showcase pages (Certifications, Community, Contact, Projects, Research, ResumeDownload, Skills)

**Files:**
- Modify: `inner/src/components/showcase/Certifications.tsx`
- Modify: `inner/src/components/showcase/Community.tsx`
- Modify: `inner/src/components/showcase/Projects.tsx`
- Modify: `inner/src/components/showcase/Research.tsx`
- Modify: `inner/src/components/showcase/ResumeDownload.tsx`
- Modify: `inner/src/components/showcase/Skills.tsx`

**Interfaces:**
- Consumes Task 1's CSS variables. `Contact.tsx` needs **no changes** — its only colors (`color: 'red'` and the dynamic `formMessageColor`) are semantic success/error feedback, not chrome. `About.tsx`, `Education.tsx`, `Experience.tsx`, `Hobbies.tsx`, `Summary.tsx`, `VerticalNavbar.tsx`, `Home.tsx` need **no changes** — they have no inline colors at all and already inherit the theme-aware `html, body` rule from Task 1.

- [ ] **Step 1** In `inner/src/components/showcase/Certifications.tsx`, change the `card` style's `backgroundColor` (around line 134-143) and the 3 muted-text `color` values:

```ts
    card: {
        border: '2px solid #808080',
        backgroundColor: 'var(--os-chrome-bg)',
        padding: 16,
        marginBottom: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
    },
```

```ts
    issuer: {
        color: 'var(--os-text-muted)',
        marginBottom: 2,
    },
    date: {
        color: 'var(--os-text-muted)',
        fontSize: 13,
    },
    credId: {
        color: 'var(--os-text-muted)',
        marginTop: 4,
    },
```

- [ ] **Step 2** In `inner/src/components/showcase/Community.tsx`, change the `certCard` style's `backgroundColor` (around line 81-89):

```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

- [ ] **Step 3** In `inner/src/components/showcase/Projects.tsx`, change 3 lines:

`context` (around line 150-152):
```ts
    context: {
        color: 'var(--os-text-muted)',
    },
```

`domain` (around line 161-165), only `color`:
```ts
        color: 'var(--os-text-muted)',
```

`tag` (around line 170-174), only `backgroundColor`:
```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

- [ ] **Step 4** In `inner/src/components/showcase/Research.tsx`, change 2 lines:

`domain` (around line 60-64), only `color`:
```ts
        color: 'var(--os-text-muted)',
```

`tag` (around line 69-74), only `backgroundColor`:
```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

- [ ] **Step 5** In `inner/src/components/showcase/ResumeDownload.tsx`, change the `resumeContainer` style's `backgroundColor` (around line 24-33):

```ts
        backgroundColor: 'var(--os-bg)',
```

- [ ] **Step 6** In `inner/src/components/showcase/Skills.tsx`, change the `tag` style's `backgroundColor` (around line 106-114):

```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

- [ ] **Step 7** `cd inner && npx tsc --noEmit` clean. Commit: "Theme My Details showcase pages: cards, badges, and muted text".

---

### Task 7: Games (Minesweeper, Wordle)

**Files:**
- Modify: `inner/src/components/applications/Minesweeper.tsx`
- Modify: `inner/src/components/wordle/Wordle.tsx`

**Interfaces:**
- Consumes Task 1's CSS variables. `Doom.tsx`, `OregonTrail.tsx`, `Scrabble.tsx` need **no changes** — DOS-emulated, per Global Constraints.

- [ ] **Step 1** In `inner/src/components/applications/Minesweeper.tsx`, change only the `container` style's `backgroundColor` (around line 238-246) — this is the window's own padding area around the header/board, not the board itself:

```ts
        backgroundColor: 'var(--os-chrome-bg)',
```

(Leave `header`, `counter` (the red-on-black LED digit display), `faceButton`, `board`, `cell`, and `cellRevealed` untouched — these are the actual Minesweeper board look, a fixed gameplay surface like a real Minesweeper board, not chrome.)

- [ ] **Step 2** In `inner/src/components/wordle/Wordle.tsx`, change only the outer container style's `backgroundColor` (around line 394-401, the top-level absolute-positioned wrapper with `justifyContent: 'center', alignItems: 'center'`):

```ts
        backgroundColor: 'var(--os-bg)',
```

(Leave every tile-related color untouched — `isInWord`/`isInPlace`/`notInWord`'s yellow/lightgreen/gray, the shake animation's `#f00`/`#fff`, and `emptyBox`'s `backgroundColor: 'white'` — these are Wordle's own fixed tile-state color language, unchanged even in real Wordle's own dark mode.)

- [ ] **Step 3** `cd inner && npx tsc --noEmit` clean. Commit: "Theme Minesweeper and Wordle window chrome (gameplay colors unchanged)".

---

### Task 8: Final verification

- [ ] `cd inner && npm run build` clean.
- [ ] Live Playwright pass: toggle dark mode via Settings → Personalization → Display/Personalization panel; confirm the desktop's taskbar and Start Menu darken immediately (no reload needed); open each of Notepad/Calculator/Paint/My Computer/Settings/CertificateViewer (via a certification in My Computer or My Details)/Credits and confirm dark backgrounds with legible light text; open My Details and click through every sub-page (Summary/Skills/Projects/Education/Experience/Research/Community/Hobbies/Contact/Certifications/About) confirming each is dark and readable; open Minesweeper and confirm its window chrome darkens while the board/counter keep their classic look; open Doom/Oregon Trail/Scrabble and confirm only their window title bar/border follow the theme (the DOS screen itself is unaffected, as expected); open Wordle and confirm its background darkens while tile colors stay their normal yellow/green/gray/white.
- [ ] Toggle back to light mode and confirm everything reverts correctly.
- [ ] Reload the page with dark mode selected and confirm the OS boots directly into dark mode (the `data-theme` attribute must be set correctly on initial load, not only after a manual toggle — this is the main risk in Task 1's `useEffect` approach, since `useEffect` runs after first paint, so also check for a flash-of-light-mode on load before the effect fires, and if present, either accept it as a very brief non-blocking flash or note it for the user).
- [ ] Console/page-error check throughout.

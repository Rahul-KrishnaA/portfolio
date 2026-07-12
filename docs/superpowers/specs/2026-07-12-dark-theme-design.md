# Dark Theme (Functional) Design

## Goal

Make the existing `ThemeContext` (light/dark, already toggleable via Settings → Personalization) actually change the visual appearance of the whole RahulOS simulator: taskbar, Start Menu, window chrome, desktop icon labels, and the content of every app (Notepad, Calculator, Paint, My Computer, Settings + its panels, Credits, My Details/ShowcaseExplorer and all its resume sub-pages, Minesweeper, Wordle). Currently only `Credits.tsx` reacts to theme at all.

## Constraints (confirmed)

- **PDF pages themselves stay their native color** (a resume/certificate PDF is a fixed document, not re-themeable) — but `CertificateViewer.tsx`'s own chrome (toolbar, the grey surrounding area, scrollbar) follows the theme.
- **Doom, Oregon Trail, Scrabble** run inside the `js-dos` DOS emulator, rendering their own pixel canvas — their in-game colors cannot be re-themed. Only their `<Window>` chrome (title bar, borders) follows the theme, same as any other window.
- **Minesweeper and Wordle** are native React components and get full theming.
- **My Details (ShowcaseExplorer) gets full dark mode on every sub-page** (About, Skills, Projects, Education, Experience, Research, Community, Hobbies, Contact, Certifications, Summary, VerticalNavbar) — not just the shell.

## Architecture: CSS custom properties (Option A)

`index.css` already has a small set of CSS variables (`--button-highlight`, `--button-face`, `--button-shadow`, `--window-frame`, `--surface`, `--surface-hover`) that drive the Win98 bevel look (`.site-button`, `.button-border`, `input`), but they're theme-agnostic today. This design:

1. **Retrofits those existing bevel variables** with dark equivalents under a `:root[data-theme="dark"]` block. Every element already using them (`.site-button`, `.big-button-container`, `input`, etc.) becomes dark-theme-aware with zero component changes.
2. **Adds new content-level variables** for the things that are currently hardcoded and not var-based: `--os-bg` (main content background, white↔dark), `--os-text` (primary text, black↔near-white), `--os-text-muted` (secondary text like dates/captions), `--os-border` (card/divider borders), `--os-taskbar-bg` (Toolbar/Start Menu background), `--os-window-bg` (Window.tsx's own chrome background, distinct from app content). Accent colors (the Windows-blue title bar and selection highlight, `Colors.blue`) do **not** change between themes — that matches how Windows' own dark mode keeps its accent color.
3. **`html, body` get `background-color: var(--os-bg); color: var(--os-text);`** as the global default. This matters because most of `ShowcaseExplorer`'s ~11 sub-pages (About, Education, Experience, Hobbies, Summary, VerticalNavbar, Home, Contact) have **no explicit inline colors at all** — they inherit white background/black text from `html, body` today. Once that base rule is theme-aware, those pages go dark for free, with no per-file changes needed.
4. **Every file that explicitly hardcodes a background/text color** (instead of inheriting) needs its relevant style properties swapped from a literal value (`Colors.white`, `'black'`, `'#f0f0f0'`, `'#444'`, etc.) to the matching `var(--os-...)` string. The full list, by category:
   - **OS chrome:** `Window.tsx` (content/window background), `Toolbar.tsx` (taskbar + Start Menu background — text colors already removed per the icon-only taskbar change), `ContextMenu.tsx` (background), `Button.tsx`, `DragIndicator.tsx`, `ShutdownSequence.tsx`.
   - **Native apps:** `Notepad.tsx`, `Calculator.tsx`, `Paint.tsx` (canvas itself stays white — a paint canvas is a "document" like a PDF, not chrome), `MyComputer.tsx`, `CertificateViewer.tsx` (toolbar + surrounding grey area only, not the rendered page), `Credits.tsx` (currently does its own inline `theme === 'dark' ? ... : ...` — simplify to consume the same CSS vars for consistency, since the vars now exist), `Settings.tsx`.
   - **Settings sub-panels:** `DisplaySettings.tsx`, `ExplorerChrome.tsx`, `PersonalizationSettings.tsx`, `SettingsTile.tsx`.
   - **Showcase sub-pages with their own inline colors:** `Certifications.tsx`, `Community.tsx`, `Contact.tsx`, `Projects.tsx`, `Research.tsx`, `ResumeDownload.tsx`, `Skills.tsx`.
   - **Games:** `Minesweeper.tsx` (full theming, native component). Wordle: check for inline colors and theme if present. Doom/OregonTrail/Scrabble: no changes needed (DOS-rendered, window chrome already covered by `Window.tsx`).
   - **Desktop:** `DesktopShortcut.tsx`'s label text is already white (readable on any wallpaper), left unchanged; no dark-mode-specific change needed there.
5. **`ThemeContext`** gains a `useEffect` that sets `document.documentElement.dataset.theme = theme` on mount and on every change — this is what makes the CSS `[data-theme="dark"]` selectors actually activate. (Today the toggle only updates React state/localStorage; nothing sets this attribute.)

## Testing / verification

No test framework — verification is `npx tsc --noEmit` per task, `npm run build` on the final task, plus a live Playwright pass: toggle dark mode via Settings → Personalization, confirm the desktop/taskbar/Start Menu darken immediately, open each native app and each My Details sub-page and confirm dark backgrounds + readable (light) text, open a certificate in `CertificateViewer` and confirm the toolbar/surrounding area is dark while the PDF page itself stays white, open Minesweeper and confirm it themes, open Doom/Oregon Trail/Scrabble and confirm only their window chrome (not the DOS screen) follows the theme, toggle back to light and confirm everything reverts, reload the page and confirm the theme choice persists (already handled by existing `ThemeContext` localStorage logic) and the `data-theme` attribute is set correctly on initial load (not just after a toggle).

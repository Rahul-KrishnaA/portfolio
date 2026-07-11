# Control Panel Exact-Match + Functional Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the chrome/content flex-row layout bug, add a Win98 selection model to the Settings grid, and make every menu and toolbar button in the Control Panel chrome genuinely functional (real history for Back/Forward, working Cut/Copy/Paste, functional File/Edit/View/Go/Favorites/Help menus, About dialog).

**Architecture:** A new `ControlPanelContext` (scoped inside `Settings.tsx`'s `<Router>`) owns selection, clipboard, icon size, and an explicit navigation-history stack wrapping `useNavigate`. Grid and chrome both consume it. See the spec (`docs/superpowers/specs/2026-07-11-control-panel-exact-design.md`) for full semantics — read it before implementing any task.

**Tech Stack:** React 17, TypeScript, react-router-dom v6 (MemoryRouter, already in use), no new packages.

## Global Constraints

- Match existing code style: inline `style={...}` via `StyleSheetCSS`, `React.FC<Props>`, `Colors` from `inner/src/constants/colors.ts`, `MSSerif` font, `Object.assign` conditional-style idiom.
- No test framework — verification is `cd inner && npx tsc --noEmit` per task plus a live end-to-end pass at the end.
- Do not modify `outer/` or `inner/src/components/os/Window.tsx`. No new packages.
- **Important codebase gotcha:** the global CSS makes `div`s `display: flex; flex-direction: row` by default — any stacked layout needs explicit `flexDirection: 'column'`. This is the root cause of the layout bug being fixed here.
- Icon artwork is NOT changed (user explicitly excluded icons).
- `navigator.clipboard.writeText` may be unavailable in some contexts — wrap clipboard writes in try/catch; the cut/copy state must still update even if the actual clipboard write fails.
- Commits are pre-authorized for this session's task-per-commit workflow.

---

### Task 1: ControlPanelContext + layout fix + grid selection model

**Files:**
- Create: `inner/src/components/settings/ControlPanelContext.tsx`
- Modify: `inner/src/components/applications/Settings.tsx`
- Modify: `inner/src/components/settings/SettingsGrid.tsx`
- Modify: `inner/src/components/settings/SettingsTile.tsx`

**Interfaces:**
- Produces `ControlPanelProvider: React.FC` (must render INSIDE the `<Router>` since it calls `useNavigate`/`useLocation`) and `useControlPanel()` returning:
  ```ts
  {
      selection: string | null;               // selected category key
      setSelection: (key: string | null) => void;
      clipboard: { key: string; mode: 'cut' | 'copy' } | null;
      setClipboard: (c: { key: string; mode: 'cut' | 'copy' } | null) => void;
      iconSize: 'large' | 'small';
      setIconSize: (s: 'large' | 'small') => void;
      navigateTo: (path: string) => void;     // push onto history stack + router navigate
      goBack: () => void;
      goForward: () => void;
      canGoBack: boolean;
      canGoForward: boolean;
      atRoot: boolean;
  }
  ```
  History stack: `entries: string[]` starting `['/']`, `index: number` starting 0. `navigateTo` truncates any forward entries, pushes, navigates. `goBack`/`goForward` move the index and navigate to `entries[newIndex]`. Navigating anywhere also clears `selection`.
- Consumed by Task 2's `ExplorerChrome` rewrite — the exact property names above are load-bearing.

- [ ] **Step 1** Read the spec file first (`docs/superpowers/specs/2026-07-11-control-panel-exact-design.md`), then the current `Settings.tsx`, `SettingsGrid.tsx`, `SettingsTile.tsx`, and `ExplorerChrome.tsx` to see what exists.
- [ ] **Step 2** Create `ControlPanelContext.tsx` per the interface above (pattern-match `ThemeContext.tsx` for provider/hook shape; no localStorage — this state is per-window-instance and intentionally resets when the window is reopened).
- [ ] **Step 3** Fix the layout in `Settings.tsx`: wrap `<ControlPanelProvider>` around an explicit flex-column div containing `<ExplorerChrome …/>` and a white, full-width, flex-1, scrollable content div containing `<Routes>`. This kills the grey dead zone (see Global Constraints gotcha).
- [ ] **Step 4** Update `SettingsGrid`/`SettingsTile`: single-click selects (label gets `Colors.blue` background + `Colors.white` text, plus a subtle highlight on the icon area), double-click opens via `navigateTo(category.key)` (reuse the double-click timer pattern from `inner/src/components/os/DesktopShortcut.tsx` rather than inventing a new one), clicking empty grid background clears selection, tiles render dimmed (opacity ~0.5) when `clipboard?.mode === 'cut' && clipboard.key === category.key`, and icon size comes from `iconSize` (40 large / 20 small).
- [ ] **Step 5** `cd inner && npx tsc --noEmit` — clean. Then commit: `git add -A inner/src && git commit -m "Add ControlPanel context, fix chrome layout, add grid selection model"`.

---

### Task 2: Functional chrome — menus, history toolbar, About dialog

**Files:**
- Rewrite: `inner/src/components/settings/ExplorerChrome.tsx`

**Interfaces:**
- Consumes `useControlPanel()` (Task 1, exact shape above), `CATEGORIES` from `./categories`, existing icons. Keeps `ExplorerChromeProps { onClose: () => void }`.

- [ ] **Step 1** Read the spec file first, then Task 1's committed `ControlPanelContext.tsx` for the real API.
- [ ] **Step 2** Rebuild the menu system: each of the 6 menus opens a dropdown on click (and switches menus on hover while one is open — classic menubar behavior), closes on outside mousedown or after an action. Accelerator letters underlined (`<u>F</u>ile` etc.). Items support disabled state (greyed, non-clickable) and an optional checkmark. Menu contents and enable rules exactly per the spec's "Menus" section — File (Open/Close), Edit (Cut/Copy/Paste), View (Large Icons ✓/Small Icons, Refresh), Go (Back/Forward/Up/Control Panel), Favorites (5 categories), Help (About Control Panel…).
- [ ] **Step 3** Wire the toolbar to the context: Back/Forward use `canGoBack`/`canGoForward` + `goBack`/`goForward`; Up disabled `atRoot`, navigates to `/` via `navigateTo('/')`; Cut/Copy enabled iff `selection !== null`; Paste enabled iff `clipboard !== null`, action = `navigateTo(clipboard.key)` + clear clipboard. Cut/Copy write `Control Panel\<Label>` to the clipboard in a try/catch and set `clipboard` state regardless. Keep the hover-raised/pressed bevel behavior (flat idle, raised outset bevel on hover, inset while pressed) and the existing disabled opacity treatment.
- [ ] **Step 4** About dialog: local `showAbout` state; when open, render a centered Win98-style modal (blue title bar "About Control Panel", settings icon, "RahulOS Control Panel" + one tagline line, OK button using the beveled `site-button` class) over a full-area dim/blocker div inside the chrome's positioned ancestor; OK (or blocker click) closes it. Add a thin grooved divider line between menu bar and toolbar while in this file (reference shows one).
- [ ] **Step 5** `cd inner && npx tsc --noEmit` — clean. Commit: `git add inner/src/components/settings/ExplorerChrome.tsx && git commit -m "Make Control Panel menus and toolbar fully functional"`.

---

### Task 3: End-to-end verification (controller-driven, live)

- [ ] `cd inner && npm run build` — clean.
- [ ] Live Playwright pass per the spec's Verification list: layout (chrome full width, white content below, no grey dead zone), select → highlight, double-click → opens, Back/Forward enablement through grid→Display→back→forward sequence, Up, Cut → dim + Paste enabled → Paste opens category, View → Small Icons shrinks grid icons, Favorites → navigates, Help → About opens and OK dismisses, File → Close closes the window.
- [ ] Screenshot compared against the reference; regressions checked (Display/Personalization panels still work).

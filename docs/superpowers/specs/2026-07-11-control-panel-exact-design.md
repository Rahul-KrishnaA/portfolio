# Control Panel Exact-Match + Functional Chrome — Design

## Problem

Two gaps remain versus the reference Windows 98 Control Panel screenshot:

1. **Layout bug:** `ExplorerChrome` and the routed content render as flex-row
   siblings inside `Window`'s content area (the codebase's global CSS makes
   `div`s flex-row by default), so the chrome occupies a left column and the
   icon grid a right column, leaving a tall grey dead zone. In the reference,
   the chrome rows span the full window width with the white icon area below.
2. **Non-functional chrome:** menus (Edit/View/Go/Favorites/Help) and
   Cut/Copy/Paste are decorative no-ops. The user has now explicitly asked
   for all of them to be functional.

## Goal

Make the Settings app match the reference screenshot's layout exactly
(except icon artwork, per the user), and make every menu and toolbar button
do something real.

## Functional semantics (what "functional" means per control)

**Selection model (new):** single-click a category tile selects it (label
gets the classic blue-background/white-text highlight, like "32bit ODBC" in
the screenshot); double-click opens it. Clicking empty grid space clears the
selection. This replaces the current single-click-to-open behavior and
matches real Win98.

**Toolbar:**
- **Back / Forward** — real navigation history. A history stack (managed in
  a small ControlPanelContext) records every navigation; Back/Forward move
  through it and are enabled exactly when a previous/next entry exists.
- **Up** — navigates to the grid root; disabled at root.
- **Cut / Copy** — enabled when a tile is selected. Copy writes
  `Control Panel\<Label>` to the clipboard. Cut does the same and renders
  the tile dimmed (classic cut-pending look) until paste or another cut/copy.
- **Paste** — enabled when something was cut/copied; opens that category
  (the one sensible "paste" in an un-rearrangeable settings folder) and
  clears any cut-dim state.

**Menus** (all open on click, close on outside click / after action;
accelerator letters underlined: F̲ile, E̲dit, V̲iew, G̲o, Fa̲vorites, H̲elp):
- **File** — Open (enabled with selection; opens it), Close.
- **Edit** — Cut, Copy, Paste (mirror toolbar state/actions exactly).
- **View** — Large Icons / Small Icons (functional icon-size toggle for the
  grid, 40px vs 20px, checkmark on the active one), Refresh (re-navigates to
  the current route — visually a no-op but a real re-render, matching what
  Refresh does in a static folder).
- **Go** — Back, Forward, Up, Control Panel (home) — same enable rules as
  the toolbar.
- **Favorites** — the 5 categories as menu items; clicking navigates to that
  category.
- **Help** — About Control Panel… opens a small Win98-style modal dialog
  (title bar, an icon, "RahulOS Control Panel" text, OK button) inside the
  window content area.

## Layout corrections (exact-match items)

- Wrap chrome + routes in an explicit flex-column container so the chrome
  rows span full width and content sits below.
- Content area: white, full width, no grey dead zone.
- Menu bar: accelerator underlines; thin raised divider below (the reference
  shows a grooved separator between menu bar and toolbar).
- Toolbar: buttons show a raised bevel on hover (flat when idle — classic
  IE4 "coolbar" behavior), pressed bevel while active; Back/Forward keep the
  small ▾ dropdown indicators; separator between navigation and clipboard
  groups.
- Address bar: unchanged from current (already matches).
- Status bar: unchanged (already shows "5 object(s)" / uses Window's bottom
  bar).

## Architecture

**New `inner/src/components/settings/ControlPanelContext.tsx`** — a context
scoped inside `Settings.tsx`'s `<Router>` (provider wraps chrome + routes)
holding: `selection: string | null`, `clipboard: { key: string; mode: 'cut' | 'copy' } | null`,
`iconSize: 'large' | 'small'`, and a history stack
(`entries: string[]`, `index: number`) with `navigateTo/goBack/goForward/canGoBack/canGoForward`
that wrap `useNavigate` so router state and stack never diverge.

**`SettingsGrid.tsx` / `SettingsTile.tsx`** — consume the context: selection
highlight, cut-dim, double-click-to-open, icon size, click-empty-to-deselect.

**`ExplorerChrome.tsx`** — rewritten menus (per-menu item lists with
enabled/disabled state and real actions), toolbar wired to context
history/clipboard, About dialog state. `onClose` prop kept for File → Close.

**`Settings.tsx`** — wraps chrome + routes in the ControlPanel provider and
an explicit flex-column layout div; content area forced white/full-width.

## Non-goals

- Icon artwork stays this codebase's own pixel-art (user: "except the icons ofc").
- No Explorer keyboard accelerators (Alt+F etc.) — underlines are visual.
- Cut never actually removes a category (nothing can be deleted from this
  Control Panel), matching how real CPL folders refuse cut/delete too.

## Verification

`tsc --noEmit` + `npm run build` clean; live Playwright pass covering: layout
(chrome full-width, white content below), selection highlight + double-click
open, Back/Forward enable/disable through a multi-step history, Up, Cut dim +
clipboard text, Paste opens target, View icon-size toggle, Favorites
navigation, Help → About dialog open/OK-dismiss, File → Open/Close.

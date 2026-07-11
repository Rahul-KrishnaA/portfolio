# Control Panel Explorer Chrome — Design

## Problem

The user wants the Settings app to look exactly like the reference Windows 98
Control Panel screenshot: menu bar (File Edit View Go Favorites Help),
toolbar (Back/Forward/Up, Cut/Copy/Paste), address bar ("Control Panel"),
and status bar ("N object(s)" / "My Computer"). This explicitly reverses an
earlier scope cut that treated this chrome as non-functional decoration not
worth building — the user has now confirmed they want it.

## Goal

Add authentic-looking Explorer-style chrome around the existing Settings
category grid/panels, matching the reference screenshot's visual layout.

## Scope decisions

- **Menu bar**: static row of labels with hover highlight (Win98 menu-bar
  convention). Only "File" gets a real minimal dropdown (a single "Close"
  item wired to the window's actual close handler — this is the one menu
  action that has an obvious, correct real behavior here). The other 5
  labels (Edit/View/Go/Favorites/Help) render the same hover highlight but
  clicking them is a no-op — there is nothing in a 5-category settings grid
  for these to meaningfully do, and fabricating fake menu items with no
  effect would be worse than an honest no-op.
- **Toolbar**: Back/Up buttons are wired to real navigation — enabled and
  functional when inside a category panel (Display, Personalization, or a
  placeholder), navigating back to the grid; disabled (greyed) at the grid
  root, matching real Explorer behavior. Forward is always disabled (this
  app has no meaningful forward-navigation concept). Cut/Copy/Paste are
  always disabled/greyed — there's no selection concept in a settings grid,
  and real Explorer disables these with nothing selected too, so this is
  actually the *authentic* Win98 behavior, not a shortcut.
- **Address bar**: a sunken box showing an icon + "Control Panel" text with
  a dropdown arrow, matching the screenshot. Not an editable input — it's
  decorative, matching every other "you can't actually navigate elsewhere"
  constraint already established for this app.
- **Status bar**: left segment shows "N object(s)" (N = number of Settings
  categories, computed live from `CATEGORIES.length`, not hardcoded), right
  segment shows "My Computer" — reusing `Window`'s existing
  `bottomLeftText` prop and bottom-bar segments rather than rebuilding the
  window chrome.
- **Window title**: the in-window title bar text changes from "Settings" to
  "Control Panel" (matching the screenshot exactly). The desktop
  icon/taskbar label stays "Settings" — those come from a separate `name`
  value in `Desktop.tsx`'s `APPLICATIONS` registry, not from `Window`'s
  `windowTitle` prop, so this is a purely cosmetic in-window change with no
  effect on how the app is found/labeled elsewhere.
- **No new icons for the menu bar items** (File/Edit/View/Go/Favorites/Help
  are text-only, matching the reference). Six new toolbar icons are needed:
  back arrow, forward arrow, up arrow, cut (scissors), copy, paste — none
  of the existing 20+ icons in this codebase fit, generated via the same
  zlib/PNG technique already used repeatedly this session.

## Architecture

### 1. Six new toolbar icons

Generated the same way as every other icon in this codebase (throwaway
Node/zlib script, no image libraries): `backIcon.png`, `forwardIcon.png`
(mirror of back), `upIcon.png` (arrow pointing up out of a folder-ish
shape), `cutIcon.png` (scissors), `copyIcon.png` (two overlapping
rectangles), `pasteIcon.png` (clipboard). 16x16 (toolbar icons are smaller
than desktop/window-bar icons in the reference), flat, 1px black outline,
consistent with the existing icon set.

### 2. `ExplorerChrome.tsx`

New `inner/src/components/settings/ExplorerChrome.tsx`, rendered inside
`Settings.tsx`'s `<Router>` (so it can use `useLocation`/`useNavigate`
itself for the Back/Up buttons), above the `<Routes>` content. Contains:

- **Menu bar row**: `File Edit View Go Favorites Help`, each a
  hover-highlightable label; only "File" opens a tiny dropdown with a
  single "Close" item calling the `onClose` prop passed down from
  `Settings.tsx`.
- **Toolbar row**: Back/Forward/Up icon buttons (Back/Up call
  `navigate('/')` and are `disabled` when `location.pathname === '/'`;
  Forward is always `disabled`), a vertical separator, Cut/Copy/Paste icon
  buttons (always `disabled`).
- **Address bar row**: sunken box with `settingsIcon` + "Control Panel"
  text + a small dropdown arrow glyph, non-interactive.

All three rows use the existing beveled-border/inset techniques already
established in this codebase (`Window.tsx`'s `insetBorder`,
`DisplaySettings.tsx`'s swatch bevel) — no new visual language invented.

### 3. `Settings.tsx` wiring

- `windowTitle="Control Panel"` (was `"Settings"`).
- Window size increased from `480x360` to `520x420` to comfortably fit the
  extra chrome above the content.
- `bottomLeftText={`${CATEGORIES.length} object(s)`}` (was empty string) —
  imports `CATEGORIES` from `../settings/categories` to compute this live.
- Renders `<ExplorerChrome onClose={props.onClose} />` as a sibling above
  `<Routes>`, both inside the same `<Router>`.

## Non-goals (still out of scope)

- No real Cut/Copy/Paste functionality (nothing to cut/copy/paste in a
  settings grid).
- No real Edit/View/Go/Favorites menu functionality.
- No editable address bar / URL navigation.
- No "My Computer" right-hand status bar becoming a second interactive
  element — it's static text.

## Testing / Verification

- `tsc --noEmit` + `npm run build` clean.
- Manual: Settings window now visually shows the full menu bar / toolbar /
  address bar chrome, title bar reads "Control Panel", status bar shows
  "5 object(s)" and "My Computer". At the grid root, Back/Up are visibly
  disabled; navigating into any category enables them, and clicking either
  returns to the grid. File → Close actually closes the window. All 5
  category panels (Display, Personalization, Sounds, Time & Date, Fonts)
  still function exactly as before this change.

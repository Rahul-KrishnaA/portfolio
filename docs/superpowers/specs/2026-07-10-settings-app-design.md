# Settings App — Design

## Problem

The simulated desktop OS ("RahulOS", a Windows 95/98-style shell) has no Settings/Control Panel app. The user wants to eventually customize the OS (wallpaper, light/dark theme, click/UI sounds volume, fonts, time format), but none of that exists yet. This spec covers only the first step: the app shell, its icon, and the navigation pattern later features will be added into — no actual settings are wired up to anything yet.

## Goal

Add a "Settings" desktop app matching the existing Windows 95/98 Control Panel convention: double-clicking its desktop icon opens a window showing a grid of category tiles (Display, Personalization, Sounds, Time & Date, Fonts). Clicking a tile navigates to a "Coming soon" placeholder for that category, with a Back button returning to the grid. Every category is a placeholder in this pass; wiring up real functionality (theme toggle, wallpaper picker, volume slider, etc.) is explicitly out of scope and will be follow-up work built on top of this shell.

## Non-goals

- No actual settings persistence (no localStorage, no theme/wallpaper/sound changes take effect).
- No new sound effects or volume control logic.
- No distinct icon per category — one shared placeholder icon is used for all 5 tiles (see Icons below).

## Architecture

### 1. App registration

One entry added to the `APPLICATIONS` dict in `inner/src/components/os/Desktop.tsx`, following the existing pattern used by `showcase` and `credits`:

```ts
settings: {
    key: 'settings',
    name: 'Settings',
    shortcutIcon: 'settingsIcon',
    component: Settings,
},
```

This is sufficient for the app to get a desktop shortcut and open/close/minimize/focus through the existing `WindowManagerContext` — no other changes to `Desktop.tsx`, `Toolbar.tsx`, or `WindowManagerContext.tsx` are needed.

### 2. Components

New directory `inner/src/components/settings/`:

- **`inner/src/components/applications/Settings.tsx`** — top-level app component, same shape as `ShowcaseExplorer.tsx`: wraps a `Window` (from `../os/Window`) with `windowTitle="Settings"`, `windowBarIcon="settingsIcon"`, wires `closeWindow`/`onInteract`/`minimizeWindow` from `WindowAppProps`, and renders a `Router`/`Routes` internally with two routes:
  - `/` → `SettingsGrid`
  - `/:category` → `SettingsCategoryPlaceholder`

  Fixed window size (this content doesn't need to measure itself like the PDF viewer does) — reuse a small fixed default, e.g. 480×360, consistent with the window minimums already used elsewhere (`MIN_WINDOW_WIDTH`/`MIN_WINDOW_HEIGHT` pattern in `CertificateViewer.tsx`, though Settings doesn't need a min-size hook since its size never changes based on content).

- **`inner/src/components/settings/SettingsGrid.tsx`** — the icon-grid home view. Renders 5 `SettingsTile` components in a wrapped flex/grid layout (rows of tiles, wrapping based on window width, matching the desktop-icon-grid visual convention already used for desktop shortcuts). Category list is a local constant:

  ```ts
  const CATEGORIES = [
      { key: 'display', label: 'Display' },
      { key: 'personalization', label: 'Personalization' },
      { key: 'sounds', label: 'Sounds' },
      { key: 'time', label: 'Time & Date' },
      { key: 'fonts', label: 'Fonts' },
  ];
  ```

  Each tile links to `/${category.key}` via `react-router`'s `Link` (or `useNavigate`), consistent with `VerticalNavbar`'s existing routing usage in the showcase app.

- **`inner/src/components/settings/SettingsCategoryPlaceholder.tsx`** — single reusable detail view (not 5 separate files, since all 5 are identical placeholders right now). Reads the `:category` route param, looks up the matching label from the same `CATEGORIES` list (imported from `SettingsGrid.tsx` or hoisted to a shared `categories.ts` constants file — hoisting to a small shared file is cleaner than importing from the grid component), and renders:
  - A Back control (styled like a Windows 95 button, "← Back", calling `useNavigate(-1)` or `navigate('/')`)
  - The category label as a heading
  - Placeholder body text: "Coming soon."

- **`inner/src/components/settings/SettingsTile.tsx`** — one clickable tile: icon + label underneath, matching the visual style of desktop shortcuts (`DesktopShortcut` in `Desktop.tsx`) but reusable inside a window's content area rather than the desktop background. Props: `icon: IconName`, `label: string`, `onClick: () => void`.

- **`inner/src/components/settings/categories.ts`** — the shared `CATEGORIES` constant (key + label pairs), imported by both `SettingsGrid` and `SettingsCategoryPlaceholder` so the list only exists once.

### 3. Icons

- **`inner/src/assets/icons/settingsIcon.png`** — new pixel-art icon (Windows 95 Control Panel style: grey gear, flat-shaded, hard pixel edges, no gradients/anti-aliasing, matching the existing chunky low-res look of `showcaseIcon.png`). Used both as the desktop shortcut icon and the window title bar icon, and reused as every `SettingsTile`'s icon in this pass (no distinct per-category icons yet — those get swapped in as each feature is actually built).
- Registered in `inner/src/assets/icons/index.ts` under the key `settingsIcon`, following the existing `IconName`-keyed map pattern.

### 4. Styling

Reuse existing conventions rather than introducing new patterns:
- `SettingsTile` reuses the desktop shortcut styling from `DesktopShortcut` in `Desktop.tsx` (icon over a text label, same selection/hover treatment) — it's the same visual element (icon + label grid tile), just placed inside a window instead of on the desktop background.
- The Back button reuses the existing beveled Windows-98 button look (`site-button` class, already used for buttons in `CertificateViewer.tsx`).
- Fonts/colors pull from the existing `Colors` constants (`inner/src/constants/colors.ts`) and system font stack already used throughout (`MSSerif`/system default), no new design tokens.

## Testing / Verification

- `tsc --noEmit` in `inner/` passes with no new type errors.
- Manual verification in the running dev server (`npm start` in `inner/`, viewed directly at `localhost:3000` and/or through the outer 3D scene via `?dev`):
  - Desktop shows a new "Settings" shortcut with the gear icon.
  - Double-clicking opens the Settings window with correct Win95 chrome (title bar, icon, minimize/maximize/close buttons all functional via existing `Window` component — no new behavior to verify there).
  - Window shows 5 tiles: Display, Personalization, Sounds, Time & Date, Fonts.
  - Clicking each tile navigates to its placeholder view showing the correct category label and "Coming soon." text.
  - Back button returns to the grid from every category.
  - Window minimizes to the taskbar and restores correctly (existing `WindowManagerContext` behavior, just confirming Settings participates normally).
  - Closing and reopening the app resets to the grid view: `closeWindow` removes the window's entry (and its mounted `element`) from `WindowManagerContext` state, so reopening calls `openWindow` again with a freshly created `<Settings />` element — a new component instance, mounted at its default route (`/`). No explicit reset logic is needed for this.

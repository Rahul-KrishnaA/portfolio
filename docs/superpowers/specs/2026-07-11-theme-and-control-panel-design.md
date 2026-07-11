# Theme System + Control Panel Redesign — Design

## Problem

Settings → Personalization is still a "Coming soon." placeholder, and the
Settings grid is a generic tile grid rather than resembling a classic Win98
Control Panel. There is no dark/light theme system at all — `Credits.tsx` is
hardcoded to a black background regardless of anything.

## Goal

1. A real `ThemeContext` (light/dark), persisted across reloads like
   `WallpaperContext`.
2. Personalization category becomes a real panel with a light/dark toggle.
3. `Credits.tsx` becomes theme-reactive: **white background by default**
   (light theme), switches to **black background** when dark theme is
   active — the inverse of its current always-black behavior.
4. The Settings grid (`SettingsGrid.tsx`) is restyled to visually resemble
   the reference Win98 Control Panel screenshot: a grid of larger icons with
   labels beneath, one per category, rather than the current small-tile
   layout — using freshly generated pixel-art icons (same zlib/PNG technique
   already used for `settingsIcon.png`/`minesweeperIcon.png`) themed per
   category (a monitor for Display, a paintbrush/palette for
   Personalization, a speaker for Sounds, a clock for Time & Date, an "A"
   glyph for Fonts).

## Non-goals (explicit scope cut, to keep this landable)

- **No Explorer-style menu bar/toolbar/address bar** (the reference
  screenshot's "File Edit View Go Favorites / Back Forward Up Cut Copy
  Paste / Address" chrome). That chrome belongs to a full file-browser
  window, not a 5-item settings grid, and building working
  Back/Forward/Cut/Copy/Paste for a settings panel would be pure decoration
  with no function. This spec reproduces the *visual language* (icon grid +
  labels, beveled window) rather than that literal chrome.
- **No external/downloaded icon images.** Nothing in this environment can
  reliably fetch and license-clear arbitrary images from the internet ("find
  icons online"). Every icon in this codebase so far (`settingsIcon.png`,
  `minesweeperIcon.png`) is a small generated pixel-art PNG via a throwaway
  Node/zlib script — this spec continues that pattern for the 5 category
  icons, styled to evoke the reference screenshot's icon language (flat,
  chunky, colorful, no gradients) rather than being pixel-identical copies.
- Sounds and Time & Date and Fonts categories remain "Coming soon."
  placeholders — only Personalization becomes real in this pass.
- No theme-reactivity for any app other than `Credits.tsx` in this pass
  (other apps like `ShowcaseExplorer`/`Settings` itself stay on the existing
  light Win98 chrome — full-OS dark mode is a larger follow-up, not promised
  here).

## Architecture

### 1. `ThemeContext`

New `inner/src/contexts/ThemeContext.tsx`, structurally mirroring
`WallpaperContext.tsx`:

```ts
export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}
```

- Persisted to `localStorage` under `rahulos.theme`, default `'light'`.
- Same defensive load pattern as `WallpaperContext` (malformed/missing
  storage falls back to `'light'`).
- Provider (`ThemeProvider`) wraps the same place `WallpaperProvider` does
  in `Desktop.tsx` (outermost, alongside it), so both the Settings window
  and any other app (like `Credits.tsx`) can read it regardless of where
  they're mounted in the window-manager tree.

### 2. Personalization panel

New `inner/src/components/settings/PersonalizationSettings.tsx`, structured
like `DisplaySettings.tsx`: `← Back` button, "Personalization" heading, and
two large clickable swatches/buttons — "Light" and "Dark" — the active one
visually highlighted (reusing the same beveled-selection technique added to
`DisplaySettings.tsx`'s swatches). Clicking calls `setTheme`.

Routed in `Settings.tsx` the same way `display` was: a static
`personalization` route added before the `:category` catch-all.

### 3. Credits.tsx theme reactivity

`Credits.tsx` calls `useTheme()` and computes its background/text colors
from it instead of the current hardcoded `backgroundColor: 'black', color:
'white'`:

- `light` (default): white background, black text.
- `dark`: black background, white text (i.e., today's existing look becomes
  the *dark* variant, reachable once a user opts into dark theme).

### 4. Category icons

New throwaway script generating 5 icons (`displayIcon.png` — reuse existing
gear-adjacent style but monitor-shaped; `personalizationIcon.png` — a
paintbrush/palette; `soundsIcon.png` — a speaker; `timeIcon.png` — a clock
face; `fontsIcon.png` — a stylized "A"), each 32x32 flat pixel-art, same
technique as `settingsIcon.png`. Registered in
`inner/src/assets/icons/index.ts`.

### 5. SettingsGrid restyle

`SettingsGrid.tsx` and `SettingsTile.tsx` restyled: larger icon size (was
32px, becomes ~40-48px to read closer to the reference screenshot's chunky
icons), tiles arranged in a wrapped grid with more breathing room, each
category now using its own icon (from step 4) instead of every tile
reusing the shared `settingsIcon`.

## Files

**New:**
- `inner/src/contexts/ThemeContext.tsx`
- `inner/src/components/settings/PersonalizationSettings.tsx`
- `inner/src/assets/icons/displayIcon.png`, `personalizationIcon.png`,
  `soundsIcon.png`, `timeIcon.png`, `fontsIcon.png`

**Modified:**
- `inner/src/components/os/Desktop.tsx` (add `ThemeProvider`)
- `inner/src/components/applications/Settings.tsx` (add `personalization`
  route)
- `inner/src/components/applications/Credits.tsx` (theme-reactive colors)
- `inner/src/components/settings/SettingsGrid.tsx`,
  `inner/src/components/settings/SettingsTile.tsx` (restyle, per-category
  icons)
- `inner/src/assets/icons/index.ts`

## Testing / Verification

- `tsc --noEmit` + `npm run build` clean.
- Manual: Settings grid shows 5 distinct icons in a Control-Panel-like
  layout. Personalization → Dark → desktop unaffected (per non-goals) but
  Credits (open separately) now renders black-on-white by default and
  flips to the classic black-background look after switching to Dark and
  reopening/already-open Credits updates live. Reload persists the theme
  choice. Display category still works (regression check against the
  previous wallpaper work).

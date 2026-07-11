# Settings → Display Wallpaper Changer — Design

## Problem

The `inner/` Windows-95/98-style desktop OS ("RahulOS") has a Settings app, but
it is a navigation **shell only**: the 5 category tiles (Display,
Personalization, Sounds, Time & Date, Fonts) all lead to a single "Coming soon."
placeholder. Nothing changes the OS. The desktop background is a single
hardcoded solid color (`backgroundColor: Colors.turquoise` in
`inner/src/components/os/Desktop.tsx`).

This spec covers making the **Display** category real: a working desktop
background / wallpaper picker. The other four categories remain placeholders.

## Goal

From Settings → Display, the user can change the desktop background:

- Pick from a set of classic Win98-style **solid colors** (swatches).
- Pick from any **image wallpapers** they've dropped into a dedicated
  wallpapers folder — the folder is auto-discovered, so adding a wallpaper is
  "drop the file in, rebuild, it appears in Settings" with **no code edits**.
- The choice takes effect **live** and **persists across reloads**
  (`localStorage`).

## Non-goals

- The other four categories (Personalization, Sounds, Time & Date, Fonts) stay
  as "Coming soon." placeholders — unchanged.
- No wallpaper *upload* UI inside the browser (files are added by dropping them
  into the source folder and rebuilding, not uploaded at runtime).
- No per-monitor / tiling / stretch-vs-center options — images render
  `cover`/`center`. (Can be added later.)
- No changes to `outer/`.

## Architecture

### 1. Wallpaper state & persistence — `WallpaperContext`

New provider: `inner/src/contexts/WallpaperContext.tsx`.

Placed in `Desktop.tsx` wrapping the existing `WindowManagerProvider`/
`DesktopInner`, so both the **desktop background** (rendered by `DesktopInner`)
and the **Settings window** (mounted deep inside that tree as window content)
read/write the same state.

The context holds a **selection**:

```ts
export type WallpaperSelection =
    | { kind: 'color'; color: string }   // e.g. Colors.turquoise
    | { kind: 'image'; name: string };   // source filename, e.g. 'clouds.jpg'
```

**Persistence:** written to `localStorage` under the key `rahulos.wallpaper` as
JSON. The persisted value is the **stable identifier** — the hex color, or the
image's *source filename* — deliberately **not** the built image URL, because
webpack content-hashes asset URLs (they change every build) while the filename
is stable. On load, an `image` selection is resolved back to its current URL via
the wallpaper registry (section 2).

**Fallbacks (all resolve to the default):**

- Missing / malformed / unparseable `localStorage` value.
- An `image` selection whose file no longer exists in the registry (file was
  deleted).

Default selection: `{ kind: 'color', color: Colors.turquoise }` (preserves the
current look).

**Exposed API (`useWallpaper()` hook):**

- `selection: WallpaperSelection` — current selection (for highlighting the
  active swatch in the Display panel).
- `setSelection(sel: WallpaperSelection): void` — updates state + writes
  `localStorage`.
- `desktopStyle: React.CSSProperties` — computed background style for the
  desktop div: `{ backgroundColor }` for a color; `{ backgroundImage:
  url(...), backgroundSize: 'cover', backgroundPosition: 'center' }` for an
  image. If an image selection can't be resolved, this reflects the default
  color.

The hook throws if used outside the provider (same pattern as
`useWindowManager`).

### 2. Wallpaper folder & auto-enumeration

New folder: `inner/src/assets/wallpapers/`, containing:

- `README.md` — one paragraph: "Drop wallpaper image files (.png/.jpg/.jpeg/
  .gif/.bmp) here. After a rebuild / dev-server reload they appear as
  selectable wallpapers in Settings → Display. No code changes needed."
- `.gitkeep` — so the otherwise-empty folder is tracked by git.
- `index.ts` — enumerates images at build time:

  ```ts
  const ctx = require.context('.', false, /\.(png|jpe?g|gif|bmp)$/);
  export interface WallpaperImage { name: string; url: string; }
  export const WALLPAPER_IMAGES: WallpaperImage[] = ctx.keys().map((key) => ({
      name: key.replace(/^\.\//, ''),
      url: ctx(key),
  }));
  export const findWallpaperImage = (name: string) =>
      WALLPAPER_IMAGES.find((w) => w.name === name);
  ```

  `require.context` is a webpack feature available in Create React App. An empty
  folder yields an empty list (colors still work). This is the entire "drop a
  file in the folder → pick it in Settings" mechanism.

### 3. The Display panel — `DisplaySettings.tsx`

New: `inner/src/components/settings/DisplaySettings.tsx`. Renders inside the
Settings `Window` content for the `display` route (section 4). Structure mirrors
the existing `SettingsCategoryPlaceholder.tsx`:

- A `← Back` button (`className="site-button"`, `onClick={() => navigate('/')}`)
  — same style as the placeholder's back button.
- A "Display" heading (`MSSerif`, consistent with the placeholder).
- A short label, e.g. "Background".
- A wrapped flex grid of clickable swatches:
  - **Color swatches** first — from a `WALLPAPER_COLORS` constant (classic Win98
    desktop colors; see below). Each renders as a small square filled with the
    color.
  - **Image thumbnails** next — one per entry in `WALLPAPER_IMAGES`, each a
    small square using the image as `cover` background, with its filename as a
    `title`/tooltip.
  - The swatch matching the current `selection` gets a highlighted/beveled
    "selected" border (Win98 inset look). Clicking a swatch calls
    `setSelection(...)`.

`WALLPAPER_COLORS` — a small constant (kept in `DisplaySettings.tsx`, or a tiny
`inner/src/components/settings/wallpapers.ts` if cleaner). Classic Win98 desktop
palette, reusing `Colors` where they exist and adding a few literal hexes:

- Teal (default) — `Colors.turquoise`
- Navy — `Colors.blue`
- Olive/teal-green — `#008080` or similar classic
- Maroon — `#800000`
- Purple — `#800080`
- Silver/grey — `Colors.lightGray`
- Dark grey — `Colors.darkGray`
- Black — `Colors.black`

(Exact list finalized during implementation; the point is a handful of tasteful
classic desktop colors.)

### 4. Wiring changes

- **`inner/src/components/os/Desktop.tsx`:**
  - Wrap the tree in `<WallpaperProvider>` (around `WindowManagerProvider`).
  - `DesktopInner` calls `useWallpaper()` and applies `desktopStyle` to the
    desktop `div`, replacing the hardcoded `backgroundColor: Colors.turquoise`
    in `styles.desktop`. (`styles.desktop` keeps its other properties;
    background comes from `desktopStyle` via `Object.assign`.)

- **`inner/src/components/applications/Settings.tsx`:**
  - Add `<Route path="display" element={<DisplaySettings />} />` **before** the
    existing `<Route path=":category" element={<SettingsCategoryPlaceholder />}
    />`. React Router v6 ranks the static `display` segment above the dynamic
    `:category`, so the other four categories still resolve to the placeholder.

### 5. Files

**New:**
- `inner/src/contexts/WallpaperContext.tsx`
- `inner/src/assets/wallpapers/index.ts`
- `inner/src/assets/wallpapers/README.md`
- `inner/src/assets/wallpapers/.gitkeep`
- `inner/src/components/settings/DisplaySettings.tsx`
- (optional) `inner/src/components/settings/wallpapers.ts` for `WALLPAPER_COLORS`

**Modified:**
- `inner/src/components/os/Desktop.tsx`
- `inner/src/components/applications/Settings.tsx`

**Untouched:** `outer/`, `SettingsCategoryPlaceholder.tsx` (still used by the
other 4 categories), the window system, `WindowManagerContext.tsx`.

## Styling

Reuse existing conventions only — no new UI library:
- Inline `style={...}` objects typed via the global `StyleSheetCSS` interface.
- `Colors` from `inner/src/constants/colors.ts`, fonts `MSSerif`/`Millennium`.
- `site-button` class for the Back button; beveled inset borders (as used in
  `Window.tsx`) for the selected-swatch highlight.

## Testing / Verification

- `cd inner && npx tsc --noEmit` — no errors.
- `cd inner && npm run build` — builds cleanly.
- Manual (`npm start`, `localhost:3000`, and optionally the `outer/` `?dev`
  embed):
  - Settings → Display shows color swatches (no images yet, empty folder).
  - Clicking a color changes the desktop background **live**.
  - Reload the page → the chosen background **persists**.
  - Drop a test image into `inner/src/assets/wallpapers/`, restart the dev
    server → it appears as a selectable thumbnail; selecting it sets it as the
    background and persists.
  - Delete that image file and reload while it was selected → falls back to the
    default color without crashing.
  - The other four categories still show "Coming soon."

## Attribution

This feature is written fresh for this repo (not ported from another project),
so no third-party attribution comment is required. The Settings shell it builds
on was designed in `docs/superpowers/specs/2026-07-10-settings-app-design.md`.

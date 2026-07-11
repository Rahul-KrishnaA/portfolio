# Desktop Icon Drag-to-Reposition — Design

## Problem

Desktop shortcuts (`My Details`, `Credits`, `Settings`) are locked to a
hardcoded single-column layout (`top: i * 104` in `Desktop.tsx`) with no way
to move them, unlike a real Windows desktop.

## Goal

Let the user drag any desktop icon to a new position; icons snap to a grid
(classic Win98 "auto arrange" cell snapping) and the arrangement persists
across reloads.

## Design decisions

- **Grid-snapped, not free-form.** Real Win98 desktops snap icons to an
  invisible grid — free positioning would look sloppy against this OS's
  otherwise pixel-precise chrome. Cell size matches the existing spacing:
  72px wide × 104px tall (the current hardcoded row height), grid anchored
  at the same `top: 16, left: 6` origin `styles.shortcuts` already uses.
- **Collision handling: revert, don't swap.** If a drop's nearest grid cell
  is already occupied by a different icon, the dragged icon snaps back to
  its own last valid position rather than swapping or displacing the other
  icon — simplest correct behavior, matches how many real OSes behave with
  "confirm arrangement" off.
- **Drag-vs-click disambiguation:** a mousedown followed by mouse movement
  beyond a small threshold (5px) becomes a drag; anything under that
  threshold falls through to the existing select/double-click-to-open
  behavior in `DesktopShortcut.tsx`, which must not regress.
- **Persistence:** positions keyed by shortcut name, stored in
  `localStorage` under `rahulos.desktopIconPositions`, following the exact
  load/try-catch/fallback pattern already established by `WallpaperContext`
  and `ThemeContext` in this codebase. Missing/unrecognized keys fall back
  to their default grid slot (declaration order in `APPLICATIONS`).
- **Scope:** only the 3 existing desktop shortcuts. Icons inside windows
  (Settings grid tiles, etc.) are unaffected — this is desktop-background
  icons only.

## Architecture

### `DesktopIconPositionsContext.tsx`

New `inner/src/contexts/DesktopIconPositionsContext.tsx`:

```ts
export interface GridPosition { col: number; row: number }
export interface DesktopIconPositionsContextValue {
    getPosition: (key: string, defaultIndex: number) => GridPosition;
    setPosition: (key: string, pos: GridPosition) => void;
    isOccupied: (pos: GridPosition, excludeKey: string) => boolean;
}
```

- Internally: `positions: Record<string, GridPosition>` state, persisted to
  localStorage on every `setPosition` call (same try/catch pattern as
  `WallpaperContext`).
- `getPosition(key, defaultIndex)` returns the stored position for `key`, or
  a default `{ col: 0, row: defaultIndex }` (matching today's single-column
  layout) if unset — so a first-ever load looks identical to today.
- `isOccupied` scans all *other* keys' positions for a match — used by the
  drag-drop collision check.

### `DesktopShortcut.tsx` changes

- New props: `position: GridPosition`, `onPositionChange: (pos: GridPosition) => void`.
- Convert the container to `position: absolute` pixel coordinates computed
  from `position` (`left = 6 + col * 72`, `top = 16 + row * 104`, matching
  `styles.shortcuts`'s existing origin so the parent `shortcuts` wrapper's
  `top/left` offset stays the single source of grid origin — actually
  simpler: keep pixel math local to each shortcut, drop the wrapping
  `shortcutContainer` div in `Desktop.tsx` since position is now data-driven
  per-icon, not `i * 104`).
- Drag handling added to the existing `onMouseDown` handler path: track
  `dragStartX/Y` and current pointer offset via `window` `mousemove`/`mouseup`
  listeners (same idiom already used in `Window.tsx` for window dragging —
  reuse that pattern, don't invent a new one). Below the 5px threshold, the
  existing click/double-click logic fires unchanged. Above it, the icon
  follows the cursor (visually, via a transform, not re-parenting), and on
  `mouseup` the nearest grid cell is computed from the drop point, checked
  via `isOccupied`, and either committed via `onPositionChange` or reverted.

### `Desktop.tsx` changes

- Compute each shortcut's `position` via `getPosition(shortcut.shortcutName, i)`
  and pass `position`/`onPositionChange={(pos) => setPosition(...)}` to each
  `DesktopShortcut`.
- Remove the now-redundant `shortcutContainer`/`i * 104` wrapper — positions
  are now fully data-driven per-shortcut.
- Wrap the tree in `DesktopIconPositionsProvider` alongside the existing
  `ThemeProvider`/`WallpaperProvider`.

## Non-goals

- No multi-select drag, no rubber-band selection.
- No "Auto Arrange" / "Line up Icons" context-menu commands (no desktop
  right-click menu exists in this OS yet).
- No icons-can-overlap-windows z-index changes — desktop icons already
  render behind windows via existing DOM order.

## Verification

`tsc --noEmit` + `npm run build` clean. Live: drag an icon to an empty grid
cell → it snaps and stays; reload → position persists; drag onto an
occupied cell → reverts to prior position; a plain click (no drag) still
selects, and double-click still opens, exactly as before; drag threshold
means a small jitter during a click doesn't accidentally trigger a drag.

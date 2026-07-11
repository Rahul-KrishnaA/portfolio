# Desktop Icon Drag-to-Reposition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let desktop shortcuts be dragged and dropped onto a grid, with positions persisted across reloads.

**Architecture:** A `DesktopIconPositionsContext` (mirroring `WallpaperContext`'s persist/fallback pattern) holds per-icon grid positions. `DesktopShortcut.tsx` gains drag handling reusing `Window.tsx`'s existing `window`-level mousemove/mouseup drag idiom, gated behind a 5px threshold so click/double-click behavior is untouched below it. `Desktop.tsx` wires positions in and drops its old `i * 104` hardcoded layout.

**Tech Stack:** React 17, TypeScript, no new packages.

## Global Constraints

- Match existing code style: inline `style={...}` via `StyleSheetCSS`, `React.FC<Props>`, `Colors`/`colors` from `inner/src/constants/colors.ts`.
- No test framework — verification is `cd inner && npx tsc --noEmit` per task, `npm run build` + live Playwright pass on the final task.
- Do not modify `outer/` or `inner/src/components/os/Window.tsx` (reuse its drag idiom by pattern-matching, not by importing/refactoring it).
- Grid cell size: 72px wide × 104px tall, origin `top: 16, left: 6` (matches today's exact visual position so a fresh/first load looks identical to before this plan).
- Drag threshold: 5px of pointer movement before a mousedown becomes a drag (below it, existing select/double-click-to-open logic must fire exactly as before — this is the single highest-risk regression in this plan).
- Collision on drop: revert to the icon's last valid position if the target cell is occupied by a different icon. Never swap, never overlap.
- Commits pre-authorized for this session's task-per-commit workflow.

---

### Task 1: DesktopIconPositionsContext

**Files:**
- Create: `inner/src/contexts/DesktopIconPositionsContext.tsx`

**Interfaces:**
```ts
export interface GridPosition { col: number; row: number }
export interface DesktopIconPositionsContextValue {
    getPosition: (key: string, defaultIndex: number) => GridPosition;
    setPosition: (key: string, pos: GridPosition) => void;
    isOccupied: (pos: GridPosition, excludeKey: string) => boolean;
}
export const DesktopIconPositionsProvider: React.FC;
export function useDesktopIconPositions(): DesktopIconPositionsContextValue;
```
Consumed verbatim (these exact names) by Task 2.

- [ ] **Step 1** Read `inner/src/contexts/WallpaperContext.tsx` first — this is the pattern to mirror exactly: `localStorage` key `rahulos.desktopIconPositions`, load in a try/catch with a JSON-shape validation (record of `{col: number, row: number}`, ignore malformed entries individually rather than discarding the whole store), write in a try/catch, `useCallback`-wrapped setters.
- [ ] **Step 2** Implement: `getPosition(key, defaultIndex)` returns `positions[key]` if present and valid, else `{ col: 0, row: defaultIndex }`. `setPosition(key, pos)` updates state + persists. `isOccupied(pos, excludeKey)` returns true iff some OTHER key (`!== excludeKey`) has a stored position with the same `col`/`row` — note: keys with no stored position (still on their default slot) must also count as occupying their default cell, so `isOccupied` needs to check against the same default-fallback logic, not just the raw `positions` record. Simplest correct approach: `isOccupied` takes the full current list of `{key, position}` pairs (all shortcuts resolved via `getPosition` including defaults) as an argument rather than only scanning raw stored `positions` — expose a slightly different signature if needed: `isOccupied: (pos: GridPosition, excludeKey: string, allResolvedPositions: { key: string; position: GridPosition }[]) => boolean`. Use your judgment on the exact signature as long as the collision check is correct against BOTH explicitly-moved AND still-at-default icons; document your final signature in the report since Task 2 depends on it.
- [ ] **Step 3** `cd inner && npx tsc --noEmit` clean. Commit: "Add DesktopIconPositionsContext for grid-snapped icon positions".

---

### Task 2: Wire dragging into DesktopShortcut + Desktop

**Files:**
- Modify: `inner/src/components/os/DesktopShortcut.tsx`
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- Consumes Task 1's exact context API (read the real committed file — the plan's signature guess for `isOccupied` may have been refined in Task 1's report).
- `DesktopShortcutProps` gains `position: GridPosition`, `onPositionChange: (pos: GridPosition) => void`.

- [ ] **Step 1** Read `inner/src/components/os/Window.tsx`'s `startDrag`/`onDrag`/`stopDrag` functions (lines ~101-140 as of this plan's writing, verify against current file) — this is the exact idiom to reuse: `window.addEventListener('mousemove'/'mouseup', ...)` attached in a mousedown handler, removed on mouseup, tracking a `dragStartX/Y` ref and computing delta.
- [ ] **Step 2** In `DesktopShortcut.tsx`: add drag state (`isDragging`, a ref for drag-start pointer position, a ref/state for live visual offset during drag). On the existing `onMouseDown` (`handleClickShortcut`'s container), start tracking pointer position via `window` mousemove/mouseup listeners WITHOUT yet deciding drag-vs-click. On each mousemove, if total displacement exceeds 5px, mark as dragging (this must happen only once — don't re-trigger) and visually offset the icon via a `transform: translate(dx, dy)` on the container (do not re-parent or absolutely-reposition mid-drag, matching `Window.tsx`'s live-drag technique). On mouseup: if it never crossed the drag threshold, call through to the EXISTING `handleClickShortcut` click/double-click logic unchanged (this is the critical non-regression path — the existing single/double-click timer logic must still run exactly as today when no drag occurred). If it did cross the threshold, compute the nearest grid cell from the drop point (`col = round((dropX - 6) / 72)`, `row = round((dropY - 16) / 104)`, clamped to `col >= 0, row >= 0`), check occupancy via the context, and either call `onPositionChange(newPos)` or snap the transform back to `translate(0,0)` (reverting to `position` prop, no context write) if occupied.
- [ ] **Step 3** Convert the shortcut's positioning to be driven by the `position` prop: `left = 6 + position.col * 72`, `top = 16 + position.row * 104`, applied directly on the shortcut's own `position: absolute` style (previously this offset lived in `Desktop.tsx`'s wrapping `shortcutContainer` div — fold it into `DesktopShortcut` itself now that position is per-icon data, not an index).
- [ ] **Step 4** In `Desktop.tsx`: import `DesktopIconPositionsProvider`/`useDesktopIconPositions`, wrap the provider alongside the existing `ThemeProvider`/`WallpaperProvider` (any order relative to those two is fine — this context doesn't depend on or get depended on by them). Remove the `styles.shortcutContainer`/`i * 104` wrapper div; for each shortcut, call `getPosition(shortcut.shortcutName, i)` and pass `position`/`onPositionChange={(pos) => setPosition(shortcut.shortcutName, pos)}` directly to `DesktopShortcut`. Pass the full resolved-positions list to whatever `isOccupied` signature Task 1 actually shipped (read the real file, don't guess).
- [ ] **Step 5** `cd inner && npx tsc --noEmit` clean. Commit: "Add drag-to-reposition for desktop icons".

---

### Task 3: End-to-end verification (controller-driven, live)

- [ ] `cd inner && npm run build` clean.
- [ ] Live Playwright pass: plain click still selects (no accidental drag from a stationary click); double-click still opens the app; drag an icon a few cells away → it snaps and stays at the new grid position; reload the page → position persists; drag one icon onto another's occupied cell → it reverts to its prior position, not swapped; drag a *tiny* jitter (well under 5px) → registers as a click/select, not a drag.
- [ ] Regression check: My Details still auto-opens on load; Settings/Credits still open correctly; window dragging (`Window.tsx`) still works unaffected (confirms no accidental shared-state/listener collision between the two independent drag systems).

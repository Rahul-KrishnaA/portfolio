# Pin / Taskbar / Search Design

## Goal

Add three related desktop-OS conveniences to RahulOS (`inner/`):
1. A right-click context menu on desktop icons: Open, Pin to Start Menu, Pin to Taskbar, Remove from Desktop.
2. Drag-and-drop a desktop icon onto the taskbar to pin it there; right-click a taskbar icon to unpin/close.
3. A Start Menu that always lists every installed app (not just Games), filterable by a search box, with the same pin/unpin actions available from each row — so any app remains reachable and pinnable even after its desktop icon is removed.

"Remove from Desktop" only hides the icon; it never unregisters the app. A hidden app stays fully reachable via Start Menu (list or search) and, if pinned, via the taskbar.

## Non-goals

- No "All Programs" nested folder hierarchy — the Start Menu app list is flat.
- No renaming/reordering of pinned icons beyond simple pin/unpin toggles.
- No changes to `outer/`, no new npm dependencies, no new UI library.
- Taskbar pinned-icon behavior is intentionally Windows 7-style (one slot doubles as launcher + window button), a deliberate, confirmed departure from this OS's otherwise Win98-accurate chrome. Everything else (Start Menu chrome, context menu bevels, icons) stays Win98-styled.

## Architecture

### Shared app registry

Today, `Desktop.tsx` defines `APPLICATIONS` (a local object) for desktop shortcuts, and `Toolbar.tsx` separately imports `games.ts`'s `GAMES` array for the Games flyout — Toolbar has no knowledge of the regular apps at all. This design needs both the desktop *and* the Start Menu to enumerate the same full app list, so it extracts `APPLICATIONS`'s content into a new file mirroring `games.ts`'s existing shape:

**New file `inner/src/components/os/installedApps.ts`:**
```ts
export interface InstalledAppEntry {
    key: string;
    name: string;
    icon: IconName;
    component: React.FC<any>;
}
export const INSTALLED_APPS: InstalledAppEntry[] = [ /* showcase, credits, settings, notepad, calculator, paint, myComputer — same order as today's APPLICATIONS */ ];
```
`Desktop.tsx` imports `INSTALLED_APPS` instead of defining `APPLICATIONS` inline. `Toolbar.tsx` imports it too, for the Start Menu list. `GAMES` stays separate (games remain in their own flyout, not merged into the flat app list) but gains the same pin/hide treatment via the same context (a game's `key` is just as valid a pin target as a regular app's).

### Pin/hide state

**New file `inner/src/contexts/PinnedAppsContext.tsx`**, following `WallpaperContext.tsx`'s exact persist/load pattern:

```ts
export interface PinnedAppsContextValue {
    pinnedStartMenu: Set<string>;
    // Ordered (insertion order = taskbar display order), not a Set — the
    // taskbar's button order is user-visible and must be stable across
    // pin/unpin operations, which `Set` iteration order is not a
    // documented contract for. `pinnedStartMenu`/`hiddenFromDesktop` have
    // no visible order dependency (Start Menu list order already comes
    // from `INSTALLED_APPS`; hidden is just a filter), so they stay `Set`
    // for convenient `.has()` checks.
    pinnedTaskbar: string[];
    hiddenFromDesktop: Set<string>;
    toggleStartMenuPin: (key: string) => void;
    toggleTaskbarPin: (key: string) => void;
    hideFromDesktop: (key: string) => void;
    restoreToDesktop: (key: string) => void;
}
```
- localStorage key: `rahulos.pinnedApps`, storing `{ pinnedStartMenu: string[], pinnedTaskbar: string[], hiddenFromDesktop: string[] }`.
- Load: try/catch JSON parse; validate each field is an array of strings (drop anything else, matching `WallpaperContext`'s "ignore malformed entries" approach); fall back to all-empty on any failure.
- Save: try/catch `localStorage.setItem` on every state change (silently keep in-memory only if storage is unavailable, matching existing convention).
- Provider wraps `DesktopInner` in `Desktop.tsx` alongside the existing `ThemeProvider`/`WallpaperProvider`/`DesktopIconPositionsProvider` (order-independent, no cross-dependency).

### Context menu

**New file `inner/src/components/os/ContextMenu.tsx`** — generic, reusable:
```ts
export interface ContextMenuItem {
    label: string;
    onSelect: () => void;
    disabled?: boolean;
    separatorBefore?: boolean;
}
export interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}
```
Renders a `position: absolute` list at `(x, y)` styled like the existing Start Menu dropdown (`Colors.lightGray` background, white/black bevel border, `MSSerif` font) — reusing the same visual idiom `ExplorerChrome.tsx`'s menu dropdowns already establish. Closes on any outside `mousedown` (same idiom as `Toolbar.tsx`'s Start Menu and `ExplorerChrome.tsx`'s menu bar).

### Desktop icon changes (`DesktopShortcut.tsx`)

- Add an `onContextMenu` handler: `event.preventDefault()` (suppress the browser menu), open `ContextMenu` at the click point with:
  1. **Open** — calls the existing `onOpen`.
  2. **Pin to Start Menu** / **Unpin from Start Menu** (label depends on current state) — `toggleStartMenuPin(shortcutKey)`.
  3. **Pin to Taskbar** / **Unpin from Taskbar** — `toggleTaskbarPin(shortcutKey)`.
  4. *(separator)*
  5. **Remove from Desktop** — `hideFromDesktop(shortcutKey)`.
- `DesktopShortcutProps` gains a `shortcutKey: string` prop (the stable `INSTALLED_APPS`/`GAMES` key, distinct from the display-derived `shortcutId` already used for DOM ids) so pin/hide operate on a stable identifier independent of display name.
- Existing drag-end logic (`onDragEnd` in `DesktopShortcut.tsx`) gains a taskbar-drop check: if `event.clientY >= window.innerHeight - TASKBAR_HEIGHT` (32px, matching `Toolbar.tsx`'s `styles.toolbarOuter.height`), call `onDropOnTaskbar()` (wired to `toggleTaskbarPin(shortcutKey)` if not already pinned; a no-op if already pinned) instead of running the existing grid-snap/collision logic, and skip the position-context write entirely.

### Desktop rendering (`Desktop.tsx`)

- Shortcuts list is built from `INSTALLED_APPS.filter((app) => !hiddenFromDesktop.has(app.key))` instead of iterating a local `APPLICATIONS` object. Grid position resolution (`getPosition`/`isOccupied`) is unchanged — it already operates per-key and simply won't be asked about hidden keys.
- "My Details" auto-open-on-load logic is unchanged (unaffected by desktop visibility).

### Start Menu (`Toolbar.tsx`)

- Add a search `<input>` styled to match the Win98 chrome (bordered inset, `MSSerif`), placed at the top of `startWindowContent`, above the existing Games row.
- Below the search box: a scrollable list of `INSTALLED_APPS` (each row: icon + name, same `.start-menu-option` row styling already used for Games/Shutdown), filtered by case-insensitive substring match against the search text (empty search shows all). Each row supports the same right-click `ContextMenu` as desktop icons, minus "Remove from Desktop" (not applicable to a Start Menu row) — so Pin to Start Menu/Taskbar toggles are reachable even for apps with no desktop icon.
- Clicking a row's icon/name (not the context menu) opens the app and closes the Start Menu, exactly like today's Games row click behavior.
- Games flyout (`Games ▸`) and Shutdown row are unchanged in position/behavior, appearing after the app list.

### Taskbar (`Toolbar.tsx`)

- Taskbar button list changes from "one button per `windows[key]`" to: `pinnedTaskbar` keys (in a stable order — insertion order via array, not `Set` iteration quirks — resolved against `INSTALLED_APPS ∪ GAMES ∪` any currently-open window's own name/icon fallback) unioned with currently-open window keys not already in that pinned list, de-duplicated by key.
- Per button:
  - **Pinned + not running**: click → `openWindow(...)` (resolve name/icon/component from `INSTALLED_APPS`/`GAMES`); right-click → `ContextMenu` with only "Unpin from Taskbar".
  - **Pinned + running, or unpinned + running** (today's existing case): click → `toggleMinimize(key)` (unchanged); right-click → `ContextMenu` with "Unpin from Taskbar" (only if pinned) and "Close window" (`closeWindow(key)`).
- Visual state (active/inactive bevel) for running buttons is unchanged from today's `activeTabOuter`/`activeTabInner` logic. Pinned-but-closed buttons get a plain, non-"active" bevel (they're never the focused window).

## Data flow summary

```
INSTALLED_APPS (installedApps.ts) ──┬─→ Desktop.tsx (filtered by hiddenFromDesktop) → desktop shortcuts
                                      └─→ Toolbar.tsx (filtered by search text) → Start Menu app list
GAMES (games.ts) ──────────────────────→ Toolbar.tsx → Games flyout (unchanged) + taskbar pin resolution

PinnedAppsContext (localStorage: rahulos.pinnedApps)
  ├─ hiddenFromDesktop → read by Desktop.tsx
  ├─ pinnedStartMenu   → read by Toolbar.tsx (Start Menu row pin-state labels)
  └─ pinnedTaskbar     → read by Toolbar.tsx (taskbar button list) and DesktopShortcut.tsx (drag-to-pin, context menu)
```

## Edge cases

- Unpinning a running app's taskbar icon does not close its window; pin state and window/open state are fully independent.
- Removing a desktop icon while its window is open leaves the open window untouched — only the desktop icon disappears.
- A hidden + unpinned app remains reachable only via Start Menu (list or search), matching the user's stated intent.
- Dragging a desktop icon a small amount that lands just above the taskbar (not actually over it) still falls through to the existing grid-snap logic — the taskbar hit-test only triggers when the drop `clientY` is within the taskbar's own height from the bottom of the viewport.
- Games pinned to Start Menu/Taskbar behave identically to regular apps for pin purposes; the Games flyout itself is untouched (pinning doesn't remove a game from the flyout).
- If `localStorage` is unavailable (private browsing, sandboxed iframe), pin/hide state simply doesn't persist across reload — same graceful degradation as `WallpaperContext`/`DesktopIconPositionsContext`.

## Testing / verification

No test framework exists in `inner/src` (consistent with every prior plan in this repo) — verification is `npx tsc --noEmit` per task, `npm run build` on the final task, plus a live Playwright pass covering:
- Right-click a desktop icon → menu shows all 4 items in order; Pin to Start Menu/Taskbar toggle their labels; Remove from Desktop hides the icon (and it reappears in Start Menu's list, still launchable).
- Drag a desktop icon onto the taskbar → it becomes a pinned taskbar button; dragging within the desktop grid still works as before (regression).
- Start Menu search filters the app list live as text is typed; clearing the search restores the full list; clicking a filtered result opens it and closes the Start Menu.
- A pinned-but-closed taskbar icon, when clicked, opens the app; once open, the same slot behaves like today's window button (click to minimize/restore); right-click shows the correct menu for each state.
- Regression: existing click/double-click/drag-to-grid desktop icon behavior, existing Games flyout, existing taskbar window-button behavior for unpinned apps, existing Start Menu Shutdown flow — all unaffected.

# Pin / Taskbar / Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a right-click context menu on desktop icons (Open / Pin to Start Menu / Pin to Taskbar / Remove from Desktop), drag-to-taskbar pinning, a Start Menu with a search box + full always-visible app list (with per-row pin/hide actions), and Windows-7-style taskbar buttons that double as launchers for pinned-but-closed apps.

**Architecture:** A new `installedApps.ts` registry (mirroring the existing `games.ts` pattern) replaces `Desktop.tsx`'s inline `APPLICATIONS` object so both the desktop and the Start Menu can enumerate the same app list. A new `PinnedAppsContext` (mirroring `WallpaperContext`'s persist/load pattern) holds pin/hide state in one atomic object, persisted to `localStorage`. A new generic `ContextMenu.tsx` component is reused by `DesktopShortcut.tsx` (per-icon) and `Toolbar.tsx` (per Start-Menu-row and per-taskbar-button). Full spec: `docs/superpowers/specs/2026-07-12-pin-taskbar-search-design.md`.

**Tech Stack:** React 17, TypeScript, no new packages.

## Global Constraints

- Match existing code style exactly: inline `style={...}` via `StyleSheetCSS`, `React.FC<Props>`, `Colors` from `inner/src/constants/colors.ts`, `MSSerif` font for chrome text, `.start-menu-option` CSS class (hover-only rule in `index.css`) for list-row hover feedback.
- No test framework — verification is `cd inner && npx tsc --noEmit` per task, `npm run build` + live Playwright pass on the final task.
- Do not modify `outer/`. No new npm dependencies, no new UI library.
- "Remove from Desktop" only hides the icon — it never unregisters the app. A hidden app stays reachable via the Start Menu (list/search) and, if pinned, via the taskbar.
- Taskbar pinned-icon behavior is intentionally Windows-7-style (one slot = launcher when closed, window button when open) — a confirmed, deliberate departure from this OS's otherwise Win98-accurate chrome.
- `pinnedTaskbar` is an ordered `string[]` (insertion order = display order); `pinnedStartMenu`/`hiddenFromDesktop` are `Set<string>` (no visible order dependency).
- User is not reviewing this plan before execution — each task must be fully actionable as written; do not leave any design decision unresolved.
- **Before running any `git commit`, check with the user first** — not pre-authorized for autonomous commits (matches this repo's standing no-auto-commit preference).

---

### Task 1: Shared app registry (`installedApps.ts`)

**Files:**
- Create: `inner/src/components/os/installedApps.ts`
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- Produces: `InstalledAppEntry { key: string; name: string; icon: IconName; component: React.FC<any> }`, `INSTALLED_APPS: InstalledAppEntry[]` — consumed by Task 4 (Desktop.tsx pin-filtering) and Tasks 5-6 (Toolbar.tsx).

- [ ] **Step 1** Create `inner/src/components/os/installedApps.ts`:

```ts
import React from 'react';
import { IconName } from '../../assets/icons';
import ShowcaseExplorer from '../applications/ShowcaseExplorer';
import Credits from '../applications/Credits';
import Settings from '../applications/Settings';
import Notepad from '../applications/Notepad';
import Calculator from '../applications/Calculator';
import Paint from '../applications/Paint';
import MyComputer from '../applications/MyComputer';

export interface InstalledAppEntry {
    key: string;
    name: string;
    icon: IconName;
    component: React.FC<any>;
}

export const INSTALLED_APPS: InstalledAppEntry[] = [
    {
        key: 'showcase',
        name: 'My Details',
        icon: 'showcaseIcon',
        component: ShowcaseExplorer,
    },
    {
        key: 'credits',
        name: 'Credits',
        icon: 'credits',
        component: Credits,
    },
    {
        key: 'settings',
        name: 'Settings',
        icon: 'settingsIcon',
        component: Settings,
    },
    {
        key: 'notepad',
        name: 'Notepad',
        icon: 'notepadIcon',
        component: Notepad,
    },
    {
        key: 'calculator',
        name: 'Calculator',
        icon: 'calculatorIcon',
        component: Calculator,
    },
    {
        key: 'paint',
        name: 'Paint',
        icon: 'paintIcon',
        component: Paint,
    },
    {
        key: 'myComputer',
        name: 'My Computer',
        icon: 'computerBig',
        component: MyComputer,
    },
];
```

- [ ] **Step 2** In `inner/src/components/os/Desktop.tsx`, remove the `APPLICATIONS` object, the `ExtendedWindowAppProps` type, and the now-unused per-app component imports (`ShowcaseExplorer`, `Credits`, `Settings`, `Notepad`, `Calculator`, `Paint`, `MyComputer`); add `import { INSTALLED_APPS } from './installedApps';`. Give `ShortcutConfig` a `key` field and rebuild the shortcuts effect from `INSTALLED_APPS`:

```ts
interface ShortcutConfig {
    key: string;
    shortcutName: string;
    icon: IconName;
    onOpen: () => void;
}
```

```ts
    useEffect(() => {
        const newShortcuts: ShortcutConfig[] = INSTALLED_APPS.map((app) => ({
            key: app.key,
            shortcutName: app.name,
            icon: app.icon,
            onOpen: () => {
                openWindow(
                    app.key,
                    app.name,
                    app.icon,
                    <app.component
                        onInteract={() => focusWindow(app.key)}
                        onMinimize={() => minimizeWindow(app.key)}
                        onClose={() => closeWindow(app.key)}
                        key={app.key}
                    />
                );
            },
        }));

        newShortcuts.forEach((shortcut) => {
            if (shortcut.shortcutName === 'My Details') {
                shortcut.onOpen();
            }
        });

        setShortcuts(newShortcuts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
```

- [ ] **Step 3** `cd inner && npx tsc --noEmit` clean. Commit: "Extract shared INSTALLED_APPS registry from Desktop.tsx".

---

### Task 2: `PinnedAppsContext`

**Files:**
- Create: `inner/src/contexts/PinnedAppsContext.tsx`

**Interfaces:**
```ts
export interface PinnedAppsContextValue {
    pinnedStartMenu: Set<string>;
    pinnedTaskbar: string[];
    hiddenFromDesktop: Set<string>;
    toggleStartMenuPin: (key: string) => void;
    toggleTaskbarPin: (key: string) => void;
    hideFromDesktop: (key: string) => void;
    restoreToDesktop: (key: string) => void;
}
export const PinnedAppsProvider: React.FC;
export function usePinnedApps(): PinnedAppsContextValue;
```
Consumed verbatim (these exact names) by Tasks 4-6. Not wired into the provider tree yet — that happens in Task 4.

- [ ] **Step 1** Create `inner/src/contexts/PinnedAppsContext.tsx`:

```tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

export interface PinnedAppsContextValue {
    pinnedStartMenu: Set<string>;
    pinnedTaskbar: string[];
    hiddenFromDesktop: Set<string>;
    toggleStartMenuPin: (key: string) => void;
    toggleTaskbarPin: (key: string) => void;
    hideFromDesktop: (key: string) => void;
    restoreToDesktop: (key: string) => void;
}

interface PersistedShape {
    pinnedStartMenu: string[];
    pinnedTaskbar: string[];
    hiddenFromDesktop: string[];
}

const STORAGE_KEY = 'rahulos.pinnedApps';

const DEFAULT_STATE: PersistedShape = {
    pinnedStartMenu: [],
    pinnedTaskbar: [],
    hiddenFromDesktop: [],
};

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((v) => typeof v === 'string');

const loadState = (): PersistedShape => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_STATE;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;
        return {
            pinnedStartMenu: isStringArray(parsed.pinnedStartMenu)
                ? parsed.pinnedStartMenu
                : [],
            pinnedTaskbar: isStringArray(parsed.pinnedTaskbar)
                ? parsed.pinnedTaskbar
                : [],
            hiddenFromDesktop: isStringArray(parsed.hiddenFromDesktop)
                ? parsed.hiddenFromDesktop
                : [],
        };
    } catch {
        return DEFAULT_STATE;
    }
};

const persist = (state: PersistedShape) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // localStorage unavailable (private mode / iframe) — keep in-memory.
    }
};

const PinnedAppsContext = createContext<PinnedAppsContextValue | null>(null);

export const PinnedAppsProvider: React.FC = ({ children }) => {
    const [state, setState] = useState<PersistedShape>(loadState);

    // Single atomic state object (not three separate useState calls) so a
    // toggle always reads/writes the current values of the other two
    // fields too — three independent useState hooks would let a
    // fast-fired persist() race on stale closures of the sibling fields.
    const updateState = useCallback(
        (updater: (prev: PersistedShape) => PersistedShape) => {
            setState((prev) => {
                const next = updater(prev);
                persist(next);
                return next;
            });
        },
        []
    );

    const toggleStartMenuPin = useCallback(
        (key: string) => {
            updateState((prev) => ({
                ...prev,
                pinnedStartMenu: prev.pinnedStartMenu.includes(key)
                    ? prev.pinnedStartMenu.filter((k) => k !== key)
                    : [...prev.pinnedStartMenu, key],
            }));
        },
        [updateState]
    );

    const toggleTaskbarPin = useCallback(
        (key: string) => {
            updateState((prev) => ({
                ...prev,
                pinnedTaskbar: prev.pinnedTaskbar.includes(key)
                    ? prev.pinnedTaskbar.filter((k) => k !== key)
                    : [...prev.pinnedTaskbar, key],
            }));
        },
        [updateState]
    );

    const hideFromDesktop = useCallback(
        (key: string) => {
            updateState((prev) =>
                prev.hiddenFromDesktop.includes(key)
                    ? prev
                    : {
                          ...prev,
                          hiddenFromDesktop: [...prev.hiddenFromDesktop, key],
                      }
            );
        },
        [updateState]
    );

    const restoreToDesktop = useCallback(
        (key: string) => {
            updateState((prev) => ({
                ...prev,
                hiddenFromDesktop: prev.hiddenFromDesktop.filter(
                    (k) => k !== key
                ),
            }));
        },
        [updateState]
    );

    const pinnedStartMenuSet = useMemo(
        () => new Set(state.pinnedStartMenu),
        [state.pinnedStartMenu]
    );
    const hiddenFromDesktopSet = useMemo(
        () => new Set(state.hiddenFromDesktop),
        [state.hiddenFromDesktop]
    );

    return (
        <PinnedAppsContext.Provider
            value={{
                pinnedStartMenu: pinnedStartMenuSet,
                pinnedTaskbar: state.pinnedTaskbar,
                hiddenFromDesktop: hiddenFromDesktopSet,
                toggleStartMenuPin,
                toggleTaskbarPin,
                hideFromDesktop,
                restoreToDesktop,
            }}
        >
            {children}
        </PinnedAppsContext.Provider>
    );
};

export function usePinnedApps(): PinnedAppsContextValue {
    const ctx = useContext(PinnedAppsContext);
    if (!ctx) {
        throw new Error(
            'usePinnedApps must be used within a PinnedAppsProvider'
        );
    }
    return ctx;
}
```

- [ ] **Step 2** `cd inner && npx tsc --noEmit` clean. Commit: "Add PinnedAppsContext for Start Menu/taskbar pin and desktop-hide state".

---

### Task 3: Generic `ContextMenu` component

**Files:**
- Create: `inner/src/components/os/ContextMenu.tsx`

**Interfaces:**
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
Consumed verbatim by Tasks 4-6. Calling an item's `onSelect` always also calls `onClose` internally (consumers don't need to call `onClose` themselves inside `onSelect`).

- [ ] **Step 1** Create `inner/src/components/os/ContextMenu.tsx`:

```tsx
import React, { useEffect, useRef } from 'react';
import Colors from '../../constants/colors';

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

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const handleOutsideMouseDown = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        window.addEventListener('mousedown', handleOutsideMouseDown, true);
        return () =>
            window.removeEventListener(
                'mousedown',
                handleOutsideMouseDown,
                true
            );
    }, [onClose]);

    const handleSelect = (item: ContextMenuItem) => {
        if (item.disabled) return;
        item.onSelect();
        onClose();
    };

    return (
        <div
            ref={containerRef}
            style={Object.assign({}, styles.container, { left: x, top: y })}
            onMouseDown={(event) => event.stopPropagation()}
        >
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    {item.separatorBefore && <div style={styles.separator} />}
                    <div
                        className={item.disabled ? undefined : 'start-menu-option'}
                        style={Object.assign(
                            {},
                            styles.item,
                            item.disabled && styles.itemDisabled
                        )}
                        onMouseDown={(event) => {
                            event.stopPropagation();
                            handleSelect(item);
                        }}
                    >
                        <p>{item.label}</p>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};

// `position: fixed` (viewport-relative, not ancestor-relative) so this
// renders correctly regardless of which positioned ancestor it mounts
// under (a DesktopShortcut's own `position: absolute` box, a taskbar
// button, etc.) — the (x, y) it receives is always a `clientX`/`clientY`
// viewport coordinate from the triggering mouse event.
const styles: StyleSheetCSS = {
    container: {
        position: 'fixed',
        flexDirection: 'column',
        minWidth: 160,
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        backgroundColor: Colors.lightGray,
        boxShadow: '2px 2px 6px rgba(0,0,0,0.5)',
        zIndex: 200000,
        padding: 2,
    },
    item: {
        padding: '5px 10px',
        fontFamily: 'MSSerif',
        fontSize: 12,
        cursor: 'pointer',
    },
    itemDisabled: {
        opacity: 0.5,
        cursor: 'default',
    },
    separator: {
        height: 1,
        marginTop: 2,
        marginBottom: 2,
        borderTop: `1px solid ${Colors.darkGray}`,
        borderBottom: `1px solid ${Colors.white}`,
    },
};

export default ContextMenu;
```

- [ ] **Step 2** `cd inner && npx tsc --noEmit` clean. Commit: "Add generic ContextMenu component".

---

### Task 4: Desktop icon context menu + drag-to-taskbar pin + desktop-hide filtering

**Files:**
- Modify: `inner/src/components/os/DesktopShortcut.tsx`
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- `DesktopShortcutProps` gains `shortcutKey: string` (the stable `INSTALLED_APPS`/`GAMES` key — distinct from the display-name-derived `shortcutId` already used for DOM ids, and distinct from the position-context's own name-keyed storage, which is unchanged).
- Consumes Task 2's `usePinnedApps()` and Task 3's `ContextMenu`/`ContextMenuItem` directly (via context hook, not prop-drilled — matches how `useWallpaper()`/`useTheme()` are already consumed directly by leaf components elsewhere in this codebase).

- [ ] **Step 1** In `inner/src/components/os/DesktopShortcut.tsx`, add imports:

```ts
import { usePinnedApps } from '../../contexts/PinnedAppsContext';
import ContextMenu, { ContextMenuItem } from './ContextMenu';
```

Add `shortcutKey: string;` to `DesktopShortcutProps`, and add it to the destructured props list.

- [ ] **Step 2** Add a `TASKBAR_HEIGHT` constant near the existing grid constants (matches `Toolbar.tsx`'s `styles.toolbarOuter.height`):

```ts
// Matches Toolbar.tsx's styles.toolbarOuter.height — used to hit-test a
// drag-end drop point against the taskbar for drag-to-pin.
const TASKBAR_HEIGHT = 32;
```

- [ ] **Step 3** Inside the component, after the existing hooks, add pin-menu state and the context hook:

```ts
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(
        null
    );
    const {
        pinnedStartMenu,
        pinnedTaskbar,
        toggleStartMenuPin,
        toggleTaskbarPin,
        hideFromDesktop,
    } = usePinnedApps();
```

- [ ] **Step 4** Replace the `onDragEnd` callback's body with this version (reorders the transform-reset to happen once, before either outcome, and adds the taskbar-drop branch):

```ts
    const onDragEnd = useCallback(
        (event: MouseEvent) => {
            const info = dragInfoRef.current;
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            dragInfoRef.current = null;

            if (!info) return;

            if (!info.dragging) {
                // Threshold never crossed during this gesture — fall through
                // to the existing single/double-click logic, unchanged.
                handleClickShortcut();
                return;
            }

            // Reset the live-drag transform regardless of outcome — on
            // commit the `position` prop will update to match (parent
            // re-render); on revert/pin this simply snaps back to the
            // unchanged `position` prop's coordinates.
            if (containerRef.current) {
                containerRef.current.style.transform = 'translate(0px, 0px)';
            }

            // Dropped onto the taskbar: pin instead of grid-repositioning.
            if (event.clientY >= window.innerHeight - TASKBAR_HEIGHT) {
                if (!pinnedTaskbar.includes(shortcutKey)) {
                    toggleTaskbarPin(shortcutKey);
                }
                return;
            }

            const dx = event.clientX - info.startX;
            const dy = event.clientY - info.startY;

            const newCol = Math.max(
                0,
                Math.round(position.col + dx / GRID_CELL_WIDTH)
            );
            const newRow = Math.max(
                0,
                Math.round(position.row + dy / GRID_CELL_HEIGHT)
            );
            const newPos = { col: newCol, row: newRow };

            const isSamePosition =
                newPos.col === position.col && newPos.row === position.row;

            if (!isSamePosition && isPositionAvailable(newPos)) {
                onPositionChange(newPos);
            }
            // Otherwise (same cell, or occupied by another icon): revert —
            // transform already reset above, and no context write happens.
        },
        [
            onDragMove,
            position,
            isPositionAvailable,
            onPositionChange,
            handleClickShortcut,
            pinnedTaskbar,
            toggleTaskbarPin,
            shortcutKey,
        ]
    );
```

- [ ] **Step 5** Add a context-menu handler and an items builder just before the `return (`:

```ts
    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        setContextMenu({ x: event.clientX, y: event.clientY });
    }, []);

    const menuItems: ContextMenuItem[] = [
        { label: 'Open', onSelect: onOpen },
        {
            label: pinnedStartMenu.has(shortcutKey)
                ? 'Unpin from Start Menu'
                : 'Pin to Start Menu',
            onSelect: () => toggleStartMenuPin(shortcutKey),
        },
        {
            label: pinnedTaskbar.includes(shortcutKey)
                ? 'Unpin from Taskbar'
                : 'Pin to Taskbar',
            onSelect: () => toggleTaskbarPin(shortcutKey),
        },
        {
            label: 'Remove from Desktop',
            onSelect: () => hideFromDesktop(shortcutKey),
            separatorBefore: true,
        },
    ];
```

- [ ] **Step 6** Add `onContextMenu={handleContextMenu}` to the shortcut's root `<div>` (the one with `onMouseDown={handleMouseDown}`), and wrap the component's returned JSX in a fragment so the menu can render as a sibling. The end of the `return` becomes:

```tsx
    return (
        <>
            <div
                id={`${shortcutId}`}
                style={Object.assign(
                    {},
                    styles.appShortcut,
                    positionStyle
                )}
                onMouseDown={handleMouseDown}
                onContextMenu={handleContextMenu}
                ref={containerRef}
            >
                {/* ...existing children unchanged... */}
            </div>
            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={menuItems}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </>
    );
```
(Keep the existing large comment block and all existing children of the root `<div>` exactly as they are today — only the wrapping fragment, the added `onContextMenu` prop, and the appended `{contextMenu && ...}` sibling are new.)

- [ ] **Step 7** In `inner/src/components/os/Desktop.tsx`: import `PinnedAppsProvider` and `usePinnedApps` from `'../../contexts/PinnedAppsContext'`. Wrap `DesktopInner` with `PinnedAppsProvider` alongside the existing providers (order-independent):

```tsx
const Desktop: React.FC<DesktopProps> = () => {
    return (
        <ThemeProvider>
            <WallpaperProvider>
                <DesktopIconPositionsProvider>
                    <PinnedAppsProvider>
                        <WindowManagerProvider>
                            <DesktopInner />
                        </WindowManagerProvider>
                    </PinnedAppsProvider>
                </DesktopIconPositionsProvider>
            </WallpaperProvider>
        </ThemeProvider>
    );
};
```

- [ ] **Step 8** In `DesktopInner`, destructure `hiddenFromDesktop` from `usePinnedApps()`, filter to a `visibleShortcuts` list, and use it for both the resolved-positions list and the render map (both currently use the unfiltered `shortcuts`), and pass `shortcutKey={shortcut.key}` to `<DesktopShortcut>`:

```ts
    const { hiddenFromDesktop } = usePinnedApps();
```

```tsx
            <div style={styles.shortcuts}>
                {(() => {
                    const visibleShortcuts = shortcuts.filter(
                        (shortcut) => !hiddenFromDesktop.has(shortcut.key)
                    );
                    const allResolvedPositions: ResolvedIconPosition[] =
                        visibleShortcuts.map((shortcut, i) => ({
                            key: shortcut.shortcutName,
                            position: getPosition(shortcut.shortcutName, i),
                        }));

                    return visibleShortcuts.map((shortcut, i) => {
                        const position = getPosition(shortcut.shortcutName, i);
                        return (
                            <DesktopShortcut
                                key={shortcut.shortcutName}
                                shortcutKey={shortcut.key}
                                icon={shortcut.icon}
                                shortcutName={shortcut.shortcutName}
                                onOpen={shortcut.onOpen}
                                position={position}
                                onPositionChange={(pos) =>
                                    setPosition(shortcut.shortcutName, pos)
                                }
                                isPositionAvailable={(pos) =>
                                    !isOccupied(
                                        pos,
                                        shortcut.shortcutName,
                                        allResolvedPositions
                                    )
                                }
                            />
                        );
                    });
                })()}
            </div>
```

- [ ] **Step 9** `cd inner && npx tsc --noEmit` clean. Commit: "Add desktop icon context menu, drag-to-taskbar pin, and desktop-hide filtering".

---

### Task 5: Start Menu search + full app list

**Files:**
- Modify: `inner/src/components/os/Toolbar.tsx`

**Interfaces:**
- Introduces the shared `menu: {x, y, items} | null` state and a single `<ContextMenu>` render instance in `Toolbar.tsx`, which Task 6 reuses for taskbar buttons.
- Introduces `launchEntry(entry: {key, name, icon, component})`, reused by the existing `openGame` (refactored to call it) and by the new Start-Menu app rows.

**Note — resolved gap vs. the design doc:** the design doc says a Start-Menu row's context menu omits "Remove from Desktop" (since a list row isn't a desktop icon). Taken literally, that leaves `restoreToDesktop` with no UI that ever calls it — dead code. This plan resolves that by making the row's third menu item toggle: **"Remove from Desktop"** when the app currently has a visible desktop icon, **"Restore to Desktop"** when it's currently hidden. This is the only way (per the approved design) to bring a hidden app's icon back, and it mirrors how real Windows Start Menus let you toggle an item's desktop-shortcut presence from the menu itself.

- [ ] **Step 1** Add imports:

```ts
import { INSTALLED_APPS, InstalledAppEntry } from './installedApps';
import { usePinnedApps } from '../../contexts/PinnedAppsContext';
import ContextMenu, { ContextMenuItem } from './ContextMenu';
```

- [ ] **Step 2** Inside the `Toolbar` component, add state and the pin-context hook, alongside the existing `startWindowOpen`/`gamesMenuOpen` state:

```ts
    const [appSearch, setAppSearch] = useState('');
    const [menu, setMenu] = useState<{
        x: number;
        y: number;
        items: ContextMenuItem[];
    } | null>(null);
    const {
        pinnedStartMenu,
        pinnedTaskbar,
        hiddenFromDesktop,
        toggleStartMenuPin,
        toggleTaskbarPin,
        hideFromDesktop,
        restoreToDesktop,
    } = usePinnedApps();

    const closeMenu = () => setMenu(null);
```

- [ ] **Step 3** Add a shared `launchEntry` helper, and refactor the existing `openGame` to use it (replace the current `openGame` function body):

```ts
    const launchEntry = (entry: {
        key: string;
        name: string;
        icon: IconName;
        component: React.FC<any>;
    }) => {
        openWindow(
            entry.key,
            entry.name,
            entry.icon,
            <entry.component
                onInteract={() => focusWindow(entry.key)}
                onMinimize={() => minimizeWindow(entry.key)}
                onClose={() => closeWindow(entry.key)}
                key={entry.key}
            />
        );
    };

    const openGame = (game: (typeof GAMES)[number]) => {
        launchEntry(game);
        setGamesMenuOpen(false);
        setStartWindowOpen(false);
    };

    const openInstalledApp = (app: InstalledAppEntry) => {
        launchEntry(app);
        setStartWindowOpen(false);
    };
```

- [ ] **Step 4** Add a filtered-list computation and a per-row context-menu-items builder, above the `return (`:

```ts
    const filteredApps = INSTALLED_APPS.filter((app) =>
        app.name.toLowerCase().includes(appSearch.toLowerCase())
    );

    const appContextItems = (app: InstalledAppEntry): ContextMenuItem[] => [
        {
            label: pinnedStartMenu.has(app.key)
                ? 'Unpin from Start Menu'
                : 'Pin to Start Menu',
            onSelect: () => toggleStartMenuPin(app.key),
        },
        {
            label: pinnedTaskbar.includes(app.key)
                ? 'Unpin from Taskbar'
                : 'Pin to Taskbar',
            onSelect: () => toggleTaskbarPin(app.key),
        },
        {
            label: hiddenFromDesktop.has(app.key)
                ? 'Restore to Desktop'
                : 'Remove from Desktop',
            onSelect: () =>
                hiddenFromDesktop.has(app.key)
                    ? restoreToDesktop(app.key)
                    : hideFromDesktop(app.key),
            separatorBefore: true,
        },
    ];
```

- [ ] **Step 5** Replace `<div style={styles.startMenuSpace} />` (the flex spacer currently sitting above the Games row) with the search box + scrollable app list:

```tsx
                            <div style={styles.searchRow}>
                                <input
                                    style={styles.searchInput}
                                    placeholder="Search apps..."
                                    value={appSearch}
                                    onChange={(e) =>
                                        setAppSearch(e.target.value)
                                    }
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div style={styles.appList}>
                                {filteredApps.map((app) => (
                                    <div
                                        key={app.key}
                                        className="start-menu-option"
                                        style={styles.startMenuOption}
                                        onMouseDown={(event) => {
                                            event.stopPropagation();
                                            openInstalledApp(app);
                                        }}
                                        onContextMenu={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setMenu({
                                                x: event.clientX,
                                                y: event.clientY,
                                                items: appContextItems(app),
                                            });
                                        }}
                                    >
                                        <Icon
                                            style={styles.startMenuIcon}
                                            icon={app.icon}
                                        />
                                        <p style={styles.startMenuText}>
                                            {app.name}
                                        </p>
                                    </div>
                                ))}
                                {filteredApps.length === 0 && (
                                    <p style={styles.noResults}>
                                        No apps found
                                    </p>
                                )}
                            </div>
```

- [ ] **Step 6** Add the shared `<ContextMenu>` render, as a sibling right after the existing `{startWindowOpen && ( ... )}` block (still inside `styles.toolbarOuter`'s root div, not inside the Start Menu's own conditional):

```tsx
            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    items={menu.items}
                    onClose={closeMenu}
                />
            )}
```

- [ ] **Step 7** Add the new styles to the `styles` object:

```ts
    searchRow: {
        padding: 6,
    },
    searchInput: {
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        backgroundColor: Colors.white,
        padding: '3px 6px',
        fontFamily: 'MSSerif',
        fontSize: 12,
    },
    appList: {
        flexDirection: 'column',
        maxHeight: 180,
        overflowY: 'auto',
    },
    noResults: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        color: Colors.darkGray,
        padding: 12,
    },
```

- [ ] **Step 8** `cd inner && npx tsc --noEmit` clean. Commit: "Add Start Menu search box and full always-visible app list".

---

### Task 6: Taskbar pin/launch unification

**Files:**
- Modify: `inner/src/components/os/Toolbar.tsx`

**Interfaces:**
- Consumes Task 5's `menu`/`setMenu`/`closeMenu`/`launchEntry` and Task 2's `pinnedTaskbar`/`toggleTaskbarPin` (already destructured in Task 5).

- [ ] **Step 1** Add `GameEntry` to the existing `games.ts` import (`import { GAMES, GameEntry } from './games';`), and add a module-level combined lookup array right below the imports:

```ts
// Combined lookup for resolving a pinned-but-not-currently-open taskbar
// key back to its name/icon/component — a pinned key can be either a
// regular app or a game, and both share the same {key, name, icon,
// component} shape.
const ALL_LAUNCHABLE: (InstalledAppEntry | GameEntry)[] = [
    ...INSTALLED_APPS,
    ...GAMES,
];

const findLaunchable = (
    key: string
): InstalledAppEntry | GameEntry | undefined =>
    ALL_LAUNCHABLE.find((entry) => entry.key === key);
```

- [ ] **Step 2** Replace the existing taskbar-buttons render block (`{Object.keys(windows).map((key) => { ... })}`) with:

```tsx
                    <div style={styles.toolbarTabsContainer}>
                        {(() => {
                            const openKeys = Object.keys(windows);
                            const taskbarKeys = [
                                ...pinnedTaskbar,
                                ...openKeys.filter(
                                    (k) => !pinnedTaskbar.includes(k)
                                ),
                            ];

                            return taskbarKeys.map((key) => {
                                const isOpen = !!windows[key];
                                const isPinned = pinnedTaskbar.includes(key);
                                const entry = !isOpen
                                    ? findLaunchable(key)
                                    : undefined;

                                // A stale pinned key with no matching open
                                // window and no matching registry entry —
                                // nothing to render (defensive; shouldn't
                                // happen since pins are only ever set from
                                // real registry keys).
                                if (!isOpen && !entry) return null;

                                const name = isOpen
                                    ? windows[key].name
                                    : entry!.name;
                                const icon = isOpen
                                    ? windows[key].icon
                                    : entry!.icon;
                                const isActive =
                                    isOpen &&
                                    lastActive === key &&
                                    !windows[key].minimized;

                                const handleClick = () => {
                                    if (isOpen) {
                                        toggleMinimize(key);
                                    } else if (entry) {
                                        launchEntry(entry);
                                    }
                                };

                                const handleContextMenu = (
                                    event: React.MouseEvent
                                ) => {
                                    event.preventDefault();
                                    const items: ContextMenuItem[] = [];
                                    if (isPinned) {
                                        items.push({
                                            label: 'Unpin from Taskbar',
                                            onSelect: () =>
                                                toggleTaskbarPin(key),
                                        });
                                    }
                                    if (isOpen) {
                                        items.push({
                                            label: 'Close window',
                                            onSelect: () => closeWindow(key),
                                            separatorBefore: isPinned,
                                        });
                                    }
                                    if (items.length > 0) {
                                        setMenu({
                                            x: event.clientX,
                                            y: event.clientY,
                                            items,
                                        });
                                    }
                                };

                                return (
                                    <div
                                        key={key}
                                        style={Object.assign(
                                            {},
                                            styles.tabContainerOuter,
                                            isActive && styles.activeTabOuter
                                        )}
                                        onMouseDown={handleClick}
                                        onContextMenu={handleContextMenu}
                                    >
                                        <div
                                            style={Object.assign(
                                                {},
                                                styles.tabContainer,
                                                isActive && styles.activeTabInner
                                            )}
                                        >
                                            <Icon
                                                size={18}
                                                icon={icon}
                                                style={styles.tabIcon}
                                            />
                                            <p style={styles.tabText}>
                                                {name}
                                            </p>
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
```

- [ ] **Step 3** `cd inner && npx tsc --noEmit` clean. Commit: "Unify taskbar buttons across pinned launchers and open windows".

---

### Task 7: Final verification

- [ ] `cd inner && npm run build` clean.
- [ ] Live Playwright pass covering:
  - Right-click a desktop icon → menu shows Open, Pin to Start Menu, Pin to Taskbar, (separator), Remove from Desktop, in that order; Pin to Start Menu/Taskbar toggle their own labels on repeat right-click; Remove from Desktop hides the icon.
  - The hidden app still appears in the Start Menu's app list (search "notepad" style filtering finds it), and its Start Menu row's context menu now shows "Restore to Desktop" instead of "Remove from Desktop"; selecting it brings the desktop icon back.
  - Drag a desktop icon onto the taskbar (drop point inside the bottom 32px) → it becomes a pinned taskbar button that launches the app on click when closed, and behaves like a normal window button (minimize/restore) once open.
  - Regression: dragging a desktop icon within the grid (not onto the taskbar) still snaps/reverts/persists exactly as before this plan.
  - Start Menu search box filters the app list live as text is typed; clearing it restores the full list; clicking a filtered result opens the app and closes the Start Menu.
  - Right-click a pinned-but-closed taskbar button → only "Unpin from Taskbar" appears; right-click a pinned-and-open (or unpinned-and-open) button → "Unpin from Taskbar" (if pinned) + "Close window"; "Close window" actually closes it; unpinning a running app's taskbar button does not close its window.
  - Regression: existing Games flyout still opens Minesweeper/Doom/etc correctly (via the refactored `launchEntry`); existing Start Menu Shutdown flow unaffected; My Details still auto-opens on load.
- [ ] Console/page-error check across all of the above interactions.

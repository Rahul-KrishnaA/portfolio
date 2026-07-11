# Settings Wallpaper Changer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Settings → Display change the desktop background — a picker of classic Win98 solid-color swatches plus any image files dropped into an auto-discovered wallpapers folder, with the choice applied live and persisted across reloads.

**Architecture:** A new `WallpaperContext` provider wraps the desktop (around the existing `WindowManagerProvider` in `Desktop.tsx`) and holds a persisted `WallpaperSelection` (a stable color hex or image filename), exposing a computed `desktopStyle`. `DesktopInner` applies that style to the desktop div instead of the hardcoded turquoise. A new `assets/wallpapers/` folder auto-enumerates images via webpack's `require.context`. A new `DisplaySettings` panel (routed for the `display` category only) renders the swatch/thumbnail grid and calls the context setter.

**Tech Stack:** React 17 (function components + hooks, Context API), TypeScript, `react-router-dom` v6 (already used by Settings), Create React App + webpack `require.context`, `localStorage`. No new dependencies.

## Global Constraints

- Match existing code style exactly: inline `style={...}` objects typed via the global `StyleSheetCSS` interface (declared in `inner/src/constants/Types.d.ts`, no import needed), function components typed `React.FC<Props>`, `Colors` from `inner/src/constants/colors.ts`, fonts `'MSSerif'`/`'Millennium'`, the `site-button` CSS class for buttons.
- **No test framework** exists in `inner/src` (zero `*.test.*` files) — do NOT introduce Jest/RTL. Per-task verification is `cd inner && npx tsc --noEmit` plus the manual dev-server check given in that task.
- Do not modify `outer/`. Do not introduce a new UI library or CSS framework.
- Persist the **stable identifier** (color hex or image source filename) to `localStorage`, never the webpack-hashed image URL.
- Default selection is `{ kind: 'color', color: Colors.turquoise }` (preserves the current look). All invalid/unresolvable states fall back to it.
- **Before running any `git commit`, check with the user first** — this project's owner only commits when explicitly asked. The `git add`/`git commit` steps below are gated on that confirmation.

---

### Task 1: Wallpaper folder + auto-enumeration registry

**Files:**
- Create: `inner/src/assets/wallpapers/index.ts`
- Create: `inner/src/assets/wallpapers/README.md`
- Create: `inner/src/assets/wallpapers/.gitkeep`

**Interfaces:**
- Produces:
  - `interface WallpaperImage { name: string; url: string }`
  - `const WALLPAPER_IMAGES: WallpaperImage[]` — every image in this folder, `name` = source filename (e.g. `'clouds.jpg'`), `url` = built asset URL.
  - `const findWallpaperImage: (name: string) => WallpaperImage | undefined`
  - Consumed by `WallpaperContext.tsx` (Task 2, to resolve an image selection to a URL) and `DisplaySettings.tsx` (Task 5, to render thumbnails).

- [ ] **Step 1: Create the folder marker + README**

Create `inner/src/assets/wallpapers/.gitkeep` (empty file).

Create `inner/src/assets/wallpapers/README.md`:

```markdown
# Wallpapers

Drop wallpaper image files (`.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`) into this
folder. After a rebuild or dev-server reload they automatically appear as
selectable wallpapers in **Settings → Display** — no code changes needed.

Enumeration is handled by `index.ts` via webpack's `require.context`, so the
file's name (e.g. `clouds.jpg`) is what gets shown and persisted.
```

- [ ] **Step 2: Create the enumeration module**

Create `inner/src/assets/wallpapers/index.ts`:

```ts
// Auto-enumerates every image dropped into this folder at build time via
// webpack's require.context (available in Create React App). Adding a wallpaper
// is "drop the file in, rebuild" — no code edit needed here.

export interface WallpaperImage {
    name: string;
    url: string;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ctx = (require as any).context('.', false, /\.(png|jpe?g|gif|bmp)$/);

export const WALLPAPER_IMAGES: WallpaperImage[] = ctx
    .keys()
    .map((key: string) => ({
        name: key.replace(/^\.\//, ''),
        url: ctx(key).default || ctx(key),
    }));

export const findWallpaperImage = (
    name: string
): WallpaperImage | undefined =>
    WALLPAPER_IMAGES.find((w) => w.name === name);
```

Note: `ctx(key).default || ctx(key)` handles both ESM-interop (`.default`) and
plain-string module shapes across CRA/webpack versions.

- [ ] **Step 3: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors. (Empty folder → `WALLPAPER_IMAGES` is `[]`; that's valid.)

- [ ] **Step 4: Commit** (confirm with user first — see Global Constraints)

```bash
git add inner/src/assets/wallpapers/
git commit -m "Add auto-enumerating wallpapers asset folder"
```

---

### Task 2: WallpaperContext provider + persistence

**Files:**
- Create: `inner/src/contexts/WallpaperContext.tsx`

**Interfaces:**
- Consumes: `WALLPAPER_IMAGES`/`findWallpaperImage` from `../assets/wallpapers` (Task 1); `Colors` from `../constants/colors`.
- Produces:
  - `type WallpaperSelection = { kind: 'color'; color: string } | { kind: 'image'; name: string }`
  - `const WallpaperProvider: React.FC` (wraps children)
  - `function useWallpaper(): WallpaperContextValue` where
    `WallpaperContextValue = { selection: WallpaperSelection; setSelection: (sel: WallpaperSelection) => void; desktopStyle: React.CSSProperties }`
  - Consumed by `Desktop.tsx` (Task 3: `WallpaperProvider` + `desktopStyle`) and `DisplaySettings.tsx` (Task 5: `selection` + `setSelection`).

- [ ] **Step 1: Create the context module**

Create `inner/src/contexts/WallpaperContext.tsx`:

```tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import Colors from '../constants/colors';
import { findWallpaperImage } from '../assets/wallpapers';

export type WallpaperSelection =
    | { kind: 'color'; color: string }
    | { kind: 'image'; name: string };

export interface WallpaperContextValue {
    selection: WallpaperSelection;
    setSelection: (sel: WallpaperSelection) => void;
    desktopStyle: React.CSSProperties;
}

const STORAGE_KEY = 'rahulos.wallpaper';

const DEFAULT_SELECTION: WallpaperSelection = {
    kind: 'color',
    color: Colors.turquoise,
};

const loadSelection = (): WallpaperSelection => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SELECTION;
        const parsed = JSON.parse(raw);
        if (
            parsed &&
            parsed.kind === 'color' &&
            typeof parsed.color === 'string'
        ) {
            return { kind: 'color', color: parsed.color };
        }
        if (
            parsed &&
            parsed.kind === 'image' &&
            typeof parsed.name === 'string'
        ) {
            return { kind: 'image', name: parsed.name };
        }
        return DEFAULT_SELECTION;
    } catch {
        return DEFAULT_SELECTION;
    }
};

const styleForSelection = (
    selection: WallpaperSelection
): React.CSSProperties => {
    if (selection.kind === 'color') {
        return { backgroundColor: selection.color };
    }
    const image = findWallpaperImage(selection.name);
    if (!image) {
        // File was removed since it was chosen — fall back to default.
        return { backgroundColor: DEFAULT_SELECTION.color };
    }
    return {
        backgroundImage: `url(${image.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    };
};

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

export const WallpaperProvider: React.FC = ({ children }) => {
    const [selection, setSelectionState] = useState<WallpaperSelection>(
        loadSelection
    );

    const setSelection = useCallback((sel: WallpaperSelection) => {
        setSelectionState(sel);
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
        } catch {
            // localStorage unavailable (private mode / iframe) — keep in-memory.
        }
    }, []);

    const desktopStyle = useMemo(
        () => styleForSelection(selection),
        [selection]
    );

    return (
        <WallpaperContext.Provider
            value={{ selection, setSelection, desktopStyle }}
        >
            {children}
        </WallpaperContext.Provider>
    );
};

export function useWallpaper(): WallpaperContextValue {
    const ctx = useContext(WallpaperContext);
    if (!ctx) {
        throw new Error(
            'useWallpaper must be used within a WallpaperProvider'
        );
    }
    return ctx;
}
```

- [ ] **Step 2: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit** (confirm with user first)

```bash
git add inner/src/contexts/WallpaperContext.tsx
git commit -m "Add WallpaperContext with persisted background selection"
```

---

### Task 3: Wire WallpaperProvider + apply background in Desktop

**Files:**
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- Consumes: `WallpaperProvider` and `useWallpaper` from `../../contexts/WallpaperContext` (Task 2).
- Produces: the desktop background now driven by context; no new exports.

- [ ] **Step 1: Add the import**

In `inner/src/components/os/Desktop.tsx`, add near the other context import:

```ts
import {
    WallpaperProvider,
    useWallpaper,
} from '../../contexts/WallpaperContext';
```

- [ ] **Step 2: Wrap the tree in WallpaperProvider**

Change the `Desktop` component from:

```tsx
const Desktop: React.FC<DesktopProps> = () => {
    return (
        <WindowManagerProvider>
            <DesktopInner />
        </WindowManagerProvider>
    );
};
```

to:

```tsx
const Desktop: React.FC<DesktopProps> = () => {
    return (
        <WallpaperProvider>
            <WindowManagerProvider>
                <DesktopInner />
            </WindowManagerProvider>
        </WallpaperProvider>
    );
};
```

- [ ] **Step 3: Consume desktopStyle in DesktopInner**

In `DesktopInner`, add the hook alongside the existing `useWindowManager()` call:

```ts
    const { desktopStyle } = useWallpaper();
```

Then change the desktop div (currently `<div style={styles.desktop}>`) to merge
the dynamic background over the base style:

```tsx
        <div style={Object.assign({}, styles.desktop, desktopStyle)}>
```

- [ ] **Step 4: Drop the hardcoded background color**

In the `styles` object at the bottom, remove the `backgroundColor: Colors.turquoise` line from `styles.desktop` (the default now comes from `desktopStyle`, which defaults to turquoise). Leave the rest of `styles.desktop` (`minHeight`, `flex`) unchanged.

`Colors` is still imported and used elsewhere in the file, so leave the import.

- [ ] **Step 5: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verify (baseline unchanged)**

Run `cd inner && npm start`, open `localhost:3000`. Expected: the desktop still
shows the same turquoise background as before (default selection), and existing
apps still open. Nothing visibly changed yet — this task only rewires the source
of the background.

- [ ] **Step 7: Commit** (confirm with user first)

```bash
git add inner/src/components/os/Desktop.tsx
git commit -m "Drive desktop background from WallpaperContext"
```

---

### Task 4: Color palette constant

**Files:**
- Create: `inner/src/components/settings/wallpapers.ts`

**Interfaces:**
- Consumes: `Colors` from `../../constants/colors`.
- Produces:
  - `interface WallpaperColor { label: string; value: string }`
  - `const WALLPAPER_COLORS: WallpaperColor[]`
  - Consumed by `DisplaySettings.tsx` (Task 5).

- [ ] **Step 1: Create the constant**

Create `inner/src/components/settings/wallpapers.ts`:

```ts
import Colors from '../../constants/colors';

export interface WallpaperColor {
    label: string;
    value: string;
}

// Classic Windows 95/98 desktop colors, reusing the shared palette where it
// already has an equivalent and adding a few literal classics.
export const WALLPAPER_COLORS: WallpaperColor[] = [
    { label: 'Teal', value: Colors.turquoise },
    { label: 'Navy', value: Colors.blue },
    { label: 'Green', value: '#008080' },
    { label: 'Olive', value: '#808000' },
    { label: 'Maroon', value: '#800000' },
    { label: 'Purple', value: '#800080' },
    { label: 'Silver', value: Colors.lightGray },
    { label: 'Gray', value: Colors.darkGray },
    { label: 'Black', value: Colors.black },
];
```

- [ ] **Step 2: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit** (confirm with user first)

```bash
git add inner/src/components/settings/wallpapers.ts
git commit -m "Add Win98 wallpaper color palette constant"
```

---

### Task 5: DisplaySettings panel

**Files:**
- Create: `inner/src/components/settings/DisplaySettings.tsx`

**Interfaces:**
- Consumes: `useNavigate` from `react-router-dom`; `useWallpaper`/`WallpaperSelection` from `../../contexts/WallpaperContext` (Task 2); `WALLPAPER_COLORS` from `./wallpapers` (Task 4); `WALLPAPER_IMAGES` from `../../assets/wallpapers` (Task 1); `Colors` from `../../constants/colors`.
- Produces: `DisplaySettings: React.FC` default export, imported by `Settings.tsx` (Task 6) as `import DisplaySettings from '../settings/DisplaySettings';`.

- [ ] **Step 1: Create the component**

Create `inner/src/components/settings/DisplaySettings.tsx`:

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    useWallpaper,
    WallpaperSelection,
} from '../../contexts/WallpaperContext';
import { WALLPAPER_COLORS } from './wallpapers';
import { WALLPAPER_IMAGES } from '../../assets/wallpapers';
import Colors from '../../constants/colors';

export interface DisplaySettingsProps {}

const isSelected = (
    selection: WallpaperSelection,
    swatch: WallpaperSelection
): boolean => {
    if (selection.kind !== swatch.kind) return false;
    if (selection.kind === 'color' && swatch.kind === 'color') {
        return selection.color === swatch.color;
    }
    if (selection.kind === 'image' && swatch.kind === 'image') {
        return selection.name === swatch.name;
    }
    return false;
};

const DisplaySettings: React.FC<DisplaySettingsProps> = () => {
    const navigate = useNavigate();
    const { selection, setSelection } = useWallpaper();

    const renderSwatch = (
        key: string,
        swatch: WallpaperSelection,
        title: string,
        inner: React.CSSProperties
    ) => {
        const selected = isSelected(selection, swatch);
        return (
            <div
                key={key}
                title={title}
                onMouseDown={() => setSelection(swatch)}
                style={Object.assign(
                    {},
                    styles.swatch,
                    selected && styles.swatchSelected
                )}
            >
                <div style={Object.assign({}, styles.swatchInner, inner)} />
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <button
                className="site-button"
                style={styles.backButton}
                onClick={() => navigate('/')}
            >
                ← Back
            </button>
            <h3 style={styles.heading}>Display</h3>
            <p style={styles.label}>Background</p>
            <div style={styles.grid}>
                {WALLPAPER_COLORS.map((c) =>
                    renderSwatch(
                        `color-${c.value}`,
                        { kind: 'color', color: c.value },
                        c.label,
                        { backgroundColor: c.value }
                    )
                )}
                {WALLPAPER_IMAGES.map((img) =>
                    renderSwatch(
                        `image-${img.name}`,
                        { kind: 'image', name: img.name },
                        img.name,
                        {
                            backgroundImage: `url(${img.url})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                        }
                    )
                )}
            </div>
            {WALLPAPER_IMAGES.length === 0 && (
                <p style={styles.hint}>
                    Drop image files into src/assets/wallpapers/ to add custom
                    wallpapers.
                </p>
            )}
        </div>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flexDirection: 'column',
        padding: 16,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    heading: {
        fontFamily: 'MSSerif',
        marginBottom: 8,
    },
    label: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        marginBottom: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    swatch: {
        width: 44,
        height: 44,
        marginRight: 8,
        marginBottom: 8,
        padding: 2,
        boxSizing: 'border-box',
        cursor: 'pointer',
        border: `2px solid transparent`,
    },
    swatchSelected: {
        // Win98 inset selection look
        border: `2px solid ${Colors.blue}`,
    },
    swatchInner: {
        flex: 1,
        border: `1px solid ${Colors.darkGray}`,
        boxSizing: 'border-box',
    },
    hint: {
        fontFamily: 'MSSerif',
        fontSize: 11,
        color: Colors.darkGray,
        marginTop: 8,
    },
};

export default DisplaySettings;
```

- [ ] **Step 2: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit** (confirm with user first)

```bash
git add inner/src/components/settings/DisplaySettings.tsx
git commit -m "Add Display settings panel with wallpaper picker"
```

---

### Task 6: Route the Display category to DisplaySettings

**Files:**
- Modify: `inner/src/components/applications/Settings.tsx`

**Interfaces:**
- Consumes: `DisplaySettings` (Task 5).
- Produces: the `display` category now renders the real panel; the other four still hit `SettingsCategoryPlaceholder`.

- [ ] **Step 1: Add the import**

In `inner/src/components/applications/Settings.tsx`, add:

```ts
import DisplaySettings from '../settings/DisplaySettings';
```

- [ ] **Step 2: Add the display route before the catch-all**

Change the `<Routes>` block from:

```tsx
                <Routes>
                    <Route path="/" element={<SettingsGrid />} />
                    <Route
                        path=":category"
                        element={<SettingsCategoryPlaceholder />}
                    />
                </Routes>
```

to:

```tsx
                <Routes>
                    <Route path="/" element={<SettingsGrid />} />
                    <Route path="display" element={<DisplaySettings />} />
                    <Route
                        path=":category"
                        element={<SettingsCategoryPlaceholder />}
                    />
                </Routes>
```

(React Router v6 ranks the static `display` segment above the dynamic
`:category`, so route order here is for readability; the other four categories
still resolve to the placeholder.)

- [ ] **Step 3: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit** (confirm with user first)

```bash
git add inner/src/components/applications/Settings.tsx
git commit -m "Route Settings Display category to the wallpaper picker"
```

---

### Task 7: End-to-end verification

**Files:** none (verification only).

**Interfaces:** none — exercises the full path built by Tasks 1-6.

- [ ] **Step 1: Production build**

Run: `cd inner && npm run build`
Expected: `Compiled ... successfully` (warnings OK, no errors).

- [ ] **Step 2: Start the dev server**

Run: `cd inner && npm start`. Wait for `Compiled successfully!` on
`localhost:3000`.

- [ ] **Step 3: Verify color change (live)**

Open `localhost:3000`. Double-click Settings → click the **Display** tile.
Confirm: `← Back`, a "Display" heading, "Background" label, and a row of color
swatches (the teal one highlighted as current). Click a different color (e.g.
Maroon). Expected: the desktop background changes immediately behind the window.

- [ ] **Step 4: Verify persistence**

Reload the page (`localhost:3000`). Expected: the desktop comes back with the
color you last picked (e.g. Maroon), not the default teal. Reopen Settings →
Display and confirm that swatch is the highlighted/selected one.

- [ ] **Step 5: Verify Back + other categories intact**

From Display, click `← Back` → returns to the 5-tile grid. Click Personalization
(and each of Sounds, Time & Date, Fonts) → each still shows its own label +
"Coming soon." placeholder.

- [ ] **Step 6: Verify image wallpaper discovery**

Drop any test image (e.g. `test.jpg`) into `inner/src/assets/wallpapers/`. The
dev server hot-reloads (or restart `npm start`). Reopen Settings → Display.
Expected: a thumbnail for `test.jpg` now appears after the color swatches, and
the "Drop image files..." hint is gone. Click it → desktop shows that image
(`cover`/centered). Reload → it persists.

- [ ] **Step 7: Verify missing-file fallback**

With the image wallpaper selected, delete `test.jpg` from the folder and
restart the dev server / reload. Expected: no crash; the desktop falls back to
the default teal background. (Then remove the leftover test image so it isn't
committed.)

- [ ] **Step 8: Verify in the outer 3D scene (optional)**

If `outer/`'s dev server is running, open it with `?dev` so it iframes the local
`inner/`, zoom into the monitor, and repeat steps 3-5 through the embedded view
to confirm the iframe embedding still works.

- [ ] **Step 9: Final status check** (confirm with user before any commit)

```bash
cd D:\Prog\Portfolio
git status
git log --oneline -8
```
Expected: working tree clean aside from intentionally-untracked items; a commit
for each of Tasks 1-6 in the log. No stray test wallpaper committed.

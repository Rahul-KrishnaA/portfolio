# Theme System + Control Panel Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a persisted light/dark `ThemeContext`, make Personalization a real panel that controls it, make `Credits.tsx` theme-reactive (white by default, black in dark mode), and restyle the Settings grid with generated per-category icons to read closer to a classic Win98 Control Panel.

**Architecture:** `ThemeContext` mirrors the already-reviewed `WallpaperContext` exactly (same load/persist/fallback shape). `PersonalizationSettings.tsx` mirrors the already-reviewed `DisplaySettings.tsx` exactly (same swatch/selection pattern, applied to 2 theme options instead of colors/images). 5 new icons generated via the same zlib/PNG script technique as `settingsIcon.png`/`minesweeperIcon.png`. `SettingsGrid`/`SettingsTile` get a size/layout pass, not a rewrite.

**Tech Stack:** React 17, TypeScript, no new dependencies.

## Global Constraints

- Match existing code style exactly: inline `style={...}` via `StyleSheetCSS`, `React.FC<Props>`, `Colors` from `inner/src/constants/colors.ts`.
- No test framework — verification is `cd inner && npx tsc --noEmit` (+ `npm run build` on the final task) plus manual dev-server checks.
- Do not modify `outer/`. No new UI library/CSS framework.
- Do not attempt to fetch/download external icon images — generate them via the established zlib/PNG script pattern.
- Do not build Explorer-style menu bar/toolbar/address bar chrome for Settings — out of scope (see spec's Non-goals).
- Only Personalization becomes real; Sounds/Time & Date/Fonts remain "Coming soon." placeholders.
- Only `Credits.tsx` becomes theme-reactive in this pass — no other app.
- **Before running any `git commit`, this session has pre-authorized the task-by-task commit workflow** (same as the prior two plans) — proceed without asking.

---

### Task 1: ThemeContext provider + persistence

**Files:**
- Create: `inner/src/contexts/ThemeContext.tsx`

**Interfaces:**
- Produces: `type Theme = 'light' | 'dark'`, `ThemeProvider: React.FC`, `useTheme(): { theme: Theme; setTheme: (theme: Theme) => void }`.
- Consumed by `Desktop.tsx` (Task 6), `PersonalizationSettings.tsx` (Task 3), `Credits.tsx` (Task 4).

- [ ] **Step 1: Create the context**

Mirror `inner/src/contexts/WallpaperContext.tsx` exactly in structure
(read that file first for the exact load/try-catch/fallback pattern), but
simplified since `Theme` has only 2 flat string values, not a discriminated
union:

```tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'rahulos.theme';
const DEFAULT_THEME: Theme = 'light';

const loadTheme = (): Theme => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === 'light' || raw === 'dark') return raw;
        return DEFAULT_THEME;
    } catch {
        return DEFAULT_THEME;
    }
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(loadTheme);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // localStorage unavailable — keep in-memory.
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
}
```

- [ ] **Step 2: Type-check**

Run: `cd inner && npx tsc --noEmit` — no errors.

- [ ] **Step 3: Commit**

```bash
git add inner/src/contexts/ThemeContext.tsx
git commit -m "Add ThemeContext with persisted light/dark theme"
```

---

### Task 2: Generate the 5 category icons

**Files:**
- Create: `inner/src/assets/icons/displayIcon.png`, `personalizationIcon.png`, `soundsIcon.png`, `timeIcon.png`, `fontsIcon.png`
- Create (temporary, delete after use): `inner/scripts/generate-category-icons.js`
- Modify: `inner/src/assets/icons/index.ts`

**Interfaces:**
- Produces: 5 new `IconName` values (`'displayIcon' | 'personalizationIcon' | 'soundsIcon' | 'timeIcon' | 'fontsIcon'`), consumed by `SettingsGrid.tsx`/`categories.ts` (Task 5).

- [ ] **Step 1: Write one script generating all 5 icons**

Use the exact same zlib/PNG-building helpers already proven in this
codebase (`crc32`, `chunk`, `buildPNG` — copy the boilerplate structure
from the existing icon-generation approach used for `settingsIcon.png`),
parameterized to draw 5 different 32x32 flat pixel-art glyphs, each with a
1px black outline and no gradients/anti-aliasing, using `Colors` hex values
(`#c3c6ca` light gray, `#86898d` dark gray, `#3e9697` turquoise, `#0000a3`
blue, `#ff0000` red, `#000000` black) plus a couple of literal accent
colors where a category calls for it (e.g. yellow `#ffcc00` for a sun/
brightness cue on the display icon, if desired):

```js
// inner/scripts/generate-category-icons.js
// Generates 5 32x32 pixel-art Settings-category icons (Windows 95/98
// Control Panel style: flat, chunky, hard edges) as valid PNGs using only
// Node's built-in zlib (no image libraries).
// Run with: node scripts/generate-category-icons.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 32;
const BLACK = [0, 0, 0, 255];
const DARK_GRAY = [0x86, 0x89, 0x8d, 255];
const LIGHT_GRAY = [0xc3, 0xc6, 0xca, 255];
const WHITE = [0xff, 0xff, 0xff, 255];
const TURQUOISE = [0x3e, 0x96, 0x97, 255];
const BLUE = [0x00, 0x00, 0xa3, 255];
const RED = [0xff, 0x00, 0x00, 255];
const YELLOW = [0xff, 0xcc, 0x00, 255];
const TRANSPARENT = [0, 0, 0, 0];

function crc32(buf) {
    let c;
    const table = crc32.table || (crc32.table = (() => {
        const t = new Uint32Array(256);
        for (let n = 0; n < 256; n++) {
            c = n;
            for (let k = 0; k < 8; k++) {
                c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
            }
            t[n] = c >>> 0;
        }
        return t;
    })());
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
        crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function buildPNG(pixelColor) {
    const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    const ihdrData = Buffer.alloc(13);
    ihdrData.writeUInt32BE(SIZE, 0);
    ihdrData.writeUInt32BE(SIZE, 4);
    ihdrData[8] = 8;
    ihdrData[9] = 6;
    ihdrData[10] = 0;
    ihdrData[11] = 0;
    ihdrData[12] = 0;
    const ihdr = chunk('IHDR', ihdrData);

    const raw = Buffer.alloc(SIZE * (1 + SIZE * 4));
    let offset = 0;
    for (let y = 0; y < SIZE; y++) {
        raw[offset++] = 0;
        for (let x = 0; x < SIZE; x++) {
            const [r, g, b, a] = pixelColor(x, y);
            raw[offset++] = r;
            raw[offset++] = g;
            raw[offset++] = b;
            raw[offset++] = a;
        }
    }
    const idat = chunk('IDAT', zlib.deflateSync(raw));
    const iend = chunk('IEND', Buffer.alloc(0));
    return Buffer.concat([signature, ihdr, idat, iend]);
}

// --- Display: a monitor shape (screen + stand) ---
function displayPixel(x, y) {
    // Screen bezel: rows 4-20, cols 3-28
    if (y >= 4 && y <= 20 && x >= 3 && x <= 28) {
        const isEdge = y === 4 || y === 20 || x === 3 || x === 28;
        if (isEdge) return BLACK;
        if (y >= 6 && y <= 18 && x >= 5 && x <= 26) return TURQUOISE; // screen
        return DARK_GRAY; // bezel
    }
    // Stand
    if (y >= 21 && y <= 24 && x >= 14 && x <= 17) return DARK_GRAY;
    // Base
    if (y >= 25 && y <= 27 && x >= 9 && x <= 22) return DARK_GRAY;
    if (y === 25 || y === 27) {
        if (x >= 9 && x <= 22) return BLACK;
    }
    return TRANSPARENT;
}

// --- Personalization: a paintbrush/palette ---
function personalizationPixel(x, y) {
    const cx = 16, cy = 16;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    // Palette (circle) in the lower-left, brush diagonal upper-right
    if (dist < 11 && y > 10) {
        if (dist > 10) return BLACK;
        // paint blobs
        if (dx * dx + (dy - 3) * (dy - 3) < 6) return RED;
        if ((dx + 4) * (dx + 4) + dy * dy < 5) return BLUE;
        if ((dx - 4) * (dx - 4) + (dy + 2) * (dy + 2) < 5) return YELLOW;
        return LIGHT_GRAY;
    }
    // brush handle (diagonal line, upper right)
    const t = x - y; // diagonal coordinate
    if (t > 6 && t < 10 && x > 18 && x < 30 && y > 2 && y < 14) {
        return DARK_GRAY;
    }
    return TRANSPARENT;
}

// --- Sounds: a speaker ---
function soundsPixel(x, y) {
    // Speaker box (cols 6-14, rows 12-20)
    if (x >= 6 && x <= 14 && y >= 12 && y <= 20) {
        const isEdge = x === 6 || x === 14 || y === 12 || y === 20;
        return isEdge ? BLACK : DARK_GRAY;
    }
    // Speaker cone (triangle pointing right, cols 14-20)
    if (x >= 14 && x <= 22) {
        const half = (x - 14) * 0.9;
        if (Math.abs(y - 16) <= half) {
            const isEdge = Math.abs(y - 16) >= half - 1;
            return isEdge ? BLACK : DARK_GRAY;
        }
    }
    // Sound waves (arcs)
    for (let r = 0; r < 2; r++) {
        const radius = 4 + r * 3;
        const cx = 22, cy = 16;
        const dx = x - cx, dy = y - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > radius - 0.8 && dist < radius + 0.8 && x > cx && Math.abs(dy) < radius) {
            return BLACK;
        }
    }
    return TRANSPARENT;
}

// --- Time & Date: a clock face ---
function timePixel(x, y) {
    const cx = 15.5, cy = 15.5;
    const dx = x - cx, dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 13) return TRANSPARENT;
    if (dist > 12) return BLACK; // outline
    if (dist > 11) return LIGHT_GRAY;
    // Hour/minute hands
    if (x === Math.round(cx) && y >= 6 && y <= 16) return BLACK; // 12 o'clock hand
    if (y === Math.round(cy) && x >= 16 && x <= 21) return BLACK; // 3 o'clock hand
    // 12/3/6/9 tick marks
    if ((x === Math.round(cx) && (y <= 5 || y >= 26)) === false) {
        // no-op, ticks handled by ring edge naturally
    }
    return WHITE;
}

// --- Fonts: a stylized "A" ---
function fontsPixel(x, y) {
    // Card background
    if (x >= 2 && x <= 29 && y >= 2 && y <= 29) {
        const isEdge = x === 2 || x === 29 || y === 2 || y === 29;
        if (isEdge) return BLACK;
        // Draw a bold "A" using a simple triangular stroke test
        const lx = x - 16; // centered x
        const topY = 7, botY = 25;
        if (y >= topY && y <= botY) {
            const progress = (y - topY) / (botY - topY); // 0 at top, 1 at bottom
            const halfWidth = 2 + progress * 8; // widens going down
            const strokeWidth = 3;
            const onLeftStroke = Math.abs(lx + halfWidth) < strokeWidth;
            const onRightStroke = Math.abs(lx - halfWidth) < strokeWidth;
            const onCrossbar = y > 17 && y < 20 && Math.abs(lx) < halfWidth - 1;
            if (onLeftStroke || onRightStroke || onCrossbar) return BLACK;
        }
        return WHITE;
    }
    return TRANSPARENT;
}

const outDir = path.join(__dirname, '..', 'src', 'assets', 'icons');
const icons = {
    displayIcon: displayPixel,
    personalizationIcon: personalizationPixel,
    soundsIcon: soundsPixel,
    timeIcon: timePixel,
    fontsIcon: fontsPixel,
};

for (const [name, fn] of Object.entries(icons)) {
    const outPath = path.join(outDir, `${name}.png`);
    fs.writeFileSync(outPath, buildPNG(fn));
    console.log('Wrote', outPath);
}
```

- [ ] **Step 2: Run the script and verify each PNG**

```bash
cd inner
mkdir -p scripts
node scripts/generate-category-icons.js
node -e "
const fs = require('fs');
['displayIcon','personalizationIcon','soundsIcon','timeIcon','fontsIcon'].forEach((name) => {
  const buf = fs.readFileSync(\`src/assets/icons/\${name}.png\`);
  const sigOk = buf.slice(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  console.log(name, 'sig ok:', sigOk, 'w:', buf.readUInt32BE(16), 'h:', buf.readUInt32BE(20));
});
"
```

Expected: all 5 report `sig ok: true`, `w: 32 h: 32`.

- [ ] **Step 3: Visually check each icon**

Read each of the 5 PNGs and confirm they render as recognizable
(non-blank, non-malformed) glyphs matching their category: a monitor
shape, a paintbrush/palette, a speaker, a clock face, a bold "A". If any
icon renders as blank, malformed, or unrecognizable, fix that icon's pixel
function and regenerate before continuing — visual recognizability is the
actual acceptance bar here, not just "the PNG is technically valid."

- [ ] **Step 4: Register the 5 icons**

Read `inner/src/assets/icons/index.ts` first (current state — it has
grown since this plan was drafted). Add 5 imports and 5 map entries
following the file's existing exact pattern:

```ts
import displayIcon from './displayIcon.png';
import personalizationIcon from './personalizationIcon.png';
import soundsIcon from './soundsIcon.png';
import timeIcon from './timeIcon.png';
import fontsIcon from './fontsIcon.png';
```

```ts
    displayIcon: displayIcon,
    personalizationIcon: personalizationIcon,
    soundsIcon: soundsIcon,
    timeIcon: timeIcon,
    fontsIcon: fontsIcon,
```

- [ ] **Step 5: Type-check**

Run: `cd inner && npx tsc --noEmit` — no errors.

- [ ] **Step 6: Delete the throwaway script**

```bash
rm inner/scripts/generate-category-icons.js
rmdir inner/scripts 2>/dev/null || true
```

- [ ] **Step 7: Commit**

```bash
git add inner/src/assets/icons/displayIcon.png inner/src/assets/icons/personalizationIcon.png inner/src/assets/icons/soundsIcon.png inner/src/assets/icons/timeIcon.png inner/src/assets/icons/fontsIcon.png inner/src/assets/icons/index.ts
git commit -m "Add generated per-category Settings icons"
```

---

### Task 3: Personalization panel

**Files:**
- Create: `inner/src/components/settings/PersonalizationSettings.tsx`

**Interfaces:**
- Consumes: `useTheme`, `Theme` from `../../contexts/ThemeContext` (Task 1); `useNavigate` from `react-router-dom`.
- Produces: `PersonalizationSettings: React.FC` default export, consumed by `Settings.tsx` (Task 6).

- [ ] **Step 1: Create the component**

Mirror `inner/src/components/settings/DisplaySettings.tsx` exactly in
structure (read it first) — same `← Back` button, same heading/label
styling, same beveled-selection swatch technique — but with 2 large
labeled options instead of a color/image grid:

```tsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import Colors from '../../constants/colors';

export interface PersonalizationSettingsProps {}

const OPTIONS: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

const PersonalizationSettings: React.FC<PersonalizationSettingsProps> = () => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    return (
        <div style={styles.container}>
            <button
                className="site-button"
                style={styles.backButton}
                onClick={() => navigate('/')}
            >
                ← Back
            </button>
            <h3 style={styles.heading}>Personalization</h3>
            <p style={styles.label}>Theme</p>
            <div style={styles.grid}>
                {OPTIONS.map((option) => {
                    const selected = theme === option.value;
                    return (
                        <div
                            key={option.value}
                            onMouseDown={() => setTheme(option.value)}
                            style={Object.assign(
                                {},
                                styles.swatch,
                                selected && styles.swatchSelected
                            )}
                        >
                            <div
                                style={Object.assign({}, styles.swatchInner, {
                                    backgroundColor:
                                        option.value === 'light'
                                            ? Colors.white
                                            : Colors.black,
                                })}
                            />
                            <p style={styles.optionLabel}>{option.label}</p>
                        </div>
                    );
                })}
            </div>
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
        width: 72,
        flexDirection: 'column',
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 12,
        padding: 2,
        boxSizing: 'border-box',
        cursor: 'pointer',
        border: '2px solid transparent',
    },
    swatchSelected: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: `${Colors.black} ${Colors.white} ${Colors.white} ${Colors.black}`,
    },
    swatchInner: {
        width: 56,
        height: 40,
        border: `1px solid ${Colors.darkGray}`,
        boxSizing: 'border-box',
    },
    optionLabel: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        marginTop: 4,
    },
};

export default PersonalizationSettings;
```

Note: the `swatchSelected` border uses the same 4-value beveled-border
shorthand technique already reviewed and approved in
`DisplaySettings.tsx` (from the earlier wallpaper-picker polish fix,
commit `bc02565`) — read that file's current `swatchSelected` style first
and match its exact technique/colors rather than reinventing it, so the
two panels look visually consistent.

- [ ] **Step 2: Type-check**

Run: `cd inner && npx tsc --noEmit` — no errors.

- [ ] **Step 3: Commit**

```bash
git add inner/src/components/settings/PersonalizationSettings.tsx
git commit -m "Add Personalization settings panel with theme toggle"
```

---

### Task 4: Route Personalization + make Credits theme-reactive

**Files:**
- Modify: `inner/src/components/applications/Settings.tsx`
- Modify: `inner/src/components/applications/Credits.tsx`

**Interfaces:**
- Consumes: `PersonalizationSettings` (Task 3); `useTheme` from `../../contexts/ThemeContext` (Task 1).

- [ ] **Step 1: Add the Personalization route**

Read `inner/src/components/applications/Settings.tsx` first (current
state — it already has a `display` route from the earlier wallpaper
plan). Add the import and a new static route, following the same pattern
as `display`:

```ts
import PersonalizationSettings from '../settings/PersonalizationSettings';
```

```tsx
                    <Route
                        path="personalization"
                        element={<PersonalizationSettings />}
                    />
```

placed alongside the existing `display` route, both before the
`:category` catch-all.

- [ ] **Step 2: Make Credits.tsx theme-reactive**

Read `inner/src/components/applications/Credits.tsx` first (current
state). Add `useTheme()` and compute the credits background/text color
from it instead of the hardcoded values in `styles.credits`
(`backgroundColor: 'black', color: 'white'`):

```ts
import { useTheme } from '../../contexts/ThemeContext';
```

Inside the component function, near the other hooks:

```ts
    const { theme } = useTheme();
```

Change the credits `<div>`'s style from the static `styles.credits` to a
merged style reflecting the theme:

```tsx
            <div
                onMouseDown={nextSlide}
                className="site-page"
                style={Object.assign({}, styles.credits, {
                    backgroundColor: theme === 'dark' ? 'black' : 'white',
                    color: theme === 'dark' ? 'white' : 'black',
                })}
            >
```

Remove the now-redundant `backgroundColor`/`color` lines from
`styles.credits` itself (keep the rest of that style object —
`paddingTop`, `flexDirection`, etc. — unchanged), since they're now
supplied dynamically via the merge above.

- [ ] **Step 3: Type-check**

Run: `cd inner && npx tsc --noEmit` — no errors.

- [ ] **Step 4: Commit**

```bash
git add inner/src/components/applications/Settings.tsx inner/src/components/applications/Credits.tsx
git commit -m "Route Personalization panel and make Credits theme-reactive"
```

---

### Task 5: Restyle SettingsGrid/SettingsTile with per-category icons

**Files:**
- Modify: `inner/src/components/settings/categories.ts`
- Modify: `inner/src/components/settings/SettingsGrid.tsx`
- Modify: `inner/src/components/settings/SettingsTile.tsx`

**Interfaces:**
- Consumes: the 5 new icons (Task 2).
- Produces: `SettingsCategory` gains an `icon: IconName` field, consumed by `SettingsGrid.tsx`.

- [ ] **Step 1: Add per-category icons to the categories list**

Read `inner/src/components/settings/categories.ts` first (current state).
Add an `icon` field to the interface and each entry:

```ts
import { IconName } from '../../assets/icons';

export interface SettingsCategory {
    key: string;
    label: string;
    icon: IconName;
}

export const CATEGORIES: SettingsCategory[] = [
    { key: 'display', label: 'Display', icon: 'displayIcon' },
    { key: 'personalization', label: 'Personalization', icon: 'personalizationIcon' },
    { key: 'sounds', label: 'Sounds', icon: 'soundsIcon' },
    { key: 'time', label: 'Time & Date', icon: 'timeIcon' },
    { key: 'fonts', label: 'Fonts', icon: 'fontsIcon' },
];
```

- [ ] **Step 2: Use per-category icons in SettingsGrid**

Read `inner/src/components/settings/SettingsGrid.tsx` first (current
state — it currently hardcodes `icon="settingsIcon"` for every tile).
Change the `SettingsTile` usage to use each category's own icon:

```tsx
                <SettingsTile
                    key={category.key}
                    icon={category.icon}
                    label={category.label}
                    onClick={() => navigate(category.key)}
                />
```

- [ ] **Step 3: Enlarge the tile icons in SettingsTile**

Read `inner/src/components/settings/SettingsTile.tsx` first (current
state). Increase the icon render size from `32` to `40` (`<Icon icon={icon}
size={40} />`) and widen the tile slightly to accommodate (`styles.tile.width`
from `72` to `80`) so the grid reads closer to the reference screenshot's
chunkier icon-grid look, without otherwise changing the component's
structure or selection/hover behavior.

- [ ] **Step 4: Type-check**

Run: `cd inner && npx tsc --noEmit` — no errors.

- [ ] **Step 5: Commit**

```bash
git add inner/src/components/settings/categories.ts inner/src/components/settings/SettingsGrid.tsx inner/src/components/settings/SettingsTile.tsx
git commit -m "Restyle Settings grid with per-category icons"
```

---

### Task 6: Wire ThemeProvider into Desktop

**Files:**
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- Consumes: `ThemeProvider` from `../../contexts/ThemeContext` (Task 1).

- [ ] **Step 1: Add the import and wrap the tree**

Read `inner/src/components/os/Desktop.tsx` first (current state — it
already wraps `WallpaperProvider` around `WindowManagerProvider` from the
earlier wallpaper plan). Add:

```ts
import { ThemeProvider } from '../../contexts/ThemeContext';
```

Wrap `ThemeProvider` around the existing `WallpaperProvider` (outermost),
so it's a sibling ancestor available to every window's content the same
way `WallpaperProvider` already is:

```tsx
const Desktop: React.FC<DesktopProps> = () => {
    return (
        <ThemeProvider>
            <WallpaperProvider>
                <WindowManagerProvider>
                    <DesktopInner />
                </WindowManagerProvider>
            </WallpaperProvider>
        </ThemeProvider>
    );
};
```

- [ ] **Step 2: Type-check**

Run: `cd inner && npx tsc --noEmit` — no errors.

- [ ] **Step 3: Commit**

```bash
git add inner/src/components/os/Desktop.tsx
git commit -m "Wire ThemeProvider into Desktop"
```

---

### Task 7: End-to-end verification

**Files:** none (verification only).

**Interfaces:** none — exercises the full path built by Tasks 1-6.

- [ ] **Step 1: Production build**

Run: `cd inner && npm run build` — expect `Compiled successfully`.

- [ ] **Step 2: Start the dev server and verify the Settings grid**

Run `cd inner && npm start`, open `localhost:3000`. Open Settings.
Confirm: 5 tiles, each with its own distinct icon (not all the same gear
icon), labels underneath, readable and non-overlapping at the window's
default size.

- [ ] **Step 3: Verify Personalization**

Click Personalization. Confirm: `← Back`, heading, "Light"/"Dark" swatches,
Light selected by default (highlighted). Click Dark — it becomes
highlighted instead.

- [ ] **Step 4: Verify Credits theme reactivity**

With theme set to Light, open Credits (separately from Settings — it's its
own desktop icon). Confirm Credits now renders **white background, black
text** (previously always black). Close Credits. Go back to Settings →
Personalization → click Dark. Reopen Credits — confirm it now renders
**black background, white text** (the original look). If Credits was
already open when the theme was changed, confirm it updates live without
needing to be reopened (since it reads from the same shared context).

- [ ] **Step 5: Verify persistence**

Reload the page. Confirm the previously-selected theme persists (Personalization
shows the same option highlighted, Credits renders in the matching colors).

- [ ] **Step 6: Regression check**

Confirm Display (wallpaper picker) still works exactly as before this
plan's changes, and Sounds/Time & Date/Fonts still show "Coming soon."

- [ ] **Step 7: Final status check**

```bash
cd D:\Prog\Portfolio
git status
git log --oneline -10
```

Expected: working tree clean aside from intentionally-untracked items, a
commit for each of Tasks 1-6 in the log.

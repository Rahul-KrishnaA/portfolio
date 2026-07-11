# Control Panel Explorer Chrome Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add authentic Win98 Explorer-style chrome (menu bar, toolbar, address bar, status bar) to the Settings app, matching a reference Control Panel screenshot.

**Architecture:** 6 new toolbar icons generated via the established zlib/PNG script pattern. One new `ExplorerChrome.tsx` component (menu bar + toolbar + address bar), rendered inside `Settings.tsx`'s existing `<Router>` so it can drive Back/Up navigation via `useLocation`/`useNavigate`. Status bar reuses `Window`'s existing `bottomLeftText` prop — no changes to `Window.tsx`.

**Tech Stack:** React 17, TypeScript, `react-router-dom` (already a dependency), no new packages.

## Global Constraints

- Match existing code style: inline `style={...}` via `StyleSheetCSS`, `React.FC<Props>`, `Colors` from `inner/src/constants/colors.ts`.
- No test framework — verification is `cd inner && npx tsc --noEmit` (+ `npm run build` on the final task) plus manual dev-server checks.
- Do not modify `outer/`. No new UI library/CSS framework.
- Do not modify `inner/src/components/os/Window.tsx` — reuse its existing `bottomLeftText` prop for the status bar rather than rebuilding window chrome.
- Cut/Copy/Paste are always disabled (no selection concept in this app — this matches real Explorer behavior with nothing selected, not a shortcut). Forward is always disabled. Back/Up are enabled only when not at the grid root (`location.pathname !== '/'`).
- Only "File" in the menu bar has a real action (Close, wired to the actual window close handler). Edit/View/Go/Favorites/Help are hover-highlightable but non-functional — do not fabricate fake behavior for them.
- The desktop icon / taskbar label for this app stays "Settings" (set elsewhere, in `Desktop.tsx`'s `APPLICATIONS` registry) — only the in-window title bar text changes to "Control Panel".
- **Before running any `git commit`, this session has pre-authorized the task-by-task commit workflow** (same as prior plans this session) — proceed without asking.

---

### Task 1: Generate 6 toolbar icons

**Files:**
- Create: `inner/src/assets/icons/backIcon.png`, `forwardIcon.png`, `upIcon.png`, `cutIcon.png`, `copyIcon.png`, `pasteIcon.png`
- Create (temporary, delete after use): `inner/scripts/generate-toolbar-icons.js`
- Modify: `inner/src/assets/icons/index.ts`

**Interfaces:**
- Produces: 6 new `IconName` values, consumed by `ExplorerChrome.tsx` (Task 2).

- [ ] **Step 1: Write one script generating all 6 icons**

Use the same zlib/PNG-building helpers established in this codebase (crc32,
chunk, buildPNG — same boilerplate as `generate-category-icons.js` earlier
in this project's history; you can find that exact boilerplate via `git
log --all --oneline | grep -i icon` and `git show <sha>` for reference if
useful). Size: 16x16 (toolbar icons read smaller than the 32x32 window/
category icons already in this codebase). Flat, 1px black outline where it
reads clearly at this size (a full outline may be too heavy at 16px —
use judgment, prioritize recognizability over rigid style-matching).

Draw:
- **backIcon**: a left-pointing arrow/chevron.
- **forwardIcon**: a right-pointing arrow/chevron (mirror of back).
- **upIcon**: an up-pointing arrow, optionally over a small folder-tab
  shape (classic "up one level" glyph), but a plain clean up-arrow is
  acceptable if a folder+arrow combo doesn't render clearly at 16px —
  recognizability over literal accuracy.
- **cutIcon**: a pair of open scissors (two diagonal blades crossing near
  a pivot point).
- **copyIcon**: two overlapping small rectangles (the classic "duplicate
  page" glyph).
- **pasteIcon**: a clipboard shape (rectangle with a small tab/clip at
  top).

**The acceptance bar is visual recognizability at 16x16, not literal
accuracy.** After generating each icon, actually view the PNG file and
judge whether it reads as its intended concept. If any icon is
unrecognizable noise, revise its pixel-drawing function and regenerate —
expect to iterate, the same way `personalizationIcon`'s first attempt in
an earlier task needed a full redesign after failing this same bar.

- [ ] **Step 2: Run the script and verify each PNG**

```bash
cd inner
mkdir -p scripts
node scripts/generate-toolbar-icons.js
node -e "
const fs = require('fs');
['backIcon','forwardIcon','upIcon','cutIcon','copyIcon','pasteIcon'].forEach((name) => {
  const buf = fs.readFileSync(\`src/assets/icons/\${name}.png\`);
  const sigOk = buf.slice(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  console.log(name, 'sig ok:', sigOk, 'w:', buf.readUInt32BE(16), 'h:', buf.readUInt32BE(20));
});
"
```

Expected: all 6 report `sig ok: true`, `w: 16 h: 16`.

- [ ] **Step 3: Visually check each icon**

Read each of the 6 PNGs and confirm they render as recognizable glyphs.
Iterate on any that don't (see Step 1's acceptance bar).

- [ ] **Step 4: Register the 6 icons**

Read `inner/src/assets/icons/index.ts` first (current state). Add 6
imports and 6 map entries following the file's existing exact pattern.

- [ ] **Step 5: Type-check**

Run: `cd inner && npx tsc --noEmit` — no errors.

- [ ] **Step 6: Delete the throwaway script**

```bash
rm inner/scripts/generate-toolbar-icons.js
rmdir inner/scripts 2>/dev/null || true
```

- [ ] **Step 7: Commit**

```bash
git add inner/src/assets/icons/backIcon.png inner/src/assets/icons/forwardIcon.png inner/src/assets/icons/upIcon.png inner/src/assets/icons/cutIcon.png inner/src/assets/icons/copyIcon.png inner/src/assets/icons/pasteIcon.png inner/src/assets/icons/index.ts
git commit -m "Add toolbar icons for Control Panel chrome"
```

---

### Task 2: ExplorerChrome component

**Files:**
- Create: `inner/src/components/settings/ExplorerChrome.tsx`

**Interfaces:**
- Consumes: `useLocation`, `useNavigate` from `react-router-dom`; the 6 new icons (Task 1); `settingsIcon` (existing, for the address bar); `Icon` from `../general`; `Colors` from `../../constants/colors`.
- Produces: `ExplorerChrome: React.FC<{ onClose: () => void }>` default export, consumed by `Settings.tsx` (Task 3). Must be rendered as a descendant of a `react-router-dom` `<Router>` (it calls `useLocation`/`useNavigate` itself), as a sibling above `<Routes>`, not inside any specific `<Route>`.

- [ ] **Step 1: Create the component**

Read `inner/src/components/os/Window.tsx` first for the existing
`insetBorder` bevel technique to reuse for the address bar's sunken box.
Read `inner/src/components/settings/DisplaySettings.tsx` for the general
`StyleSheetCSS` conventions already established for this app's settings
components.

```tsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../general';
import Colors from '../../constants/colors';

export interface ExplorerChromeProps {
    onClose: () => void;
}

const MENU_ITEMS = ['File', 'Edit', 'View', 'Go', 'Favorites', 'Help'];

const ExplorerChrome: React.FC<ExplorerChromeProps> = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const atRoot = location.pathname === '/' || location.pathname === '';
    const canGoBack = !atRoot;

    const goBack = () => {
        if (canGoBack) navigate('/');
    };

    return (
        <div style={styles.container}>
            <div style={styles.menuBar}>
                {MENU_ITEMS.map((item) => (
                    <div
                        key={item}
                        style={styles.menuItemWrapper}
                        onMouseEnter={() =>
                            item === 'File' && setOpenMenu(item)
                        }
                        onMouseLeave={() => setOpenMenu(null)}
                    >
                        <p
                            style={Object.assign(
                                {},
                                styles.menuItem,
                                openMenu === item && styles.menuItemActive
                            )}
                            onMouseDown={() =>
                                setOpenMenu(openMenu === item ? null : item)
                            }
                        >
                            {item}
                        </p>
                        {item === 'File' && openMenu === 'File' && (
                            <div style={styles.menuDropdown}>
                                <div
                                    style={styles.menuDropdownItem}
                                    onMouseDown={() => {
                                        setOpenMenu(null);
                                        onClose();
                                    }}
                                >
                                    <p>Close</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div style={styles.toolbar}>
                <button
                    style={styles.toolbarButton}
                    disabled={!canGoBack}
                    onMouseDown={goBack}
                >
                    <Icon icon="backIcon" size={16} />
                    <p style={styles.toolbarLabel}>Back</p>
                </button>
                <button style={styles.toolbarButton} disabled>
                    <Icon icon="forwardIcon" size={16} />
                    <p style={styles.toolbarLabel}>Forward</p>
                </button>
                <button
                    style={styles.toolbarButton}
                    disabled={!canGoBack}
                    onMouseDown={goBack}
                >
                    <Icon icon="upIcon" size={16} />
                    <p style={styles.toolbarLabel}>Up</p>
                </button>
                <div style={styles.toolbarSeparator} />
                <button style={styles.toolbarButton} disabled>
                    <Icon icon="cutIcon" size={16} />
                    <p style={styles.toolbarLabel}>Cut</p>
                </button>
                <button style={styles.toolbarButton} disabled>
                    <Icon icon="copyIcon" size={16} />
                    <p style={styles.toolbarLabel}>Copy</p>
                </button>
                <button style={styles.toolbarButton} disabled>
                    <Icon icon="pasteIcon" size={16} />
                    <p style={styles.toolbarLabel}>Paste</p>
                </button>
            </div>
            <div style={styles.addressBarRow}>
                <p style={styles.addressLabel}>Address</p>
                <div style={styles.addressBox}>
                    <Icon
                        icon="settingsIcon"
                        size={16}
                        style={styles.addressIcon}
                    />
                    <p style={styles.addressText}>Control Panel</p>
                    <p style={styles.addressArrow}>▾</p>
                </div>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flexDirection: 'column',
        borderBottom: `1px solid ${Colors.darkGray}`,
        backgroundColor: Colors.lightGray,
    },
    menuBar: {
        flexDirection: 'row',
        padding: '2px 4px',
    },
    menuItemWrapper: {
        position: 'relative',
    },
    menuItem: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        padding: '2px 6px',
        cursor: 'default',
    },
    menuItemActive: {
        backgroundColor: Colors.blue,
        color: Colors.white,
    },
    menuDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        minWidth: 100,
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        backgroundColor: Colors.lightGray,
        zIndex: 10,
    },
    menuDropdownItem: {
        padding: '4px 8px',
        fontFamily: 'MSSerif',
        fontSize: 12,
        cursor: 'default',
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: '2px 4px',
        borderTop: `1px solid ${Colors.white}`,
    },
    toolbarButton: {
        flexDirection: 'column',
        alignItems: 'center',
        border: 'none',
        background: 'none',
        padding: '2px 6px',
        cursor: 'pointer',
    },
    toolbarLabel: {
        fontFamily: 'MSSerif',
        fontSize: 10,
        marginTop: 2,
    },
    toolbarSeparator: {
        width: 1,
        height: 24,
        backgroundColor: Colors.darkGray,
        marginLeft: 4,
        marginRight: 4,
    },
    addressBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: '2px 4px',
        borderTop: `1px solid ${Colors.white}`,
    },
    addressLabel: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        marginRight: 6,
    },
    addressBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        backgroundColor: Colors.white,
        padding: '2px 4px',
    },
    addressIcon: {
        marginRight: 4,
    },
    addressText: {
        flex: 1,
        fontFamily: 'MSSerif',
        fontSize: 12,
    },
    addressArrow: {
        fontSize: 10,
    },
};

export default ExplorerChrome;
```

Note: `<button>` elements are `disabled` for Forward/Cut/Copy/Paste, and
conditionally `disabled` for Back/Up — confirm this actually visually
greys them out given this codebase's global CSS (check `inner/src/
index.css` for any `button` styling that might override the native
disabled look; if disabled buttons don't look visually greyed, add
`opacity: 0.4` to `toolbarButton` conditionally via a `disabled` style
variant, following the `Object.assign` conditional-style pattern already
used throughout this app).

- [ ] **Step 2: Type-check**

Run: `cd inner && npx tsc --noEmit` — no errors.

- [ ] **Step 3: Commit**

```bash
git add inner/src/components/settings/ExplorerChrome.tsx
git commit -m "Add Explorer-style chrome for Control Panel"
```

---

### Task 3: Wire ExplorerChrome into Settings.tsx

**Files:**
- Modify: `inner/src/components/applications/Settings.tsx`

**Interfaces:**
- Consumes: `ExplorerChrome` (Task 2), `CATEGORIES` from `../settings/categories` (existing).

- [ ] **Step 1: Update Settings.tsx**

Read the current file first (shown above in this session — verify it
still matches). Add the import and wire `ExplorerChrome` as a sibling
above `<Routes>`, inside the same `<Router>`; change `windowTitle`,
window size, and `bottomLeftText`:

```tsx
import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Window from '../os/Window';
import SettingsGrid from '../settings/SettingsGrid';
import SettingsCategoryPlaceholder from '../settings/SettingsCategoryPlaceholder';
import DisplaySettings from '../settings/DisplaySettings';
import PersonalizationSettings from '../settings/PersonalizationSettings';
import ExplorerChrome from '../settings/ExplorerChrome';
import { CATEGORIES } from '../settings/categories';

export interface SettingsProps extends WindowAppProps {}

const Settings: React.FC<SettingsProps> = (props) => {
    return (
        <Window
            top={80}
            left={80}
            width={520}
            height={420}
            windowTitle="Control Panel"
            windowBarIcon="settingsIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${CATEGORIES.length} object(s)`}
        >
            <Router>
                <ExplorerChrome onClose={props.onClose} />
                <Routes>
                    <Route path="/" element={<SettingsGrid />} />
                    <Route path="display" element={<DisplaySettings />} />
                    <Route
                        path="personalization"
                        element={<PersonalizationSettings />}
                    />
                    <Route
                        path=":category"
                        element={<SettingsCategoryPlaceholder />}
                    />
                </Routes>
            </Router>
        </Window>
    );
};

export default Settings;
```

- [ ] **Step 2: Type-check**

Run: `cd inner && npx tsc --noEmit` — no errors.

- [ ] **Step 3: Commit**

```bash
git add inner/src/components/applications/Settings.tsx
git commit -m "Wire Control Panel chrome into Settings window"
```

---

### Task 4: End-to-end verification

**Files:** none (verification only).

**Interfaces:** none — exercises the full path built by Tasks 1-3.

- [ ] **Step 1: Production build**

Run: `cd inner && npm run build` — expect `Compiled successfully`.

- [ ] **Step 2: Start the dev server and verify visually**

Run `cd inner && npm start`, open `localhost:3000`. Open Settings.
Confirm: title bar reads "Control Panel", menu bar shows File/Edit/View/
Go/Favorites/Help, toolbar shows Back/Forward/Up/Cut/Copy/Paste icon
buttons with a separator between the two groups, address bar shows the
settings icon + "Control Panel" text, status bar shows "5 object(s)"
(left) — compare the overall layout against the reference screenshot.

- [ ] **Step 3: Verify toolbar behavior**

At the grid root: confirm Back and Up appear visually disabled/greyed
and clicking them does nothing. Click into any category (e.g. Display).
Confirm Back and Up now appear enabled, and clicking either returns to
the grid. Confirm Forward, Cut, Copy, Paste are always visually disabled
regardless of location.

- [ ] **Step 4: Verify File → Close**

Click "File" in the menu bar — confirm a dropdown appears with "Close".
Click it — confirm the Settings window actually closes.

- [ ] **Step 5: Regression check**

Confirm all 5 category panels (Display wallpaper picker, Personalization
theme toggle, and the 3 remaining placeholders) still work exactly as
before this plan's changes. Confirm other apps (My Details, Credits,
Games from the Start Menu) are unaffected.

- [ ] **Step 6: Final status check**

```bash
cd D:\Prog\Portfolio
git status
git log --oneline -8
```

Expected: working tree clean aside from intentionally-untracked items, a
commit for each of Tasks 1-3 in the log.

# Certificate Viewer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let certificates on the Certifications page open as their own taskbar-visible desktop windows (with zoom + scroll), alongside a separate real file-download button.

**Architecture:** Introduce a `WindowManagerContext` so any component nested inside the simulated desktop (not just direct children of `Desktop.tsx`) can open/focus/close top-level windows. Add a generic `CertificateViewer` window app that renders PDFs via `react-pdf` (continuous vertical scroll, button-driven zoom) or images via a scaled `<img>`. Wire `Certifications.tsx`'s new "View" button to it; "Download" becomes a real `<a download>`.

**Tech Stack:** React 17, TypeScript 4.6, Create React App (react-scripts 5 / webpack 5), `react-pdf` (new dependency, pulls in `pdfjs-dist`).

## Global Constraints

- Codebase has no existing component test suite (`inner/src/**/*.test.*` — none found); verification is manual via `npm start` in a browser, plus `tsc --noEmit` as an automated compile gate per task. Do not introduce a new test framework.
- All new UI must follow the existing retro-OS visual language: use the `.site-button` CSS class for buttons, `Window` component for chrome, and the pixelated 32×32 icon style.
- Global CSS rule `div { display: flex }` (`inner/src/App.css:18`) means style objects can use `flexDirection`/`alignItems`/etc. on plain divs without setting `display: flex` explicitly — follow this existing convention.
- Each task commits its own changes locally as it's completed and reviewed (normal git hygiene, needed so per-task reviews can diff commit ranges). These are local checkpoint commits only, not a "feature is done" signal. Per user instruction: do **not** push to the remote or deploy at all until the full feature has been locally verified end-to-end in the browser (Task 7) — stop after Task 7's local commit and let the user decide on push/deploy.
- `inner/tsconfig.json` has `skipLibCheck: true` and `module: esnext` already set (required for `react-pdf`'s types and for `import.meta.url` worker setup) — do not change these.

---

### Task 1: Add `react-pdf` dependency

**Files:**
- Modify: `inner/package.json`

**Interfaces:**
- Produces: `react-pdf` package (version `10.4.1`, includes `pdfjs-dist@4.8.69` as a transitive dependency) available for import in later tasks as `import { Document, Page, pdfjs } from 'react-pdf';`.

- [ ] **Step 1: Install the dependency**

Run:
```bash
cd inner
npm install react-pdf@10.4.1
```
Expected: `package.json` gains `"react-pdf": "^10.4.1"` (or exact `"10.4.1"`, whatever npm writes) under `dependencies`, and `package-lock.json` updates. No peer dependency errors (react-pdf 10.4.1 supports `react@^17.0.0`, which this project uses).

- [ ] **Step 2: Verify the project still builds**

Run:
```bash
cd inner
npx tsc --noEmit -p tsconfig.json
```
Expected: no errors (this only checks types; `react-pdf` isn't imported anywhere yet, so this is really just confirming the install didn't break anything).

- [ ] **Step 3: Commit**

```bash
cd "D:/Prog/Portfolio"
git add inner/package.json inner/package-lock.json
git commit -m "Add react-pdf dependency for in-app certificate viewing"
```

---

### Task 2: Add the generic file-document icon

**Files:**
- Create: `inner/src/assets/icons/fileIcon.png` (already created earlier in this session — a 32×32 pixelated document icon with a folded top-right corner and text lines, matching the existing icon set's style)
- Modify: `inner/src/assets/icons/index.ts`

**Interfaces:**
- Produces: `IconName` union gains `'fileIcon'`, usable anywhere `<Icon icon="fileIcon" />` is valid, and as the `shortcutIcon`/`windowBarIcon` value for certificate windows in later tasks.

- [ ] **Step 1: Verify the icon file exists**

Run:
```bash
ls -la "inner/src/assets/icons/fileIcon.png"
```
Expected: file exists (32×32 PNG, already generated). If missing, regenerate with:
```bash
python -c "
from PIL import Image, ImageDraw
W = H = 32
im = Image.new('RGBA', (W, H), (0,0,0,0))
d = ImageDraw.Draw(im)
black = (0,0,0,255); white = (255,255,255,255)
ltgray = (192,192,192,255); dkgray = (128,128,128,255)
fold = 8
page_pts = [(6,2),(24-fold,2),(26,4+fold-2),(26,30),(6,30)]
d.polygon(page_pts, fill=white, outline=black)
fold_pts = [(24-fold,2),(26,4+fold-2),(24-fold,4+fold-2)]
d.polygon(fold_pts, fill=ltgray, outline=black)
for y in [10,13,16,19,22,25]:
    d.line([(9,y),(23,y)], fill=dkgray, width=1)
im.save('inner/src/assets/icons/fileIcon.png')
"
```

- [ ] **Step 2: Register the icon**

Read `inner/src/assets/icons/index.ts` first (to get exact current line numbers), then apply this edit — add the import after the `close` import (line 20) and the map entry after the `close` entry (line 36):

```ts
import close from './close.png';
import fileIcon from './fileIcon.png';
```

```ts
    close: close,
    fileIcon: fileIcon,
```

The full modified file should read:

```ts
import React from 'react';

import windowResize from './windowResize.png';
import maximize from './maximize.png';
import minimize from './minimize.png';
import computerBig from './computerBig.png';
import computerSmall from './computerSmall.png';
import myComputer from './myComputer.png';
import showcaseIcon from './showcaseIcon.png';
import doomIcon from './doomIcon.png';
import henordleIcon from './henordleIcon.png';
import credits from './credits.png';
import volumeOn from './volumeOn.png';
import volumeOff from './volumeOff.png';
import trailIcon from './trailIcon.png';
import windowGameIcon from './windowGameIcon.png';
import windowExplorerIcon from './windowExplorerIcon.png';
import windowsStartIcon from './windowsStartIcon.png';
import scrabbleIcon from './scrabbleIcon.png';
import close from './close.png';
import fileIcon from './fileIcon.png';

const icons = {
    windowResize: windowResize,
    maximize: maximize,
    minimize: minimize,
    computerBig: computerBig,
    computerSmall: computerSmall,
    myComputer: myComputer,
    showcaseIcon: showcaseIcon,
    doomIcon: doomIcon,
    volumeOn: volumeOn,
    volumeOff: volumeOff,
    credits: credits,
    scrabbleIcon: scrabbleIcon,
    henordleIcon: henordleIcon,
    close: close,
    fileIcon: fileIcon,
    windowGameIcon: windowGameIcon,
    windowExplorerIcon: windowExplorerIcon,
    windowsStartIcon: windowsStartIcon,
    trailIcon: trailIcon,
};

export type IconName = keyof typeof icons;

const getIconByName = (
    iconName: IconName
    // @ts-ignore
): React.FC<React.SVGAttributes<SVGElement>> => icons[iconName];

export default getIconByName;
```

- [ ] **Step 3: Verify it compiles**

Run:
```bash
cd inner
npx tsc --noEmit -p tsconfig.json
```
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd "D:/Prog/Portfolio"
git add inner/src/assets/icons/fileIcon.png inner/src/assets/icons/index.ts
git commit -m "Add generic file-document icon for file-viewer windows"
```

---

### Task 3: Create `WindowManagerContext`

**Files:**
- Create: `inner/src/contexts/WindowManagerContext.tsx`

**Interfaces:**
- Consumes: global types `DesktopWindows` and nothing else (both declared ambiently in `inner/src/constants/Types.d.ts`, no import needed); `IconName` from `inner/src/assets/icons`.
- Produces:
  - `WindowManagerProvider: React.FC` — wraps a subtree, owns all window state.
  - `useWindowManager(): WindowManagerContextValue` — hook, throws if used outside the provider.
  - `WindowManagerContextValue` shape:
    ```ts
    interface WindowManagerContextValue {
        windows: DesktopWindows;
        openWindow: (key: string, name: string, icon: IconName, element: JSX.Element) => void;
        focusWindow: (key: string) => void;
        closeWindow: (key: string) => void;
        minimizeWindow: (key: string) => void;
        toggleMinimize: (key: string) => void;
        resetWindows: () => void;
    }
    ```
  - `openWindow` is idempotent by `key`: if a window with that key already exists, it just calls the same logic as `focusWindow` (bring to front, un-minimize) instead of creating a duplicate entry.

- [ ] **Step 1: Create the context file**

Create `inner/src/contexts/WindowManagerContext.tsx`:

```tsx
import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from 'react';
import { IconName } from '../assets/icons';

export interface WindowManagerContextValue {
    windows: DesktopWindows;
    openWindow: (
        key: string,
        name: string,
        icon: IconName,
        element: JSX.Element
    ) => void;
    focusWindow: (key: string) => void;
    closeWindow: (key: string) => void;
    minimizeWindow: (key: string) => void;
    toggleMinimize: (key: string) => void;
    resetWindows: () => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
    null
);

export const WindowManagerProvider: React.FC = ({ children }) => {
    const [windows, setWindows] = useState<DesktopWindows>({});

    const getHighestZIndex = useCallback((): number => {
        let highestZIndex = 0;
        Object.keys(windows).forEach((key) => {
            const w = windows[key];
            if (w && w.zIndex > highestZIndex) highestZIndex = w.zIndex;
        });
        return highestZIndex;
    }, [windows]);

    const closeWindow = useCallback((key: string) => {
        setTimeout(() => {
            setWindows((prevWindows) => {
                const newWindows = { ...prevWindows };
                delete newWindows[key];
                return newWindows;
            });
        }, 100);
    }, []);

    const minimizeWindow = useCallback((key: string) => {
        setWindows((prevWindows) => {
            if (!prevWindows[key]) return prevWindows;
            const newWindows = { ...prevWindows };
            newWindows[key] = { ...newWindows[key], minimized: true };
            return newWindows;
        });
    }, []);

    const toggleMinimize = useCallback(
        (key: string) => {
            const newWindows = { ...windows };
            if (!newWindows[key]) return;
            const highestIndex = getHighestZIndex();
            let minimized = newWindows[key].minimized;
            if (minimized || newWindows[key].zIndex === highestIndex) {
                minimized = !minimized;
            }
            newWindows[key] = {
                ...newWindows[key],
                minimized,
                zIndex: getHighestZIndex() + 1,
            };
            setWindows(newWindows);
        },
        [windows, getHighestZIndex]
    );

    const focusWindow = useCallback(
        (key: string) => {
            setWindows((prevWindows) => {
                if (!prevWindows[key]) return prevWindows;
                return {
                    ...prevWindows,
                    [key]: {
                        ...prevWindows[key],
                        zIndex: getHighestZIndex() + 1,
                        minimized: false,
                    },
                };
            });
        },
        [getHighestZIndex]
    );

    const openWindow = useCallback(
        (key: string, name: string, icon: IconName, element: JSX.Element) => {
            setWindows((prevWindows) => {
                if (prevWindows[key]) {
                    return {
                        ...prevWindows,
                        [key]: {
                            ...prevWindows[key],
                            zIndex: getHighestZIndex() + 1,
                            minimized: false,
                        },
                    };
                }
                return {
                    ...prevWindows,
                    [key]: {
                        zIndex: getHighestZIndex() + 1,
                        minimized: false,
                        component: element,
                        name,
                        icon,
                    },
                };
            });
        },
        [getHighestZIndex]
    );

    const resetWindows = useCallback(() => {
        setWindows({});
    }, []);

    return (
        <WindowManagerContext.Provider
            value={{
                windows,
                openWindow,
                focusWindow,
                closeWindow,
                minimizeWindow,
                toggleMinimize,
                resetWindows,
            }}
        >
            {children}
        </WindowManagerContext.Provider>
    );
};

export function useWindowManager(): WindowManagerContextValue {
    const ctx = useContext(WindowManagerContext);
    if (!ctx) {
        throw new Error(
            'useWindowManager must be used within a WindowManagerProvider'
        );
    }
    return ctx;
}
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd inner
npx tsc --noEmit -p tsconfig.json
```
Expected: no errors. (Nothing imports this file yet, so this just checks the new file itself is well-typed.)

- [ ] **Step 3: Commit**

```bash
cd "D:/Prog/Portfolio"
git add inner/src/contexts/WindowManagerContext.tsx
git commit -m "Add WindowManagerContext for opening top-level windows from nested pages"
```

---

### Task 4: Refactor `Desktop.tsx` to use `WindowManagerContext`

**Files:**
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- Consumes: `WindowManagerProvider`, `useWindowManager` from `../../contexts/WindowManagerContext` (Task 3).
- Produces: no external interface change — `Desktop` still renders the same way. This task must not change existing behavior (shortcuts, taskbar, minimize/restore, shutdown/reboot prank) — it only relocates state into the context so Task 6 can reach it from deeper in the tree.

- [ ] **Step 1: Replace the file contents**

Read `inner/src/components/os/Desktop.tsx` first to confirm current line numbers, then replace the entire file with:

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import Colors from '../../constants/colors';
import ShowcaseExplorer from '../applications/ShowcaseExplorer';
import ShutdownSequence from './ShutdownSequence';
import Toolbar from './Toolbar';
import DesktopShortcut, { DesktopShortcutProps } from './DesktopShortcut';
import { IconName } from '../../assets/icons';
import Credits from '../applications/Credits';
import {
    WindowManagerProvider,
    useWindowManager,
} from '../../contexts/WindowManagerContext';

export interface DesktopProps {}

type ExtendedWindowAppProps<T> = T & WindowAppProps;

const APPLICATIONS: {
    [key in string]: {
        key: string;
        name: string;
        shortcutIcon: IconName;
        component: React.FC<ExtendedWindowAppProps<any>>;
    };
} = {
    showcase: {
        key: 'showcase',
        name: 'My Details',
        shortcutIcon: 'showcaseIcon',
        component: ShowcaseExplorer,
    },
    credits: {
        key: 'credits',
        name: 'Credits',
        shortcutIcon: 'credits',
        component: Credits,
    },
};

const Desktop: React.FC<DesktopProps> = () => {
    return (
        <WindowManagerProvider>
            <DesktopInner />
        </WindowManagerProvider>
    );
};

const DesktopInner: React.FC = () => {
    const {
        windows,
        openWindow,
        focusWindow,
        closeWindow,
        minimizeWindow,
        toggleMinimize,
        resetWindows,
    } = useWindowManager();

    const [shortcuts, setShortcuts] = useState<DesktopShortcutProps[]>([]);
    const [shutdown, setShutdown] = useState(false);
    const [numShutdowns, setNumShutdowns] = useState(1);

    const rebootDesktop = useCallback(() => {
        resetWindows();
    }, [resetWindows]);

    useEffect(() => {
        if (shutdown === true) {
            rebootDesktop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shutdown]);

    useEffect(() => {
        const newShortcuts: DesktopShortcutProps[] = [];
        Object.keys(APPLICATIONS).forEach((key) => {
            const app = APPLICATIONS[key];
            newShortcuts.push({
                shortcutName: app.name,
                icon: app.shortcutIcon,
                onOpen: () => {
                    openWindow(
                        app.key,
                        app.name,
                        app.shortcutIcon,
                        <app.component
                            onInteract={() => focusWindow(app.key)}
                            onMinimize={() => minimizeWindow(app.key)}
                            onClose={() => closeWindow(app.key)}
                            key={app.key}
                        />
                    );
                },
            });
        });

        newShortcuts.forEach((shortcut) => {
            if (shortcut.shortcutName === 'My Details') {
                shortcut.onOpen();
            }
        });

        setShortcuts(newShortcuts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startShutdown = useCallback(() => {
        setTimeout(() => {
            setShutdown(true);
            setNumShutdowns(numShutdowns + 1);
        }, 600);
    }, [numShutdowns]);

    return !shutdown ? (
        <div style={styles.desktop}>
            {Object.keys(windows).map((key) => {
                const element = windows[key].component;
                if (!element) return <div key={`win-${key}`}></div>;
                return (
                    <div
                        key={`win-${key}`}
                        style={Object.assign(
                            {},
                            { zIndex: windows[key].zIndex },
                            windows[key].minimized && styles.minimized
                        )}
                    >
                        {React.cloneElement(element, {
                            key,
                            onInteract: () => focusWindow(key),
                            onClose: () => closeWindow(key),
                        })}
                    </div>
                );
            })}
            <div style={styles.shortcuts}>
                {shortcuts.map((shortcut, i) => {
                    return (
                        <div
                            style={Object.assign({}, styles.shortcutContainer, {
                                top: i * 104,
                            })}
                            key={shortcut.shortcutName}
                        >
                            <DesktopShortcut
                                icon={shortcut.icon}
                                shortcutName={shortcut.shortcutName}
                                onOpen={shortcut.onOpen}
                            />
                        </div>
                    );
                })}
            </div>
            <Toolbar
                windows={windows}
                toggleMinimize={toggleMinimize}
                shutdown={startShutdown}
            />
        </div>
    ) : (
        <ShutdownSequence
            setShutdown={setShutdown}
            numShutdowns={numShutdowns}
        />
    );
};

const styles: StyleSheetCSS = {
    desktop: {
        minHeight: '100%',
        flex: 1,
        backgroundColor: Colors.turquoise,
    },
    shortcutContainer: {
        position: 'absolute',
    },
    shortcuts: {
        position: 'absolute',
        top: 16,
        left: 6,
    },
    minimized: {
        pointerEvents: 'none',
        opacity: 0,
    },
};

export default Desktop;
```

Note the one intentional behavior fix folded in here: the original `toggleMinimize` mutated `newWindows[key]` in place (`newWindows[key].minimized = ...`) even though `newWindows[key]` was the same object reference as the one in state — this plan's version copies `newWindows[key]` into a new object before mutating (`newWindows[key] = { ...newWindows[key], minimized, zIndex }`) to avoid mutating state in place. This is a strictly safer rewrite of the same logic, not a behavior change a user would notice.

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd inner
npx tsc --noEmit -p tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Manual smoke test — existing apps still work**

Run:
```bash
cd inner
npm start
```
Open the printed local URL in a browser and verify, before moving on:
- "My Details" window auto-opens on load (as before).
- Desktop shortcuts "My Details" and "Credits" open/focus their windows on double-click.
- Taskbar tabs for open windows minimize/restore on click.
- Clicking "Shut down..." from the Start menu plays the shutdown prank sequence and reboots to an empty desktop (no windows auto-open after reboot — this is the existing, intentional joke behavior).

Stop the dev server (Ctrl+C) once confirmed.

- [ ] **Step 4: Commit**

```bash
cd "D:/Prog/Portfolio"
git add inner/src/components/os/Desktop.tsx
git commit -m "Move Desktop window state into WindowManagerContext"
```

---

### Task 5: Create the `CertificateViewer` app

**Files:**
- Create: `inner/src/components/applications/CertificateViewer.tsx`

**Interfaces:**
- Consumes: `Window` from `../os/Window` (props: `top, left, width, height, windowTitle, windowBarIcon, closeWindow, onInteract, minimizeWindow, bottomLeftText` — all already defined in `inner/src/components/os/Window.tsx:10-25`); `useInitialWindowSize` from `../../hooks/useInitialWindowSize` (returns `{ initWidth, initHeight }`); the ambient `WindowAppProps` type (`onClose`, `onInteract`, `onMinimize` — `inner/src/constants/Types.d.ts:5-9`).
- Produces: `CertificateViewer: React.FC<CertificateViewerProps>` where:
  ```ts
  interface CertificateViewerProps extends WindowAppProps {
      fileUrl: string;
      fileName: string;
      fileType: 'pdf' | 'image';
      cascadeOffset: number;
  }
  ```
  This is the exact shape Task 6 will instantiate.

- [ ] **Step 1: Create the file**

Create `inner/src/components/applications/CertificateViewer.tsx`:

```tsx
import React, { useCallback, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Window from '../os/Window';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

export interface CertificateViewerProps extends WindowAppProps {
    fileUrl: string;
    fileName: string;
    fileType: 'pdf' | 'image';
    cascadeOffset: number;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

const CertificateViewer: React.FC<CertificateViewerProps> = (props) => {
    const [zoom, setZoom] = useState(1);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadError, setLoadError] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    const onDocumentLoadSuccess = useCallback(
        ({ numPages }: { numPages: number }) => {
            setNumPages(numPages);
            pageRefs.current = new Array(numPages).fill(null);
        },
        []
    );

    const onDocumentLoadError = useCallback(() => {
        setLoadError(true);
    }, []);

    const zoomIn = useCallback(() => {
        setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
    }, []);

    const resetZoom = useCallback(() => {
        setZoom(1);
    }, []);

    const onScroll = useCallback(() => {
        if (!contentRef.current || !numPages) return;
        const containerRect = contentRef.current.getBoundingClientRect();
        const midpoint = containerRect.top + containerRect.height / 2;
        let closestPage = 1;
        let closestDistance = Infinity;
        pageRefs.current.forEach((el, i) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - midpoint);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPage = i + 1;
            }
        });
        setCurrentPage(closestPage);
    }, [numPages]);

    const width = 500;
    const height = 600;

    return (
        <Window
            top={40 + props.cascadeOffset}
            left={80 + props.cascadeOffset}
            width={width}
            height={height}
            windowTitle={props.fileName}
            windowBarIcon="fileIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={
                props.fileType === 'pdf' && numPages
                    ? `Page ${currentPage} of ${numPages}`
                    : ''
            }
        >
            <div style={styles.container}>
                <div style={styles.toolbar}>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={zoomOut}
                        disabled={zoom <= ZOOM_MIN}
                    >
                        −
                    </button>
                    <span style={styles.zoomLabel}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={zoomIn}
                        disabled={zoom >= ZOOM_MAX}
                    >
                        +
                    </button>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={resetZoom}
                    >
                        Reset
                    </button>
                </div>
                <div style={styles.content} ref={contentRef} onScroll={onScroll}>
                    {loadError ? (
                        <div style={styles.centered}>
                            <p>Couldn't load this file.</p>
                        </div>
                    ) : props.fileType === 'pdf' ? (
                        <Document
                            file={props.fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div style={styles.centered}>
                                    <p>Loading...</p>
                                </div>
                            }
                        >
                            {numPages &&
                                Array.from(new Array(numPages), (_, index) => (
                                    <div
                                        key={`page_${index + 1}`}
                                        ref={(el) => {
                                            pageRefs.current[index] = el;
                                        }}
                                        style={styles.page}
                                    >
                                        <Page
                                            pageNumber={index + 1}
                                            scale={zoom}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                        />
                                    </div>
                                ))}
                        </Document>
                    ) : (
                        <div style={styles.imageWrapper}>
                            <img
                                src={props.fileUrl}
                                alt={props.fileName}
                                style={{
                                    ...styles.image,
                                    transform: `scale(${zoom})`,
                                }}
                                onError={() => setLoadError(true)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    toolbar: {
        alignItems: 'center',
        padding: 6,
        borderBottom: '1px solid #808080',
        flexShrink: 0,
    },
    toolbarButton: {
        minWidth: 28,
        height: 26,
        marginRight: 6,
    },
    zoomLabel: {
        fontSize: 12,
        marginRight: 6,
        minWidth: 40,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#787878',
        alignItems: 'center',
        flexDirection: 'column',
        padding: 16,
    },
    page: {
        marginBottom: 16,
        boxShadow: '0 0 8px rgba(0,0,0,0.4)',
    },
    imageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        maxWidth: 'none',
        transformOrigin: 'top center',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
};

export default CertificateViewer;
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd inner
npx tsc --noEmit -p tsconfig.json
```
Expected: no errors. If TypeScript complains about `import.meta`, double check `inner/tsconfig.json` still has `"module": "esnext"` (it should — this plan doesn't touch that file).

- [ ] **Step 3: Commit**

```bash
cd "D:/Prog/Portfolio"
git add inner/src/components/applications/CertificateViewer.tsx
git commit -m "Add CertificateViewer window app (PDF/image render, zoom, page counter)"
```

---

### Task 6: Wire up `Certifications.tsx`

**Files:**
- Modify: `inner/src/components/showcase/Certifications.tsx`

**Interfaces:**
- Consumes: `useWindowManager` from `../../contexts/WindowManagerContext` (Task 3); `CertificateViewer` from `../applications/CertificateViewer` (Task 5, exact props from that task's `CertificateViewerProps`).
- Produces: no new exports — this is a leaf page component. `CertCardProps.pdfPath` is renamed to `filePath` (internal rename only, not consumed elsewhere — `Certifications.tsx` is the only place `CertCardProps`/`CERTS` are used, confirmed via the file being self-contained with no exports of these types).

- [ ] **Step 1: Replace the file contents**

Replace `inner/src/components/showcase/Certifications.tsx` entirely with:

```tsx
import React from 'react';
import { useWindowManager } from '../../contexts/WindowManagerContext';
import CertificateViewer from '../applications/CertificateViewer';

export interface CertificationsProps {}

interface CertCardProps {
    title: string;
    issuer: string;
    date: string;
    filePath: string;
    credentialId?: string;
}

const getFileName = (filePath: string): string =>
    filePath.split('/').pop() || filePath;

const getFileType = (filePath: string): 'pdf' | 'image' => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? 'image' : 'pdf';
};

const CertCard: React.FC<CertCardProps> = ({
    title,
    issuer,
    date,
    filePath,
    credentialId,
}) => {
    const { windows, openWindow, focusWindow, closeWindow, minimizeWindow } =
        useWindowManager();

    const openCertificate = () => {
        if (windows[filePath]) {
            focusWindow(filePath);
            return;
        }
        const fileName = getFileName(filePath);
        const cascadeOffset = (Object.keys(windows).length % 6) * 24;
        openWindow(
            filePath,
            fileName,
            'fileIcon',
            <CertificateViewer
                fileUrl={filePath}
                fileName={fileName}
                fileType={getFileType(filePath)}
                cascadeOffset={cascadeOffset}
                onInteract={() => focusWindow(filePath)}
                onMinimize={() => minimizeWindow(filePath)}
                onClose={() => closeWindow(filePath)}
                key={filePath}
            />
        );
    };

    return (
        <div style={styles.card}>
            <div style={styles.cardContent}>
                <h3 style={styles.certTitle}>{title}</h3>
                <p style={styles.issuer}>{issuer}</p>
                <p style={styles.date}>{date}</p>
                {credentialId && (
                    <p style={styles.credId}>
                        <sub>ID: {credentialId}</sub>
                    </p>
                )}
            </div>
            <div style={styles.btnGroup}>
                <button
                    className="site-button"
                    style={styles.actionBtn}
                    onClick={openCertificate}
                >
                    View
                </button>
                <a href={filePath} download={getFileName(filePath)}>
                    <button className="site-button" style={styles.actionBtn}>
                        Download
                    </button>
                </a>
            </div>
        </div>
    );
};

const CERTS: CertCardProps[] = [
    {
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services (AWS)',
        date: 'Feb 2026 – Feb 2029',
        filePath: '/certifications/aws-cloud-practitioner.pdf',
        credentialId: 'ab4be7a32bfa488ea4998724f9de7457',
    },
    {
        title: 'Oracle Cloud Infrastructure 2025 Certified Foundations Associate',
        issuer: 'Oracle University',
        date: 'Jan 2026',
        filePath: '/certifications/oracle-cloud.pdf',
        credentialId: '325437098OCI25FNDCFA',
    },
    {
        title: 'SAP Certified — SAP Generative AI Developer',
        issuer: 'SAP',
        date: 'Mar 2026 – Mar 2027',
        filePath: '/certifications/sap-genai.pdf',
    },
    {
        title: 'SAP ERP Certificate',
        issuer: 'SAP',
        date: '2025',
        filePath: '/certifications/sap-erp.pdf',
    },
    {
        title: 'MongoDB Associate Developer',
        issuer: 'MongoDB',
        date: 'Mar 2026',
        filePath: '/certifications/mongodb-associate.pdf',
    },
    {
        title: 'Alteryx Designer Core Certification',
        issuer: 'Alteryx',
        date: 'Jan 2026 – Jan 2028',
        filePath: '/certifications/alteryx-designer.pdf',
    },
    {
        title: 'AR VR Consultant',
        issuer: 'IT-ITeS Sector Skill Council (NASSCOM) / NCVET',
        date: 'Feb 2025',
        filePath: '/certifications/ar-vr-consultant.pdf',
        credentialId: 'AETNA0021QG-06-IT-00471-2023-V1.1',
    },
    {
        title: 'Deloitte Australia — Data Analytics',
        issuer: 'Deloitte Australia',
        date: '2025',
        filePath: '/certifications/deloitte-analytics.pdf',
    },
    {
        title: 'Programming in Java',
        issuer: 'NPTEL',
        date: 'Nov 2024',
        filePath: '/certifications/nptel-java.pdf',
    },
    {
        title: 'Introduction to Database Systems',
        issuer: 'NPTEL',
        date: 'May 2025',
        filePath: '/certifications/nptel-database.pdf',
    },
    {
        title: 'Introduction to Machine Learning',
        issuer: 'NPTEL',
        date: 'Sept 2025',
        filePath: '/certifications/nptel-ml.pdf',
    },
];

const Certifications: React.FC<CertificationsProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Certifications</h1>
            <br />
            <p>
                A collection of professional certifications earned across cloud
                platforms, data technologies, AI, and software development.
            </p>
            <br />
            <div style={styles.grid}>
                {CERTS.map((cert) => (
                    <CertCard key={cert.filePath} {...cert} />
                ))}
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    grid: {
        flexDirection: 'column',
        width: '100%',
    },
    card: {
        border: '2px solid #808080',
        backgroundColor: '#f0f0f0',
        padding: 16,
        marginBottom: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
    },
    cardContent: {
        flexDirection: 'column',
        flex: 1,
    },
    certTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    issuer: {
        color: '#444',
        marginBottom: 2,
    },
    date: {
        color: '#666',
        fontSize: 13,
    },
    credId: {
        color: '#888',
        marginTop: 4,
    },
    btnGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
        flexShrink: 0,
    },
    actionBtn: {
        minWidth: 72,
        height: 28,
        marginLeft: 8,
    },
};

export default Certifications;
```

- [ ] **Step 2: Verify it compiles**

Run:
```bash
cd inner
npx tsc --noEmit -p tsconfig.json
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd "D:/Prog/Portfolio"
git add inner/src/components/showcase/Certifications.tsx
git commit -m "Wire Certifications page to open certs in-app; add real download button"
```

---

### Task 7: End-to-end local verification

**Files:** none (verification only — Tasks 1-6 already committed their own changes locally)

**Interfaces:** none — this task closes out the feature.

- [ ] **Step 1: Start the dev server**

Run:
```bash
cd inner
npm start
```

- [ ] **Step 2: Walk through the acceptance checklist in a browser**

Navigate to My Details → Certifications and verify each of these (from the design spec's testing plan):
- Clicking **View** on a certificate opens a new taskbar-visible window titled with the actual filename (e.g. `aws-cloud-practitioner.pdf`), not the pretty title.
- The PDF renders and is readable; scrolling with the mouse wheel (or touch, if testing on a touch device/emulator) moves through the document with no visible custom scrollbar widget.
- Zoom `+`/`−` buttons change the rendered size; `Reset` returns to 100%; the `−` button disables at the minimum zoom and `+` disables at the maximum.
- The bottom-left window status text shows `Page 1 of 1` (or however many pages the PDF has).
- Clicking **View** again on the same certificate (while its window is already open) brings the existing window to front instead of opening a second copy — confirm by opening it, minimizing it via the taskbar, then clicking View again: it should un-minimize and focus rather than duplicate.
- Opening 2–3 different certificates shows 2–3 separate taskbar tabs; each minimizes/restores/closes independently of the others.
- Clicking **Download** on a certificate triggers an actual file download (browser download prompt or file saved to Downloads), not a new tab.
- No regressions: "My Details" still auto-opens on load, the "Credits" app still opens from its shortcut, and the shutdown sequence (Start → Shut down...) still plays its prank and reboots to an empty desktop.

If any check fails, fix the underlying task's code, verify the fix in the browser, and commit the fix to that task's existing local commit history (a small follow-up commit is fine) before proceeding.

- [ ] **Step 3: Stop the dev server**

Press Ctrl+C in the terminal running `npm start`.

- [ ] **Step 4: Confirm final state**

```bash
cd "D:/Prog/Portfolio"
git status
git log --oneline main..feature/certificate-viewer
```
Expected: clean working tree (aside from anything unrelated already known to be untracked, e.g. `Screenshots/`), and the log shows the 6 feature commits from Tasks 1-6 (plus any follow-up fix commits from Step 2).

- [ ] **Step 5: Stop here**

Per the Global Constraints, do not push to the remote and do not deploy, and do not merge `feature/certificate-viewer` into `main`. Report back and wait for the user to decide when to merge/push/deploy.

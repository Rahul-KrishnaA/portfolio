# Certificate Viewer — Design

## Problem

The Certifications page (inside the "My Details" desktop app) currently offers a single "View" button per certificate, which opens the PDF in a new browser tab via `<a target="_blank">`. There's no way to download the file separately, and viewing breaks the illusion of the simulated desktop OS by leaving it entirely.

## Goal

Add a "Download" button (actual file download) alongside a new "View" button that opens the certificate **inside the simulated OS** as its own first-class desktop app — with a taskbar entry named after the file, its own window, zoom controls, and natural scrolling. Multiple certificates can be open at once as separate windows. Re-clicking "View" on an already-open certificate focuses the existing window instead of opening a duplicate.

## Architecture

### 1. `WindowManagerContext`

New file: `inner/src/contexts/WindowManagerContext.tsx`.

Today, `Desktop.tsx` is the sole owner of the `windows` state dict and the functions that mutate it (`addWindow`, `removeWindow`, `minimizeWindow`, `toggleMinimize`, `onWindowInteract`, `getHighestZIndex`). These are only passed as props to direct children (the `APPLICATIONS` shortcut click-handlers). `Certifications.tsx` is nested much deeper: `Desktop` → `Window` (My Details) → `Router` → `Certifications` page. Props can't reach it without threading through every intermediate layer.

The fix: move the window-state and its manipulation functions into a `WindowManagerProvider`. `Desktop.tsx` renders this provider at its root and consumes it the same way it uses the state today (no behavior change for existing apps: My Details, Credits). Any component nested anywhere inside `Desktop` — including `Certifications.tsx` — can call `useWindowManager()` to open/focus/close a window.

Exposed API:

```ts
interface WindowManagerContextValue {
  windows: DesktopWindows;
  openWindow: (key: string, name: string, icon: IconName, element: JSX.Element) => void;
  focusWindow: (key: string) => void; // brings to front, un-minimizes if needed
  closeWindow: (key: string) => void;
  minimizeWindow: (key: string) => void;
  isWindowOpen: (key: string) => boolean;
}
```

`openWindow` is idempotent by `key`: if a window with that key already exists, it calls `focusWindow(key)` instead of creating a second one. This single rule covers both the "existing app shortcuts" case and the "certificate already open" case — no separate dedup logic needed in `Certifications.tsx`.

### 2. Generic file-viewer app

New file: `inner/src/components/applications/CertificateViewer.tsx`. Deliberately generic (not certificate-specific) since it just renders "a file" — could be reused later for other file types.

Props: `fileUrl: string`, `fileName: string`, `fileType: 'pdf' | 'image'`, plus the standard `WindowAppProps` (`onInteract`, `onMinimize`, `onClose`).

- Renders a `Window` (`inner/src/components/os/Window.tsx`) with `windowTitle={fileName}` and `windowBarIcon="fileIcon"` (new icon, see below). This is what shows in the taskbar tab per the existing generic `Toolbar.tsx` behavior (it already reads `windows[key].name` / `.icon` — no Toolbar changes needed).
- Default size 500×600. Position cascades: each new certificate window opens offset +24px/+24px from the last-opened one (wrapping back near the top-left after a few, to avoid drifting off-screen), so stacking several doesn't perfectly overlap.
- Local toolbar row above the content area: `−` button, zoom % label, `+` button, `Reset` button, and a page counter (`Page 2 of 3`) when the PDF has more than one page. Styled with the existing `site-button` class already used for the current View button, matching the OS's Windows-98 button look.
- Zoom: local `useState` scale, 0.5×–3.0×, 0.25 steps. `Reset` snaps back to 1.0×. Buttons only — no scroll-to-zoom, no gesture interception, so trackpad/touch pinch-zoom on mobile keeps working as a native browser behavior alongside the buttons.
- Content area: a single `overflow: auto` div, default browser scrollbar, no custom scroll UI. Content scrolls via native mouse wheel / trackpad / touch.
  - **PDF** (`react-pdf`): `<Document>` renders every page stacked vertically inside the scroll container (continuous-scroll reading, not a paged view), each `<Page scale={zoom} />`. The page counter is derived from `onLoadSuccess`'s page count plus an `IntersectionObserver`-free approximate "current page" from scroll position (simplest: track which page's Y-range contains the container's scrollTop + half its height).
  - **Image**: plain `<img src={fileUrl} style={{ transform: scale(zoom) }} />` inside the same scroll container.
  - Loading state: small centered spinner/text while the file loads. Error state: centered "Couldn't load this file" message if loading fails.

### 3. New icon

`inner/src/assets/icons/fileIcon.png` — a generic 32×32 pixelated document icon (white page, folded top-right corner, a few gray text lines), matching the existing icon set's style. Already created and registered as `fileIcon` in `inner/src/assets/icons/index.ts`.

### 4. `Certifications.tsx` changes

- Rename `pdfPath` → `filePath` on `CertCardProps` and in the `CERTS` array (purely a rename; values unchanged, all still `.pdf` today but the field name shouldn't imply PDF-only since image certs are expected later).
- Derive `fileType` from the `filePath` extension (`.pdf` → `'pdf'`, `.jpg`/`.jpeg`/`.png` → `'image'`).
- Derive the taskbar/window title from the filename portion of `filePath` (e.g. `aws-cloud-practitioner.pdf`), not the pretty `title` field — per requirement, the app name shown is the file name.
- Replace the single "View" button with two side-by-side buttons in the same slot:
  - **View** — calls `openWindow(filePath, fileNameFromPath, 'fileIcon', <CertificateViewer fileUrl={filePath} fileName={fileNameFromPath} fileType={fileType} .../>)`.
  - **Download** — `<a href={filePath} download={fileNameFromPath}>` with a button styled the same as View. Actually downloads the file (browser save dialog / downloads folder) instead of today's new-tab behavior.

## Dependencies

Add `react-pdf` (pulls in `pdfjs-dist`). Needs a version compatible with React 17 (this app is on `react@^17.0.2`, CRA 5 / webpack 5) — will pin to whatever `react-pdf` major last supported React 17 (likely v7.x) at implementation time, and verify pdf.js worker loads correctly under CRA 5's webpack 5 (`new URL('pdfjs-dist/build/pdf.worker.min.js', import.meta.url)` pattern, no eject needed).

## Out of scope / explicitly skipped

- Keyboard shortcuts (Esc to close, Ctrl +/− to zoom) — skipped for v1 per user decision.
- Prev/next page navigation buttons — continuous vertical scroll covers this; page counter is read-only feedback, not a control.
- Custom scrollbar UI — explicitly rejected; native scroll only.

## Testing plan

Run `inner` locally (`npm start`), open My Details → Certifications, verify:
- View opens a new taskbar-visible window titled with the filename.
- Opening the same cert's View twice focuses the existing window rather than duplicating it.
- Opening 2–3 different certs shows 2–3 separate taskbar tabs, all functional (minimize/restore/close independently).
- Zoom in/out/reset buttons work; scrolling works via mouse wheel.
- Download button actually downloads the file (not just opens it).
- No regressions to the existing My Details / Credits apps (shortcut double-click, taskbar minimize/restore, close).

Per user instruction: do not commit or push this feature until it's been tested locally; commit to the repo only after local verification, then deploy.

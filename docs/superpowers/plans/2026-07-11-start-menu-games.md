# Start Menu Games Submenu Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Windows-98-style cascading "Games ▸" submenu to the Start Menu (`Toolbar.tsx`) listing 5 games — Minesweeper (freshly ported), and Doom/Oregon Trail/Scrabble/Wordle (recovered from this repo's own git history, where they lived before being deliberately removed in commit `e34fd92`).

**Architecture:** 4 legacy games are restored via `git checkout e34fd92~1 -- <path>`, which pulls their exact pre-removal content back into the working tree (they're already fully adapted to this codebase's `WindowAppProps`/`Window` pattern). Minesweeper is a fresh port from `risterz/windows98-emulator` (MIT), following the same process used for the Settings app. A new `games.ts` registry (mirroring `Desktop.tsx`'s `APPLICATIONS`) feeds a new cascading flyout added to `Toolbar.tsx`, which is given the window-manager functions (`openWindow`/`focusWindow`/`closeWindow`/`minimizeWindow`) it needs to launch games — the same four functions `Desktop.tsx` already uses for desktop shortcuts.

**Tech Stack:** React 17 (function components + hooks), TypeScript, no new UI library. `js-dos`/`emulators-ui` npm packages are reinstalled (previously removed) to run Doom/Oregon Trail/Scrabble.

## Global Constraints

- Match existing code style exactly: inline `style={...}` objects typed via the global `StyleSheetCSS` interface, `React.FC<Props>` components, `Colors` from `inner/src/constants/colors.ts`.
- No test framework exists in `inner/src` — verification is `cd inner && npx tsc --noEmit` (and `npm run build` for the final task) plus manual dev-server checks.
- Do not modify `outer/`. Do not introduce a new UI library or CSS framework.
- None of these 5 games get a desktop shortcut — they are reachable only via Start Menu → Games.
- `ThisComputer.tsx` stays removed — not part of this plan.
- `digger.jsdos` stays removed — it had no consumer before removal and none now.
- Doom/Oregon Trail/Scrabble/Wordle originate from `henryjeff/portfolio-inner-site`; Minesweeper is adapted from `risterz/windows98-emulator` (MIT) — add a short attribution comment at the top of the new `Minesweeper.tsx` noting the source and its MIT license, matching how other ported work in this repo is attributed.
- **Before running any `git commit`, check with the user first** unless explicitly pre-authorized for this session's task-by-task workflow (this plan follows the same pre-authorized commit-per-task pattern used for the Settings/Wallpaper plans).

---

### Task 1: Restore js-dos runtime, npm deps, and index.html wiring

**Files:**
- Restore (via `git checkout`): `inner/public/js-dos/` (entire directory)
- Modify: `inner/package.json`, `inner/package-lock.json` (via `npm install`)
- Modify: `inner/public/index.html`

**Interfaces:**
- Produces: the `js-dos` global (`Dos` factory function) available at runtime via the restored `<script>` tag; the `js-dos` npm package's TypeScript types (`DosPlayer as Instance, DosPlayerFactoryType`) importable from `'js-dos'`. Consumed by `DosPlayer.tsx` (Task 2).

- [ ] **Step 1: Restore the js-dos runtime directory**

```bash
cd D:\Prog\Portfolio
git checkout e34fd92~1 -- inner/public/js-dos/
```

Expected: `inner/public/js-dos/` now exists again with `js-dos.js`, `js-dos.css`, `emulators-ui-loader.png`, and the `types/` subtree (matches the file list removed in commit `e34fd92`'s stat).

- [ ] **Step 2: Reinstall the npm dependencies**

```bash
cd inner
npm install js-dos@^7.3.9 emulators-ui@^0.73.1
```

Expected: `package.json` gets `"js-dos": "^7.3.9"` and `"emulators-ui": "^0.73.1"` added back to `dependencies` (alphabetical position matches where they were before removal — between `"@types/react-dom"` and `"framer-motion"`), `package-lock.json` updates accordingly, no npm errors.

- [ ] **Step 3: Restore the index.html script/style tags**

Read `inner/public/index.html` first. Find this block (immediately before `</head>`):

```html
  <script>
      // ... existing inline script ...
  </script>
</head>
```

Insert the following 3 lines immediately before the existing `</head>` closing tag (after the existing inline `<script>` block, matching exactly what commit `e34fd92` removed):

```html
  <script src="%PUBLIC_URL%/js-dos/js-dos.js"></script>
  <link rel="stylesheet" href="%PUBLIC_URL%/js-dos/js-dos.css">
  <script>
    emulators.pathPrefix = "%PUBLIC_URL%/js-dos/";
  </script>
```

- [ ] **Step 4: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors (no application code references `js-dos` yet in this task — that's Task 2).

- [ ] **Step 5: Commit**

```bash
git add inner/public/js-dos/ inner/package.json inner/package-lock.json inner/public/index.html
git commit -m "Restore js-dos emulator runtime and npm dependencies"
```

---

### Task 2: Restore Doom, Oregon Trail, Scrabble, and DosPlayer

**Files:**
- Restore (via `git checkout`):
  - `inner/src/components/dos/DosPlayer.tsx`
  - `inner/src/components/applications/Doom.tsx`
  - `inner/src/components/applications/OregonTrail.tsx`
  - `inner/src/components/applications/Scrabble.tsx`
  - `inner/src/assets/icons/doomIcon.png`
  - `inner/src/assets/icons/trailIcon.png`
  - `inner/src/assets/icons/scrabbleIcon.png`
  - `inner/src/assets/icons/windowGameIcon.png`
  - `inner/public/doom.jsdos`
  - `inner/public/trail.jsdos`
  - `inner/public/scrabble.jsdos`
- Modify: `inner/src/assets/icons/index.ts`

**Interfaces:**
- Consumes: `js-dos` runtime/npm package (Task 1).
- Produces: `DoomApp`, `OregonTrailApp`, `ScrabbleApp` default exports (each `React.FC<WindowAppProps>`), consumed by `games.ts` (Task 5) as `Doom`, `OregonTrail`, `Scrabble`. `IconName` type gains `'doomIcon' | 'trailIcon' | 'scrabbleIcon' | 'windowGameIcon'`.

- [ ] **Step 1: Restore the component and DOS-player files**

```bash
cd D:\Prog\Portfolio
git checkout e34fd92~1 -- inner/src/components/dos/DosPlayer.tsx
git checkout e34fd92~1 -- inner/src/components/applications/Doom.tsx
git checkout e34fd92~1 -- inner/src/components/applications/OregonTrail.tsx
git checkout e34fd92~1 -- inner/src/components/applications/Scrabble.tsx
```

Expected: all 4 files restored with their exact pre-removal content (`DosPlayer.tsx` wraps the `js-dos` `Dos()` factory; `Doom.tsx`/`OregonTrail.tsx`/`Scrabble.tsx` each render a `Window` containing a `DosPlayer` pointed at their respective `.jsdos` bundle).

- [ ] **Step 2: Restore the icons and game binaries**

```bash
git checkout e34fd92~1 -- inner/src/assets/icons/doomIcon.png
git checkout e34fd92~1 -- inner/src/assets/icons/trailIcon.png
git checkout e34fd92~1 -- inner/src/assets/icons/scrabbleIcon.png
git checkout e34fd92~1 -- inner/src/assets/icons/windowGameIcon.png
git checkout e34fd92~1 -- inner/public/doom.jsdos
git checkout e34fd92~1 -- inner/public/trail.jsdos
git checkout e34fd92~1 -- inner/public/scrabble.jsdos
```

- [ ] **Step 3: Register the 4 icons in the icon map**

Read `inner/src/assets/icons/index.ts` first (it has evolved since these icons were removed — e.g. `settingsIcon` was added later — so don't assume the file matches its pre-removal state; add to the current file). Add these 4 imports and 4 map entries, following the file's existing pattern exactly:

```ts
import doomIcon from './doomIcon.png';
import trailIcon from './trailIcon.png';
import scrabbleIcon from './scrabbleIcon.png';
import windowGameIcon from './windowGameIcon.png';
```

And in the `icons` object:

```ts
    doomIcon: doomIcon,
    trailIcon: trailIcon,
    scrabbleIcon: scrabbleIcon,
    windowGameIcon: windowGameIcon,
```

- [ ] **Step 4: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors. (`Doom.tsx`/`OregonTrail.tsx`/`Scrabble.tsx` are not imported by anything yet, so TypeScript checks them standalone; this surfaces any API drift in `js-dos`'s types vs. what `DosPlayer.tsx` expects.)

- [ ] **Step 5: Commit**

```bash
git add inner/src/components/dos/ inner/src/components/applications/Doom.tsx inner/src/components/applications/OregonTrail.tsx inner/src/components/applications/Scrabble.tsx inner/src/assets/icons/doomIcon.png inner/src/assets/icons/trailIcon.png inner/src/assets/icons/scrabbleIcon.png inner/src/assets/icons/windowGameIcon.png inner/public/doom.jsdos inner/public/trail.jsdos inner/public/scrabble.jsdos inner/src/assets/icons/index.ts
git commit -m "Restore Doom, Oregon Trail, and Scrabble DOS games"
```

---

### Task 3: Restore Wordle (renamed from Henordle)

**Files:**
- Restore (via `git checkout`):
  - `inner/src/components/wordle/Wordle.tsx`
  - `inner/src/components/wordle/Words.ts`
  - `inner/src/assets/icons/henordleIcon.png` → then rename to `wordleIcon.png`
- Create: `inner/src/components/applications/Wordle.tsx` (adapted from the restored `Henordle.tsx` content, renamed)
- Modify: `inner/src/assets/icons/index.ts`

**Interfaces:**
- Produces: `WordleApp` default export (`React.FC<WindowAppProps>`), consumed by `games.ts` (Task 5) as `Wordle`. `IconName` type gains `'wordleIcon'`.

- [ ] **Step 1: Restore the underlying game files**

```bash
cd D:\Prog\Portfolio
git checkout e34fd92~1 -- inner/src/components/wordle/Wordle.tsx
git checkout e34fd92~1 -- inner/src/components/wordle/Words.ts
```

- [ ] **Step 2: Restore and rename the icon**

```bash
git checkout e34fd92~1 -- inner/src/assets/icons/henordleIcon.png
git mv inner/src/assets/icons/henordleIcon.png inner/src/assets/icons/wordleIcon.png
```

- [ ] **Step 3: Register the icon**

Read `inner/src/assets/icons/index.ts` first. Add:

```ts
import wordleIcon from './wordleIcon.png';
```

And in the `icons` object:

```ts
    wordleIcon: wordleIcon,
```

- [ ] **Step 4: Create the renamed application wrapper**

The pre-removal `Henordle.tsx` (recoverable for reference via
`git show e34fd92~1:inner/src/components/applications/Henordle.tsx`) was:

```tsx
import React from 'react';import Window from '../os/Window';import Wordle from '../wordle/Wordle';export interface HenordleAppProps extends WindowAppProps {}const HenordleApp: React.FC<HenordleAppProps> = (props) => {    return (        <Window            top={20}            left={300}            width={600}            height={860}            windowBarIcon="windowGameIcon"            windowTitle="Henordle"            closeWindow={props.onClose}            onInteract={props.onInteract}            minimizeWindow={props.onMinimize}            bottomLeftText={'Â© Copyright 2025 Rahul Krishna A'}        >            <div className="site-page">                <Wordle />            </div>        </Window>    );};export default HenordleApp;
```

Note it has no line breaks (minified/corrupted formatting) and a mangled
copyright symbol (`Â©` — a UTF-8/Latin-1 double-encoding artifact). Create
`inner/src/components/applications/Wordle.tsx` as a clean, properly
formatted version with the Henry-specific name dropped and the copyright
byte-sequence fixed, updating the year to 2026 to match this repo's other
apps (e.g. `Credits.tsx` uses `© Copyright 2026 Rahul Krishna A`) and using
`wordleIcon` as the window bar icon instead of the shared `windowGameIcon`:

```tsx
import React from 'react';
import Window from '../os/Window';
import Wordle from '../wordle/Wordle';

export interface WordleAppProps extends WindowAppProps {}

const WordleApp: React.FC<WordleAppProps> = (props) => {
    return (
        <Window
            top={20}
            left={300}
            width={600}
            height={860}
            windowBarIcon="wordleIcon"
            windowTitle="Wordle"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={'© Copyright 2026 Rahul Krishna A'}
        >
            <div className="site-page">
                <Wordle />
            </div>
        </Window>
    );
};

export default WordleApp;
```

Do NOT create a file named `Henordle.tsx` — this task creates only
`Wordle.tsx`.

- [ ] **Step 5: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add inner/src/components/wordle/ inner/src/assets/icons/wordleIcon.png inner/src/assets/icons/index.ts inner/src/components/applications/Wordle.tsx
git commit -m "Restore Wordle game (renamed from Henordle)"
```

---

### Task 4: Generate the Minesweeper icon

**Files:**
- Create: `inner/src/assets/icons/minesweeperIcon.png` (generated by a throwaway script, not hand-drawn)
- Create (temporary, delete after use): `inner/scripts/generate-minesweeper-icon.js`
- Modify: `inner/src/assets/icons/index.ts`

**Interfaces:**
- Produces: icon asset importable as `minesweeperIcon`, string literal `'minesweeperIcon'` becomes a valid `IconName`. Consumed by `Minesweeper.tsx` (Task 5, as its window bar icon) and `games.ts` (Task 6).

- [ ] **Step 1: Write the icon-generation script**

Create `inner/scripts/generate-minesweeper-icon.js`:

```js
// One-off script to generate a 32x32 pixel-art Minesweeper icon (a flat
// grey 3x3 grid with one dark mine cell) as a valid PNG, using only Node's
// built-in zlib (no image libraries). Run with:
// node scripts/generate-minesweeper-icon.js
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const SIZE = 32;
const BLACK = [0, 0, 0, 255];
const DARK_GRAY = [0x86, 0x89, 0x8d, 255];
const LIGHT_GRAY = [0xc3, 0xc6, 0xca, 255];
const WHITE = [0xff, 0xff, 0xff, 255];
const RED = [0xc0, 0x00, 0x00, 255];
const TRANSPARENT = [0, 0, 0, 0];

const CELL = 9; // 3x3 grid of 9px cells + borders, centered in 32x32
const GRID_ORIGIN = 3;

function pixelColor(x, y) {
    const gridSize = CELL * 3;
    const gx = x - GRID_ORIGIN;
    const gy = y - GRID_ORIGIN;
    if (gx < 0 || gy < 0 || gx >= gridSize || gy >= gridSize) return TRANSPARENT;

    const col = Math.floor(gx / CELL);
    const row = Math.floor(gy / CELL);
    const cx = gx % CELL;
    const cy = gy % CELL;

    // 1px black grid line on the right/bottom edge of each cell
    if (cx === CELL - 1 || cy === CELL - 1) return BLACK;

    const isMineCell = row === 1 && col === 1;

    if (isMineCell) {
        const mx = cx - (CELL - 1) / 2;
        const my = cy - (CELL - 1) / 2;
        const dist = Math.sqrt(mx * mx + my * my);
        if (dist < 3) return BLACK;
        return RED;
    }

    // Beveled unrevealed cell: light top/left, dark bottom/right
    if (cx === 0 || cy === 0) return WHITE;
    if (cx === CELL - 2 || cy === CELL - 2) return DARK_GRAY;
    return LIGHT_GRAY;
}

function buildRawRGBA() {
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
    return raw;
}

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

function buildPNG() {
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
    const raw = buildRawRGBA();
    const idatData = zlib.deflateSync(raw);
    const idat = chunk('IDAT', idatData);
    const iend = chunk('IEND', Buffer.alloc(0));
    return Buffer.concat([signature, ihdr, idat, iend]);
}

const outPath = path.join(__dirname, '..', 'src', 'assets', 'icons', 'minesweeperIcon.png');
fs.writeFileSync(outPath, buildPNG());
console.log('Wrote', outPath);
```

- [ ] **Step 2: Run the script and verify the PNG**

```bash
cd inner
mkdir -p scripts
node scripts/generate-minesweeper-icon.js
node -e "
const fs = require('fs');
const buf = fs.readFileSync('src/assets/icons/minesweeperIcon.png');
console.log('signature ok:', buf.slice(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])));
console.log('width:', buf.readUInt32BE(16), 'height:', buf.readUInt32BE(20));
"
```

Expected: `signature ok: true` and `width: 32 height: 32`.

- [ ] **Step 3: Register the icon**

Read `inner/src/assets/icons/index.ts` first. Add:

```ts
import minesweeperIcon from './minesweeperIcon.png';
```

And in the `icons` object:

```ts
    minesweeperIcon: minesweeperIcon,
```

- [ ] **Step 4: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Delete the throwaway script**

```bash
rm inner/scripts/generate-minesweeper-icon.js
rmdir inner/scripts 2>/dev/null || true
```

- [ ] **Step 6: Visually check the icon**

Read `inner/src/assets/icons/minesweeperIcon.png` and confirm it renders as
a recognizable 3x3 beveled grid with a red/black mine in the center cell on
a transparent background.

- [ ] **Step 7: Commit**

```bash
git add inner/src/assets/icons/minesweeperIcon.png inner/src/assets/icons/index.ts
git commit -m "Add Minesweeper icon"
```

---

### Task 5: Port Minesweeper

**Files:**
- Create: `inner/src/components/applications/Minesweeper.tsx`

**Interfaces:**
- Consumes: `Window` from `../os/Window`, `Colors` from `../../constants/colors`, `minesweeperIcon` (Task 4).
- Produces: `MinesweeperApp` default export (`React.FC<WindowAppProps>`), consumed by `games.ts` (Task 6) as `Minesweeper`.

- [ ] **Step 1: Fetch the source for reference**

The source is `risterz/windows98-emulator` (MIT licensed, confirmed via
`gh api repos/risterz/windows98-emulator` → `license.name: "MIT License"`).
Fetch its Minesweeper implementation for reference:

```bash
gh api repos/risterz/windows98-emulator/contents/components/apps/minesweeper.tsx --jq '.content' | base64 -d > /tmp/reference-minesweeper.tsx
```

Read `/tmp/reference-minesweeper.tsx` to understand its game-state shape
(board representation, cell reveal/flag logic, mine placement, win/lose
detection, timer) — this is the part worth reusing. Its own window chrome,
drag/resize logic, and CSS are NOT reused (this repo's `Window` component
replaces all of that).

- [ ] **Step 2: Implement the component**

Create `inner/src/components/applications/Minesweeper.tsx`. Start the file
with a short attribution comment:

```tsx
// Minesweeper game logic adapted from risterz/windows98-emulator
// (https://github.com/risterz/windows98-emulator), MIT licensed:
// https://github.com/risterz/windows98-emulator/blob/master/LICENSE
// Window chrome, styling, and app wiring are original to this repo.
import React, { useCallback, useEffect, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface MinesweeperProps extends WindowAppProps {}

const ROWS = 9;
const COLS = 9;
const MINES = 10;

interface Cell {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    adjacentMines: number;
}

type GameStatus = 'playing' | 'won' | 'lost';

const createEmptyBoard = (): Cell[][] =>
    Array.from({ length: ROWS }, () =>
        Array.from({ length: COLS }, () => ({
            isMine: false,
            isRevealed: false,
            isFlagged: false,
            adjacentMines: 0,
        }))
    );

const placeMines = (board: Cell[][], excludeRow: number, excludeCol: number): Cell[][] => {
    const next = board.map((row) => row.map((cell) => ({ ...cell })));
    let placed = 0;
    while (placed < MINES) {
        const r = Math.floor(Math.random() * ROWS);
        const c = Math.floor(Math.random() * COLS);
        if (next[r][c].isMine) continue;
        if (r === excludeRow && c === excludeCol) continue;
        next[r][c].isMine = true;
        placed++;
    }
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            if (next[r][c].isMine) continue;
            let count = 0;
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                    if (next[nr][nc].isMine) count++;
                }
            }
            next[r][c].adjacentMines = count;
        }
    }
    return next;
};

const floodReveal = (board: Cell[][], row: number, col: number): Cell[][] => {
    const next = board.map((r) => r.map((cell) => ({ ...cell })));
    const stack: [number, number][] = [[row, col]];
    while (stack.length > 0) {
        const [r, c] = stack.pop() as [number, number];
        const cell = next[r][c];
        if (cell.isRevealed || cell.isFlagged) continue;
        cell.isRevealed = true;
        if (cell.adjacentMines === 0 && !cell.isMine) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    const nr = r + dr;
                    const nc = c + dc;
                    if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue;
                    if (!next[nr][nc].isRevealed) stack.push([nr, nc]);
                }
            }
        }
    }
    return next;
};

const checkWin = (board: Cell[][]): boolean => {
    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLS; c++) {
            const cell = board[r][c];
            if (!cell.isMine && !cell.isRevealed) return false;
        }
    }
    return true;
};

const revealAllMines = (board: Cell[][]): Cell[][] =>
    board.map((row) =>
        row.map((cell) => (cell.isMine ? { ...cell, isRevealed: true } : cell))
    );

const NUMBER_COLORS: { [key: number]: string } = {
    1: '#0000ff',
    2: '#008000',
    3: '#ff0000',
    4: '#000080',
    5: '#800000',
    6: '#008080',
    7: '#000000',
    8: '#808080',
};

const MinesweeperApp: React.FC<MinesweeperProps> = (props) => {
    const [board, setBoard] = useState<Cell[][]>(createEmptyBoard);
    const [status, setStatus] = useState<GameStatus>('playing');
    const [minesPlaced, setMinesPlaced] = useState(false);
    const [flagCount, setFlagCount] = useState(0);
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (status !== 'playing' || !minesPlaced) return;
        const interval = setInterval(() => setSeconds((s) => Math.min(s + 1, 999)), 1000);
        return () => clearInterval(interval);
    }, [status, minesPlaced]);

    const reset = useCallback(() => {
        setBoard(createEmptyBoard());
        setStatus('playing');
        setMinesPlaced(false);
        setFlagCount(0);
        setSeconds(0);
    }, []);

    const revealCell = useCallback(
        (row: number, col: number) => {
            if (status !== 'playing') return;
            if (board[row][col].isFlagged || board[row][col].isRevealed) return;

            let workingBoard = board;
            if (!minesPlaced) {
                workingBoard = placeMines(board, row, col);
                setMinesPlaced(true);
            }

            if (workingBoard[row][col].isMine) {
                setBoard(revealAllMines(workingBoard));
                setStatus('lost');
                return;
            }

            const revealed = floodReveal(workingBoard, row, col);
            setBoard(revealed);
            if (checkWin(revealed)) {
                setStatus('won');
            }
        },
        [board, status, minesPlaced]
    );

    const toggleFlag = useCallback(
        (row: number, col: number, event: React.MouseEvent) => {
            event.preventDefault();
            if (status !== 'playing') return;
            if (board[row][col].isRevealed) return;
            const next = board.map((r) => r.map((cell) => ({ ...cell })));
            next[row][col].isFlagged = !next[row][col].isFlagged;
            setBoard(next);
            setFlagCount((f) => f + (next[row][col].isFlagged ? 1 : -1));
        },
        [board, status]
    );

    const minesRemaining = Math.max(0, MINES - flagCount);
    const faceEmoji = status === 'won' ? '😎' : status === 'lost' ? '😵' : '🙂';

    return (
        <Window
            top={40}
            left={40}
            width={340}
            height={420}
            windowTitle="Minesweeper"
            windowBarIcon="minesweeperIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={status === 'won' ? 'You win!' : status === 'lost' ? 'You lose.' : ''}
        >
            <div style={styles.container}>
                <div style={styles.header}>
                    <div style={styles.counter}>
                        {String(minesRemaining).padStart(3, '0')}
                    </div>
                    <button style={styles.faceButton} onClick={reset}>
                        {faceEmoji}
                    </button>
                    <div style={styles.counter}>
                        {String(seconds).padStart(3, '0')}
                    </div>
                </div>
                <div style={styles.board}>
                    {board.map((row, r) => (
                        <div key={r} style={styles.row}>
                            {row.map((cell, c) => (
                                <div
                                    key={c}
                                    style={Object.assign(
                                        {},
                                        styles.cell,
                                        cell.isRevealed && styles.cellRevealed
                                    )}
                                    onClick={() => revealCell(r, c)}
                                    onContextMenu={(e) => toggleFlag(r, c, e)}
                                >
                                    {cell.isRevealed && cell.isMine && '💣'}
                                    {cell.isRevealed &&
                                        !cell.isMine &&
                                        cell.adjacentMines > 0 && (
                                            <span
                                                style={{
                                                    color:
                                                        NUMBER_COLORS[cell.adjacentMines],
                                                }}
                                            >
                                                {cell.adjacentMines}
                                            </span>
                                        )}
                                    {!cell.isRevealed && cell.isFlagged && '🚩'}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flexDirection: 'column',
        alignItems: 'center',
        padding: 8,
        backgroundColor: Colors.lightGray,
        width: '100%',
        height: '100%',
        boxSizing: 'border-box',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        marginBottom: 8,
        padding: 4,
        border: `2px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        boxSizing: 'border-box',
    },
    counter: {
        backgroundColor: Colors.black,
        color: Colors.red,
        fontFamily: 'monospace',
        fontSize: 20,
        fontWeight: 'bold',
        padding: '2px 6px',
        minWidth: 40,
        textAlign: 'center',
    },
    faceButton: {
        width: 28,
        height: 28,
        fontSize: 16,
        cursor: 'pointer',
        border: `2px solid ${Colors.darkGray}`,
        borderTopColor: Colors.white,
        borderLeftColor: Colors.white,
        backgroundColor: Colors.lightGray,
    },
    board: {
        flexDirection: 'column',
        border: `2px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
    },
    row: {
        flexDirection: 'row',
    },
    cell: {
        width: 24,
        height: 24,
        boxSizing: 'border-box',
        border: `2px solid ${Colors.white}`,
        borderTopColor: Colors.white,
        borderLeftColor: Colors.white,
        borderBottomColor: Colors.darkGray,
        borderRightColor: Colors.darkGray,
        backgroundColor: Colors.lightGray,
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'monospace',
        userSelect: 'none',
    },
    cellRevealed: {
        border: `1px solid ${Colors.darkGray}`,
        backgroundColor: Colors.lightGray,
    },
};

export default MinesweeperApp;
```

Note: `Colors` (`inner/src/constants/colors.ts`) does not have a `red` key
— check the file first; if `red` is missing, use the literal `'#ff0000'`
for `styles.counter.color` instead of `Colors.red`.

- [ ] **Step 3: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add inner/src/components/applications/Minesweeper.tsx
git commit -m "Port Minesweeper from risterz/windows98-emulator"
```

---

### Task 6: Create the games registry

**Files:**
- Create: `inner/src/components/os/games.ts`

**Interfaces:**
- Consumes: `Minesweeper` (Task 5, default export from `../applications/Minesweeper`), `Doom` (Task 2, default export from `../applications/Doom`), `OregonTrail` (Task 2, default export from `../applications/OregonTrail`), `Scrabble` (Task 2, default export from `../applications/Scrabble`), `Wordle` (Task 3, default export from `../applications/Wordle`), `IconName` from `../../assets/icons`.
- Produces: `GameEntry` interface and `GAMES: GameEntry[]`, imported by `Toolbar.tsx` (Task 7) as `import { GAMES } from './games';`.

- [ ] **Step 1: Create the registry**

```ts
import React from 'react';
import { IconName } from '../../assets/icons';
import Minesweeper from '../applications/Minesweeper';
import Doom from '../applications/Doom';
import OregonTrail from '../applications/OregonTrail';
import Scrabble from '../applications/Scrabble';
import Wordle from '../applications/Wordle';

export interface GameEntry {
    key: string;
    name: string;
    icon: IconName;
    component: React.FC<any>;
}

export const GAMES: GameEntry[] = [
    {
        key: 'minesweeper',
        name: 'Minesweeper',
        icon: 'minesweeperIcon',
        component: Minesweeper,
    },
    {
        key: 'doom',
        name: 'Doom',
        icon: 'doomIcon',
        component: Doom,
    },
    {
        key: 'trail',
        name: 'Oregon Trail',
        icon: 'trailIcon',
        component: OregonTrail,
    },
    {
        key: 'scrabble',
        name: 'Scrabble',
        icon: 'scrabbleIcon',
        component: Scrabble,
    },
    {
        key: 'wordle',
        name: 'Wordle',
        icon: 'wordleIcon',
        component: Wordle,
    },
];
```

- [ ] **Step 2: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add inner/src/components/os/games.ts
git commit -m "Add Start Menu games registry"
```

---

### Task 7: Wire the Games flyout into the Start Menu

**Files:**
- Modify: `inner/src/components/os/Toolbar.tsx`
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- Consumes: `GAMES` (Task 6), `openWindow`/`focusWindow`/`closeWindow`/`minimizeWindow` from `useWindowManager()` (already available in `DesktopInner`, per `inner/src/contexts/WindowManagerContext.tsx`: `openWindow(key: string, name: string, icon: IconName, element: JSX.Element): void`, `focusWindow`/`closeWindow`/`minimizeWindow(key: string): void`).
- Produces: `Toolbar`'s prop interface gains `openWindow`, `focusWindow`, `closeWindow`, `minimizeWindow`; no other file consumes this (final wiring step).

- [ ] **Step 1: Pass window-manager functions from Desktop.tsx to Toolbar**

Read `inner/src/components/os/Desktop.tsx` first. Find the `<Toolbar ... />`
render call (currently passing `windows`, `toggleMinimize`, `shutdown={startShutdown}`)
and add the 4 additional props:

```tsx
            <Toolbar
                windows={windows}
                toggleMinimize={toggleMinimize}
                shutdown={startShutdown}
                openWindow={openWindow}
                focusWindow={focusWindow}
                closeWindow={closeWindow}
                minimizeWindow={minimizeWindow}
            />
```

(`openWindow`, `focusWindow`, `closeWindow`, `minimizeWindow` are already
destructured from `useWindowManager()` at the top of `DesktopInner` — no new
import needed in `Desktop.tsx`.)

- [ ] **Step 2: Extend Toolbar's props and add the Games flyout**

Read `inner/src/components/os/Toolbar.tsx` first (shown in relevant part
below — modify it, don't recreate it). Add the import and extend
`ToolbarProps`:

```ts
import { GAMES } from './games';
```

```ts
export interface ToolbarProps {
    windows: DesktopWindows;
    toggleMinimize: (key: string) => void;
    shutdown: () => void;
    openWindow: (key: string, name: string, icon: IconName, element: JSX.Element) => void;
    focusWindow: (key: string) => void;
    closeWindow: (key: string) => void;
    minimizeWindow: (key: string) => void;
}
```

(`IconName` needs importing: `import { IconName } from '../../assets/icons';`)

Update the component signature to destructure the new props:

```ts
const Toolbar: React.FC<ToolbarProps> = ({
    windows,
    toggleMinimize,
    shutdown,
    openWindow,
    focusWindow,
    closeWindow,
    minimizeWindow,
}) => {
```

Add a `gamesMenuOpen` state near the existing `startWindowOpen` state:

```ts
    const [gamesMenuOpen, setGamesMenuOpen] = useState(false);
```

Add a handler that opens a game and closes both menus:

```ts
    const openGame = (game: (typeof GAMES)[number]) => {
        openWindow(
            game.key,
            game.name,
            game.icon,
            <game.component
                onInteract={() => focusWindow(game.key)}
                onMinimize={() => minimizeWindow(game.key)}
                onClose={() => closeWindow(game.key)}
                key={game.key}
            />
        );
        setGamesMenuOpen(false);
        setStartWindowOpen(false);
    };
```

In the JSX, inside `startWindowContent` (currently just
`startMenuSpace` + `startMenuLine` + the Shut down option), add a Games row
above the divider, and the flyout panel:

```tsx
                        <div style={styles.startWindowContent}>
                            <div style={styles.startMenuSpace} />
                            <div
                                style={styles.gamesRowWrapper}
                                onMouseEnter={() => setGamesMenuOpen(true)}
                                onMouseLeave={() => setGamesMenuOpen(false)}
                            >
                                {gamesMenuOpen && (
                                    <div style={styles.gamesFlyout}>
                                        <div style={styles.gamesFlyoutInner}>
                                            {GAMES.map((game) => (
                                                <div
                                                    key={game.key}
                                                    className="start-menu-option"
                                                    style={styles.startMenuOption}
                                                    onMouseDown={() => openGame(game)}
                                                >
                                                    <Icon
                                                        style={styles.startMenuIcon}
                                                        icon={game.icon}
                                                    />
                                                    <p style={styles.startMenuText}>
                                                        {game.name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div
                                    className="start-menu-option"
                                    style={styles.startMenuOption}
                                >
                                    <Icon
                                        style={styles.startMenuIcon}
                                        icon="windowGameIcon"
                                    />
                                    <p style={styles.startMenuText}>
                                        Games <span style={styles.gamesArrow}>▸</span>
                                    </p>
                                </div>
                            </div>
                            <div style={styles.startMenuLine} />
                            <div
                                className="start-menu-option"
                                style={styles.startMenuOption}
                                onMouseDown={shutdown}
                            >
                                <Icon
                                    style={styles.startMenuIcon}
                                    icon="computerBig"
                                />
                                <p style={styles.startMenuText}>
                                    Sh<u>u</u>t down...
                                </p>
                            </div>
                        </div>
```

Add these styles to the `styles` object (`StyleSheetCSS`), placed near the
existing `startMenuOption`/`startMenuIcon`/`startMenuText` entries:

```ts
    gamesRowWrapper: {
        position: 'relative',
    },
    gamesFlyout: {
        position: 'absolute',
        left: '100%',
        bottom: 0,
        boxSizing: 'border-box',
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        background: Colors.lightGray,
        minWidth: 180,
    },
    gamesFlyoutInner: {
        border: `1px solid ${Colors.lightGray}`,
        borderBottomColor: Colors.darkGray,
        borderRightColor: Colors.darkGray,
        flexDirection: 'column',
        flex: 1,
    },
    gamesArrow: {
        float: 'right',
    },
```

- [ ] **Step 3: Type-check**

Run: `cd inner && npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add inner/src/components/os/Toolbar.tsx inner/src/components/os/Desktop.tsx
git commit -m "Add Games flyout submenu to the Start Menu"
```

---

### Task 8: End-to-end verification

**Files:** none (verification only).

**Interfaces:** none — exercises the full path built by Tasks 1-7.

- [ ] **Step 1: Production build**

```bash
cd inner
npm run build
```

Expected: `Compiled successfully` (warnings OK, no errors). This is the
first point where the ~15MB of restored js-dos/`.jsdos` assets flow through
the full production build — confirm the build doesn't fail or hang.

- [ ] **Step 2: Start the dev server and verify the Start Menu**

```bash
npm start
```

Open `http://localhost:3000`. Click "Start". Confirm:
- A "Games ▸" row appears above "Shut down...".
- Hovering "Games ▸" opens a flyout listing Minesweeper, Doom, Oregon
  Trail, Scrabble, Wordle, each with its own icon.
- No new desktop shortcuts appeared for any of these 5 games.

- [ ] **Step 3: Verify each game launches and plays**

For each of the 5 games: click it from the flyout, confirm a window opens
with the correct title/icon and standard chrome (drag, resize, minimize,
maximize, close).

- Minesweeper: left-click reveals a cell (flood-fills zero-adjacency
  regions), right-click flags/unflags a cell (mine counter updates),
  clicking a mine ends the game (all mines reveal, face shows 😵),
  revealing all non-mine cells wins (face shows 😎), clicking the face
  resets the board, timer counts up while playing.
- Doom: the DOS emulator boots and the game is playable with
  keyboard/mouse input.
- Oregon Trail: same — emulator boots and is playable.
- Scrabble: same — emulator boots and is playable.
- Wordle: can type a guess, submit it, see letter-state coloring, and
  reach a win/lose state.

- [ ] **Step 4: Verify existing apps unaffected**

Confirm "My Details", "Credits", and "Settings" desktop shortcuts still
work exactly as before, and the Settings → Display wallpaper picker (from
the prior plan) still functions.

- [ ] **Step 5: Final status check**

```bash
cd D:\Prog\Portfolio
git status
git log --oneline -10
```

Expected: working tree clean (aside from any pre-existing untracked
files), and a commit for each of Tasks 1-7 visible in the log.

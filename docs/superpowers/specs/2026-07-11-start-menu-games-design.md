# Start Menu Games Submenu — Design

## Problem

The desktop OS ("RahulOS") has a Start Menu (`inner/src/components/os/Toolbar.tsx`)
with only a "Shut down..." option. Five games should be reachable from a
Windows-98-style cascading "Games" submenu inside it — not as desktop icons.

## Goal

Clicking/hovering a "Games" row in the Start Menu opens a cascading flyout
listing 5 games. Clicking a game opens it as a normal managed window (same
`WindowManagerContext` path as every other app).

## Non-goals

- No desktop shortcuts for any of these 5 games.
- No changes to the existing "Shut down..." entry or `WindowManagerContext`.
- No new window system — games use the existing `Window` component exactly
  like `Credits.tsx`/`Settings.tsx`.
- `ThisComputer.tsx` (the old retro-Google iframe app) is NOT restored — it
  isn't a game and wasn't requested.

## Games (5)

1. **Minesweeper** — ported fresh from `risterz/windows98-emulator` (MIT
   licensed, confirmed via `gh api`). Core game logic (grid generation, flood
   fill, flag/reveal, win/lose, timer, mine counter) adapted from
   `components/apps/minesweeper.tsx`, rewritten to this repo's `Window`/style
   conventions per the same process used for the Settings app.
2. **Doom** — recovered from this repo's own git history (removed in commit
   `e34fd92`; recovered from `e34fd92~1`). Runs via the `js-dos` emulator.
3. **Oregon Trail** — recovered the same way, also via `js-dos`.
4. **Scrabble** — recovered the same way, also via `js-dos`.
5. **Wordle** (renamed from "Henordle" — dropping Henry-specific branding,
   consistent with this repo's existing renames like `HeffernanOS`→`RahulOS`)
   — recovered the same way; pure React, no emulator.

Attribution: Doom/Oregon Trail/Scrabble/Wordle originate from
`henryjeff/portfolio-inner-site` (no LICENSE file present; this project is
already an extensive, credited derivative of that repo — Henry is already
listed in the Credits app's Inspiration section). Minesweeper is adapted from
`risterz/windows98-emulator`, MIT licensed.

## Architecture

### 1. Recovering the 4 legacy games

Recovered directly via `git show e34fd92~1:<path>` for each file (not
re-fetched from Henry's remote repo — they're already fully adapted to this
codebase's `WindowAppProps`/`Window` pattern from when they lived here
before):

- `inner/src/components/applications/Doom.tsx`
- `inner/src/components/applications/OregonTrail.tsx`
- `inner/src/components/applications/Scrabble.tsx`
- `inner/src/components/dos/DosPlayer.tsx` (shared js-dos wrapper consumed by
  the 3 DOS games)
- `inner/src/components/wordle/Wordle.tsx` and `Wordle.tsx`'s data file
  `inner/src/components/wordle/Words.ts`
- `inner/src/components/applications/Henordle.tsx` → recovered then renamed
  to `Wordle.tsx` at the applications level (renamed from `HenordleApp` to
  `WordleApp`, title "Henordle"→"Wordle", copyright line's mangled `Â©`
  byte-sequence fixed to a clean `©` while restoring)
- Icons: `doomIcon.png`, `henordleIcon.png`→`wordleIcon.png`,
  `scrabbleIcon.png`, `trailIcon.png`, `windowGameIcon.png`
- Binaries: `inner/public/doom.jsdos`, `inner/public/scrabble.jsdos`,
  `inner/public/trail.jsdos` (NOT `digger.jsdos` — confirmed it had no
  consumer before removal, stays removed)
- Runtime: `inner/public/js-dos/` (the emulator runtime directory)
- `index.html`'s `<script>`/`<link>` tags for js-dos (re-added, mirroring
  what commit `e34fd92` removed)
- npm deps: `js-dos` and `emulators-ui`, reinstalled via `npm install` so
  `package-lock.json` stays consistent (mirrors how the removal commit
  uninstalled them properly)

### 2. Minesweeper (fresh port)

New `inner/src/components/applications/Minesweeper.tsx` — game logic (board
generation with mine placement excluding first click, flood-fill reveal for
zero-adjacency cells, flagging, timer, mine counter, win/lose state) adapted
from `risterz/windows98-emulator`'s `components/apps/minesweeper.tsx`,
restyled with `Colors`/inline `StyleSheetCSS` objects and wrapped in `Window`
exactly like `Credits.tsx`. A short attribution comment at the top of the file
notes the source repo and its MIT license.

New icon: `minesweeperIcon.png`, generated the same way `settingsIcon.png`
was (small pixel-art PNG via a throwaway Node/zlib script, no image
libraries) — grid-of-mines motif, since no icon exists to port for this one.

### 3. Games registry

New `inner/src/components/os/games.ts`:

```ts
export interface GameEntry {
    key: string;
    name: string;
    icon: IconName;
    component: React.FC<any>; // WindowAppProps-compatible
}

export const GAMES: GameEntry[] = [
    { key: 'minesweeper', name: 'Minesweeper', icon: 'minesweeperIcon', component: Minesweeper },
    { key: 'doom', name: 'Doom', icon: 'doomIcon', component: Doom },
    { key: 'trail', name: 'Oregon Trail', icon: 'trailIcon', component: OregonTrail },
    { key: 'scrabble', name: 'Scrabble', icon: 'scrabbleIcon', component: Scrabble },
    { key: 'wordle', name: 'Wordle', icon: 'wordleIcon', component: Wordle },
];
```

This mirrors `Desktop.tsx`'s existing `APPLICATIONS` shape/pattern, kept
separate since games are launched from the Start Menu, not the desktop
shortcut loop.

### 4. Start Menu wiring

`Toolbar.tsx` currently only receives `windows`, `toggleMinimize`, `shutdown`
as props — it has no way to open a new window today (that's only wired in
`Desktop.tsx`'s shortcut-click handlers). `Toolbar` needs `openWindow`,
`focusWindow`, `closeWindow`, `minimizeWindow` passed down from
`DesktopInner` (which already has them from `useWindowManager()`), the same
four functions `Desktop.tsx` already uses to wire desktop shortcuts.

Inside `Toolbar.tsx`:
- Add a `gamesMenuOpen` state (boolean), toggled on hover/click of a new
  "Games ▸" row rendered inside the existing `startWindowContent`, above the
  "Shut down..." line (with a `startMenuLine` divider, matching the existing
  structure).
- When `gamesMenuOpen`, render a second flyout panel (`styles.gamesFlyout`,
  positioned `absolute`, anchored to the right edge of the Games row,
  `Colors.lightGray` background with the same beveled border technique
  already used for `startWindow`) listing `GAMES.map(...)`, each row an
  icon + label matching the existing `startMenuOption`/`startMenuIcon`/
  `startMenuText` styling, `onMouseDown` opening the game via
  `openWindow(game.key, game.name, game.icon, <game.component ... />)` (same
  call shape `Desktop.tsx` uses for shortcuts) and closing both the flyout
  and the Start Menu.
- Flyout opens on hover (`onMouseEnter`) for authenticity, closes on
  `onMouseLeave` of the combined Games-row-plus-flyout area (not on every
  individual row's mouseleave, to avoid flicker while moving the cursor
  from the row into the flyout).

## Testing / Verification

- `cd inner && npx tsc --noEmit` — no errors.
- `cd inner && npm run build` — clean (this will surface if the ~15MB of
  restored js-dos assets cause any build issues).
- Manual (`npm start`, `localhost:3000`):
  - Start Menu shows "Games ▸" above "Shut down...".
  - Hovering "Games ▸" opens a flyout listing all 5 games with correct
    icons/labels.
  - Clicking each game opens it as a managed window (draggable, resizable,
    minimizes to taskbar, closes) — same chrome as every other app.
  - Minesweeper: full game loop (reveal, flag, flood-fill, win, lose, timer,
    mine counter) works correctly.
  - Doom/Oregon Trail/Scrabble: js-dos boots and the DOS game is playable.
  - Wordle: guess submission, letter-state coloring, win/lose all work.
  - No games appear as desktop shortcuts.
  - Existing apps (My Details, Credits, Settings) and "Shut down..." are
    unaffected.

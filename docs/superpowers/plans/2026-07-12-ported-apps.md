# Remaining Ported Apps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Finish the original "port apps from open-source Windows 98 repos" spec by delivering the four apps not yet built — Notepad, Calculator, Paint, and My Computer/File Explorer — each opening/closing/minimizing through the existing `WindowManagerContext` and matching this repo's visual language exactly.

**Context — what's already done from the original spec:**
- **Minesweeper** — shipped (`inner/src/components/applications/Minesweeper.tsx`, adapted from `risterz/windows98-emulator`). Per a later, deliberate plan (`2026-07-11-start-menu-games.md`), it is reachable only via Start Menu → Games, not a desktop shortcut. This plan does **not** change that.
- **Control Panel / Settings** — shipped, but built independently (Settings app shell + Explorer-style Control Panel chrome + theme system) rather than literally ported from `packard-belle-desktop`. Functionally equivalent to the spec's ask (Display/Personalization panels, background changer). Not touched by this plan.
- **Notepad, Calculator, Paint, My Computer/File Explorer** — not started. This plan builds all four.

**Architecture:** Each app is a standalone `React.FC<WindowAppProps>` in `inner/src/components/applications/`, wrapped in the existing `<Window>` chrome exactly like `Credits.tsx`/`CertificateViewer.tsx`, registered in `Desktop.tsx`'s `APPLICATIONS` object so it gets a desktop shortcut. Calculator's arithmetic logic is adapted from `risterz/windows98-emulator` (MIT) with an attribution comment, matching the convention `Minesweeper.tsx` already established. Notepad and Paint have no viable MIT source (per the original spec) and are built from scratch. My Computer is a small virtual file tree built from scratch, wired to the real `CERTS` data (`Certifications.tsx`) and the real resume PDF asset — reusing `SettingsTile` for its icon grid and the same `openWindow(...CertificateViewer...)` pattern `FileActions.tsx` already uses for opening a file.

**Tech Stack:** React 17, TypeScript, no new npm packages, no new UI library. Icons generated as small pixel-art PNGs via a scratch Python/PIL script (matching how `minesweeperIcon.png` etc. were generated — see `git show 007890e`), not committed to the repo.

## Global Constraints

- Match existing code style exactly: inline `style={...}` objects typed via the global `StyleSheetCSS` interface, `React.FC<Props>` components, `Colors` from `inner/src/constants/colors.ts`, `.site-button` CSS class for buttons (defined in `inner/src/index.css`), `MSSerif` font for chrome text.
- No test framework exists in `inner/src` — verification per task is `cd inner && npx tsc --noEmit`; the final task also runs `npm run build` and a live dev-server check.
- Every app must open/close/minimize/focus only through the existing `WindowManagerContext` (`useWindowManager`/`WindowAppProps`) — do not build a second window system.
- Do not introduce a new UI library or CSS framework.
- Do not modify `outer/`.
- Register each finished app in the `APPLICATIONS` object in `inner/src/components/os/Desktop.tsx`, in this order, after the existing `showcase`/`credits`/`settings` entries: Notepad, Calculator, Paint, My Computer.
- New icons go through the existing `icons/index.ts` pattern (`inner/src/assets/icons/<name>.png` + an entry in the `icons` object). Generate them with a scratch script (Python+PIL, already confirmed available in this environment) and delete the script when done — do not commit it.
- Add a short attribution comment at the top of `Calculator.tsx` noting it's adapted from `risterz/windows98-emulator` and linking its license, matching `Minesweeper.tsx`'s existing comment.
- **Before running any `git commit`, check with the user first** — this plan is not pre-authorized for autonomous commits (unlike the Settings/Wallpaper/Games plans), since the user has an explicit "don't auto-commit" preference for this repo.
- After each app (task), stop and summarize what was added (files created/modified, what was adapted vs. written fresh) before moving to the next, per the original spec's "Order of work" instruction.

---

### Task 1: Generate the four new icons

**Files:**
- Create (then keep): `inner/src/assets/icons/notepadIcon.png`, `inner/src/assets/icons/calculatorIcon.png`, `inner/src/assets/icons/paintIcon.png`, `inner/src/assets/icons/folderIcon.png`
- Modify: `inner/src/assets/icons/index.ts`
- Create (then delete): a scratch Python script, anywhere outside the repo (e.g. the session scratchpad dir)

**Interfaces:**
- Produces: 4 new `IconName` values — `'notepadIcon'`, `'calculatorIcon'`, `'paintIcon'`, `'folderIcon'` — consumed by Tasks 2-5. (My Computer's own shortcut reuses the existing `'computerBig'` icon — no new icon needed for it.)

- [ ] **Step 1** Write this script to a scratch path (e.g. `<scratchpad>/gen_icons.py`) and run it with `python <path>`:

```python
from PIL import Image, ImageDraw

def save_indexed(img, path):
    # Match the existing icons' tiny palette-PNG footprint (~150-250 bytes).
    img.convert('P', palette=Image.ADAPTIVE, colors=16).save(path, optimize=True)

# --- notepadIcon: white page, folded corner, blue ruled lines ---
img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rectangle([5, 2, 26, 29], fill=(255, 255, 255, 255), outline=(134, 137, 141, 255))
d.polygon([(20, 2), (26, 2), (26, 8)], fill=(195, 198, 202, 255))
d.line([(20, 2), (20, 8), (26, 8)], fill=(134, 137, 141, 255))
for y in range(12, 26, 3):
    d.line([(8, y), (23, y)], fill=(0, 0, 163, 255))
save_indexed(img, 'notepadIcon.png')

# --- calculatorIcon: dark body, screen, button grid ---
img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rectangle([4, 2, 27, 29], fill=(134, 137, 141, 255), outline=(0, 0, 0, 255))
d.rectangle([7, 5, 24, 11], fill=(195, 222, 195, 255), outline=(0, 0, 0, 255))
for row in range(4):
    for col in range(3):
        x0 = 7 + col * 6
        y0 = 15 + row * 4
        d.rectangle([x0, y0, x0 + 4, y0 + 2], fill=(255, 255, 255, 255))
save_indexed(img, 'calculatorIcon.png')

# --- paintIcon: canvas + palette blob + brush stroke ---
img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rectangle([3, 4, 22, 23], fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))
d.line([(5, 20), (20, 6)], fill=(0, 0, 163, 255), width=2)
d.ellipse([16, 16, 29, 27], fill=(195, 198, 202, 255), outline=(0, 0, 0, 255))
d.ellipse([19, 19, 22, 22], fill=(255, 0, 0, 255))
d.ellipse([22, 21, 25, 24], fill=(0, 163, 0, 255))
d.ellipse([19, 22, 22, 25], fill=(255, 255, 0, 255))
save_indexed(img, 'paintIcon.png')

# --- folderIcon: classic yellow folder ---
img = Image.new('RGBA', (32, 32), (0, 0, 0, 0))
d = ImageDraw.Draw(img)
d.rectangle([3, 10, 29, 26], fill=(222, 179, 33, 255), outline=(0, 0, 0, 255))
d.polygon([(3, 10), (10, 10), (13, 7), (29, 7), (29, 10)], fill=(255, 214, 79, 255), outline=(0, 0, 0, 255))
save_indexed(img, 'folderIcon.png')

print('done')
```

- [ ] **Step 2** Move the 4 generated PNGs into `inner/src/assets/icons/`.
- [ ] **Step 3** In `inner/src/assets/icons/index.ts`, add the 4 imports and registry entries, e.g.:

```ts
import notepadIcon from './notepadIcon.png';
import calculatorIcon from './calculatorIcon.png';
import paintIcon from './paintIcon.png';
import folderIcon from './folderIcon.png';
```

and inside the `icons` object:

```ts
    notepadIcon: notepadIcon,
    calculatorIcon: calculatorIcon,
    paintIcon: paintIcon,
    folderIcon: folderIcon,
```

- [ ] **Step 4** `cd inner && npx tsc --noEmit` clean. Delete the scratch script. Stop and summarize (files created, icon appearance) before Task 2.

---

### Task 2: Notepad

**Files:**
- Create: `inner/src/components/applications/Notepad.tsx`
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- `Notepad: React.FC<WindowAppProps>` (no extra props — matches `Credits.tsx`'s shape).

- [ ] **Step 1** Create `inner/src/components/applications/Notepad.tsx`:

```tsx
import React, { useCallback, useRef, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface NotepadProps extends WindowAppProps {}

const DEFAULT_FILENAME = 'Untitled.txt';

const Notepad: React.FC<NotepadProps> = (props) => {
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState(DEFAULT_FILENAME);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const handleNew = useCallback(() => {
        setText('');
        setFileName(DEFAULT_FILENAME);
        textAreaRef.current?.focus();
    }, []);

    const handleSave = useCallback(() => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || DEFAULT_FILENAME;
        a.click();
        URL.revokeObjectURL(url);
    }, [text, fileName]);

    return (
        <Window
            top={120}
            left={160}
            width={480}
            height={400}
            windowTitle={`Notepad - ${fileName}`}
            windowBarIcon="notepadIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <div style={styles.container}>
                <div style={styles.toolbar}>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={handleNew}
                    >
                        New
                    </button>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <input
                        style={styles.filenameInput}
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        spellCheck={false}
                    />
                </div>
                <textarea
                    ref={textAreaRef}
                    style={styles.textArea}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    spellCheck={false}
                />
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        flexDirection: 'column',
        boxSizing: 'border-box',
    },
    toolbar: {
        width: '100%',
        alignItems: 'center',
        padding: 6,
        borderBottom: `1px solid ${Colors.darkGray}`,
        flexShrink: 0,
        boxSizing: 'border-box',
    },
    toolbarButton: {
        minWidth: 56,
        height: 26,
        marginRight: 6,
    },
    filenameInput: {
        marginLeft: 'auto',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        padding: '3px 6px',
        fontFamily: 'MSSerif',
        fontSize: 12,
        width: 160,
    },
    textArea: {
        flex: 1,
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        border: 'none',
        outline: 'none',
        resize: 'none',
        padding: 8,
        fontFamily: 'Consolas, monospace',
        fontSize: 13,
        boxSizing: 'border-box',
        backgroundColor: Colors.white,
        color: Colors.black,
    },
};

export default Notepad;
```

- [ ] **Step 2** In `inner/src/components/os/Desktop.tsx`, add the import (`import Notepad from '../applications/Notepad';`) and register it in `APPLICATIONS`, immediately after `settings`:

```ts
    notepad: {
        key: 'notepad',
        name: 'Notepad',
        shortcutIcon: 'notepadIcon',
        component: Notepad,
    },
```

- [ ] **Step 3** `cd inner && npx tsc --noEmit` clean. Stop and summarize before Task 3.

---

### Task 3: Calculator

**Files:**
- Create: `inner/src/components/applications/Calculator.tsx`
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- `Calculator: React.FC<WindowAppProps>`.

- [ ] **Step 1** Create `inner/src/components/applications/Calculator.tsx`:

```tsx
// Arithmetic logic adapted from risterz/windows98-emulator
// (https://github.com/risterz/windows98-emulator), MIT licensed:
// https://github.com/risterz/windows98-emulator/blob/master/LICENSE
// Window chrome, styling, and app wiring are original to this repo.
import React, { useCallback, useEffect, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface CalculatorProps extends WindowAppProps {}

type Operator = '+' | '-' | '*' | '/';

const applyOperator = (a: number, b: number, op: Operator): number => {
    switch (op) {
        case '+':
            return a + b;
        case '-':
            return a - b;
        case '*':
            return a * b;
        case '/':
            return b === 0 ? NaN : a / b;
    }
};

const Calculator: React.FC<CalculatorProps> = (props) => {
    const [display, setDisplay] = useState('0');
    const [operand, setOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<Operator | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);

    const inputDigit = useCallback(
        (digit: string) => {
            if (waitingForOperand) {
                setDisplay(digit);
                setWaitingForOperand(false);
            } else {
                setDisplay(display === '0' ? digit : display + digit);
            }
        },
        [display, waitingForOperand]
    );

    const inputDecimal = useCallback(() => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
            return;
        }
        if (!display.includes('.')) {
            setDisplay(display + '.');
        }
    }, [display, waitingForOperand]);

    const clear = useCallback(() => {
        setDisplay('0');
        setOperand(null);
        setOperator(null);
        setWaitingForOperand(false);
    }, []);

    const toggleSign = useCallback(() => {
        setDisplay((d) => (d.startsWith('-') ? d.slice(1) : d === '0' ? d : '-' + d));
    }, []);

    const inputPercent = useCallback(() => {
        setDisplay((d) => String(parseFloat(d) / 100));
    }, []);

    const backspace = useCallback(() => {
        setDisplay((d) => (d.length > 1 ? d.slice(0, -1) : '0'));
    }, []);

    const performOperator = useCallback(
        (nextOperator: Operator | '=') => {
            const inputValue = parseFloat(display);

            if (operand === null) {
                setOperand(inputValue);
            } else if (operator) {
                const result = applyOperator(operand, inputValue, operator);
                setDisplay(String(result));
                setOperand(nextOperator === '=' ? null : result);
            }

            setWaitingForOperand(true);
            setOperator(nextOperator === '=' ? null : nextOperator);
        },
        [display, operand, operator]
    );

    useEffect(() => {
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key >= '0' && e.key <= '9') {
                inputDigit(e.key);
            } else if (e.key === '.') {
                inputDecimal();
            } else if (['+', '-', '*', '/'].includes(e.key)) {
                performOperator(e.key as Operator);
            } else if (e.key === 'Enter' || e.key === '=') {
                e.preventDefault();
                performOperator('=');
            } else if (e.key === 'Escape') {
                clear();
            } else if (e.key === 'Backspace') {
                backspace();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [inputDigit, inputDecimal, performOperator, clear, backspace]);

    const buttons: { label: string; onClick: () => void; wide?: boolean }[] = [
        { label: 'C', onClick: clear },
        { label: '+/-', onClick: toggleSign },
        { label: '%', onClick: inputPercent },
        { label: '/', onClick: () => performOperator('/') },
        { label: '7', onClick: () => inputDigit('7') },
        { label: '8', onClick: () => inputDigit('8') },
        { label: '9', onClick: () => inputDigit('9') },
        { label: '*', onClick: () => performOperator('*') },
        { label: '4', onClick: () => inputDigit('4') },
        { label: '5', onClick: () => inputDigit('5') },
        { label: '6', onClick: () => inputDigit('6') },
        { label: '-', onClick: () => performOperator('-') },
        { label: '1', onClick: () => inputDigit('1') },
        { label: '2', onClick: () => inputDigit('2') },
        { label: '3', onClick: () => inputDigit('3') },
        { label: '+', onClick: () => performOperator('+') },
        { label: '0', onClick: () => inputDigit('0'), wide: true },
        { label: '.', onClick: inputDecimal },
        { label: '=', onClick: () => performOperator('=') },
    ];

    return (
        <Window
            top={140}
            left={220}
            width={220}
            height={300}
            windowTitle="Calculator"
            windowBarIcon="calculatorIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <div style={styles.container}>
                <div style={styles.display}>{display}</div>
                <div style={styles.grid}>
                    {buttons.map((b, i) => (
                        <button
                            key={i}
                            className="site-button"
                            style={Object.assign(
                                {},
                                styles.button,
                                b.wide && styles.buttonWide
                            )}
                            onClick={b.onClick}
                        >
                            {b.label}
                        </button>
                    ))}
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        width: '100%',
        flexDirection: 'column',
        padding: 8,
        boxSizing: 'border-box',
        backgroundColor: Colors.lightGray,
    },
    display: {
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        backgroundColor: Colors.white,
        color: Colors.black,
        fontFamily: 'Consolas, monospace',
        fontSize: 20,
        padding: '6px 8px',
        marginBottom: 8,
        textAlign: 'right',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
    },
    grid: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
    },
    button: {
        width: '23%',
        height: 36,
        margin: '1%',
        fontSize: 14,
    },
    buttonWide: {
        width: '48%',
    },
};

export default Calculator;
```

- [ ] **Step 2** In `inner/src/components/os/Desktop.tsx`, add the import and register it in `APPLICATIONS`, immediately after `notepad`:

```ts
    calculator: {
        key: 'calculator',
        name: 'Calculator',
        shortcutIcon: 'calculatorIcon',
        component: Calculator,
    },
```

- [ ] **Step 3** `cd inner && npx tsc --noEmit` clean. Stop and summarize before Task 4.

---

### Task 4: Paint

**Files:**
- Create: `inner/src/components/applications/Paint.tsx`
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- `Paint: React.FC<WindowAppProps>`.

- [ ] **Step 1** Create `inner/src/components/applications/Paint.tsx`:

```tsx
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface PaintProps extends WindowAppProps {}

const PALETTE = [
    '#000000', '#808080', '#FF0000', '#00A300',
    '#0000A3', '#FFFF00', '#FFA500', '#FFFFFF',
];
const BRUSH_SIZES = [1, 3, 5, 8];
const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 380;

const Paint: React.FC<PaintProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const [color, setColor] = useState(PALETTE[0]);
    const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getPoint = useCallback((e: MouseEvent | React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    const draw = useCallback(
        (point: { x: number; y: number }) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!ctx) return;
            const last = lastPointRef.current || point;
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            lastPointRef.current = point;
        },
        [color, brushSize]
    );

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            isDrawingRef.current = true;
            const point = getPoint(e);
            lastPointRef.current = point;
            draw(point);
        },
        [getPoint, draw]
    );

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!isDrawingRef.current) return;
            draw(getPoint(e));
        };
        const onUp = () => {
            isDrawingRef.current = false;
            lastPointRef.current = null;
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [getPoint, draw]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const saveAsPng = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'painting.png';
        a.click();
    }, []);

    return (
        <Window
            top={100}
            left={120}
            width={640}
            height={520}
            windowTitle="Paint"
            windowBarIcon="paintIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <div style={styles.container}>
                <div style={styles.toolbar}>
                    <div style={styles.palette}>
                        {PALETTE.map((c) => (
                            <div
                                key={c}
                                onMouseDown={() => setColor(c)}
                                style={Object.assign(
                                    {},
                                    styles.swatch,
                                    { backgroundColor: c },
                                    color === c && styles.swatchSelected
                                )}
                            />
                        ))}
                    </div>
                    <div style={styles.brushGroup}>
                        {BRUSH_SIZES.map((size) => (
                            <button
                                key={size}
                                className="site-button"
                                style={Object.assign(
                                    {},
                                    styles.brushButton,
                                    brushSize === size && styles.brushButtonSelected
                                )}
                                onClick={() => setBrushSize(size)}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: size,
                                        height: size,
                                        borderRadius: '50%',
                                        backgroundColor: Colors.black,
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                    <button
                        className="site-button"
                        style={styles.actionButton}
                        onClick={clearCanvas}
                    >
                        Clear
                    </button>
                    <button
                        className="site-button"
                        style={styles.actionButton}
                        onClick={saveAsPng}
                    >
                        Save as PNG
                    </button>
                </div>
                <div style={styles.canvasWrapper}>
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        style={styles.canvas}
                        onMouseDown={onMouseDown}
                    />
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        flexDirection: 'column',
        boxSizing: 'border-box',
    },
    toolbar: {
        alignItems: 'center',
        padding: 6,
        borderBottom: `1px solid ${Colors.darkGray}`,
        flexShrink: 0,
        boxSizing: 'border-box',
    },
    palette: {
        flexDirection: 'row',
        marginRight: 12,
    },
    swatch: {
        width: 20,
        height: 20,
        marginRight: 4,
        border: `1px solid ${Colors.black}`,
        cursor: 'pointer',
        boxSizing: 'border-box',
    },
    swatchSelected: {
        border: `2px solid ${Colors.blue}`,
    },
    brushGroup: {
        flexDirection: 'row',
        marginRight: 12,
    },
    brushButton: {
        width: 30,
        height: 26,
        marginRight: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brushButtonSelected: {
        backgroundColor: Colors.darkGray,
    },
    actionButton: {
        height: 26,
        marginRight: 8,
    },
    canvasWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.darkGray,
        overflow: 'auto',
        padding: 8,
        boxSizing: 'border-box',
    },
    canvas: {
        backgroundColor: Colors.white,
        cursor: 'crosshair',
        boxShadow: '0 0 4px rgba(0,0,0,0.5)',
    },
};

export default Paint;
```

- [ ] **Step 2** In `inner/src/components/os/Desktop.tsx`, add the import and register it in `APPLICATIONS`, immediately after `calculator`:

```ts
    paint: {
        key: 'paint',
        name: 'Paint',
        shortcutIcon: 'paintIcon',
        component: Paint,
    },
```

- [ ] **Step 3** `cd inner && npx tsc --noEmit` clean. Stop and summarize before Task 5.

---

### Task 5: My Computer / File Explorer

**Files:**
- Modify: `inner/src/components/showcase/Certifications.tsx` — export `CERTS` and `CertCardProps` so My Computer can reuse the real data instead of duplicating it
- Create: `inner/src/components/applications/MyComputer.tsx`
- Modify: `inner/src/components/os/Desktop.tsx`

**Interfaces:**
- `MyComputer: React.FC<WindowAppProps>`.
- Reuses `SettingsTile` (`inner/src/components/settings/SettingsTile.tsx`) verbatim for the icon grid — same props it already has: `icon`, `label`, `selected`, `dimmed`, `iconSize`, `onSelect`, `onOpen`.
- Reuses `CertificateViewer` (`inner/src/components/applications/CertificateViewer.tsx`) the same way `FileActions.tsx` does, via `useWindowManager().openWindow(...)`.

- [ ] **Step 1** In `inner/src/components/showcase/Certifications.tsx`, export the interface and the data array (no behavior change, just visibility):

```ts
export interface CertCardProps {
```

```ts
export const CERTS: CertCardProps[] = [
```

- [ ] **Step 2** Create `inner/src/components/applications/MyComputer.tsx`:

```tsx
import React, { useCallback, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';
import { IconName } from '../../assets/icons';
import SettingsTile from '../settings/SettingsTile';
import CertificateViewer from './CertificateViewer';
import { useWindowManager } from '../../contexts/WindowManagerContext';
import { CERTS } from '../showcase/Certifications';

export interface MyComputerProps extends WindowAppProps {}

interface FolderNode {
    type: 'folder';
    name: string;
    icon: IconName;
    children: FSNode[];
}
interface FileNode {
    type: 'file';
    name: string;
    icon: IconName;
    filePath: string;
    fileType: 'pdf' | 'image';
}
type FSNode = FolderNode | FileNode;

const getFileType = (filePath: string): 'pdf' | 'image' => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? 'image' : 'pdf';
};

const ROOT: FolderNode = {
    type: 'folder',
    name: 'My Computer',
    icon: 'computerBig',
    children: [
        {
            type: 'folder',
            name: 'Local Disk (C:)',
            icon: 'folderIcon',
            children: [
                {
                    type: 'folder',
                    name: 'My Documents',
                    icon: 'folderIcon',
                    children: [
                        {
                            type: 'file',
                            name: 'Resume.pdf',
                            icon: 'fileIcon',
                            filePath: '/resume/Rahul_Krishna_A_Resume.pdf',
                            fileType: 'pdf',
                        },
                        {
                            type: 'folder',
                            name: 'Certifications',
                            icon: 'folderIcon',
                            children: CERTS.map((cert) => ({
                                type: 'file' as const,
                                name: cert.title,
                                icon: 'fileIcon' as const,
                                filePath: cert.filePath,
                                fileType: getFileType(cert.filePath),
                            })),
                        },
                    ],
                },
            ],
        },
    ],
};

const TreeRow: React.FC<{
    node: FolderNode;
    depth: number;
    path: string[];
    selectedPath: string[];
    expanded: Set<string>;
    onToggle: (key: string) => void;
    onSelect: (path: string[]) => void;
}> = ({ node, depth, path, selectedPath, expanded, onToggle, onSelect }) => {
    const key = path.join('/');
    const isExpanded = expanded.has(key);
    const isSelected = selectedPath.join('/') === key;

    return (
        <>
            <div
                style={Object.assign(
                    {},
                    styles.treeRow,
                    { paddingLeft: 8 + depth * 14 },
                    isSelected && styles.treeRowSelected
                )}
                onMouseDown={() => onSelect(path)}
            >
                <span
                    style={styles.treeToggle}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onToggle(key);
                    }}
                >
                    {node.children.some((c) => c.type === 'folder')
                        ? isExpanded
                            ? '−'
                            : '+'
                        : ''}
                </span>
                <p style={styles.treeLabel}>{node.name}</p>
            </div>
            {isExpanded &&
                node.children
                    .filter((c): c is FolderNode => c.type === 'folder')
                    .map((child) => (
                        <TreeRow
                            key={child.name}
                            node={child}
                            depth={depth + 1}
                            path={[...path, child.name]}
                            selectedPath={selectedPath}
                            expanded={expanded}
                            onToggle={onToggle}
                            onSelect={onSelect}
                        />
                    ))}
        </>
    );
};

const findNode = (root: FolderNode, path: string[]): FolderNode => {
    let current = root;
    for (const segment of path.slice(1)) {
        const next = current.children.find(
            (c): c is FolderNode => c.type === 'folder' && c.name === segment
        );
        if (!next) break;
        current = next;
    }
    return current;
};

const MyComputer: React.FC<MyComputerProps> = (props) => {
    const { windows, openWindow, focusWindow, closeWindow, minimizeWindow } =
        useWindowManager();
    const [selectedPath, setSelectedPath] = useState<string[]>([ROOT.name]);
    const [expanded, setExpanded] = useState<Set<string>>(
        new Set([ROOT.name])
    );
    const [selectedTile, setSelectedTile] = useState<string | null>(null);

    const currentFolder = findNode(ROOT, selectedPath);

    const toggleExpanded = useCallback((key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const openFile = useCallback(
        (file: FileNode) => {
            if (windows[file.filePath]) {
                focusWindow(file.filePath);
                return;
            }
            const cascadeOffset = (Object.keys(windows).length % 5) * 44;
            openWindow(
                file.filePath,
                file.name,
                'fileIcon',
                <CertificateViewer
                    fileUrl={file.filePath}
                    fileName={file.name}
                    fileType={file.fileType}
                    cascadeOffset={cascadeOffset}
                    onInteract={() => focusWindow(file.filePath)}
                    onMinimize={() => minimizeWindow(file.filePath)}
                    onClose={() => closeWindow(file.filePath)}
                    key={file.filePath}
                />
            );
        },
        [windows, openWindow, focusWindow, closeWindow, minimizeWindow]
    );

    return (
        <Window
            top={90}
            left={140}
            width={640}
            height={460}
            windowTitle="My Computer"
            windowBarIcon="windowExplorerIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <div style={styles.container}>
                <div style={styles.treePane}>
                    <TreeRow
                        node={ROOT}
                        depth={0}
                        path={[ROOT.name]}
                        selectedPath={selectedPath}
                        expanded={expanded}
                        onToggle={toggleExpanded}
                        onSelect={setSelectedPath}
                    />
                </div>
                <div style={styles.gridPane}>
                    {currentFolder.children.map((child) => (
                        <SettingsTile
                            key={child.name}
                            icon={child.icon}
                            label={child.name}
                            selected={selectedTile === child.name}
                            dimmed={false}
                            iconSize={32}
                            onSelect={() => setSelectedTile(child.name)}
                            onOpen={() => {
                                if (child.type === 'folder') {
                                    setSelectedPath([...selectedPath, child.name]);
                                    setExpanded(
                                        (prev) =>
                                            new Set([
                                                ...Array.from(prev),
                                                [...selectedPath, child.name].join('/'),
                                            ])
                                    );
                                } else {
                                    openFile(child);
                                }
                            }}
                        />
                    ))}
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        width: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
    },
    treePane: {
        width: 180,
        flexShrink: 0,
        flexDirection: 'column',
        borderRight: `1px solid ${Colors.darkGray}`,
        backgroundColor: Colors.white,
        overflow: 'auto',
        paddingTop: 4,
        boxSizing: 'border-box',
    },
    treeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
        paddingTop: 2,
        paddingBottom: 2,
        cursor: 'pointer',
    },
    treeRowSelected: {
        backgroundColor: Colors.blue,
    },
    treeToggle: {
        width: 12,
        fontFamily: 'monospace',
        fontSize: 11,
    },
    treeLabel: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        whiteSpace: 'nowrap',
    },
    gridPane: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: 16,
        backgroundColor: Colors.white,
        overflow: 'auto',
        boxSizing: 'border-box',
    },
};

export default MyComputer;
```

- [ ] **Step 3** In `inner/src/components/os/Desktop.tsx`, add the import and register it in `APPLICATIONS`, immediately after `paint`:

```ts
    myComputer: {
        key: 'myComputer',
        name: 'My Computer',
        shortcutIcon: 'computerBig',
        component: MyComputer,
    },
```

- [ ] **Step 4** `cd inner && npx tsc --noEmit` clean. Stop and summarize before Task 6.

---

### Task 6: Final verification

- [ ] `cd inner && npm run build` clean.
- [ ] Live dev-server pass (headless Chromium): each of the 4 new desktop shortcuts opens its window on double-click; Notepad's Save downloads a `.txt` with the typed content; Calculator computes `2 + 2 =` → `4` and responds to keyboard digit/operator/Enter input; Paint's pencil draws a stroke in the selected color/brush size and Clear empties the canvas; My Computer's tree expands `Local Disk (C:)` → `My Documents` → `Certifications` and double-clicking a certification opens it in `CertificateViewer` (same file already used elsewhere in the site).
- [ ] Regression check: existing desktop shortcuts (My Details, Credits, Settings) still auto-open/open correctly; Start Menu → Games still opens Minesweeper/Doom/etc unaffected.
- [ ] Console/page-error check (`console --errors` equivalent) across all 4 new apps.

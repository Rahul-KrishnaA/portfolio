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
        backgroundColor: 'var(--os-chrome-bg)',
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

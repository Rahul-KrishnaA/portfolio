import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from 'react';

export interface GridPosition {
    col: number;
    row: number;
}

export interface ResolvedIconPosition {
    key: string;
    position: GridPosition;
}

export interface DesktopIconPositionsContextValue {
    getPosition: (key: string, defaultIndex: number) => GridPosition;
    setPosition: (key: string, pos: GridPosition) => void;
    isOccupied: (
        pos: GridPosition,
        excludeKey: string,
        allResolvedPositions: ResolvedIconPosition[]
    ) => boolean;
}

const STORAGE_KEY = 'rahulos.desktopIconPositions';

const isValidPosition = (value: unknown): value is GridPosition => {
    return (
        !!value &&
        typeof value === 'object' &&
        typeof (value as GridPosition).col === 'number' &&
        typeof (value as GridPosition).row === 'number'
    );
};

const loadPositions = (): Record<string, GridPosition> => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return {};
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return {};

        const result: Record<string, GridPosition> = {};
        for (const key of Object.keys(parsed)) {
            const entry = (parsed as Record<string, unknown>)[key];
            // Validate each entry individually — a single malformed entry
            // must not discard the rest of the store.
            if (isValidPosition(entry)) {
                result[key] = { col: entry.col, row: entry.row };
            }
        }
        return result;
    } catch {
        return {};
    }
};

const DesktopIconPositionsContext =
    createContext<DesktopIconPositionsContextValue | null>(null);

export const DesktopIconPositionsProvider: React.FC = ({ children }) => {
    const [positions, setPositions] = useState<Record<string, GridPosition>>(
        loadPositions
    );

    const getPosition = useCallback(
        (key: string, defaultIndex: number): GridPosition => {
            const stored = positions[key];
            if (isValidPosition(stored)) return stored;
            return { col: 0, row: defaultIndex };
        },
        [positions]
    );

    const setPosition = useCallback((key: string, pos: GridPosition) => {
        setPositions((prev) => {
            const next = { ...prev, [key]: pos };
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {
                // localStorage unavailable (private mode / iframe) — keep in-memory.
            }
            return next;
        });
    }, []);

    // Collision check against the FULL resolved layout (every icon's current
    // grid cell, including icons that were never explicitly moved and are
    // therefore still sitting on their default `{ col: 0, row: defaultIndex }`
    // slot with nothing in `positions`/localStorage for them). Scanning only
    // the raw `positions` record would miss those default-position icons and
    // let a dragged icon land on top of one that never moved. Callers must
    // pass every shortcut's position already resolved via `getPosition`
    // (defaults included) as `allResolvedPositions`.
    const isOccupied = useCallback(
        (
            pos: GridPosition,
            excludeKey: string,
            allResolvedPositions: ResolvedIconPosition[]
        ): boolean => {
            return allResolvedPositions.some(
                (entry) =>
                    entry.key !== excludeKey &&
                    entry.position.col === pos.col &&
                    entry.position.row === pos.row
            );
        },
        []
    );

    return (
        <DesktopIconPositionsContext.Provider
            value={{ getPosition, setPosition, isOccupied }}
        >
            {children}
        </DesktopIconPositionsContext.Provider>
    );
};

export function useDesktopIconPositions(): DesktopIconPositionsContextValue {
    const ctx = useContext(DesktopIconPositionsContext);
    if (!ctx) {
        throw new Error(
            'useDesktopIconPositions must be used within a DesktopIconPositionsProvider'
        );
    }
    return ctx;
}

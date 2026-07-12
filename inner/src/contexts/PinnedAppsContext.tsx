import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';

export interface PinnedAppsContextValue {
    pinnedStartMenu: Set<string>;
    pinnedTaskbar: string[];
    hiddenFromDesktop: Set<string>;
    toggleStartMenuPin: (key: string) => void;
    toggleTaskbarPin: (key: string) => void;
    hideFromDesktop: (key: string) => void;
    restoreToDesktop: (key: string) => void;
}

interface PersistedShape {
    pinnedStartMenu: string[];
    pinnedTaskbar: string[];
    hiddenFromDesktop: string[];
}

const STORAGE_KEY = 'rahulos.pinnedApps';

const DEFAULT_STATE: PersistedShape = {
    pinnedStartMenu: [],
    pinnedTaskbar: [],
    hiddenFromDesktop: [],
};

const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((v) => typeof v === 'string');

const loadState = (): PersistedShape => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_STATE;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') return DEFAULT_STATE;
        return {
            pinnedStartMenu: isStringArray(parsed.pinnedStartMenu)
                ? parsed.pinnedStartMenu
                : [],
            pinnedTaskbar: isStringArray(parsed.pinnedTaskbar)
                ? parsed.pinnedTaskbar
                : [],
            hiddenFromDesktop: isStringArray(parsed.hiddenFromDesktop)
                ? parsed.hiddenFromDesktop
                : [],
        };
    } catch {
        return DEFAULT_STATE;
    }
};

const persist = (state: PersistedShape) => {
    try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
        // localStorage unavailable (private mode / iframe) — keep in-memory.
    }
};

const PinnedAppsContext = createContext<PinnedAppsContextValue | null>(null);

export const PinnedAppsProvider: React.FC = ({ children }) => {
    const [state, setState] = useState<PersistedShape>(loadState);

    // Single atomic state object (not three separate useState calls) so a
    // toggle always reads/writes the current values of the other two
    // fields too — three independent useState hooks would let a
    // fast-fired persist() race on stale closures of the sibling fields.
    const updateState = useCallback(
        (updater: (prev: PersistedShape) => PersistedShape) => {
            setState((prev) => {
                const next = updater(prev);
                persist(next);
                return next;
            });
        },
        []
    );

    const toggleStartMenuPin = useCallback(
        (key: string) => {
            updateState((prev) => ({
                ...prev,
                pinnedStartMenu: prev.pinnedStartMenu.includes(key)
                    ? prev.pinnedStartMenu.filter((k) => k !== key)
                    : [...prev.pinnedStartMenu, key],
            }));
        },
        [updateState]
    );

    const toggleTaskbarPin = useCallback(
        (key: string) => {
            updateState((prev) => ({
                ...prev,
                pinnedTaskbar: prev.pinnedTaskbar.includes(key)
                    ? prev.pinnedTaskbar.filter((k) => k !== key)
                    : [...prev.pinnedTaskbar, key],
            }));
        },
        [updateState]
    );

    const hideFromDesktop = useCallback(
        (key: string) => {
            updateState((prev) =>
                prev.hiddenFromDesktop.includes(key)
                    ? prev
                    : {
                          ...prev,
                          hiddenFromDesktop: [...prev.hiddenFromDesktop, key],
                      }
            );
        },
        [updateState]
    );

    const restoreToDesktop = useCallback(
        (key: string) => {
            updateState((prev) => ({
                ...prev,
                hiddenFromDesktop: prev.hiddenFromDesktop.filter(
                    (k) => k !== key
                ),
            }));
        },
        [updateState]
    );

    const pinnedStartMenuSet = useMemo(
        () => new Set(state.pinnedStartMenu),
        [state.pinnedStartMenu]
    );
    const hiddenFromDesktopSet = useMemo(
        () => new Set(state.hiddenFromDesktop),
        [state.hiddenFromDesktop]
    );

    return (
        <PinnedAppsContext.Provider
            value={{
                pinnedStartMenu: pinnedStartMenuSet,
                pinnedTaskbar: state.pinnedTaskbar,
                hiddenFromDesktop: hiddenFromDesktopSet,
                toggleStartMenuPin,
                toggleTaskbarPin,
                hideFromDesktop,
                restoreToDesktop,
            }}
        >
            {children}
        </PinnedAppsContext.Provider>
    );
};

export function usePinnedApps(): PinnedAppsContextValue {
    const ctx = useContext(PinnedAppsContext);
    if (!ctx) {
        throw new Error(
            'usePinnedApps must be used within a PinnedAppsProvider'
        );
    }
    return ctx;
}

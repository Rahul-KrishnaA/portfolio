import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import Colors from '../constants/colors';
import { findWallpaperImage } from '../assets/wallpapers';

export type WallpaperSelection =
    | { kind: 'color'; color: string }
    | { kind: 'image'; name: string };

export interface WallpaperContextValue {
    selection: WallpaperSelection;
    setSelection: (sel: WallpaperSelection) => void;
    desktopStyle: React.CSSProperties;
}

const STORAGE_KEY = 'rahulos.wallpaper';

const DEFAULT_SELECTION: WallpaperSelection = {
    kind: 'color',
    color: Colors.turquoise,
};

const loadSelection = (): WallpaperSelection => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return DEFAULT_SELECTION;
        const parsed = JSON.parse(raw);
        if (
            parsed &&
            parsed.kind === 'color' &&
            typeof parsed.color === 'string'
        ) {
            return { kind: 'color', color: parsed.color };
        }
        if (
            parsed &&
            parsed.kind === 'image' &&
            typeof parsed.name === 'string'
        ) {
            return { kind: 'image', name: parsed.name };
        }
        return DEFAULT_SELECTION;
    } catch {
        return DEFAULT_SELECTION;
    }
};

const styleForSelection = (
    selection: WallpaperSelection
): React.CSSProperties => {
    if (selection.kind === 'color') {
        return { backgroundColor: selection.color };
    }
    const image = findWallpaperImage(selection.name);
    if (!image) {
        // File was removed since it was chosen — fall back to default.
        return { backgroundColor: DEFAULT_SELECTION.color };
    }
    return {
        backgroundImage: `url(${image.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
    };
};

const WallpaperContext = createContext<WallpaperContextValue | null>(null);

export const WallpaperProvider: React.FC = ({ children }) => {
    const [selection, setSelectionState] = useState<WallpaperSelection>(
        loadSelection
    );

    const setSelection = useCallback((sel: WallpaperSelection) => {
        setSelectionState(sel);
        try {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sel));
        } catch {
            // localStorage unavailable (private mode / iframe) — keep in-memory.
        }
    }, []);

    const desktopStyle = useMemo(
        () => styleForSelection(selection),
        [selection]
    );

    return (
        <WallpaperContext.Provider
            value={{ selection, setSelection, desktopStyle }}
        >
            {children}
        </WallpaperContext.Provider>
    );
};

export function useWallpaper(): WallpaperContextValue {
    const ctx = useContext(WallpaperContext);
    if (!ctx) {
        throw new Error(
            'useWallpaper must be used within a WallpaperProvider'
        );
    }
    return ctx;
}

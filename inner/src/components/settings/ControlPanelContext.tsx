import React, {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface ControlPanelClipboard {
    key: string;
    mode: 'cut' | 'copy';
}

export type ControlPanelIconSize = 'large' | 'small';

export interface ControlPanelContextValue {
    selection: string | null;
    setSelection: (key: string | null) => void;
    clipboard: ControlPanelClipboard | null;
    setClipboard: (c: ControlPanelClipboard | null) => void;
    iconSize: ControlPanelIconSize;
    setIconSize: (s: ControlPanelIconSize) => void;
    navigateTo: (path: string) => void;
    goBack: () => void;
    goForward: () => void;
    canGoBack: boolean;
    canGoForward: boolean;
    atRoot: boolean;
}

const ControlPanelContext = createContext<ControlPanelContextValue | null>(
    null
);

export const ControlPanelProvider: React.FC = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();

    const [selection, setSelection] = useState<string | null>(null);
    const [clipboard, setClipboard] = useState<ControlPanelClipboard | null>(
        null
    );
    const [iconSize, setIconSize] = useState<ControlPanelIconSize>('large');

    // History stack independent from (but kept in sync with) the router.
    const [entries, setEntries] = useState<string[]>(['/']);
    const [index, setIndex] = useState(0);

    const navigateTo = useCallback(
        (path: string) => {
            setSelection(null);
            setEntries((prevEntries) => {
                const truncated = prevEntries.slice(0, index + 1);
                truncated.push(path);
                return truncated;
            });
            setIndex((prevIndex) => prevIndex + 1);
            navigate(path);
        },
        [index, navigate]
    );

    const goBack = useCallback(() => {
        if (index <= 0) return;
        const newIndex = index - 1;
        setSelection(null);
        setIndex(newIndex);
        navigate(entries[newIndex]);
    }, [index, entries, navigate]);

    const goForward = useCallback(() => {
        if (index >= entries.length - 1) return;
        const newIndex = index + 1;
        setSelection(null);
        setIndex(newIndex);
        navigate(entries[newIndex]);
    }, [index, entries, navigate]);

    const canGoBack = index > 0;
    const canGoForward = index < entries.length - 1;
    const atRoot = location.pathname === '/' || location.pathname === '';

    const value = useMemo<ControlPanelContextValue>(
        () => ({
            selection,
            setSelection,
            clipboard,
            setClipboard,
            iconSize,
            setIconSize,
            navigateTo,
            goBack,
            goForward,
            canGoBack,
            canGoForward,
            atRoot,
        }),
        [
            selection,
            clipboard,
            iconSize,
            navigateTo,
            goBack,
            goForward,
            canGoBack,
            canGoForward,
            atRoot,
        ]
    );

    return (
        <ControlPanelContext.Provider value={value}>
            {children}
        </ControlPanelContext.Provider>
    );
};

export function useControlPanel(): ControlPanelContextValue {
    const ctx = useContext(ControlPanelContext);
    if (!ctx) {
        throw new Error(
            'useControlPanel must be used within a ControlPanelProvider'
        );
    }
    return ctx;
}

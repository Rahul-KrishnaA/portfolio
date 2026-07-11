import React, {
    createContext,
    useCallback,
    useContext,
    useState,
} from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeContextValue {
    theme: Theme;
    setTheme: (theme: Theme) => void;
}

const STORAGE_KEY = 'rahulos.theme';
const DEFAULT_THEME: Theme = 'light';

const loadTheme = (): Theme => {
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw === 'light' || raw === 'dark') return raw;
        return DEFAULT_THEME;
    } catch {
        return DEFAULT_THEME;
    }
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export const ThemeProvider: React.FC = ({ children }) => {
    const [theme, setThemeState] = useState<Theme>(loadTheme);

    const setTheme = useCallback((next: Theme) => {
        setThemeState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // localStorage unavailable — keep in-memory.
        }
    }, []);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

export function useTheme(): ThemeContextValue {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
}

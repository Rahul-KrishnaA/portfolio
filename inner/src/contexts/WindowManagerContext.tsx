import React, { createContext, useCallback, useContext, useState } from 'react';
import { IconName } from '../assets/icons';

export interface WindowManagerContextValue {
    windows: DesktopWindows;
    openWindow: (
        key: string,
        name: string,
        icon: IconName,
        element: JSX.Element
    ) => void;
    focusWindow: (key: string) => void;
    closeWindow: (key: string) => void;
    minimizeWindow: (key: string) => void;
    toggleMinimize: (key: string) => void;
    resetWindows: () => void;
}

const WindowManagerContext = createContext<WindowManagerContextValue | null>(
    null
);

const getHighestZIndex = (windows: DesktopWindows): number => {
    let highestZIndex = 0;
    Object.keys(windows).forEach((key) => {
        const w = windows[key];
        if (w && w.zIndex > highestZIndex) highestZIndex = w.zIndex;
    });
    return highestZIndex;
};

export const WindowManagerProvider: React.FC = ({ children }) => {
    const [windows, setWindows] = useState<DesktopWindows>({});

    const closeWindow = useCallback((key: string) => {
        setTimeout(() => {
            setWindows((prevWindows) => {
                const newWindows = { ...prevWindows };
                delete newWindows[key];
                return newWindows;
            });
        }, 100);
    }, []);

    const minimizeWindow = useCallback((key: string) => {
        setWindows((prevWindows) => {
            if (!prevWindows[key]) return prevWindows;
            return {
                ...prevWindows,
                [key]: { ...prevWindows[key], minimized: true },
            };
        });
    }, []);

    const toggleMinimize = useCallback((key: string) => {
        setWindows((prevWindows) => {
            if (!prevWindows[key]) return prevWindows;
            const highestIndex = getHighestZIndex(prevWindows);
            let minimized = prevWindows[key].minimized;
            if (minimized || prevWindows[key].zIndex === highestIndex) {
                minimized = !minimized;
            }
            return {
                ...prevWindows,
                [key]: {
                    ...prevWindows[key],
                    minimized,
                    zIndex: highestIndex + 1,
                },
            };
        });
    }, []);

    const focusWindow = useCallback((key: string) => {
        setWindows((prevWindows) => {
            if (!prevWindows[key]) return prevWindows;
            return {
                ...prevWindows,
                [key]: {
                    ...prevWindows[key],
                    zIndex: getHighestZIndex(prevWindows) + 1,
                    minimized: false,
                },
            };
        });
    }, []);

    const openWindow = useCallback(
        (key: string, name: string, icon: IconName, element: JSX.Element) => {
            setWindows((prevWindows) => {
                if (prevWindows[key]) {
                    return {
                        ...prevWindows,
                        [key]: {
                            ...prevWindows[key],
                            zIndex: getHighestZIndex(prevWindows) + 1,
                            minimized: false,
                        },
                    };
                }
                return {
                    ...prevWindows,
                    [key]: {
                        zIndex: getHighestZIndex(prevWindows) + 1,
                        minimized: false,
                        component: element,
                        name,
                        icon,
                    },
                };
            });
        },
        []
    );

    const resetWindows = useCallback(() => {
        setWindows({});
    }, []);

    return (
        <WindowManagerContext.Provider
            value={{
                windows,
                openWindow,
                focusWindow,
                closeWindow,
                minimizeWindow,
                toggleMinimize,
                resetWindows,
            }}
        >
            {children}
        </WindowManagerContext.Provider>
    );
};

export function useWindowManager(): WindowManagerContextValue {
    const ctx = useContext(WindowManagerContext);
    if (!ctx) {
        throw new Error(
            'useWindowManager must be used within a WindowManagerProvider'
        );
    }
    return ctx;
}

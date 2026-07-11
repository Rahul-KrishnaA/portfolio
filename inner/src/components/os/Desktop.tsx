import React, { useCallback, useEffect, useState } from 'react';
import ShowcaseExplorer from '../applications/ShowcaseExplorer';
import ShutdownSequence from './ShutdownSequence';
import Toolbar from './Toolbar';
import DesktopShortcut, { DesktopShortcutProps } from './DesktopShortcut';
import { IconName } from '../../assets/icons';
import Credits from '../applications/Credits';
import Settings from '../applications/Settings';
import {
    WindowManagerProvider,
    useWindowManager,
} from '../../contexts/WindowManagerContext';
import {
    WallpaperProvider,
    useWallpaper,
} from '../../contexts/WallpaperContext';
import { ThemeProvider } from '../../contexts/ThemeContext';

export interface DesktopProps {}

type ExtendedWindowAppProps<T> = T & WindowAppProps;

const APPLICATIONS: {
    [key in string]: {
        key: string;
        name: string;
        shortcutIcon: IconName;
        component: React.FC<ExtendedWindowAppProps<any>>;
    };
} = {
    showcase: {
        key: 'showcase',
        name: 'My Details',
        shortcutIcon: 'showcaseIcon',
        component: ShowcaseExplorer,
    },
    credits: {
        key: 'credits',
        name: 'Credits',
        shortcutIcon: 'credits',
        component: Credits,
    },
    settings: {
        key: 'settings',
        name: 'Settings',
        shortcutIcon: 'settingsIcon',
        component: Settings,
    },
};

const Desktop: React.FC<DesktopProps> = () => {
    return (
        <ThemeProvider>
            <WallpaperProvider>
                <WindowManagerProvider>
                    <DesktopInner />
                </WindowManagerProvider>
            </WallpaperProvider>
        </ThemeProvider>
    );
};

const DesktopInner: React.FC = () => {
    const {
        windows,
        openWindow,
        focusWindow,
        closeWindow,
        minimizeWindow,
        toggleMinimize,
        resetWindows,
    } = useWindowManager();
    const { desktopStyle } = useWallpaper();

    const [shortcuts, setShortcuts] = useState<DesktopShortcutProps[]>([]);
    const [shutdown, setShutdown] = useState(false);
    const [numShutdowns, setNumShutdowns] = useState(1);

    const rebootDesktop = useCallback(() => {
        resetWindows();
    }, [resetWindows]);

    useEffect(() => {
        if (shutdown === true) {
            rebootDesktop();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [shutdown]);

    useEffect(() => {
        const newShortcuts: DesktopShortcutProps[] = [];
        Object.keys(APPLICATIONS).forEach((key) => {
            const app = APPLICATIONS[key];
            newShortcuts.push({
                shortcutName: app.name,
                icon: app.shortcutIcon,
                onOpen: () => {
                    openWindow(
                        app.key,
                        app.name,
                        app.shortcutIcon,
                        <app.component
                            onInteract={() => focusWindow(app.key)}
                            onMinimize={() => minimizeWindow(app.key)}
                            onClose={() => closeWindow(app.key)}
                            key={app.key}
                        />
                    );
                },
            });
        });

        newShortcuts.forEach((shortcut) => {
            if (shortcut.shortcutName === 'My Details') {
                shortcut.onOpen();
            }
        });

        setShortcuts(newShortcuts);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const startShutdown = useCallback(() => {
        setTimeout(() => {
            setShutdown(true);
            setNumShutdowns(numShutdowns + 1);
        }, 600);
    }, [numShutdowns]);

    return !shutdown ? (
        <div style={Object.assign({}, styles.desktop, desktopStyle)}>
            {Object.keys(windows).map((key) => {
                const element = windows[key].component;
                if (!element) return <div key={`win-${key}`}></div>;
                return (
                    <div
                        key={`win-${key}`}
                        style={Object.assign(
                            {},
                            styles.windowWrapper,
                            { zIndex: windows[key].zIndex },
                            windows[key].minimized && styles.minimized
                        )}
                    >
                        {React.cloneElement(element, {
                            key,
                            onInteract: () => focusWindow(key),
                            onClose: () => closeWindow(key),
                        })}
                    </div>
                );
            })}
            <div style={styles.shortcuts}>
                {shortcuts.map((shortcut, i) => {
                    return (
                        <div
                            style={Object.assign({}, styles.shortcutContainer, {
                                top: i * 104,
                            })}
                            key={shortcut.shortcutName}
                        >
                            <DesktopShortcut
                                icon={shortcut.icon}
                                shortcutName={shortcut.shortcutName}
                                onOpen={shortcut.onOpen}
                            />
                        </div>
                    );
                })}
            </div>
            <Toolbar
                windows={windows}
                toggleMinimize={toggleMinimize}
                shutdown={startShutdown}
                openWindow={openWindow}
                focusWindow={focusWindow}
                closeWindow={closeWindow}
                minimizeWindow={minimizeWindow}
            />
        </div>
    ) : (
        <ShutdownSequence
            setShutdown={setShutdown}
            numShutdowns={numShutdowns}
        />
    );
};

const styles: StyleSheetCSS = {
    desktop: {
        minHeight: '100%',
        flex: 1,
    },
    shortcutContainer: {
        position: 'absolute',
    },
    shortcuts: {
        position: 'absolute',
        top: 16,
        left: 6,
    },
    windowWrapper: {
        transformOrigin: 'center bottom',
        transition:
            'transform 0.2s steps(6, jump-end), opacity 0.2s steps(4, jump-end)',
    },
    minimized: {
        pointerEvents: 'none',
        opacity: 0,
        transform: 'scale(0.06) translateY(70vh)',
    },
};

export default Desktop;

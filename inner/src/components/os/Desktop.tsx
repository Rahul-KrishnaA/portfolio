import React, { useCallback, useEffect, useState } from 'react';
import ShowcaseExplorer from '../applications/ShowcaseExplorer';
import ShutdownSequence from './ShutdownSequence';
import Toolbar from './Toolbar';
import DesktopShortcut from './DesktopShortcut';
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
import {
    DesktopIconPositionsProvider,
    useDesktopIconPositions,
    ResolvedIconPosition,
} from '../../contexts/DesktopIconPositionsContext';

export interface DesktopProps {}

type ExtendedWindowAppProps<T> = T & WindowAppProps;

// Config for the desktop's fixed set of app shortcuts — distinct from
// `DesktopShortcutProps`, which now also carries per-render drag/position
// data resolved in `DesktopInner` below.
interface ShortcutConfig {
    shortcutName: string;
    icon: IconName;
    onOpen: () => void;
}

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
                <DesktopIconPositionsProvider>
                    <WindowManagerProvider>
                        <DesktopInner />
                    </WindowManagerProvider>
                </DesktopIconPositionsProvider>
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
    const { getPosition, setPosition, isOccupied } = useDesktopIconPositions();

    const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
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
        const newShortcuts: ShortcutConfig[] = [];
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
                {(() => {
                    // Every shortcut's position resolved via `getPosition`
                    // (defaults included) — required by the context's
                    // `isOccupied` contract so a dragged icon can never
                    // silently land on an icon that was never moved.
                    const allResolvedPositions: ResolvedIconPosition[] =
                        shortcuts.map((shortcut, i) => ({
                            key: shortcut.shortcutName,
                            position: getPosition(shortcut.shortcutName, i),
                        }));

                    return shortcuts.map((shortcut, i) => {
                        const position = getPosition(shortcut.shortcutName, i);
                        return (
                            <DesktopShortcut
                                key={shortcut.shortcutName}
                                icon={shortcut.icon}
                                shortcutName={shortcut.shortcutName}
                                onOpen={shortcut.onOpen}
                                position={position}
                                onPositionChange={(pos) =>
                                    setPosition(shortcut.shortcutName, pos)
                                }
                                isPositionAvailable={(pos) =>
                                    !isOccupied(
                                        pos,
                                        shortcut.shortcutName,
                                        allResolvedPositions
                                    )
                                }
                            />
                        );
                    });
                })()}
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
    shortcuts: {
        // Origin now lives per-icon in DesktopShortcut's own left/top
        // (`6 + col * 72`, `16 + row * 104`) since position is data-driven
        // per shortcut, not an index into this wrapper. This wrapper only
        // anchors that per-icon math at the desktop's own (0, 0).
        position: 'absolute',
        top: 0,
        left: 0,
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

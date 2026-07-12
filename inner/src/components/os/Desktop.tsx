import React, { useCallback, useEffect, useState } from 'react';
import ShutdownSequence from './ShutdownSequence';
import Toolbar from './Toolbar';
import DesktopShortcut from './DesktopShortcut';
import { IconName } from '../../assets/icons';
import { INSTALLED_APPS } from './installedApps';
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
import {
    PinnedAppsProvider,
    usePinnedApps,
} from '../../contexts/PinnedAppsContext';

export interface DesktopProps {}

// Config for the desktop's fixed set of app shortcuts — distinct from
// `DesktopShortcutProps`, which now also carries per-render drag/position
// data resolved in `DesktopInner` below.
interface ShortcutConfig {
    key: string;
    shortcutName: string;
    icon: IconName;
    onOpen: () => void;
}

const Desktop: React.FC<DesktopProps> = () => {
    return (
        <ThemeProvider>
            <WallpaperProvider>
                <DesktopIconPositionsProvider>
                    <PinnedAppsProvider>
                        <WindowManagerProvider>
                            <DesktopInner />
                        </WindowManagerProvider>
                    </PinnedAppsProvider>
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
    const { hiddenFromDesktop } = usePinnedApps();

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
        const newShortcuts: ShortcutConfig[] = INSTALLED_APPS.map((app) => ({
            key: app.key,
            shortcutName: app.name,
            icon: app.icon,
            onOpen: () => {
                openWindow(
                    app.key,
                    app.name,
                    app.icon,
                    <app.component
                        onInteract={() => focusWindow(app.key)}
                        onMinimize={() => minimizeWindow(app.key)}
                        onClose={() => closeWindow(app.key)}
                        key={app.key}
                    />
                );
            },
        }));

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
                    const visibleShortcuts = shortcuts.filter(
                        (shortcut) => !hiddenFromDesktop.has(shortcut.key)
                    );
                    const allResolvedPositions: ResolvedIconPosition[] =
                        visibleShortcuts.map((shortcut, i) => ({
                            key: shortcut.shortcutName,
                            position: getPosition(shortcut.shortcutName, i),
                        }));

                    return visibleShortcuts.map((shortcut, i) => {
                        const position = getPosition(shortcut.shortcutName, i);
                        return (
                            <DesktopShortcut
                                key={shortcut.shortcutName}
                                shortcutKey={shortcut.key}
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

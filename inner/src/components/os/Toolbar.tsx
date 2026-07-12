import React, { useEffect, useRef, useState } from 'react';
import Colors from '../../constants/colors';
import { Icon } from '../general';
import { IconName } from '../../assets/icons';
import { GAMES, GameEntry } from './games';
import { INSTALLED_APPS, InstalledAppEntry } from './installedApps';
import { usePinnedApps } from '../../contexts/PinnedAppsContext';
import ContextMenu, { ContextMenuItem } from './ContextMenu';
// import { } from '../general';
// import Home from '../site/Home';
// import Window from './Window';

// Combined lookup for resolving a pinned-but-not-currently-open taskbar
// key back to its name/icon/component — a pinned key can be either a
// regular app or a game, and both share the same {key, name, icon,
// component} shape.
const ALL_LAUNCHABLE: (InstalledAppEntry | GameEntry)[] = [
    ...INSTALLED_APPS,
    ...GAMES,
];

// Shown while a lazy-loaded game's chunk (Doom/Oregon Trail/Scrabble, all
// js-dos bundles) is still downloading, since those components render their
// own `Window` chrome only once loaded — without this the window would be
// blank for a moment instead of showing something.
const GameLoadingFallback: React.FC = () => (
    <div style={styles.gameLoadingOverlay}>
        <div style={styles.gameLoadingBox}>
            <p className="loading">Loading</p>
        </div>
    </div>
);

const findLaunchable = (
    key: string
): InstalledAppEntry | GameEntry | undefined =>
    ALL_LAUNCHABLE.find((entry) => entry.key === key);

export interface ToolbarProps {
    windows: DesktopWindows;
    toggleMinimize: (key: string) => void;
    shutdown: () => void;
    openWindow: (
        key: string,
        name: string,
        icon: IconName,
        element: JSX.Element
    ) => void;
    focusWindow: (key: string) => void;
    closeWindow: (key: string) => void;
    minimizeWindow: (key: string) => void;
}

const Toolbar: React.FC<ToolbarProps> = ({
    windows,
    toggleMinimize,
    shutdown,
    openWindow,
    focusWindow,
    closeWindow,
    minimizeWindow,
}) => {
    const getTime = () => {
        const date = new Date();
        let hours = date.getHours();
        let minutes = date.getMinutes();
        let amPm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12;
        hours = hours ? hours : 12;
        let mins = minutes < 10 ? '0' + minutes : minutes;
        const strTime = hours + ':' + mins + ' ' + amPm;
        return strTime;
    };

    const [startWindowOpen, setStartWindowOpen] = useState(false);
    const [gamesMenuOpen, setGamesMenuOpen] = useState(false);
    const [appSearch, setAppSearch] = useState('');
    const [menu, setMenu] = useState<{
        x: number;
        y: number;
        items: ContextMenuItem[];
    } | null>(null);
    const {
        pinnedStartMenu,
        pinnedTaskbar,
        hiddenFromDesktop,
        toggleStartMenuPin,
        toggleTaskbarPin,
        hideFromDesktop,
        restoreToDesktop,
    } = usePinnedApps();

    const closeMenu = () => setMenu(null);
    const lastClickInside = useRef(false);

    const [lastActive, setLastActive] = useState('');

    useEffect(() => {
        let max = 0;
        let k = '';
        Object.keys(windows).forEach((key) => {
            if (windows[key].zIndex >= max) {
                max = windows[key].zIndex;
                k = key;
            }
        });
        setLastActive(k);
    }, [windows]);

    const [time, setTime] = useState(getTime());

    const updateTime = () => {
        setTime(getTime());
        setTimeout(() => {
            updateTime();
        }, 5000);
    };

    useEffect(() => {
        updateTime();
    });

    const onCheckClick = () => {
        if (lastClickInside.current) {
            setStartWindowOpen(true);
        } else {
            setStartWindowOpen(false);
        }
        lastClickInside.current = false;
    };

    useEffect(() => {
        window.addEventListener('mousedown', onCheckClick, false);
        return () => {
            window.removeEventListener('mousedown', onCheckClick, false);
        };
    }, []);

    const onStartWindowClicked = () => {
        setStartWindowOpen(true);
        lastClickInside.current = true;
    };

    const toggleStartWindow = () => {
        if (!startWindowOpen) {
            lastClickInside.current = true;
        } else {
            lastClickInside.current = false;
        }
    };

    const launchEntry = (entry: {
        key: string;
        name: string;
        icon: IconName;
        component: React.ComponentType<any>;
    }) => {
        openWindow(
            entry.key,
            entry.name,
            entry.icon,
            <React.Suspense fallback={<GameLoadingFallback />}>
                <entry.component
                    onInteract={() => focusWindow(entry.key)}
                    onMinimize={() => minimizeWindow(entry.key)}
                    onClose={() => closeWindow(entry.key)}
                    key={entry.key}
                />
            </React.Suspense>
        );
    };

    const openGame = (game: (typeof GAMES)[number]) => {
        launchEntry(game);
        setGamesMenuOpen(false);
        setStartWindowOpen(false);
    };

    const openInstalledApp = (app: InstalledAppEntry) => {
        launchEntry(app);
        setStartWindowOpen(false);
    };

    const filteredApps = INSTALLED_APPS.filter((app) =>
        app.name.toLowerCase().includes(appSearch.toLowerCase())
    );

    const appContextItems = (app: InstalledAppEntry): ContextMenuItem[] => [
        {
            label: pinnedStartMenu.has(app.key)
                ? 'Unpin from Start Menu'
                : 'Pin to Start Menu',
            onSelect: () => toggleStartMenuPin(app.key),
        },
        {
            label: pinnedTaskbar.includes(app.key)
                ? 'Unpin from Taskbar'
                : 'Pin to Taskbar',
            onSelect: () => toggleTaskbarPin(app.key),
        },
        {
            label: hiddenFromDesktop.has(app.key)
                ? 'Restore to Desktop'
                : 'Remove from Desktop',
            onSelect: () =>
                hiddenFromDesktop.has(app.key)
                    ? restoreToDesktop(app.key)
                    : hideFromDesktop(app.key),
            separatorBefore: true,
        },
    ];

    return (
        <div style={styles.toolbarOuter}>
            {startWindowOpen && (
                <div
                    onMouseDown={onStartWindowClicked}
                    style={styles.startWindow}
                >
                    <div style={styles.startWindowInner}>
                        <div style={styles.verticalStartContainer}>
                            <p style={styles.verticalText}>RahulOS</p>
                        </div>
                        <div style={styles.startWindowContent}>
                            <div style={styles.searchRow}>
                                <input
                                    style={styles.searchInput}
                                    placeholder="Search apps..."
                                    value={appSearch}
                                    onChange={(e) =>
                                        setAppSearch(e.target.value)
                                    }
                                    onMouseDown={(e) => e.stopPropagation()}
                                />
                            </div>
                            <div style={styles.appList}>
                                {filteredApps.map((app) => (
                                    <div
                                        key={app.key}
                                        className="start-menu-option"
                                        style={styles.startMenuOption}
                                        onMouseDown={(event) => {
                                            event.stopPropagation();
                                            // Right-click (button 2) must
                                            // only open the context menu
                                            // below, not also trigger this
                                            // row's open-app action.
                                            if (event.button !== 0) return;
                                            openInstalledApp(app);
                                        }}
                                        onContextMenu={(event) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            setMenu({
                                                x: event.clientX,
                                                y: event.clientY,
                                                items: appContextItems(app),
                                            });
                                        }}
                                    >
                                        <Icon
                                            style={styles.startMenuIcon}
                                            icon={app.icon}
                                        />
                                        <p style={styles.startMenuText}>
                                            {app.name}
                                        </p>
                                    </div>
                                ))}
                                {filteredApps.length === 0 && (
                                    <p style={styles.noResults}>
                                        No apps found
                                    </p>
                                )}
                            </div>
                            <div
                                style={styles.gamesRowWrapper}
                                onMouseEnter={() => setGamesMenuOpen(true)}
                                onMouseLeave={() => setGamesMenuOpen(false)}
                            >
                                {gamesMenuOpen && (
                                    <div style={styles.gamesFlyout}>
                                        <div style={styles.gamesFlyoutInner}>
                                            {GAMES.map((game) => (
                                                <div
                                                    key={game.key}
                                                    className="start-menu-option"
                                                    style={styles.startMenuOption}
                                                    onMouseDown={(event) => {
                                                        event.stopPropagation();
                                                        openGame(game);
                                                    }}
                                                >
                                                    <Icon
                                                        style={styles.startMenuIcon}
                                                        icon={game.icon}
                                                    />
                                                    <p style={styles.startMenuText}>
                                                        {game.name}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <div
                                    className="start-menu-option"
                                    style={styles.startMenuOption}
                                >
                                    <Icon
                                        style={styles.startMenuIcon}
                                        icon="windowGameIcon"
                                    />
                                    <p style={styles.startMenuText}>
                                        Games <span style={styles.gamesArrow}>▸</span>
                                    </p>
                                </div>
                            </div>
                            <div style={styles.startMenuLine} />
                            <div
                                className="start-menu-option"
                                style={styles.startMenuOption}
                                onMouseDown={shutdown}
                            >
                                <Icon
                                    style={styles.startMenuIcon}
                                    icon="computerBig"
                                />
                                <p style={styles.startMenuText}>
                                    Sh<u>u</u>t down...
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {menu && (
                <ContextMenu
                    x={menu.x}
                    y={menu.y}
                    items={menu.items}
                    onClose={closeMenu}
                />
            )}
            <div style={styles.toolbarInner}>
                <div style={styles.toolbar}>
                    <div
                        style={Object.assign(
                            {},
                            styles.startContainerOuter,
                            startWindowOpen && styles.activeTabOuter
                        )}
                        onMouseDown={toggleStartWindow}
                    >
                        <div
                            style={Object.assign(
                                {},
                                styles.startContainer,
                                startWindowOpen && styles.activeTabInner
                            )}
                        >
                            <Icon
                                size={18}
                                icon="windowsStartIcon"
                                style={styles.startIcon}
                            />
                            <p className="toolbar-text ">Start</p>
                        </div>
                    </div>
                    <div style={styles.toolbarTabsContainer}>
                        {(() => {
                            const openKeys = Object.keys(windows);
                            const taskbarKeys = [
                                ...pinnedTaskbar,
                                ...openKeys.filter(
                                    (k) => !pinnedTaskbar.includes(k)
                                ),
                            ];

                            return taskbarKeys.map((key) => {
                                const isOpen = !!windows[key];
                                const isPinned = pinnedTaskbar.includes(key);
                                const entry = !isOpen
                                    ? findLaunchable(key)
                                    : undefined;

                                // A stale pinned key with no matching open
                                // window and no matching registry entry —
                                // nothing to render (defensive; shouldn't
                                // happen since pins are only ever set from
                                // real registry keys).
                                if (!isOpen && !entry) return null;

                                const name = isOpen
                                    ? windows[key].name
                                    : entry!.name;
                                const icon = isOpen
                                    ? windows[key].icon
                                    : entry!.icon;
                                const isActive =
                                    isOpen &&
                                    lastActive === key &&
                                    !windows[key].minimized;

                                const handleClick = (
                                    event: React.MouseEvent
                                ) => {
                                    // Right-click (button 2) must only
                                    // open the context menu below, not
                                    // also toggle-minimize/launch this
                                    // button.
                                    if (event.button !== 0) return;
                                    if (isOpen) {
                                        toggleMinimize(key);
                                    } else if (entry) {
                                        launchEntry(entry);
                                    }
                                };

                                const handleContextMenu = (
                                    event: React.MouseEvent
                                ) => {
                                    event.preventDefault();
                                    const items: ContextMenuItem[] = [];
                                    if (isPinned) {
                                        items.push({
                                            label: 'Unpin from Taskbar',
                                            onSelect: () =>
                                                toggleTaskbarPin(key),
                                        });
                                    }
                                    if (isOpen) {
                                        items.push({
                                            label: 'Close window',
                                            onSelect: () => closeWindow(key),
                                            separatorBefore: isPinned,
                                        });
                                    }
                                    if (items.length > 0) {
                                        setMenu({
                                            x: event.clientX,
                                            y: event.clientY,
                                            items,
                                        });
                                    }
                                };

                                return (
                                    <div
                                        key={key}
                                        style={Object.assign(
                                            {},
                                            styles.tabContainerOuter,
                                            isActive && styles.activeTabOuter
                                        )}
                                        onMouseDown={handleClick}
                                        onContextMenu={handleContextMenu}
                                    >
                                        <div
                                            style={Object.assign(
                                                {},
                                                styles.tabContainer,
                                                isActive && styles.activeTabInner
                                            )}
                                            title={name}
                                        >
                                            <Icon
                                                size={20}
                                                icon={icon}
                                                style={styles.tabIcon}
                                            />
                                        </div>
                                    </div>
                                );
                            });
                        })()}
                    </div>
                </div>
                <div style={styles.time}>
                    <Icon style={styles.volumeIcon} icon="volumeOn" />
                    <p style={styles.timeText}>{time}</p>
                </div>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    gameLoadingOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 99999,
        pointerEvents: 'none',
    },
    gameLoadingBox: {
        background: 'var(--os-chrome-bg)',
        border: `1px solid ${'var(--os-edge-white)'}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        padding: '16px 24px',
    },
    toolbarOuter: {
        boxSizing: 'border-box',
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: 32,
        background: 'var(--os-chrome-bg)',
        borderTop: '1px solid var(--os-chrome-bg)',
        zIndex: 100000,
    },
    verticalStartContainer: {
        // width: 30,
        height: '100%',
        background: Colors.darkGray,
    },
    verticalText: {
        fontFamily: 'Terminal',
        textOrientation: 'sideways',
        fontSize: 32,
        padding: 4,
        paddingBottom: 64,
        paddingTop: 8,
        letterSpacing: 1,
        color: Colors.lightGray,
        transform: 'scale(-1)',
        WebkitTransform: 'scale(-1)',
        MozTransform: 'scale(-1)',
        msTransform: 'scale(-1)',
        OTransform: 'scale(-1)',
        // @ts-ignore
        writingMode: 'tb-rl',
    },
    startWindowContent: {
        flex: 1,
        flexDirection: 'column',
        justifyContent: 'flex-end',
        // alignItems: 'flex-end',
    },
    startWindow: {
        position: 'absolute',
        bottom: 28,
        display: 'flex',
        flex: 1,
        width: 256,
        // height: 400,
        left: 4,
        boxSizing: 'border-box',
        border: `1px solid ${'var(--os-edge-white)'}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        background: 'var(--os-chrome-bg)',
    },
    activeTabOuter: {
        border: `1px solid ${Colors.black}`,
        borderBottomColor: 'var(--os-edge-white)',
        borderRightColor: 'var(--os-edge-white)',
    },
    startWindowInner: {
        border: `1px solid ${'var(--os-edge-lightgray)'}`,
        borderBottomColor: Colors.darkGray,
        borderRightColor: Colors.darkGray,
        flex: 1,
    },
    startMenuIcon: {
        width: 32,
        height: 32,
    },
    startMenuText: {
        fontSize: 14,
        fontFamily: 'MSSerif',
        marginLeft: 8,
    },
    startMenuOption: {
        alignItems: 'center',
        // flex: 1,
        height: 24,
        padding: 12,
    },
    searchRow: {
        padding: 6,
    },
    searchInput: {
        width: '100%',
        boxSizing: 'border-box',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        backgroundColor: 'var(--os-bg)',
        color: 'var(--os-text)',
        padding: '3px 6px',
        fontFamily: 'MSSerif',
        fontSize: 12,
    },
    appList: {
        flexDirection: 'column',
        maxHeight: 180,
        overflowY: 'auto',
    },
    noResults: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        color: 'var(--os-text-muted)',
        padding: 12,
    },
    startMenuLine: {
        height: 1,
        background: 'var(--os-edge-white)',
        borderTop: `1px solid ${Colors.darkGray}`,
    },
    gamesRowWrapper: {
        position: 'relative',
    },
    gamesFlyout: {
        position: 'absolute',
        left: '100%',
        bottom: 0,
        boxSizing: 'border-box',
        border: `1px solid ${'var(--os-edge-white)'}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        background: 'var(--os-chrome-bg)',
        minWidth: 180,
    },
    gamesFlyoutInner: {
        border: `1px solid ${'var(--os-edge-lightgray)'}`,
        borderBottomColor: Colors.darkGray,
        borderRightColor: Colors.darkGray,
        flexDirection: 'column',
        flex: 1,
    },
    gamesArrow: {
        float: 'right',
    },
    activeTabInner: {
        border: `1px solid ${Colors.darkGray}`,
        borderBottomColor: 'var(--os-edge-lightgray)',
        borderRightColor: 'var(--os-edge-lightgray)',
        backgroundImage: `linear-gradient(45deg, white 25%, transparent 25%),
        linear-gradient(-45deg,  white 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%,  white 75%),
        linear-gradient(-45deg, transparent 75%,  white 75%)`,
        backgroundSize: `4px 4px`,
        backgroundPosition: `0 0, 0 2px, 2px -2px, -2px 0px`,
        pointerEvents: 'none',
    },
    tabContainerOuter: {
        display: 'flex',
        flexShrink: 0,
        width: 40,
        height: '100%',
        marginRight: 2,
        boxSizing: 'border-box',
        cursor: 'pointer',
        border: `1px solid ${'var(--os-edge-white)'}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
    },
    tabContainer: {
        display: 'flex',
        border: `1px solid ${'var(--os-edge-lightgray)'}`,
        borderBottomColor: Colors.darkGray,
        borderRightColor: Colors.darkGray,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    tabIcon: {},
    startContainer: {
        alignItems: 'center',
        flexShrink: 1,
        // background: 'red',
        border: `1px solid ${'var(--os-edge-lightgray)'}`,
        borderBottomColor: Colors.darkGray,
        borderRightColor: Colors.darkGray,
        padding: 1,
        paddingLeft: 5,
        paddingRight: 5,
    },
    startContainerOuter: {
        marginLeft: 3,
        boxSizing: 'border-box',
        cursor: 'pointer',
        border: `1px solid ${'var(--os-edge-white)'}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
    },
    toolbarTabsContainer: {
        // background: 'blue',
        flex: 1,
        marginLeft: 4,
        marginRight: 4,
    },
    startIcon: {
        marginRight: 4,
    },
    toolbarInner: {
        borderTop: `1px solid ${'var(--os-edge-white)'}`,

        alignItems: 'center',
        flex: 1,
    },
    toolbar: {
        flexGrow: 1,
        width: '100%',
    },
    time: {
        flexShrink: 1,
        width: 86,
        height: 24,
        boxSizing: 'border-box',
        marginRight: 4,
        paddingLeft: 4,
        paddingRight: 4,
        border: `1px solid ${'var(--os-edge-white)'}`,
        borderTopColor: Colors.darkGray,

        justifyContent: 'space-between',
        alignItems: 'center',
        borderLeftColor: Colors.darkGray,
    },
    volumeIcon: {
        cursor: 'pointer',
        height: 18,
    },
    timeText: {
        fontSize: 12,
        fontFamily: 'MSSerif',
    },
};

export default Toolbar;

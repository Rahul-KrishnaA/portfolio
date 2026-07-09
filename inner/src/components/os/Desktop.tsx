import React, { useCallback, useEffect, useState } from 'react';
import Colors from '../../constants/colors';
import ShowcaseExplorer from '../applications/ShowcaseExplorer';
import ShutdownSequence from './ShutdownSequence';
import Toolbar from './Toolbar';
import DesktopShortcut, { DesktopShortcutProps } from './DesktopShortcut';
import { IconName } from '../../assets/icons';
import Credits from '../applications/Credits';
import {
    WindowManagerProvider,
    useWindowManager,
} from '../../contexts/WindowManagerContext';

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
};

const Desktop: React.FC<DesktopProps> = () => {
    return (
        <WindowManagerProvider>
            <DesktopInner />
        </WindowManagerProvider>
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
        <div style={styles.desktop}>
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
        backgroundColor: Colors.turquoise,
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
            'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.22s ease',
    },
    minimized: {
        pointerEvents: 'none',
        opacity: 0,
        transform: 'scale(0.85) translateY(64px)',
    },
};

export default Desktop;

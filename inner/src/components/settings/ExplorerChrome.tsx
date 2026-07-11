import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../general';
import Colors from '../../constants/colors';
import { IconName } from '../../assets/icons';
import { CATEGORIES } from './categories';
import { useControlPanel } from './ControlPanelContext';

export interface ExplorerChromeProps {
    onClose: () => void;
}

type MenuKey = 'File' | 'Edit' | 'View' | 'Go' | 'Favorites' | 'Help';

const MENU_KEYS: MenuKey[] = [
    'File',
    'Edit',
    'View',
    'Go',
    'Favorites',
    'Help',
];

interface MenuEntry {
    label: string;
    disabled?: boolean;
    checked?: boolean;
    onSelect?: () => void;
    separatorAfter?: boolean;
}

interface ToolbarButtonProps {
    icon: IconName;
    label: string;
    disabled: boolean;
    onClick?: () => void;
    hasDropdown?: boolean;
}

// Classic IE4 "coolbar" behavior: flat while idle, raised outset bevel on
// hover, inset bevel while pressed. Only applies to enabled buttons.
const ToolbarButton: React.FC<ToolbarButtonProps> = ({
    icon,
    label,
    disabled,
    onClick,
    hasDropdown,
}) => {
    const [hovering, setHovering] = useState(false);
    const [pressed, setPressed] = useState(false);

    const bevelStyle =
        !disabled && pressed
            ? styles.toolbarButtonPressed
            : !disabled && hovering
            ? styles.toolbarButtonHover
            : undefined;

    return (
        <button
            style={Object.assign(
                {},
                styles.toolbarButton,
                bevelStyle,
                disabled && styles.toolbarButtonDisabled
            )}
            disabled={disabled}
            onMouseEnter={() => setHovering(true)}
            onMouseLeave={() => {
                setHovering(false);
                setPressed(false);
            }}
            onMouseDown={() => {
                setPressed(true);
                if (onClick) onClick();
            }}
            onMouseUp={() => setPressed(false)}
        >
            <div style={styles.toolbarButtonTop}>
                <Icon icon={icon} size={16} />
                {hasDropdown && <p style={styles.toolbarDropdownArrow}>▾</p>}
            </div>
            <p style={styles.toolbarLabel}>{label}</p>
        </button>
    );
};

const ExplorerChrome: React.FC<ExplorerChromeProps> = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const {
        selection,
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
    } = useControlPanel();

    const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
    const [showAbout, setShowAbout] = useState(false);
    const containerRef = useRef<HTMLDivElement | null>(null);

    // Close the open menu on any outside mousedown.
    useEffect(() => {
        const handleOutsideMouseDown = (e: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(e.target as Node)
            ) {
                setOpenMenu(null);
            }
        };
        window.addEventListener('mousedown', handleOutsideMouseDown, true);
        return () =>
            window.removeEventListener(
                'mousedown',
                handleOutsideMouseDown,
                true
            );
    }, []);

    const selectedLabel = selection
        ? CATEGORIES.find((c) => c.key === selection)?.label ?? null
        : null;

    const closeMenu = () => setOpenMenu(null);

    const runAction = (fn?: () => void) => () => {
        if (fn) fn();
        closeMenu();
    };

    // navigator.clipboard may be undefined (sync throw) AND writeText's
    // promise can reject on permission denial (common inside the deployed
    // iframe) — guard both so Cut/Copy never surface console errors.
    const writeClipboardText = (text: string) => {
        try {
            navigator.clipboard.writeText(text).catch(() => {});
        } catch {}
    };

    const handleCut = () => {
        if (!selection || !selectedLabel) return;
        writeClipboardText(`Control Panel\\${selectedLabel}`);
        setClipboard({ key: selection, mode: 'cut' });
    };

    const handleCopy = () => {
        if (!selection || !selectedLabel) return;
        writeClipboardText(`Control Panel\\${selectedLabel}`);
        setClipboard({ key: selection, mode: 'copy' });
    };

    const handlePaste = () => {
        if (!clipboard) return;
        navigateTo(clipboard.key);
        setClipboard(null);
    };

    const handleRefresh = () => {
        navigate(location.pathname, { replace: true });
    };

    const canCutCopy = selection !== null;
    const canPaste = clipboard !== null;

    const menus: Record<MenuKey, MenuEntry[]> = {
        File: [
            {
                label: 'Open',
                disabled: !selection,
                onSelect: () => selection && navigateTo(selection),
            },
            { label: 'Close', onSelect: onClose },
        ],
        Edit: [
            { label: 'Cut', disabled: !canCutCopy, onSelect: handleCut },
            { label: 'Copy', disabled: !canCutCopy, onSelect: handleCopy },
            { label: 'Paste', disabled: !canPaste, onSelect: handlePaste },
        ],
        View: [
            {
                label: 'Large Icons',
                checked: iconSize === 'large',
                onSelect: () => setIconSize('large'),
            },
            {
                label: 'Small Icons',
                checked: iconSize === 'small',
                onSelect: () => setIconSize('small'),
            },
            { label: 'Refresh', onSelect: handleRefresh },
        ],
        Go: [
            { label: 'Back', disabled: !canGoBack, onSelect: goBack },
            {
                label: 'Forward',
                disabled: !canGoForward,
                onSelect: goForward,
            },
            { label: 'Up', disabled: atRoot, onSelect: () => navigateTo('/') },
            {
                label: 'Control Panel',
                disabled: atRoot,
                onSelect: () => navigateTo('/'),
            },
        ],
        Favorites: CATEGORIES.map((category) => ({
            label: category.label,
            onSelect: () => navigateTo(category.key),
        })),
        Help: [
            {
                label: 'About Control Panel…',
                onSelect: () => setShowAbout(true),
            },
        ],
    };

    // Win98 disambiguates duplicate first letters: File gets F, so
    // Favorites underlines its second letter (Fa̲vorites).
    const renderAccelerated = (label: string) => {
        const i = label === 'Favorites' ? 1 : 0;
        return (
            <>
                {label.slice(0, i)}
                <u>{label.charAt(i)}</u>
                {label.slice(i + 1)}
            </>
        );
    };

    return (
        <div style={styles.container} ref={containerRef}>
            <div style={styles.menuBar}>
                {MENU_KEYS.map((key) => (
                    <div
                        key={key}
                        style={styles.menuItemWrapper}
                        onMouseEnter={() => {
                            if (openMenu && openMenu !== key) {
                                setOpenMenu(key);
                            }
                        }}
                    >
                        <p
                            style={Object.assign(
                                {},
                                styles.menuItem,
                                openMenu === key && styles.menuItemActive
                            )}
                            onMouseDown={() =>
                                setOpenMenu(openMenu === key ? null : key)
                            }
                        >
                            {renderAccelerated(key)}
                        </p>
                        {openMenu === key && (
                            <div style={styles.menuDropdown}>
                                {menus[key].map((entry, i) => (
                                    <div
                                        key={i}
                                        style={Object.assign(
                                            {},
                                            styles.menuDropdownItem,
                                            entry.disabled &&
                                                styles.menuDropdownItemDisabled
                                        )}
                                        onMouseDown={(e) => {
                                            e.stopPropagation();
                                            if (entry.disabled) return;
                                            runAction(entry.onSelect)();
                                        }}
                                    >
                                        <span style={styles.menuDropdownCheck}>
                                            {entry.checked ? '✓' : ''}
                                        </span>
                                        <p>{entry.label}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div style={styles.menuDivider} />
            <div style={styles.toolbar}>
                <ToolbarButton
                    icon="backIcon"
                    label="Back"
                    disabled={!canGoBack}
                    onClick={goBack}
                    hasDropdown
                />
                <ToolbarButton
                    icon="forwardIcon"
                    label="Forward"
                    disabled={!canGoForward}
                    onClick={goForward}
                    hasDropdown
                />
                <ToolbarButton
                    icon="upIcon"
                    label="Up"
                    disabled={atRoot}
                    onClick={() => navigateTo('/')}
                />
                <div style={styles.toolbarSeparator} />
                <ToolbarButton
                    icon="cutIcon"
                    label="Cut"
                    disabled={!canCutCopy}
                    onClick={handleCut}
                />
                <ToolbarButton
                    icon="copyIcon"
                    label="Copy"
                    disabled={!canCutCopy}
                    onClick={handleCopy}
                />
                <ToolbarButton
                    icon="pasteIcon"
                    label="Paste"
                    disabled={!canPaste}
                    onClick={handlePaste}
                />
            </div>
            <div style={styles.addressBarRow}>
                <p style={styles.addressLabel}>Address</p>
                <div style={styles.addressBox}>
                    <Icon
                        icon="settingsIcon"
                        size={16}
                        style={styles.addressIcon}
                    />
                    <p style={styles.addressText}>Control Panel</p>
                </div>
                <button style={styles.addressDropdownButton}>
                    <p style={styles.addressArrow}>▾</p>
                </button>
            </div>
            {showAbout && (
                <div
                    style={styles.aboutBlocker}
                    onMouseDown={() => setShowAbout(false)}
                >
                    <div
                        style={styles.aboutDialog}
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div style={styles.aboutTitleBar}>
                            <Icon
                                icon="settingsIcon"
                                size={16}
                                style={styles.aboutTitleIcon}
                            />
                            <p style={styles.aboutTitleText}>
                                About Control Panel
                            </p>
                        </div>
                        <div style={styles.aboutBody}>
                            <Icon
                                icon="settingsIcon"
                                size={32}
                                style={styles.aboutBodyIcon}
                            />
                            <div style={styles.aboutTextBlock}>
                                <p style={styles.aboutHeading}>
                                    RahulOS Control Panel
                                </p>
                                <p style={styles.aboutTagline}>
                                    Customize your desktop the way you like
                                    it.
                                </p>
                            </div>
                        </div>
                        <div style={styles.aboutFooter}>
                            <button
                                className="site-button"
                                style={styles.aboutOkButton}
                                onMouseDown={() => setShowAbout(false)}
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flexDirection: 'column',
        borderBottom: `1px solid ${Colors.darkGray}`,
        backgroundColor: Colors.lightGray,
    },
    menuBar: {
        flexDirection: 'row',
        padding: '2px 4px',
    },
    menuItemWrapper: {
        position: 'relative',
    },
    menuItem: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        padding: '2px 6px',
        cursor: 'default',
    },
    menuItemActive: {
        backgroundColor: Colors.blue,
        color: Colors.white,
    },
    menuDropdown: {
        position: 'absolute',
        top: '100%',
        left: 0,
        minWidth: 140,
        flexDirection: 'column',
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        backgroundColor: Colors.lightGray,
        zIndex: 10,
        padding: 2,
    },
    menuDropdownItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: '4px 8px',
        fontFamily: 'MSSerif',
        fontSize: 12,
        cursor: 'default',
    },
    menuDropdownItemDisabled: {
        opacity: 0.5,
        cursor: 'default',
    },
    menuDropdownCheck: {
        display: 'inline-block',
        width: 14,
        fontSize: 12,
    },
    menuDivider: {
        height: 2,
        borderTop: `1px solid ${Colors.darkGray}`,
        borderBottom: `1px solid ${Colors.white}`,
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: '2px 4px',
    },
    toolbarButton: {
        flexDirection: 'column',
        alignItems: 'center',
        border: '1px solid transparent',
        background: 'none',
        padding: '1px 5px',
        cursor: 'pointer',
    },
    // Native `disabled` alone doesn't visibly grey these out: there is no
    // global `button` rule in index.css/App.css (only the unrelated
    // `.site-button` class defines a disabled look), and the toolbar icons
    // are plain <img> elements inside a `background: none; border: none`
    // button, so the browser's default disabled treatment has nothing to
    // dim. Fade the whole button explicitly instead, same conditional-style
    // pattern as `swatchSelected` in DisplaySettings.tsx.
    toolbarButtonDisabled: {
        opacity: 0.4,
        cursor: 'default',
    },
    toolbarButtonHover: {
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
    },
    toolbarButtonPressed: {
        border: `1px solid ${Colors.black}`,
        borderBottomColor: Colors.white,
        borderRightColor: Colors.white,
    },
    toolbarButtonTop: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    toolbarDropdownArrow: {
        fontSize: 8,
        marginLeft: 2,
    },
    toolbarLabel: {
        fontFamily: 'MSSerif',
        fontSize: 10,
        marginTop: 2,
    },
    toolbarSeparator: {
        width: 1,
        height: 24,
        backgroundColor: Colors.darkGray,
        marginLeft: 4,
        marginRight: 4,
    },
    addressBarRow: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: '2px 4px',
        borderTop: `1px solid ${Colors.white}`,
    },
    addressLabel: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        marginRight: 6,
    },
    addressBox: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        borderRightWidth: 0,
        backgroundColor: Colors.white,
        padding: '2px 4px',
    },
    addressIcon: {
        marginRight: 4,
    },
    addressText: {
        flex: 1,
        fontFamily: 'MSSerif',
        fontSize: 12,
    },
    addressDropdownButton: {
        width: 16,
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        backgroundColor: Colors.lightGray,
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        padding: 0,
    },
    addressArrow: {
        fontSize: 10,
        lineHeight: '10px',
    },
    aboutBlocker: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        zIndex: 1000,
        alignItems: 'center',
        justifyContent: 'center',
    },
    aboutDialog: {
        flexDirection: 'column',
        width: 280,
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        backgroundColor: Colors.lightGray,
        boxShadow: '2px 2px 6px rgba(0,0,0,0.5)',
    },
    aboutTitleBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.blue,
        padding: '3px 4px',
    },
    aboutTitleIcon: {
        marginRight: 4,
    },
    aboutTitleText: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        color: Colors.white,
    },
    aboutBody: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    aboutBodyIcon: {
        marginRight: 12,
    },
    aboutTextBlock: {
        flexDirection: 'column',
        flex: 1,
    },
    aboutHeading: {
        fontFamily: 'MSSerif',
        fontSize: 13,
        marginBottom: 6,
    },
    aboutTagline: {
        fontFamily: 'MSSerif',
        fontSize: 11,
    },
    aboutFooter: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: '0 12px 12px 12px',
    },
    aboutOkButton: {
        minWidth: 64,
    },
};

export default ExplorerChrome;

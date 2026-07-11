import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '../general';
import Colors from '../../constants/colors';
import { IconName } from '../../assets/icons';

export interface ExplorerChromeProps {
    onClose: () => void;
}

const MENU_ITEMS = ['File', 'Edit', 'View', 'Go', 'Favorites', 'Help'];

const ExplorerChrome: React.FC<ExplorerChromeProps> = ({ onClose }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [openMenu, setOpenMenu] = useState<string | null>(null);

    const atRoot = location.pathname === '/' || location.pathname === '';
    const canGoBack = !atRoot;

    const goBack = () => {
        if (canGoBack) navigate('/');
    };

    const renderToolbarButton = (
        icon: IconName,
        label: string,
        disabled: boolean,
        onMouseDown?: () => void,
        hasDropdown?: boolean
    ) => (
        <button
            style={Object.assign(
                {},
                styles.toolbarButton,
                disabled && styles.toolbarButtonDisabled
            )}
            disabled={disabled}
            onMouseDown={onMouseDown}
        >
            <div style={styles.toolbarButtonTop}>
                <Icon icon={icon} size={16} />
                {hasDropdown && <p style={styles.toolbarDropdownArrow}>▾</p>}
            </div>
            <p style={styles.toolbarLabel}>{label}</p>
        </button>
    );

    return (
        <div style={styles.container}>
            <div style={styles.menuBar}>
                {MENU_ITEMS.map((item) => (
                    <div
                        key={item}
                        style={styles.menuItemWrapper}
                        onMouseEnter={() =>
                            item === 'File' && setOpenMenu(item)
                        }
                        onMouseLeave={() => setOpenMenu(null)}
                    >
                        <p
                            style={Object.assign(
                                {},
                                styles.menuItem,
                                openMenu === item && styles.menuItemActive
                            )}
                            onMouseDown={() =>
                                setOpenMenu(openMenu === item ? null : item)
                            }
                        >
                            {item}
                        </p>
                        {item === 'File' && openMenu === 'File' && (
                            <div style={styles.menuDropdown}>
                                <div
                                    style={styles.menuDropdownItem}
                                    onMouseDown={() => {
                                        setOpenMenu(null);
                                        onClose();
                                    }}
                                >
                                    <p>Close</p>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <div style={styles.toolbar}>
                {renderToolbarButton(
                    'backIcon',
                    'Back',
                    !canGoBack,
                    goBack,
                    true
                )}
                {renderToolbarButton('forwardIcon', 'Forward', true, undefined, true)}
                {renderToolbarButton('upIcon', 'Up', !canGoBack, goBack)}
                <div style={styles.toolbarSeparator} />
                {renderToolbarButton('cutIcon', 'Cut', true)}
                {renderToolbarButton('copyIcon', 'Copy', true)}
                {renderToolbarButton('pasteIcon', 'Paste', true)}
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
        minWidth: 100,
        border: `1px solid ${Colors.white}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        backgroundColor: Colors.lightGray,
        zIndex: 10,
    },
    menuDropdownItem: {
        padding: '4px 8px',
        fontFamily: 'MSSerif',
        fontSize: 12,
        cursor: 'default',
    },
    toolbar: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: '2px 4px',
        borderTop: `1px solid ${Colors.white}`,
    },
    toolbarButton: {
        flexDirection: 'column',
        alignItems: 'center',
        border: 'none',
        background: 'none',
        padding: '2px 6px',
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
};

export default ExplorerChrome;

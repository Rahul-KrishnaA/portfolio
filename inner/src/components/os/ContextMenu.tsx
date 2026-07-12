import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import Colors from '../../constants/colors';

export interface ContextMenuItem {
    label: string;
    onSelect: () => void;
    disabled?: boolean;
    separatorBefore?: boolean;
}

export interface ContextMenuProps {
    x: number;
    y: number;
    items: ContextMenuItem[];
    onClose: () => void;
}

const VIEWPORT_MARGIN = 4;

const ContextMenu: React.FC<ContextMenuProps> = ({ x, y, items, onClose }) => {
    const containerRef = useRef<HTMLDivElement | null>(null);
    // Anchoring (x, y) as the menu's top-left corner works everywhere
    // except near the bottom/right edge — a taskbar button's right-click
    // point sits only ~30px above the viewport bottom, so a menu with
    // several items would render mostly off-screen below it. Measure the
    // menu's actual size after mount and flip to open upward/leftward
    // whenever it would overflow, matching real Windows context-menu
    // behavior. Hidden (opacity 0) until measured so there's no visible
    // jump from the unflipped to the flipped position.
    const [pos, setPos] = useState<{ left: number; top: number } | null>(
        null
    );

    useLayoutEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const left =
            x + rect.width + VIEWPORT_MARGIN > window.innerWidth
                ? Math.max(VIEWPORT_MARGIN, x - rect.width)
                : x;
        const top =
            y + rect.height + VIEWPORT_MARGIN > window.innerHeight
                ? Math.max(VIEWPORT_MARGIN, y - rect.height)
                : y;
        setPos({ left, top });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [x, y, items]);

    useEffect(() => {
        const handleOutsideMouseDown = (event: MouseEvent) => {
            if (
                containerRef.current &&
                !containerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };
        window.addEventListener('mousedown', handleOutsideMouseDown, true);
        return () =>
            window.removeEventListener(
                'mousedown',
                handleOutsideMouseDown,
                true
            );
    }, [onClose]);

    const handleSelect = (item: ContextMenuItem) => {
        if (item.disabled) return;
        item.onSelect();
        onClose();
    };

    return (
        <div
            ref={containerRef}
            style={Object.assign(
                {},
                styles.container,
                pos
                    ? { left: pos.left, top: pos.top, opacity: 1 }
                    : { left: x, top: y, opacity: 0 }
            )}
            onMouseDown={(event) => event.stopPropagation()}
        >
            {items.map((item, i) => (
                <React.Fragment key={i}>
                    {item.separatorBefore && <div style={styles.separator} />}
                    <div
                        className={item.disabled ? undefined : 'start-menu-option'}
                        style={Object.assign(
                            {},
                            styles.item,
                            item.disabled && styles.itemDisabled
                        )}
                        onMouseDown={(event) => {
                            event.stopPropagation();
                            handleSelect(item);
                        }}
                    >
                        <p>{item.label}</p>
                    </div>
                </React.Fragment>
            ))}
        </div>
    );
};

// `position: fixed` (viewport-relative, not ancestor-relative) so this
// renders correctly regardless of which positioned ancestor it mounts
// under (a DesktopShortcut's own `position: absolute` box, a taskbar
// button, etc.) — the (x, y) it receives is always a `clientX`/`clientY`
// viewport coordinate from the triggering mouse event.
const styles: StyleSheetCSS = {
    container: {
        position: 'fixed',
        flexDirection: 'column',
        minWidth: 160,
        border: `1px solid ${'var(--os-edge-white)'}`,
        borderBottomColor: Colors.black,
        borderRightColor: Colors.black,
        backgroundColor: 'var(--os-chrome-bg)',
        boxShadow: '2px 2px 6px rgba(0,0,0,0.5)',
        zIndex: 200000,
        padding: 2,
    },
    item: {
        padding: '5px 10px',
        fontFamily: 'MSSerif',
        fontSize: 12,
        cursor: 'pointer',
    },
    itemDisabled: {
        opacity: 0.5,
        cursor: 'default',
    },
    separator: {
        height: 1,
        marginTop: 2,
        marginBottom: 2,
        borderTop: `1px solid ${Colors.darkGray}`,
        borderBottom: `1px solid ${'var(--os-edge-white)'}`,
    },
};

export default ContextMenu;

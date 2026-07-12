import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconName } from '../../assets/icons';
import colors from '../../constants/colors';
import { Icon } from '../general';
import { GridPosition } from '../../contexts/DesktopIconPositionsContext';
import { usePinnedApps } from '../../contexts/PinnedAppsContext';
import { useSound } from '../../contexts/SoundContext';
import ContextMenu, { ContextMenuItem } from './ContextMenu';

// Grid origin/cell size — matches `styles.shortcuts`'s former wrapper offset
// (top: 16, left: 6) and the previous hardcoded `i * 104` row height. Folded
// in here since position is now per-icon data, not an index into a wrapper.
const GRID_ORIGIN_LEFT = 6;
const GRID_ORIGIN_TOP = 16;
const GRID_CELL_WIDTH = 72;
const GRID_CELL_HEIGHT = 104;

// Minimum pointer displacement (px) before a mousedown is treated as a drag
// instead of a click. Below this, the existing click/double-click logic
// fires completely unchanged.
const DRAG_THRESHOLD = 5;

// Matches Toolbar.tsx's styles.toolbarOuter.height — used to hit-test a
// drag-end drop point against the taskbar for drag-to-pin.
const TASKBAR_HEIGHT = 32;

export interface DesktopShortcutProps {
    icon: IconName;
    shortcutName: string;
    shortcutKey: string;
    invertText?: boolean;
    onOpen: () => void;
    position: GridPosition;
    onPositionChange: (pos: GridPosition) => void;
    isPositionAvailable: (pos: GridPosition) => boolean;
}

const DesktopShortcut: React.FC<DesktopShortcutProps> = ({
    icon,
    shortcutName,
    shortcutKey,
    invertText,
    onOpen,
    position,
    onPositionChange,
    isPositionAvailable,
}) => {
    const [isSelected, setIsSelected] = useState(false);
    const [shortcutId, setShortcutId] = useState('');
    const { playSound } = useSound();
    const [lastSelected, setLastSelected] = useState(false);
    const containerRef = useRef<any>();

    const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(
        null
    );
    const {
        pinnedStartMenu,
        pinnedTaskbar,
        toggleStartMenuPin,
        toggleTaskbarPin,
        hideFromDesktop,
    } = usePinnedApps();

    // Tracks an in-progress drag gesture between mousedown and mouseup.
    // `dragging` only flips true once the threshold is crossed, and is what
    // gates click-vs-drag at mouseup time.
    const dragInfoRef = useRef<{
        startX: number;
        startY: number;
        dragging: boolean;
    } | null>(null);

    const requiredIcon = require(`../../assets/icons/${icon}.png`);
    const [doubleClickTimerActive, setDoubleClickTimerActive] = useState(false);

    const getShortcutId = useCallback(() => {
        const shortcutId = shortcutName.replace(/\s/g, '');
        return `desktop-shortcut-${shortcutId}`;
    }, [shortcutName]);

    useEffect(() => {
        setShortcutId(getShortcutId());
    }, [shortcutName, getShortcutId]);

    const handleClickOutside = useCallback(
        (event: MouseEvent) => {
            // @ts-ignore
            const targetId = event.target.id;
            if (targetId !== shortcutId) {
                setIsSelected(false);
            }
            if (!isSelected && lastSelected) {
                setLastSelected(false);
            }
        },
        [isSelected, setIsSelected, setLastSelected, lastSelected, shortcutId]
    );

    const handleClickShortcut = useCallback(() => {
        if (doubleClickTimerActive) {
            playSound('click');
            onOpen && onOpen();
            setIsSelected(false);
            setDoubleClickTimerActive(false);
            return;
        }
        setIsSelected(true);
        setLastSelected(true);
        setDoubleClickTimerActive(true);
        // set double click timer
        setTimeout(() => {
            setDoubleClickTimerActive(false);
        }, 300);
    }, [doubleClickTimerActive, setIsSelected, onOpen, playSound]);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSelected, handleClickOutside]);

    // Mirrors Window.tsx's startDrag/onDrag/stopDrag idiom: window-level
    // mousemove/mouseup listeners attached on mousedown, tracking a
    // dragStart ref and live-offsetting via a CSS transform (no re-parenting
    // or absolute repositioning mid-drag).
    const onDragMove = useCallback((event: MouseEvent) => {
        const info = dragInfoRef.current;
        if (!info) return;
        const dx = event.clientX - info.startX;
        const dy = event.clientY - info.startY;

        if (!info.dragging) {
            if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
                return;
            }
            // Threshold crossed exactly once — from here on this gesture is
            // a drag, not a click.
            info.dragging = true;
        }

        if (containerRef.current) {
            containerRef.current.style.transform = `translate(${dx}px, ${dy}px)`;
        }
    }, []);

    const onDragEnd = useCallback(
        (event: MouseEvent) => {
            const info = dragInfoRef.current;
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
            dragInfoRef.current = null;

            if (!info) return;

            if (!info.dragging) {
                // Threshold never crossed during this gesture — fall through
                // to the existing single/double-click logic, unchanged.
                handleClickShortcut();
                return;
            }

            // Reset the live-drag transform regardless of outcome — on
            // commit the `position` prop will update to match (parent
            // re-render); on revert/pin this simply snaps back to the
            // unchanged `position` prop's coordinates.
            if (containerRef.current) {
                containerRef.current.style.transform = 'translate(0px, 0px)';
            }

            // Dropped onto the taskbar: pin instead of grid-repositioning.
            if (event.clientY >= window.innerHeight - TASKBAR_HEIGHT) {
                if (!pinnedTaskbar.includes(shortcutKey)) {
                    toggleTaskbarPin(shortcutKey);
                }
                return;
            }

            const dx = event.clientX - info.startX;
            const dy = event.clientY - info.startY;

            const newCol = Math.max(
                0,
                Math.round(position.col + dx / GRID_CELL_WIDTH)
            );
            const newRow = Math.max(
                0,
                Math.round(position.row + dy / GRID_CELL_HEIGHT)
            );
            const newPos = { col: newCol, row: newRow };

            const isSamePosition =
                newPos.col === position.col && newPos.row === position.row;

            if (!isSamePosition && isPositionAvailable(newPos)) {
                onPositionChange(newPos);
            }
            // Otherwise (same cell, or occupied by another icon): revert —
            // transform already reset above, and no context write happens.
        },
        [
            onDragMove,
            position,
            isPositionAvailable,
            onPositionChange,
            handleClickShortcut,
            pinnedTaskbar,
            toggleTaskbarPin,
            shortcutKey,
        ]
    );

    const handleMouseDown = useCallback(
        (event: React.MouseEvent) => {
            // Right-click (button 2) must only open the context menu
            // (handleContextMenu below), not also arm the click/drag
            // gesture — otherwise a right-click's mouseup would select
            // the icon and arm the double-click timer, letting a quick
            // follow-up click unexpectedly open the app.
            if (event.button !== 0) return;
            event.preventDefault();
            dragInfoRef.current = {
                startX: event.clientX,
                startY: event.clientY,
                dragging: false,
            };
            window.addEventListener('mousemove', onDragMove, false);
            window.addEventListener('mouseup', onDragEnd, false);
        },
        [onDragMove, onDragEnd]
    );

    // Safety cleanup: if the component unmounts mid-drag, don't leak
    // window-level listeners.
    useEffect(() => {
        return () => {
            window.removeEventListener('mousemove', onDragMove);
            window.removeEventListener('mouseup', onDragEnd);
        };
    }, [onDragMove, onDragEnd]);

    const positionStyle = {
        left: GRID_ORIGIN_LEFT + position.col * GRID_CELL_WIDTH,
        top: GRID_ORIGIN_TOP + position.row * GRID_CELL_HEIGHT,
    };

    const handleContextMenu = useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        setIsSelected(true);
        setLastSelected(true);
        setContextMenu({ x: event.clientX, y: event.clientY });
    }, []);

    const menuItems: ContextMenuItem[] = [
        { label: 'Open', onSelect: onOpen },
        {
            label: pinnedStartMenu.has(shortcutKey)
                ? 'Unpin from Start Menu'
                : 'Pin to Start Menu',
            onSelect: () => toggleStartMenuPin(shortcutKey),
        },
        {
            label: pinnedTaskbar.includes(shortcutKey)
                ? 'Unpin from Taskbar'
                : 'Pin to Taskbar',
            onSelect: () => toggleTaskbarPin(shortcutKey),
        },
        {
            label: 'Remove from Desktop',
            onSelect: () => hideFromDesktop(shortcutKey),
            separatorBefore: true,
        },
    ];

    return (
        <>
        <div
            id={`${shortcutId}`}
            style={Object.assign(
                {},
                styles.appShortcut,
                // Grid-derived left/top is the single source of truth for
                // where the icon sits (see GRID_ORIGIN_LEFT/TOP above). This
                // used to be merged with a legacy `scaledStyle` nudge
                // (transform: scale(1.5) + a left/top offset) computed from
                // a pre-grid DOM structure where this element had no
                // explicit left/top of its own — the scale was compensated
                // by an ancestor wrapper's positioning. Now that this
                // element owns its own absolute left/top directly, that
                // same scale(1.5)/transformOrigin:center combo instead
                // visually shifts the box up/left of its intended grid
                // origin (scaling a positioned box from its own center
                // pushes its edges outward from `left`/`top`, not from the
                // grid cell). It served no other purpose (no CSS/hover rule
                // depends on it), so it's removed entirely rather than
                // reordered — positionStyle was never the bug, the stray
                // transform was.
                positionStyle
            )}
            onMouseDown={handleMouseDown}
            onContextMenu={handleContextMenu}
            ref={containerRef}
        >
            <div id={`${shortcutId}`} style={styles.iconContainer}>
                <div
                    id={`${shortcutId}`}
                    className="desktop-shortcut-icon"
                    style={Object.assign(
                        {},
                        styles.iconOverlay,
                        isSelected && styles.checkerboard,
                        isSelected && {
                            WebkitMask: `url(${requiredIcon})`,
                            WebkitMaskSize: '100% 100%',
                            WebkitMaskRepeat: 'no-repeat',
                        }
                    )}
                />
                <Icon icon={icon} size={32 * SCALE} />
            </div>
            <div
                className={
                    isSelected
                        ? 'selected-shortcut-border'
                        : lastSelected
                        ? 'shortcut-border'
                        : ''
                }
                id={`${shortcutId}`}
                style={isSelected ? { backgroundColor: colors.blue } : {}}
            >
                <p
                    id={`${shortcutId}`}
                    style={Object.assign(
                        {},
                        styles.shortcutText,
                        invertText && !isSelected && { color: 'black' }
                    )}
                >
                    {shortcutName}
                </p>
            </div>
        </div>
        {contextMenu && (
            <ContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                items={menuItems}
                onClose={() => setContextMenu(null)}
            />
        )}
        </>
    );
};

// The original design rendered icons at 1.5x their base 32px/8px-text size
// via a runtime-measured `transform: scale(1.5)` (compensated by a
// quarter-width/height left/top offset to re-center around the box's own
// center). That measurement-and-offset hack is what broke once this
// component started owning its own grid-driven left/top directly (see the
// comment on `positionStyle` below). Baking the 1.5x enlargement into the
// actual icon/text dimensions instead reproduces the same visual size
// without any transform-vs-position interaction to get wrong.
const SCALE = 1.5;

const styles: StyleSheetCSS = {
    appShortcut: {
        position: 'absolute',
        width: 56 * SCALE,

        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        textAlign: 'center',
    },
    shortcutText: {
        cursor: 'pointer',
        textOverflow: 'wrap',
        fontFamily: 'MSSerif',
        color: 'white',
        fontSize: 8 * SCALE,
        paddingRight: 2,
        paddingLeft: 2,
    },
    iconContainer: {
        cursor: 'pointer',
        paddingBottom: 3,
    },
    iconOverlay: {
        position: 'absolute',
        top: 0,
        width: 32 * SCALE,
        height: 32 * SCALE,
    },
    checkerboard: {
        backgroundImage: `linear-gradient(45deg, ${colors.blue} 25%, transparent 25%),
        linear-gradient(-45deg, ${colors.blue} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, ${colors.blue} 75%),
        linear-gradient(-45deg, transparent 75%, ${colors.blue} 75%)`,
        backgroundSize: `${2 * SCALE}px ${2 * SCALE}px`,
        backgroundPosition: `0 0, 0 ${SCALE}px, ${SCALE}px -${SCALE}px, -${SCALE}px 0px`,
        pointerEvents: 'none',
    },
};

export default DesktopShortcut;

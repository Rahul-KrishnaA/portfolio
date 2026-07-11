import React, { useCallback, useEffect, useRef, useState } from 'react';
import { IconName } from '../../assets/icons';
import colors from '../../constants/colors';
import { Icon } from '../general';
import { GridPosition } from '../../contexts/DesktopIconPositionsContext';

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

export interface DesktopShortcutProps {
    icon: IconName;
    shortcutName: string;
    invertText?: boolean;
    onOpen: () => void;
    position: GridPosition;
    onPositionChange: (pos: GridPosition) => void;
    isPositionAvailable: (pos: GridPosition) => boolean;
}

const DesktopShortcut: React.FC<DesktopShortcutProps> = ({
    icon,
    shortcutName,
    invertText,
    onOpen,
    position,
    onPositionChange,
    isPositionAvailable,
}) => {
    const [isSelected, setIsSelected] = useState(false);
    const [shortcutId, setShortcutId] = useState('');
    const [lastSelected, setLastSelected] = useState(false);
    const containerRef = useRef<any>();

    // Tracks an in-progress drag gesture between mousedown and mouseup.
    // `dragging` only flips true once the threshold is crossed, and is what
    // gates click-vs-drag at mouseup time.
    const dragInfoRef = useRef<{
        startX: number;
        startY: number;
        dragging: boolean;
    } | null>(null);

    const [scaledStyle, setScaledStyle] = useState({});

    const requiredIcon = require(`../../assets/icons/${icon}.png`);
    const [doubleClickTimerActive, setDoubleClickTimerActive] = useState(false);

    const getShortcutId = useCallback(() => {
        const shortcutId = shortcutName.replace(/\s/g, '');
        return `desktop-shortcut-${shortcutId}`;
    }, [shortcutName]);

    useEffect(() => {
        setShortcutId(getShortcutId());
    }, [shortcutName, getShortcutId]);

    useEffect(() => {
        if (containerRef.current && Object.keys(scaledStyle).length === 0) {
            //@ts-ignore
            const boundingBox = containerRef.current.getBoundingClientRect();
            setScaledStyle({
                transformOrigin: 'center',
                transform: 'scale(1.5)',
                left: boundingBox.width / 4,
                top: boundingBox.height / 4,
                // transform: 'scale(1.5)',
                // left: boundingBox.width / 4,
                // top: boundingBox.height / 4,
            });
        }
    }, [scaledStyle]);

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
    }, [doubleClickTimerActive, setIsSelected, onOpen]);

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

            // Reset the live-drag transform regardless of outcome — on
            // commit the `position` prop will update to match (parent
            // re-render); on revert this simply snaps back to the
            // unchanged `position` prop's coordinates.
            if (containerRef.current) {
                containerRef.current.style.transform = 'translate(0px, 0px)';
            }

            const isSamePosition =
                newPos.col === position.col && newPos.row === position.row;

            if (!isSamePosition && isPositionAvailable(newPos)) {
                onPositionChange(newPos);
            }
            // Otherwise (same cell, or occupied by another icon): revert —
            // transform already reset above, and no context write happens.
        },
        [onDragMove, position, isPositionAvailable, onPositionChange, handleClickShortcut]
    );

    const handleMouseDown = useCallback(
        (event: React.MouseEvent) => {
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

    return (
        <div
            id={`${shortcutId}`}
            style={Object.assign(
                {},
                styles.appShortcut,
                scaledStyle,
                // Grid-derived left/top always wins over `scaledStyle`'s
                // legacy centering-offset left/top (see effect above) — the
                // grid position is now the single source of truth for where
                // the icon sits.
                positionStyle
            )}
            onMouseDown={handleMouseDown}
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
                        }
                    )}
                />
                <Icon icon={icon} style={styles.icon} />
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
    );
};

const styles: StyleSheetCSS = {
    appShortcut: {
        position: 'absolute',
        width: 56,

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
        fontSize: 8,
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
        width: 32,
        height: 32,
    },
    checkerboard: {
        backgroundImage: `linear-gradient(45deg, ${colors.blue} 25%, transparent 25%),
        linear-gradient(-45deg, ${colors.blue} 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, ${colors.blue} 75%),
        linear-gradient(-45deg, transparent 75%, ${colors.blue} 75%)`,
        backgroundSize: `2px 2px`,
        backgroundPosition: `0 0, 0 1px, 1px -1px, -1px 0px`,
        pointerEvents: 'none',
    },
};

export default DesktopShortcut;

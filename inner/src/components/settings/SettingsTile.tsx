import React, { useCallback, useState } from 'react';
import { Icon } from '../general';
import { IconName } from '../../assets/icons';
import colors from '../../constants/colors';

export interface SettingsTileProps {
    icon: IconName;
    label: string;
    selected: boolean;
    dimmed: boolean;
    iconSize: number;
    onSelect: () => void;
    onOpen: () => void;
}

const SettingsTile: React.FC<SettingsTileProps> = ({
    icon,
    label,
    selected,
    dimmed,
    iconSize,
    onSelect,
    onOpen,
}) => {
    const [isHovering, setIsHovering] = useState(false);
    const [doubleClickTimerActive, setDoubleClickTimerActive] =
        useState(false);

    const handleMouseDown = useCallback(() => {
        if (doubleClickTimerActive) {
            setDoubleClickTimerActive(false);
            onOpen();
            return;
        }
        onSelect();
        setDoubleClickTimerActive(true);
        setTimeout(() => {
            setDoubleClickTimerActive(false);
        }, 300);
    }, [doubleClickTimerActive, onSelect, onOpen]);

    return (
        <div
            style={Object.assign(
                {},
                styles.tile,
                dimmed && styles.tileDimmed
            )}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseDown={handleMouseDown}
        >
            <div
                style={Object.assign(
                    {},
                    styles.iconContainer,
                    isHovering && !selected && { backgroundColor: colors.blue, opacity: 0.4 }
                )}
            >
                <Icon icon={icon} size={iconSize} />
            </div>
            <p
                style={Object.assign(
                    {},
                    styles.label,
                    selected && styles.labelSelected
                )}
            >
                {label}
            </p>
        </div>
    );
};

const styles: StyleSheetCSS = {
    tile: {
        width: 80,
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        marginRight: 16,
        marginBottom: 16,
    },
    tileDimmed: {
        opacity: 0.5,
    },
    iconContainer: {
        padding: 8,
        marginBottom: 4,
    },
    label: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        textAlign: 'center',
        padding: '1px 3px',
    },
    labelSelected: {
        backgroundColor: colors.blue,
        color: colors.white,
    },
};

export default SettingsTile;

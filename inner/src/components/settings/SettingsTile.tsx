import React, { useState } from 'react';
import { Icon } from '../general';
import { IconName } from '../../assets/icons';
import colors from '../../constants/colors';

export interface SettingsTileProps {
    icon: IconName;
    label: string;
    onClick: () => void;
}

const SettingsTile: React.FC<SettingsTileProps> = ({
    icon,
    label,
    onClick,
}) => {
    const [isHovering, setIsHovering] = useState(false);

    return (
        <div
            style={styles.tile}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            onMouseDown={onClick}
        >
            <div
                style={Object.assign(
                    {},
                    styles.iconContainer,
                    isHovering && { backgroundColor: colors.blue }
                )}
            >
                <Icon icon={icon} size={40} />
            </div>
            <p style={styles.label}>{label}</p>
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
    iconContainer: {
        padding: 8,
        marginBottom: 4,
    },
    label: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        textAlign: 'center',
    },
};

export default SettingsTile;

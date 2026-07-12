import React from 'react';
import SettingsTile from './SettingsTile';
import { CATEGORIES } from './categories';
import { useControlPanel } from './ControlPanelContext';

export interface SettingsGridProps {}

const SettingsGrid: React.FC<SettingsGridProps> = () => {
    const { selection, setSelection, clipboard, iconSize, navigateTo } =
        useControlPanel();

    const iconPixelSize = iconSize === 'large' ? 40 : 20;

    return (
        <div
            style={styles.grid}
            onMouseDown={(e) => {
                if (e.target === e.currentTarget) {
                    setSelection(null);
                }
            }}
        >
            {CATEGORIES.map((category) => (
                <SettingsTile
                    key={category.key}
                    icon={category.icon}
                    label={category.label}
                    selected={selection === category.key}
                    dimmed={
                        clipboard?.mode === 'cut' &&
                        clipboard.key === category.key
                    }
                    iconSize={iconPixelSize}
                    onSelect={() => setSelection(category.key)}
                    onOpen={() => navigateTo(category.key)}
                    openOnSingleClick
                />
            ))}
        </div>
    );
};

const styles: StyleSheetCSS = {
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        width: '100%',
        height: '100%',
    },
};

export default SettingsGrid;

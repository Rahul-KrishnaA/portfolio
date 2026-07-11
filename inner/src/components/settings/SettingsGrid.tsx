import React from 'react';
import { useNavigate } from 'react-router-dom';
import SettingsTile from './SettingsTile';
import { CATEGORIES } from './categories';

export interface SettingsGridProps {}

const SettingsGrid: React.FC<SettingsGridProps> = () => {
    const navigate = useNavigate();

    return (
        <div style={styles.grid}>
            {CATEGORIES.map((category) => (
                <SettingsTile
                    key={category.key}
                    icon={category.icon}
                    label={category.label}
                    onClick={() => navigate(category.key)}
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
    },
};

export default SettingsGrid;

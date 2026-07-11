import React from 'react';
import { useParams } from 'react-router-dom';
import { CATEGORIES } from './categories';
import { useControlPanel } from './ControlPanelContext';

export interface SettingsCategoryPlaceholderProps {}

const SettingsCategoryPlaceholder: React.FC<
    SettingsCategoryPlaceholderProps
> = () => {
    const { goBack } = useControlPanel();
    const { category } = useParams<{ category: string }>();
    const matched = CATEGORIES.find((c) => c.key === category);
    const label = matched ? matched.label : 'Settings';

    return (
        <div style={styles.container}>
            <button
                className="site-button"
                style={styles.backButton}
                onClick={goBack}
            >
                ← Back
            </button>
            <h3 style={styles.heading}>{label}</h3>
            <p style={styles.body}>Coming soon.</p>
        </div>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flexDirection: 'column',
        padding: 16,
    },
    backButton: {
        alignSelf: 'flex-start',
        marginBottom: 16,
    },
    heading: {
        fontFamily: 'MSSerif',
        marginBottom: 8,
    },
    body: {
        fontFamily: 'MSSerif',
    },
};

export default SettingsCategoryPlaceholder;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme, Theme } from '../../contexts/ThemeContext';
import Colors from '../../constants/colors';

export interface PersonalizationSettingsProps {}

const OPTIONS: { value: Theme; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
];

const PersonalizationSettings: React.FC<PersonalizationSettingsProps> = () => {
    const navigate = useNavigate();
    const { theme, setTheme } = useTheme();

    return (
        <div style={styles.container}>
            <button
                className="site-button"
                style={styles.backButton}
                onClick={() => navigate('/')}
            >
                ← Back
            </button>
            <h3 style={styles.heading}>Personalization</h3>
            <p style={styles.label}>Theme</p>
            <div style={styles.grid}>
                {OPTIONS.map((option) => {
                    const selected = theme === option.value;
                    return (
                        <div
                            key={option.value}
                            title={option.label}
                            // onMouseDown (not onClick) to match the
                            // DisplaySettings swatch pattern, avoiding
                            // conflicts with window drag/focus handling
                            // which also listens on mousedown.
                            onMouseDown={() => setTheme(option.value)}
                            style={Object.assign(
                                {},
                                styles.swatch,
                                selected && styles.swatchSelected
                            )}
                        >
                            <div
                                style={Object.assign({}, styles.swatchInner, {
                                    backgroundColor:
                                        option.value === 'light'
                                            ? Colors.white
                                            : Colors.black,
                                })}
                            />
                            <p style={styles.optionLabel}>{option.label}</p>
                        </div>
                    );
                })}
            </div>
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
    label: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        marginBottom: 8,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    swatch: {
        width: 72,
        flexDirection: 'column',
        alignItems: 'center',
        marginRight: 12,
        marginBottom: 12,
        padding: 2,
        boxSizing: 'border-box',
        cursor: 'pointer',
        border: `2px solid transparent`,
    },
    swatchSelected: {
        // Win98 inset selection look — same two-tone bevel technique as
        // DisplaySettings.tsx's swatchSelected (dark top/left, light
        // bottom/right via white base + black overrides on top/left).
        border: `2px solid ${Colors.white}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
    },
    swatchInner: {
        width: 56,
        height: 40,
        border: `1px solid ${Colors.darkGray}`,
        boxSizing: 'border-box',
    },
    optionLabel: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        marginTop: 4,
    },
};

export default PersonalizationSettings;

import React from 'react';
import { useSound } from '../../contexts/SoundContext';
import Colors from '../../constants/colors';
import { useControlPanel } from './ControlPanelContext';

export interface SoundsSettingsProps {}

const OPTIONS: { value: boolean; label: string }[] = [
    { value: false, label: 'On' },
    { value: true, label: 'Muted' },
];

const SoundsSettings: React.FC<SoundsSettingsProps> = () => {
    const { goBack } = useControlPanel();
    const { muted, setMuted, playSound } = useSound();

    return (
        <div style={styles.container}>
            <button
                className="site-button"
                style={styles.backButton}
                onClick={goBack}
            >
                ← Back
            </button>
            <h3 style={styles.heading}>Sounds</h3>
            <p style={styles.label}>System sounds</p>
            <div style={styles.grid}>
                {OPTIONS.map((option) => {
                    const selected = muted === option.value;
                    return (
                        <div
                            key={option.label}
                            title={option.label}
                            // onMouseDown (not onClick) to match the
                            // Personalization/Display swatch pattern.
                            onMouseDown={() => {
                                setMuted(option.value);
                                if (!option.value) playSound('click');
                            }}
                            style={Object.assign(
                                {},
                                styles.swatch,
                                selected && styles.swatchSelected
                            )}
                        >
                            <div style={styles.swatchInner}>
                                {option.value ? '🔇' : '🔊'}
                            </div>
                            <p style={styles.optionLabel}>{option.label}</p>
                        </div>
                    );
                })}
            </div>
            <button
                className="site-button"
                style={styles.testButton}
                onMouseDown={() => playSound('startup')}
            >
                Test startup chime
            </button>
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
        border: `2px solid ${Colors.white}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
    },
    swatchInner: {
        width: 56,
        height: 40,
        border: `1px solid ${Colors.darkGray}`,
        boxSizing: 'border-box',
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 20,
    },
    optionLabel: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        marginTop: 4,
    },
    testButton: {
        alignSelf: 'flex-start',
        marginTop: 8,
        height: 26,
        paddingLeft: 10,
        paddingRight: 10,
    },
};

export default SoundsSettings;

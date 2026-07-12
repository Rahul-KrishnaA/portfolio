import React, { useEffect } from 'react';

export interface BSODProps {
    onDismiss: () => void;
}

// Classic Win9x blue-screen-of-death easter egg. Any key (or click)
// dismisses it and "reboots" back to the desktop — nothing underneath is
// actually torn down, this is purely a full-screen overlay.
const BSOD: React.FC<BSODProps> = ({ onDismiss }) => {
    useEffect(() => {
        const dismiss = () => onDismiss();
        window.addEventListener('keydown', dismiss);
        window.addEventListener('mousedown', dismiss);
        return () => {
            window.removeEventListener('keydown', dismiss);
            window.removeEventListener('mousedown', dismiss);
        };
    }, [onDismiss]);

    return (
        <div style={styles.overlay}>
            <div style={styles.inner}>
                <p style={styles.title}>RahulOS</p>
                <p style={styles.body}>
                    {'\n'}
                    An unrecoverable error occurred while rendering the
                    portfolio.{'\n'}
                    {'\n'}
                    If this is the first time you've seen this error screen,
                    restart the browser tab. If this screen appears again,
                    it means you found the easter egg — nice work.{'\n'}
                    {'\n'}
                    Technical information:{'\n'}
                    {'\n'}
                    *** STOP: 0x0000004E (0xRAHULKRISHNAA, 0x00000000,
                    0x00000000, 0x00000000){'\n'}
                    {'\n'}
                    *** PORTFOLIO.SYS - Address 4B2F0AE2 base at 4B200000,
                    DateStamp 3e93569c{'\n'}
                </p>
                <p style={styles.footer}>
                    Press any key to reboot, or click anywhere to continue.
                </p>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    overlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: '#0000AA',
        color: '#FFFFFF',
        zIndex: 300000,
        display: 'flex',
        boxSizing: 'border-box',
        padding: 48,
        cursor: 'default',
        userSelect: 'none',
    },
    inner: {
        flexDirection: 'column',
        maxWidth: 720,
    },
    title: {
        fontFamily: 'monospace',
        fontSize: 16,
        backgroundColor: '#FFFFFF',
        color: '#0000AA',
        padding: '2px 8px',
        marginBottom: 24,
        alignSelf: 'flex-start',
    },
    body: {
        fontFamily: 'monospace',
        fontSize: 14,
        whiteSpace: 'pre-line',
        lineHeight: 1.5,
    },
    footer: {
        fontFamily: 'monospace',
        fontSize: 14,
        marginTop: 24,
    },
};

export default BSOD;

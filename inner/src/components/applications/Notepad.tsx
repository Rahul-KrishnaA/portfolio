import React, { useCallback, useRef, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface NotepadProps extends WindowAppProps {}

const DEFAULT_FILENAME = 'Untitled.txt';

const Notepad: React.FC<NotepadProps> = (props) => {
    const [text, setText] = useState('');
    const [fileName, setFileName] = useState(DEFAULT_FILENAME);
    const textAreaRef = useRef<HTMLTextAreaElement>(null);

    const handleNew = useCallback(() => {
        setText('');
        setFileName(DEFAULT_FILENAME);
        textAreaRef.current?.focus();
    }, []);

    const handleSave = useCallback(() => {
        const blob = new Blob([text], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || DEFAULT_FILENAME;
        a.click();
        URL.revokeObjectURL(url);
    }, [text, fileName]);

    return (
        <Window
            top={120}
            left={160}
            width={480}
            height={400}
            windowTitle={`Notepad - ${fileName}`}
            windowBarIcon="notepadIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <div style={styles.container}>
                <div style={styles.toolbar}>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={handleNew}
                    >
                        New
                    </button>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={handleSave}
                    >
                        Save
                    </button>
                    <input
                        style={styles.filenameInput}
                        value={fileName}
                        onChange={(e) => setFileName(e.target.value)}
                        spellCheck={false}
                    />
                </div>
                <textarea
                    ref={textAreaRef}
                    style={styles.textArea}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    spellCheck={false}
                />
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        flexDirection: 'column',
        boxSizing: 'border-box',
    },
    toolbar: {
        width: '100%',
        alignItems: 'center',
        padding: 6,
        borderBottom: `1px solid ${Colors.darkGray}`,
        flexShrink: 0,
        boxSizing: 'border-box',
    },
    toolbarButton: {
        minWidth: 56,
        height: 26,
        marginRight: 6,
    },
    filenameInput: {
        marginLeft: 'auto',
        border: `1px solid ${Colors.darkGray}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
        padding: '3px 6px',
        fontFamily: 'MSSerif',
        fontSize: 12,
        width: 160,
    },
    textArea: {
        flex: 1,
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        border: 'none',
        outline: 'none',
        resize: 'none',
        padding: 8,
        fontFamily: 'Consolas, monospace',
        fontSize: 13,
        boxSizing: 'border-box',
        backgroundColor: 'var(--os-bg)',
        color: 'var(--os-text)',
    },
};

export default Notepad;

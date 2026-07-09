import React from 'react';
import { useWindowManager } from '../../contexts/WindowManagerContext';
import CertificateViewer from '../applications/CertificateViewer';

export interface FileActionsProps {
    filePath: string;
    containerStyle?: React.CSSProperties;
    buttonStyle?: React.CSSProperties;
}

const getFileName = (filePath: string): string =>
    filePath.split('/').pop() || filePath;

const getFileType = (filePath: string): 'pdf' | 'image' => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? 'image' : 'pdf';
};

const FileActions: React.FC<FileActionsProps> = ({
    filePath,
    containerStyle,
    buttonStyle,
}) => {
    const { windows, openWindow, focusWindow, closeWindow, minimizeWindow } =
        useWindowManager();

    const openFile = () => {
        if (windows[filePath]) {
            focusWindow(filePath);
            return;
        }
        const fileName = getFileName(filePath);
        const cascadeOffset = (Object.keys(windows).length % 6) * 24;
        openWindow(
            filePath,
            fileName,
            'fileIcon',
            <CertificateViewer
                fileUrl={filePath}
                fileName={fileName}
                fileType={getFileType(filePath)}
                cascadeOffset={cascadeOffset}
                onInteract={() => focusWindow(filePath)}
                onMinimize={() => minimizeWindow(filePath)}
                onClose={() => closeWindow(filePath)}
                key={filePath}
            />
        );
    };

    return (
        <div style={Object.assign({}, styles.btnGroup, containerStyle)}>
            <button
                className="site-button"
                style={Object.assign({}, styles.actionBtn, buttonStyle)}
                onClick={openFile}
            >
                View
            </button>
            <a href={filePath} download={getFileName(filePath)}>
                <button
                    className="site-button"
                    style={Object.assign({}, styles.actionBtn, buttonStyle)}
                >
                    Download
                </button>
            </a>
        </div>
    );
};

const styles: StyleSheetCSS = {
    btnGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
    actionBtn: {
        minWidth: 72,
        height: 28,
        marginLeft: 8,
    },
};

export default FileActions;

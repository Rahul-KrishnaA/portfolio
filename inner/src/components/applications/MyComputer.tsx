import React, { useCallback, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';
import { IconName } from '../../assets/icons';
import SettingsTile from '../settings/SettingsTile';
import CertificateViewer from './CertificateViewer';
import { useWindowManager } from '../../contexts/WindowManagerContext';
import { CERTS } from '../showcase/Certifications';

export interface MyComputerProps extends WindowAppProps {}

interface FolderNode {
    type: 'folder';
    name: string;
    icon: IconName;
    children: FSNode[];
}
interface FileNode {
    type: 'file';
    name: string;
    icon: IconName;
    filePath: string;
    fileType: 'pdf' | 'image';
}
type FSNode = FolderNode | FileNode;

const getFileType = (filePath: string): 'pdf' | 'image' => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? 'image' : 'pdf';
};

const ROOT: FolderNode = {
    type: 'folder',
    name: 'My Computer',
    icon: 'computerBig',
    children: [
        {
            type: 'folder',
            name: 'Local Disk (C:)',
            icon: 'folderIcon',
            children: [
                {
                    type: 'folder',
                    name: 'My Documents',
                    icon: 'folderIcon',
                    children: [
                        {
                            type: 'file',
                            name: 'Resume.pdf',
                            icon: 'fileIcon',
                            filePath: '/resume/Rahul_Krishna_A_Resume.pdf',
                            fileType: 'pdf',
                        },
                        {
                            type: 'folder',
                            name: 'Certifications',
                            icon: 'folderIcon',
                            children: CERTS.map((cert) => ({
                                type: 'file' as const,
                                name: cert.title,
                                icon: 'fileIcon' as const,
                                filePath: cert.filePath,
                                fileType: getFileType(cert.filePath),
                            })),
                        },
                    ],
                },
            ],
        },
    ],
};

const TreeRow: React.FC<{
    node: FolderNode;
    depth: number;
    path: string[];
    selectedPath: string[];
    expanded: Set<string>;
    onToggle: (key: string) => void;
    onSelect: (path: string[]) => void;
}> = ({ node, depth, path, selectedPath, expanded, onToggle, onSelect }) => {
    const key = path.join('/');
    const isExpanded = expanded.has(key);
    const isSelected = selectedPath.join('/') === key;

    return (
        <>
            <div
                style={Object.assign(
                    {},
                    styles.treeRow,
                    { paddingLeft: 8 + depth * 14 },
                    isSelected && styles.treeRowSelected
                )}
                onMouseDown={() => onSelect(path)}
            >
                <span
                    style={styles.treeToggle}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onToggle(key);
                    }}
                >
                    {node.children.some((c) => c.type === 'folder')
                        ? isExpanded
                            ? '−'
                            : '+'
                        : ''}
                </span>
                <p style={styles.treeLabel}>{node.name}</p>
            </div>
            {isExpanded &&
                node.children
                    .filter((c): c is FolderNode => c.type === 'folder')
                    .map((child) => (
                        <TreeRow
                            key={child.name}
                            node={child}
                            depth={depth + 1}
                            path={[...path, child.name]}
                            selectedPath={selectedPath}
                            expanded={expanded}
                            onToggle={onToggle}
                            onSelect={onSelect}
                        />
                    ))}
        </>
    );
};

const findNode = (root: FolderNode, path: string[]): FolderNode => {
    let current = root;
    for (const segment of path.slice(1)) {
        const next = current.children.find(
            (c): c is FolderNode => c.type === 'folder' && c.name === segment
        );
        if (!next) break;
        current = next;
    }
    return current;
};

const MyComputer: React.FC<MyComputerProps> = (props) => {
    const { windows, openWindow, focusWindow, closeWindow, minimizeWindow } =
        useWindowManager();
    const [selectedPath, setSelectedPath] = useState<string[]>([ROOT.name]);
    const [expanded, setExpanded] = useState<Set<string>>(
        new Set([ROOT.name])
    );
    const [selectedTile, setSelectedTile] = useState<string | null>(null);

    const currentFolder = findNode(ROOT, selectedPath);

    const toggleExpanded = useCallback((key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    }, []);

    const openFile = useCallback(
        (file: FileNode) => {
            if (windows[file.filePath]) {
                focusWindow(file.filePath);
                return;
            }
            const cascadeOffset = (Object.keys(windows).length % 5) * 44;
            openWindow(
                file.filePath,
                file.name,
                'fileIcon',
                <CertificateViewer
                    fileUrl={file.filePath}
                    fileName={file.name}
                    fileType={file.fileType}
                    cascadeOffset={cascadeOffset}
                    onInteract={() => focusWindow(file.filePath)}
                    onMinimize={() => minimizeWindow(file.filePath)}
                    onClose={() => closeWindow(file.filePath)}
                    key={file.filePath}
                />
            );
        },
        [windows, openWindow, focusWindow, closeWindow, minimizeWindow]
    );

    return (
        <Window
            top={90}
            left={140}
            width={640}
            height={460}
            windowTitle="My Computer"
            windowBarIcon="windowExplorerIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <div style={styles.container}>
                <div style={styles.treePane}>
                    <TreeRow
                        node={ROOT}
                        depth={0}
                        path={[ROOT.name]}
                        selectedPath={selectedPath}
                        expanded={expanded}
                        onToggle={toggleExpanded}
                        onSelect={setSelectedPath}
                    />
                </div>
                <div style={styles.gridPane}>
                    {currentFolder.children.map((child) => (
                        <SettingsTile
                            key={child.name}
                            icon={child.icon}
                            label={child.name}
                            selected={selectedTile === child.name}
                            dimmed={false}
                            iconSize={32}
                            onSelect={() => setSelectedTile(child.name)}
                            onOpen={() => {
                                if (child.type === 'folder') {
                                    setSelectedPath([...selectedPath, child.name]);
                                    setExpanded(
                                        (prev) =>
                                            new Set([
                                                ...Array.from(prev),
                                                [...selectedPath, child.name].join('/'),
                                            ])
                                    );
                                } else {
                                    openFile(child);
                                }
                            }}
                        />
                    ))}
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        width: '100%',
        minHeight: 0,
        boxSizing: 'border-box',
    },
    treePane: {
        width: 180,
        flexShrink: 0,
        flexDirection: 'column',
        borderRight: `1px solid ${Colors.darkGray}`,
        backgroundColor: 'var(--os-bg)',
        overflow: 'auto',
        paddingTop: 4,
        boxSizing: 'border-box',
    },
    treeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 8,
        paddingTop: 2,
        paddingBottom: 2,
        cursor: 'pointer',
    },
    treeRowSelected: {
        backgroundColor: Colors.blue,
    },
    treeToggle: {
        width: 12,
        fontFamily: 'monospace',
        fontSize: 11,
    },
    treeLabel: {
        fontFamily: 'MSSerif',
        fontSize: 12,
        whiteSpace: 'nowrap',
    },
    gridPane: {
        flex: 1,
        flexDirection: 'row',
        flexWrap: 'wrap',
        alignContent: 'flex-start',
        padding: 16,
        backgroundColor: 'var(--os-bg)',
        overflow: 'auto',
        boxSizing: 'border-box',
    },
};

export default MyComputer;

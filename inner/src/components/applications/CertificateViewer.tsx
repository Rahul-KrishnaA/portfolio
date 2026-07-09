import React, { useCallback, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Window from '../os/Window';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.js',
    import.meta.url
).toString();

export interface CertificateViewerProps extends WindowAppProps {
    fileUrl: string;
    fileName: string;
    fileType: 'pdf' | 'image';
    cascadeOffset: number;
}

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;

const CertificateViewer: React.FC<CertificateViewerProps> = (props) => {
    const [zoom, setZoom] = useState(1);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadError, setLoadError] = useState(false);
    const contentRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

    const onDocumentLoadSuccess = useCallback(
        ({ numPages }: { numPages: number }) => {
            setNumPages(numPages);
            pageRefs.current = new Array(numPages).fill(null);
        },
        []
    );

    const onDocumentLoadError = useCallback(() => {
        setLoadError(true);
    }, []);

    const zoomIn = useCallback(() => {
        setZoom((z) => Math.min(ZOOM_MAX, +(z + ZOOM_STEP).toFixed(2)));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom((z) => Math.max(ZOOM_MIN, +(z - ZOOM_STEP).toFixed(2)));
    }, []);

    const resetZoom = useCallback(() => {
        setZoom(1);
    }, []);

    const onScroll = useCallback(() => {
        if (!contentRef.current || !numPages) return;
        const containerRect = contentRef.current.getBoundingClientRect();
        const midpoint = containerRect.top + containerRect.height / 2;
        let closestPage = 1;
        let closestDistance = Infinity;
        pageRefs.current.forEach((el, i) => {
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const distance = Math.abs(rect.top + rect.height / 2 - midpoint);
            if (distance < closestDistance) {
                closestDistance = distance;
                closestPage = i + 1;
            }
        });
        setCurrentPage(closestPage);
    }, [numPages]);

    const width = 500;
    const height = 600;

    return (
        <Window
            top={40 + props.cascadeOffset}
            left={80 + props.cascadeOffset}
            width={width}
            height={height}
            windowTitle={props.fileName}
            windowBarIcon="fileIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={
                props.fileType === 'pdf' && numPages
                    ? `Page ${currentPage} of ${numPages}`
                    : ''
            }
        >
            <div style={styles.container}>
                <div style={styles.toolbar}>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={zoomOut}
                        disabled={zoom <= ZOOM_MIN}
                    >
                        −
                    </button>
                    <span style={styles.zoomLabel}>
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={zoomIn}
                        disabled={zoom >= ZOOM_MAX}
                    >
                        +
                    </button>
                    <button
                        className="site-button"
                        style={styles.toolbarButton}
                        onClick={resetZoom}
                    >
                        Reset
                    </button>
                </div>
                <div
                    className="file-viewer-scroll"
                    style={styles.content}
                    ref={contentRef}
                    onScroll={onScroll}
                >
                    {loadError ? (
                        <div style={styles.centered}>
                            <p>Couldn't load this file.</p>
                        </div>
                    ) : props.fileType === 'pdf' ? (
                        <Document
                            file={props.fileUrl}
                            onLoadSuccess={onDocumentLoadSuccess}
                            onLoadError={onDocumentLoadError}
                            loading={
                                <div style={styles.centered}>
                                    <p>Loading...</p>
                                </div>
                            }
                        >
                            {numPages &&
                                Array.from(new Array(numPages), (_, index) => (
                                    <div
                                        key={`page_${index + 1}`}
                                        ref={(el) => {
                                            pageRefs.current[index] = el;
                                        }}
                                        style={styles.page}
                                    >
                                        <Page
                                            pageNumber={index + 1}
                                            scale={zoom}
                                            renderTextLayer={false}
                                            renderAnnotationLayer={false}
                                        />
                                    </div>
                                ))}
                        </Document>
                    ) : (
                        <div style={styles.imageWrapper}>
                            <img
                                src={props.fileUrl}
                                alt={props.fileName}
                                style={{
                                    ...styles.image,
                                    transform: `scale(${zoom})`,
                                }}
                                onError={() => setLoadError(true)}
                            />
                        </div>
                    )}
                </div>
            </div>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flex: 1,
        minHeight: 0,
        flexDirection: 'column',
    },
    toolbar: {
        alignItems: 'center',
        padding: 6,
        borderBottom: '1px solid #808080',
        flexShrink: 0,
    },
    toolbarButton: {
        minWidth: 28,
        height: 26,
        marginRight: 6,
    },
    zoomLabel: {
        fontSize: 12,
        marginRight: 6,
        minWidth: 40,
        textAlign: 'center',
    },
    content: {
        flex: 1,
        minHeight: 0,
        overflow: 'auto',
        backgroundColor: '#787878',
        alignItems: 'center',
        flexDirection: 'column',
        padding: 16,
    },
    page: {
        marginBottom: 16,
        boxShadow: '0 0 8px rgba(0,0,0,0.4)',
    },
    imageWrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    image: {
        maxWidth: 'none',
        transformOrigin: 'top center',
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
};

export default CertificateViewer;

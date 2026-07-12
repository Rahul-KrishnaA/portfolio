import React, { useCallback, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Window from '../os/Window';

// Served as a static file from public/ (not routed through webpack's asset
// pipeline via `new URL(..., import.meta.url)`) -- that pattern works in the
// CRA dev server but production's build optimizations mangle the worker
// script differently, causing the real Worker to fail and pdf.js's "fake
// worker" fallback (running on the main thread) to hit `require()` calls
// that don't exist in a browser context ("require is not defined").
pdfjs.GlobalWorkerOptions.workerSrc = `${process.env.PUBLIC_URL}/pdf.worker.min.js`;

export interface CertificateViewerProps extends WindowAppProps {
    fileUrl: string;
    fileName: string;
    fileType: 'pdf' | 'image';
    cascadeOffset: number;
}

const ZOOM_MIN = 0.1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.25;
// Below 25%, step by 5% instead of 25% so zooming out doesn't jump straight
// from 25% to the 10% floor (25 -> 20 -> 15 -> 10).
const ZOOM_STEP_FINE = 0.05;
const ZOOM_FINE_THRESHOLD = 0.25;

const DEFAULT_WIDTH = 500;
const DEFAULT_HEIGHT = 600;
const CHROME_WIDTH = 96; // content padding (16 * 2) + window borders/padding
const MIN_WINDOW_WIDTH = 520;
const MIN_WINDOW_HEIGHT = 400;
const VIEWPORT_MARGIN = 120;

const CertificateViewer: React.FC<CertificateViewerProps> = (props) => {
    const [zoom, setZoom] = useState(1);
    const [numPages, setNumPages] = useState<number | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loadError, setLoadError] = useState(false);
    const [windowSize, setWindowSize] = useState({
        width: DEFAULT_WIDTH,
        height: DEFAULT_HEIGHT,
    });
    const contentRef = useRef<HTMLDivElement>(null);
    const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
    const sizeAppliedRef = useRef(false);

    const applyContentWidth = useCallback((naturalWidth: number) => {
        if (sizeAppliedRef.current) return;
        sizeAppliedRef.current = true;
        const desiredWidth = Math.round(naturalWidth + CHROME_WIDTH);
        const maxWidth = window.innerWidth - VIEWPORT_MARGIN;
        const maxHeight = window.innerHeight - VIEWPORT_MARGIN;
        setWindowSize({
            width: Math.max(
                MIN_WINDOW_WIDTH,
                Math.min(desiredWidth, maxWidth)
            ),
            height: Math.max(
                MIN_WINDOW_HEIGHT,
                Math.min(DEFAULT_HEIGHT, maxHeight)
            ),
        });
    }, []);

    const onDocumentLoadSuccess = useCallback(
        ({ numPages }: { numPages: number }) => {
            setNumPages(numPages);
            pageRefs.current = new Array(numPages).fill(null);
        },
        []
    );

    const onFirstPageLoadSuccess = useCallback(
        (page: { originalWidth: number }) => {
            applyContentWidth(page.originalWidth);
        },
        [applyContentWidth]
    );

    const onImageLoad = useCallback(
        (event: React.SyntheticEvent<HTMLImageElement>) => {
            applyContentWidth(event.currentTarget.naturalWidth);
        },
        [applyContentWidth]
    );

    const onDocumentLoadError = useCallback(() => {
        setLoadError(true);
    }, []);

    const zoomIn = useCallback(() => {
        setZoom((z) => {
            const step = z < ZOOM_FINE_THRESHOLD ? ZOOM_STEP_FINE : ZOOM_STEP;
            return Math.min(ZOOM_MAX, +(z + step).toFixed(2));
        });
    }, []);

    const zoomOut = useCallback(() => {
        setZoom((z) => {
            const step = z <= ZOOM_FINE_THRESHOLD ? ZOOM_STEP_FINE : ZOOM_STEP;
            return Math.max(ZOOM_MIN, +(z - step).toFixed(2));
        });
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

    // Cascade horizontally more than vertically -- a window opened low can
    // push its bottom edge past the visible desktop, especially once it
    // grows to match a wide PDF page's height allowance.
    const verticalStep = Math.round((props.cascadeOffset / 44) * 16);

    return (
        <Window
            top={24 + verticalStep}
            left={80 + props.cascadeOffset}
            width={windowSize.width}
            height={windowSize.height}
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
                                            onLoadSuccess={
                                                index === 0
                                                    ? onFirstPageLoadSuccess
                                                    : undefined
                                            }
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
                                onLoad={onImageLoad}
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
        borderBottom: '1px solid #808080',
        flexShrink: 0,
        boxSizing: 'border-box',
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
        width: '100%',
        minWidth: 0,
        minHeight: 0,
        overflow: 'auto',
        backgroundColor: 'var(--os-chrome-bg)',
        alignItems: 'center',
        flexDirection: 'column',
        padding: 16,
        boxSizing: 'border-box',
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

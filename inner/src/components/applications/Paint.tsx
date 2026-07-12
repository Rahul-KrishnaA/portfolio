import React, { useCallback, useEffect, useRef, useState } from 'react';
import Window from '../os/Window';
import Colors from '../../constants/colors';

export interface PaintProps extends WindowAppProps {}

const PALETTE = [
    '#000000', '#808080', '#FF0000', '#00A300',
    '#0000A3', '#FFFF00', '#FFA500', '#FFFFFF',
];
const BRUSH_SIZES = [1, 3, 5, 8];
const CANVAS_WIDTH = 560;
const CANVAS_HEIGHT = 380;

const Paint: React.FC<PaintProps> = (props) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const isDrawingRef = useRef(false);
    const lastPointRef = useRef<{ x: number; y: number } | null>(null);
    const [color, setColor] = useState(PALETTE[0]);
    const [brushSize, setBrushSize] = useState(BRUSH_SIZES[1]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const getPoint = useCallback((e: MouseEvent | React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }, []);

    const draw = useCallback(
        (point: { x: number; y: number }) => {
            const canvas = canvasRef.current;
            const ctx = canvas?.getContext('2d');
            if (!ctx) return;
            const last = lastPointRef.current || point;
            ctx.strokeStyle = color;
            ctx.lineWidth = brushSize;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            ctx.moveTo(last.x, last.y);
            ctx.lineTo(point.x, point.y);
            ctx.stroke();
            lastPointRef.current = point;
        },
        [color, brushSize]
    );

    const onMouseDown = useCallback(
        (e: React.MouseEvent) => {
            isDrawingRef.current = true;
            const point = getPoint(e);
            lastPointRef.current = point;
            draw(point);
        },
        [getPoint, draw]
    );

    useEffect(() => {
        const onMove = (e: MouseEvent) => {
            if (!isDrawingRef.current) return;
            draw(getPoint(e));
        };
        const onUp = () => {
            isDrawingRef.current = false;
            lastPointRef.current = null;
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        return () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
        };
    }, [getPoint, draw]);

    const clearCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!ctx || !canvas) return;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }, []);

    const saveAsPng = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = 'painting.png';
        a.click();
    }, []);

    return (
        <Window
            top={100}
            left={120}
            width={640}
            height={520}
            windowTitle="Paint"
            windowBarIcon="paintIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <div style={styles.container}>
                <div style={styles.toolbar}>
                    <div style={styles.palette}>
                        {PALETTE.map((c) => (
                            <div
                                key={c}
                                onMouseDown={() => setColor(c)}
                                style={Object.assign(
                                    {},
                                    styles.swatch,
                                    { backgroundColor: c },
                                    color === c && styles.swatchSelected
                                )}
                            />
                        ))}
                    </div>
                    <div style={styles.brushGroup}>
                        {BRUSH_SIZES.map((size) => (
                            <button
                                key={size}
                                className="site-button"
                                style={Object.assign(
                                    {},
                                    styles.brushButton,
                                    brushSize === size && styles.brushButtonSelected
                                )}
                                onClick={() => setBrushSize(size)}
                            >
                                <span
                                    style={{
                                        display: 'inline-block',
                                        width: size,
                                        height: size,
                                        borderRadius: '50%',
                                        backgroundColor: Colors.black,
                                    }}
                                />
                            </button>
                        ))}
                    </div>
                    <button
                        className="site-button"
                        style={styles.actionButton}
                        onClick={clearCanvas}
                    >
                        Clear
                    </button>
                    <button
                        className="site-button"
                        style={styles.actionButton}
                        onClick={saveAsPng}
                    >
                        Save as PNG
                    </button>
                </div>
                <div style={styles.canvasWrapper}>
                    <canvas
                        ref={canvasRef}
                        width={CANVAS_WIDTH}
                        height={CANVAS_HEIGHT}
                        style={styles.canvas}
                        onMouseDown={onMouseDown}
                    />
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
        alignItems: 'center',
        padding: 6,
        borderBottom: `1px solid ${Colors.darkGray}`,
        flexShrink: 0,
        boxSizing: 'border-box',
    },
    palette: {
        flexDirection: 'row',
        marginRight: 12,
    },
    swatch: {
        width: 20,
        height: 20,
        marginRight: 4,
        border: `1px solid ${Colors.black}`,
        cursor: 'pointer',
        boxSizing: 'border-box',
    },
    swatchSelected: {
        border: `2px solid ${Colors.blue}`,
    },
    brushGroup: {
        flexDirection: 'row',
        marginRight: 12,
    },
    brushButton: {
        width: 30,
        height: 26,
        marginRight: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    brushButtonSelected: {
        backgroundColor: Colors.darkGray,
    },
    actionButton: {
        height: 26,
        marginRight: 8,
    },
    canvasWrapper: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'var(--os-chrome-bg)',
        overflow: 'auto',
        padding: 8,
        boxSizing: 'border-box',
    },
    canvas: {
        backgroundColor: Colors.white,
        cursor: 'crosshair',
        boxShadow: '0 0 4px rgba(0,0,0,0.5)',
    },
};

export default Paint;

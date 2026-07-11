import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    imageBackgroundStyle,
    useWallpaper,
    WallpaperSelection,
} from '../../contexts/WallpaperContext';
import { WALLPAPER_COLORS } from './wallpapers';
import { WALLPAPER_IMAGES } from '../../assets/wallpapers';
import Colors from '../../constants/colors';

export interface DisplaySettingsProps {}

const isSelected = (
    selection: WallpaperSelection,
    swatch: WallpaperSelection
): boolean => {
    if (selection.kind !== swatch.kind) return false;
    if (selection.kind === 'color' && swatch.kind === 'color') {
        return selection.color === swatch.color;
    }
    if (selection.kind === 'image' && swatch.kind === 'image') {
        return selection.name === swatch.name;
    }
    return false;
};

const DisplaySettings: React.FC<DisplaySettingsProps> = () => {
    const navigate = useNavigate();
    const { selection, setSelection } = useWallpaper();

    const renderSwatch = (
        key: string,
        swatch: WallpaperSelection,
        title: string,
        inner: React.CSSProperties
    ) => {
        const selected = isSelected(selection, swatch);
        return (
            <div
                key={key}
                title={title}
                // onMouseDown (not onClick) to match the SettingsTile /
                // DesktopShortcut pattern used elsewhere for icon-style
                // clickable elements, avoiding conflicts with the window
                // drag/focus handling which also listens on mousedown.
                onMouseDown={() => setSelection(swatch)}
                style={Object.assign(
                    {},
                    styles.swatch,
                    selected && styles.swatchSelected
                )}
            >
                <div style={Object.assign({}, styles.swatchInner, inner)} />
            </div>
        );
    };

    return (
        <div style={styles.container}>
            <button
                className="site-button"
                style={styles.backButton}
                onClick={() => navigate('/')}
            >
                ← Back
            </button>
            <h3 style={styles.heading}>Display</h3>
            <p style={styles.label}>Background</p>
            <div style={styles.grid}>
                {WALLPAPER_COLORS.map((c) =>
                    renderSwatch(
                        `color-${c.value}`,
                        { kind: 'color', color: c.value },
                        c.label,
                        { backgroundColor: c.value }
                    )
                )}
                {WALLPAPER_IMAGES.map((img) =>
                    renderSwatch(
                        `image-${img.name}`,
                        { kind: 'image', name: img.name },
                        img.name,
                        imageBackgroundStyle(img.url)
                    )
                )}
            </div>
            {WALLPAPER_IMAGES.length === 0 && (
                <p style={styles.hint}>
                    Drop image files into src/assets/wallpapers/ to add custom
                    wallpapers.
                </p>
            )}
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
        width: 44,
        height: 44,
        marginRight: 8,
        marginBottom: 8,
        padding: 2,
        boxSizing: 'border-box',
        cursor: 'pointer',
        border: `2px solid transparent`,
    },
    swatchSelected: {
        // Win98 inset selection look — same two-tone bevel technique as
        // `insetBorder` in Window.tsx (dark top/left, light bottom/right),
        // using black/white so the highlight reads clearly against every
        // swatch color rather than blending into one of them.
        border: `2px solid ${Colors.white}`,
        borderTopColor: Colors.black,
        borderLeftColor: Colors.black,
    },
    swatchInner: {
        flex: 1,
        border: `1px solid ${Colors.darkGray}`,
        boxSizing: 'border-box',
    },
    hint: {
        fontFamily: 'MSSerif',
        fontSize: 11,
        color: Colors.darkGray,
        marginTop: 8,
    },
};

export default DisplaySettings;

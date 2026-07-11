// Auto-enumerates every image dropped into this folder at build time via
// webpack's require.context (available in Create React App). Adding a wallpaper
// is "drop the file in, rebuild" — no code edit needed here.

export interface WallpaperImage {
    name: string;
    url: string;
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ctx = (require as any).context('.', false, /\.(png|jpe?g|gif|bmp)$/);

export const WALLPAPER_IMAGES: WallpaperImage[] = ctx
    .keys()
    .map((key: string) => ({
        name: key.replace(/^\.\//, ''),
        url: ctx(key).default || ctx(key),
    }));

export const findWallpaperImage = (
    name: string
): WallpaperImage | undefined =>
    WALLPAPER_IMAGES.find((w) => w.name === name);

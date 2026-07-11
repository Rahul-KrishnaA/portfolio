# Wallpapers

Drop wallpaper image files (`.png`, `.jpg`, `.jpeg`, `.gif`, `.bmp`) into this
folder. After a rebuild or dev-server reload they automatically appear as
selectable wallpapers in **Settings → Display** — no code changes needed.

Enumeration is handled by `index.ts` via webpack's `require.context`, so the
file's name (e.g. `clouds.jpg`) is what gets shown and persisted.

import Colors from '../../constants/colors';

export interface WallpaperColor {
    label: string;
    value: string;
}

// Classic Windows 95/98 desktop colors, reusing the shared palette where it
// already has an equivalent and adding a few literal classics.
export const WALLPAPER_COLORS: WallpaperColor[] = [
    { label: 'Teal', value: Colors.turquoise },
    { label: 'Navy', value: Colors.blue },
    { label: 'Green', value: '#008080' },
    { label: 'Olive', value: '#808000' },
    { label: 'Maroon', value: '#800000' },
    { label: 'Purple', value: '#800080' },
    { label: 'Silver', value: Colors.lightGray },
    { label: 'Gray', value: Colors.darkGray },
    { label: 'Black', value: Colors.black },
];

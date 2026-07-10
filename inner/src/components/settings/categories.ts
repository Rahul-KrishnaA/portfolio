export interface SettingsCategory {
    key: string;
    label: string;
}

export const CATEGORIES: SettingsCategory[] = [
    { key: 'display', label: 'Display' },
    { key: 'personalization', label: 'Personalization' },
    { key: 'sounds', label: 'Sounds' },
    { key: 'time', label: 'Time & Date' },
    { key: 'fonts', label: 'Fonts' },
];

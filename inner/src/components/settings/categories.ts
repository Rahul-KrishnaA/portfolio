import { IconName } from '../../assets/icons';

export interface SettingsCategory {
    key: string;
    label: string;
    icon: IconName;
}

export const CATEGORIES: SettingsCategory[] = [
    { key: 'display', label: 'Display', icon: 'displayIcon' },
    { key: 'personalization', label: 'Personalization', icon: 'personalizationIcon' },
    { key: 'sounds', label: 'Sounds', icon: 'soundsIcon' },
    { key: 'time', label: 'Time & Date', icon: 'timeIcon' },
    { key: 'fonts', label: 'Fonts', icon: 'fontsIcon' },
];

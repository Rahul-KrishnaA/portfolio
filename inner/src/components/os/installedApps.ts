import React from 'react';
import { IconName } from '../../assets/icons';
import ShowcaseExplorer from '../applications/ShowcaseExplorer';
import Credits from '../applications/Credits';
import Settings from '../applications/Settings';
import Notepad from '../applications/Notepad';
import Calculator from '../applications/Calculator';
import Paint from '../applications/Paint';
import MyComputer from '../applications/MyComputer';

export interface InstalledAppEntry {
    key: string;
    name: string;
    icon: IconName;
    component: React.FC<any>;
}

export const INSTALLED_APPS: InstalledAppEntry[] = [
    {
        key: 'showcase',
        name: 'My Details',
        icon: 'showcaseIcon',
        component: ShowcaseExplorer,
    },
    {
        key: 'credits',
        name: 'Credits',
        icon: 'credits',
        component: Credits,
    },
    {
        key: 'settings',
        name: 'Settings',
        icon: 'settingsIcon',
        component: Settings,
    },
    {
        key: 'notepad',
        name: 'Notepad',
        icon: 'notepadIcon',
        component: Notepad,
    },
    {
        key: 'calculator',
        name: 'Calculator',
        icon: 'calculatorIcon',
        component: Calculator,
    },
    {
        key: 'paint',
        name: 'Paint',
        icon: 'paintIcon',
        component: Paint,
    },
    {
        key: 'myComputer',
        name: 'My Computer',
        icon: 'computerBig',
        component: MyComputer,
    },
];

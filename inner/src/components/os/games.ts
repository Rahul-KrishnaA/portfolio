import React from 'react';
import { IconName } from '../../assets/icons';
import Minesweeper from '../applications/Minesweeper';
import Wordle from '../applications/Wordle';

// These three wrap a js-dos bundle (DosPlayer) and are the heaviest
// components in the app — lazy-load them so the initial bundle/paint
// isn't paying for DOS emulator code that most visitors never launch.
const Doom = React.lazy(() => import('../applications/Doom'));
const OregonTrail = React.lazy(() => import('../applications/OregonTrail'));
const Scrabble = React.lazy(() => import('../applications/Scrabble'));

export interface GameEntry {
    key: string;
    name: string;
    icon: IconName;
    component: React.ComponentType<any>;
}

export const GAMES: GameEntry[] = [
    {
        key: 'minesweeper',
        name: 'Minesweeper',
        icon: 'minesweeperIcon',
        component: Minesweeper,
    },
    {
        key: 'doom',
        name: 'Doom',
        icon: 'doomIcon',
        component: Doom,
    },
    {
        key: 'trail',
        name: 'Oregon Trail',
        icon: 'trailIcon',
        component: OregonTrail,
    },
    {
        key: 'scrabble',
        name: 'Scrabble',
        icon: 'scrabbleIcon',
        component: Scrabble,
    },
    {
        key: 'wordle',
        name: 'Wordle',
        icon: 'wordleIcon',
        component: Wordle,
    },
];

import React from 'react';
import { IconName } from '../../assets/icons';
import Minesweeper from '../applications/Minesweeper';
import Doom from '../applications/Doom';
import OregonTrail from '../applications/OregonTrail';
import Scrabble from '../applications/Scrabble';
import Wordle from '../applications/Wordle';

export interface GameEntry {
    key: string;
    name: string;
    icon: IconName;
    component: React.FC<any>;
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

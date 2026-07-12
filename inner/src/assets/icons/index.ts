import React from 'react';

import windowResize from './windowResize.png';
import maximize from './maximize.png';
import minimize from './minimize.png';
import computerBig from './computerBig.png';
import showcaseIcon from './showcaseIcon.png';
import credits from './credits.png';
import volumeOn from './volumeOn.png';
import volumeOff from './volumeOff.png';
import windowExplorerIcon from './windowExplorerIcon.png';
import windowsStartIcon from './windowsStartIcon.png';
import close from './close.png';
import fileIcon from './fileIcon.png';
import settingsIcon from './settingsIcon.png';
import doomIcon from './doomIcon.png';
import trailIcon from './trailIcon.png';
import scrabbleIcon from './scrabbleIcon.png';
import windowGameIcon from './windowGameIcon.png';
import wordleIcon from './wordleIcon.png';
import minesweeperIcon from './minesweeperIcon.png';
import displayIcon from './displayIcon.png';
import personalizationIcon from './personalizationIcon.png';
import soundsIcon from './soundsIcon.png';
import timeIcon from './timeIcon.png';
import fontsIcon from './fontsIcon.png';
import backIcon from './backIcon.png';
import forwardIcon from './forwardIcon.png';
import upIcon from './upIcon.png';
import cutIcon from './cutIcon.png';
import copyIcon from './copyIcon.png';
import pasteIcon from './pasteIcon.png';
import notepadIcon from './notepadIcon.png';
import calculatorIcon from './calculatorIcon.png';
import paintIcon from './paintIcon.png';
import folderIcon from './folderIcon.png';

const icons = {
    windowResize: windowResize,
    maximize: maximize,
    minimize: minimize,
    computerBig: computerBig,
    showcaseIcon: showcaseIcon,
    volumeOn: volumeOn,
    volumeOff: volumeOff,
    credits: credits,
    close: close,
    fileIcon: fileIcon,
    windowExplorerIcon: windowExplorerIcon,
    windowsStartIcon: windowsStartIcon,
    settingsIcon: settingsIcon,
    doomIcon: doomIcon,
    trailIcon: trailIcon,
    scrabbleIcon: scrabbleIcon,
    windowGameIcon: windowGameIcon,
    wordleIcon: wordleIcon,
    minesweeperIcon: minesweeperIcon,
    displayIcon: displayIcon,
    personalizationIcon: personalizationIcon,
    soundsIcon: soundsIcon,
    timeIcon: timeIcon,
    fontsIcon: fontsIcon,
    backIcon: backIcon,
    forwardIcon: forwardIcon,
    upIcon: upIcon,
    cutIcon: cutIcon,
    copyIcon: copyIcon,
    pasteIcon: pasteIcon,
    notepadIcon: notepadIcon,
    calculatorIcon: calculatorIcon,
    paintIcon: paintIcon,
    folderIcon: folderIcon,
};

export type IconName = keyof typeof icons;

const getIconByName = (
    iconName: IconName
    // @ts-ignore
): React.FC<React.SVGAttributes<SVGElement>> => icons[iconName];

export default getIconByName;

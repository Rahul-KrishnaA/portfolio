import React from 'react';
import DosPlayer from '../dos/DosPlayer';
import Window from '../os/Window';

export interface ScrabbleAppProps extends WindowAppProps {}

const WIDTH = 920;
const HEIGHT = 750;

const ScrabbleApp: React.FC<ScrabbleAppProps> = (props) => {
    return (
        <Window
            top={10}
            left={10}
            width={WIDTH}
            height={HEIGHT}
            windowTitle="Scrabble"
            windowBarIcon="windowGameIcon"
            windowBarColor="#941d13"
            bottomLeftText={'Powered by JSDOS & DOSBox'}
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <DosPlayer
                width={WIDTH}
                height={HEIGHT}
                bundleUrl="scrabble.jsdos"
            />
        </Window>
    );
};

export default ScrabbleApp;

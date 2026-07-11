import React from 'react';
import Window from '../os/Window';
import Wordle from '../wordle/Wordle';

export interface WordleAppProps extends WindowAppProps {}

const WordleApp: React.FC<WordleAppProps> = (props) => {
    return (
        <Window
            top={20}
            left={300}
            width={600}
            height={860}
            windowBarIcon="wordleIcon"
            windowTitle="Wordle"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={'© Copyright 2026 Rahul Krishna A'}
        >
            <div className="site-page">
                <Wordle />
            </div>
        </Window>
    );
};

export default WordleApp;

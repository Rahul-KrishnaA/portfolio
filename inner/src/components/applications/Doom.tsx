import React from 'react';
import DosPlayer from '../dos/DosPlayer';
import Window from '../os/Window';

export interface DoomAppProps extends WindowAppProps {}

const WIDTH = 980;
const HEIGHT = 670;

const DoomApp: React.FC<DoomAppProps> = (props) => {
    return (
        <Window
            top={10}
            left={10}
            width={WIDTH}
            height={HEIGHT}
            windowTitle="Doom"
            windowBarColor="#1C1C1C"
            windowBarIcon="windowGameIcon"
            bottomLeftText={'Powered by JSDOS & DOSBox'}
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <DosPlayer width={WIDTH} height={HEIGHT} bundleUrl="doom.jsdos" />
        </Window>
    );
};

export default DoomApp;

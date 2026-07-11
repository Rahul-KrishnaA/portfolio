import React from 'react';
import DosPlayer from '../dos/DosPlayer';
import Window from '../os/Window';

export interface OregonTrailAppProps extends WindowAppProps {}

const WIDTH = 920;
const HEIGHT = 750;

const OregonTrailApp: React.FC<OregonTrailAppProps> = (props) => {
    return (
        <Window
            top={10}
            left={10}
            width={WIDTH}
            height={HEIGHT}
            windowTitle="The Oregon Trail"
            windowBarIcon="windowGameIcon"
            windowBarColor="#240C00"
            bottomLeftText={'Powered by JSDOS & DOSBox'}
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
        >
            <DosPlayer width={WIDTH} height={HEIGHT} bundleUrl="trail.jsdos" />
        </Window>
    );
};

export default OregonTrailApp;

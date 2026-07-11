import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Window from '../os/Window';
import SettingsGrid from '../settings/SettingsGrid';
import SettingsCategoryPlaceholder from '../settings/SettingsCategoryPlaceholder';
import DisplaySettings from '../settings/DisplaySettings';
import PersonalizationSettings from '../settings/PersonalizationSettings';

export interface SettingsProps extends WindowAppProps {}

const Settings: React.FC<SettingsProps> = (props) => {
    return (
        <Window
            top={80}
            left={80}
            width={480}
            height={360}
            windowTitle="Settings"
            windowBarIcon="settingsIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText=""
        >
            <Router>
                <Routes>
                    <Route path="/" element={<SettingsGrid />} />
                    <Route path="display" element={<DisplaySettings />} />
                    <Route
                        path="personalization"
                        element={<PersonalizationSettings />}
                    />
                    <Route
                        path=":category"
                        element={<SettingsCategoryPlaceholder />}
                    />
                </Routes>
            </Router>
        </Window>
    );
};

export default Settings;

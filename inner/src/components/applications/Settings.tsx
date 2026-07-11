import React from 'react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import Window from '../os/Window';
import SettingsGrid from '../settings/SettingsGrid';
import SettingsCategoryPlaceholder from '../settings/SettingsCategoryPlaceholder';
import DisplaySettings from '../settings/DisplaySettings';
import PersonalizationSettings from '../settings/PersonalizationSettings';
import ExplorerChrome from '../settings/ExplorerChrome';
import { ControlPanelProvider } from '../settings/ControlPanelContext';
import { CATEGORIES } from '../settings/categories';

export interface SettingsProps extends WindowAppProps {}

const Settings: React.FC<SettingsProps> = (props) => {
    return (
        <Window
            top={80}
            left={80}
            width={520}
            height={420}
            windowTitle="Control Panel"
            windowBarIcon="settingsIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={`${CATEGORIES.length} object(s)`}
        >
            <Router>
                <ControlPanelProvider>
                    <div style={styles.container}>
                        <ExplorerChrome onClose={props.onClose} />
                        <div style={styles.content}>
                            <Routes>
                                <Route path="/" element={<SettingsGrid />} />
                                <Route
                                    path="display"
                                    element={<DisplaySettings />}
                                />
                                <Route
                                    path="personalization"
                                    element={<PersonalizationSettings />}
                                />
                                <Route
                                    path=":category"
                                    element={<SettingsCategoryPlaceholder />}
                                />
                            </Routes>
                        </div>
                    </div>
                </ControlPanelProvider>
            </Router>
        </Window>
    );
};

const styles: StyleSheetCSS = {
    container: {
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    content: {
        flex: 1,
        width: '100%',
        backgroundColor: '#ffffff',
        overflow: 'auto',
    },
};

export default Settings;

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../showcase/Home';
import About from '../showcase/About';
import Summary from '../showcase/Summary';
import Skills from '../showcase/Skills';
import Education from '../showcase/Education';
import Research from '../showcase/Research';
import Community from '../showcase/Community';
import Certifications from '../showcase/Certifications';
import Hobbies from '../showcase/Hobbies';
import Window from '../os/Window';
import Experience from '../showcase/Experience';
import Projects from '../showcase/Projects';
import Contact from '../showcase/Contact';
import VerticalNavbar from '../showcase/VerticalNavbar';
import useInitialWindowSize from '../../hooks/useInitialWindowSize';

export interface ShowcaseExplorerProps extends WindowAppProps {}

const ShowcaseExplorer: React.FC<ShowcaseExplorerProps> = (props) => {
    const { initWidth, initHeight } = useInitialWindowSize({ margin: 100 });

    return (
        <Window
            top={24}
            left={56}
            width={initWidth}
            height={initHeight}
            windowTitle="Rahul Krishna A - Showcase 2025"
            windowBarIcon="windowExplorerIcon"
            closeWindow={props.onClose}
            onInteract={props.onInteract}
            minimizeWindow={props.onMinimize}
            bottomLeftText={'© 2025 Rahul Krishna A'}
        >
            <Router>
                <div className="site-page">
                    <VerticalNavbar />
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/summary" element={<Summary />} />
                        <Route path="/skills" element={<Skills />} />
                        <Route path="/education" element={<Education />} />
                        <Route path="/experience" element={<Experience />} />
                        <Route path="/projects" element={<Projects />} />
                        <Route path="/research" element={<Research />} />
                        <Route path="/community" element={<Community />} />
                        <Route path="/certifications" element={<Certifications />} />
                        <Route path="/hobbies" element={<Hobbies />} />
                        <Route path="/contact" element={<Contact />} />
                    </Routes>
                </div>
            </Router>
        </Window>
    );
};

export default ShowcaseExplorer;

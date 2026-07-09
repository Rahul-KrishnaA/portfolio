import React from 'react';
import { Link } from 'react-router-dom';
import ResumeDownload from './ResumeDownload';

export interface SummaryProps {}

const Summary: React.FC<SummaryProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1 style={{ marginLeft: -16 }}>Summary</h1>
            <h3>Rahul Krishna A</h3>
            <br />
            <div className="text-block">
                <p>
                    <b>B.Tech Computer Science & Engineering</b>
                    <br />
                    SRM Institute of Science and Technology, Kattankulathur
                    <br />
                    CGPA: 9.86 / 10 &nbsp;|&nbsp; Graduating 2027
                </p>
                <br />
                <p>
                    I'm a computer science undergraduate with a strong
                    foundation in Python, AI/ML, computer vision, and cloud
                    platforms. I have hands-on industrial experience at Apollo
                    Tyres (R&D) and BPCL, and I hold certifications from AWS,
                    Oracle, SAP, MongoDB, Alteryx, and NPTEL.
                </p>
                <br />
                <p>
                    I am currently seeking internship and research opportunities
                    in AI/ML, software engineering, and data engineering.
                </p>
            </div>
            <ResumeDownload />
            <div className="text-block">
                <h3>Quick Links</h3>
                <br />
                <ul>
                    <li>
                        <Link to="/experience">Experience</Link> â€” BPCL &
                        Apollo Tyres internships
                    </li>
                    <li>
                        <Link to="/projects">Projects</Link> â€” AI, CV & NLP
                        projects
                    </li>
                    <li>
                        <Link to="/certifications">Certifications</Link> â€” AWS,
                        Oracle, SAP, MongoDB, Alteryx & more
                    </li>
                    <li>
                        <Link to="/skills">Skills</Link> â€” Tech stack overview
                    </li>
                    <li>
                        <Link to="/education">Education</Link> â€” Academic
                        history
                    </li>
                    <li>
                        <Link to="/research">Research</Link> â€” AI/ML
                        investigations
                    </li>
                    <li>
                        <Link to="/community">Community</Link> â€” Volunteering
                    </li>
                    <li>
                        <Link to="/contact">Contact</Link> â€” Get in touch
                    </li>
                </ul>
            </div>
        </div>
    );
};

export default Summary;

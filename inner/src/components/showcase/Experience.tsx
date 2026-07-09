import React from 'react';
import ResumeDownload from './ResumeDownload';

export interface ExperienceProps {}

const Experience: React.FC<ExperienceProps> = (props) => {
    return (
        <div className="site-page-content">
            <ResumeDownload />

            {/* Apollo Tyres */}
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>Apollo Tyres Ltd.</h1>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://www.apollotyres.com/"
                        >
                            <h4>www.apollotyres.com</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Industrial Project Intern — Tyre Testing & R&D</h3>
                        <b>
                            <p>Mar 2025 – Jul 2025</p>
                        </b>
                    </div>
                    <div style={styles.headerRow}>
                        <p>Chennai, Tamil Nadu, India</p>
                        <a
                            href="/experience/apollo-rd.pdf"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <button className="site-button" style={styles.certBtn}>
                                View Certificate
                            </button>
                        </a>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Completed a 4-month industrial project at Apollo Tyres Ltd
                    under the Global R&D and Tyre Testing division. The project
                    focused on the superimposition of tyre cut-sections with
                    standard rim profiles during IP-Phase 1 inspection.
                </p>
                <br />
                <p>
                    <b>Project:</b> "Superimposition of Cut-Section with Tire
                    Profile @ Standard Rim (IP-Phase 1)"
                </p>
                <br />
                <ul>
                    <li>
                        <p>
                            Developed Python-based automation using PyAutoCAD
                            and digital image processing techniques to analyse
                            tyre geometry, rim standards, and profile alignment.
                        </p>
                    </li>
                    <li>
                        <p>
                            Applied OpenCV, NumPy, and MATLAB for inspection
                            and validation of tyre profiles at standard rim
                            dimensions.
                        </p>
                    </li>
                    <li>
                        <p>
                            Collaborated with industry and academic mentors and
                            successfully delivered the project report.
                        </p>
                    </li>
                </ul>
                <br />
                <p>
                    <b>Technologies:</b> Python, PyAutoCAD, AutoCAD, Digital
                    Image Processing, NumPy, OpenCV, MATLAB
                </p>
            </div>

            {/* BPCL */}
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>BPCL</h1>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://www.bharatpetroleum.in/"
                        >
                            <h4>bharatpetroleum.in</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Information Systems Intern</h3>
                        <b>
                            <p>Dec 2024</p>
                        </b>
                    </div>
                    <div style={styles.headerRow}>
                        <p>Bharat Petroleum Corporation Ltd. — Kochi Refinery, Kerala</p>
                        <a
                            href="/experience/bpcl-internship.pdf"
                            target="_blank"
                            rel="noreferrer"
                        >
                            <button className="site-button" style={styles.certBtn}>
                                View Certificate
                            </button>
                        </a>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Completed an academic internship at the Information Systems
                    Department, BPCL Kochi Refinery.
                </p>
                <br />
                <p>
                    <b>Project:</b> "Personal Protective Equipment (PPE)
                    System"
                </p>
                <br />
                <ul>
                    <li>
                        <p>
                            Gained exposure to industrial safety systems and IT
                            support processes within a large refinery operation.
                        </p>
                    </li>
                    <li>
                        <p>
                            Worked on a PPE detection system project and
                            submitted the internship project report.
                        </p>
                    </li>
                    <li>
                        <p>
                            Demonstrated professional conduct and obtained
                            practical knowledge of refinery IS operations.
                        </p>
                    </li>
                </ul>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    header: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        width: '100%',
    },
    headerContainer: {
        alignItems: 'flex-end',
        width: '100%',
        justifyContent: 'center',
        marginTop: 32,
    },
    headerRow: {
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    certBtn: {
        height: 28,
        minWidth: 120,
    },
};

export default Experience;

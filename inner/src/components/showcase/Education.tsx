import React from 'react';
import ResumeDownload from './ResumeDownload';

export interface EducationProps {}

const Education: React.FC<EducationProps> = (props) => {
    return (
        <div className="site-page-content">
            <ResumeDownload />
            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>SRM IST</h1>
                        <a
                            rel="noreferrer"
                            target="_blank"
                            href="https://www.srmist.edu.in/"
                        >
                            <h4>www.srmist.edu.in</h4>
                        </a>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>B.Tech — Computer Science & Engineering</h3>
                        <b>
                            <p>2023 – 2027</p>
                        </b>
                    </div>
                    <div style={styles.headerRow}>
                        <p>SRM Institute of Science and Technology, Kattankulathur</p>
                        <b><p>CGPA: 9.83 / 10</p></b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Pursuing a Bachelor of Technology in Computer Science and
                    Engineering at SRM IST Kattankulathur. Maintaining a CGPA
                    of 9.83/10 with coursework in Machine Learning, Data
                    Structures & Algorithms, Database Systems, Computer Vision,
                    and Software Engineering.
                </p>
            </div>

            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>St Antony's Public School</h1>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Class XII — CBSE (PCMC)</h3>
                        <b>
                            <p>2023</p>
                        </b>
                    </div>
                    <div style={styles.headerRow}>
                        <p>Kanjirapally, Kottayam, Kerala</p>
                        <b><p>87.8%</p></b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Completed Class XII under the Central Board of Secondary
                    Education (CBSE) with Physics, Chemistry, Mathematics, and
                    Computer Science (PCMC).
                </p>
            </div>

            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>Cochin Refineries School</h1>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Class X — CBSE</h3>
                        <b>
                            <p>2021</p>
                        </b>
                    </div>
                    <div style={styles.headerRow}>
                        <p>Ambalamugal, Ernakulam, Kerala</p>
                        <b><p>84.4%</p></b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Completed Class X under CBSE at Cochin Refineries School,
                    Ambalamugal.
                </p>
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
        marginTop: 24,
    },
    headerRow: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
};

export default Education;

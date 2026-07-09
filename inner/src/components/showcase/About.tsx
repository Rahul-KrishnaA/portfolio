import React from 'react';
import { Link } from 'react-router-dom';
import ResumeDownload from './ResumeDownload';

export interface AboutProps {}

const About: React.FC<AboutProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1 style={{ marginLeft: -16 }}>Welcome</h1>
            <h3>I'm Rahul Krishna A</h3>
            <br />
            <div className="text-block">
                <p>
                    I'm a Computer Science undergraduate at SRM Institute of
                    Science and Technology (Kattankulathur), graduating in 2027
                    with a CGPA of 9.86/10.
                </p>
                <br />
                <p>
                    Thank you for taking the time to check out my portfolio. I
                    hope you enjoy exploring it! If you have any questions or
                    opportunities, feel free to reach me via{' '}
                    <Link to="/contact">this form</Link> or email me at{' '}
                    <a href="mailto:rk0148@srmist.edu.in">
                        rk0148@srmist.edu.in
                    </a>
                </p>
            </div>
            <ResumeDownload />
            <div className="text-block">
                <h3>About Me</h3>
                <br />
                <p>
                    I'm passionate about applying computing to real-world
                    engineering problems. My interests span AI/ML, computer
                    vision, industrial automation, and cloud technologies. I've
                    had the opportunity to work with Apollo Tyres Ltd on a
                    tyre-profile analysis project and with BPCL on a PPE
                    detection system, both of which deepened my appreciation for
                    the intersection of software and industry.
                </p>
                <br />
                <p>
                    I'm proficient in Python, C/C++, and Java, and I work
                    extensively with OpenCV, TensorFlow, LangChain, and various
                    cloud platforms including AWS and Oracle Cloud. I hold
                    certifications from AWS, Oracle, SAP, MongoDB, Alteryx, and
                    NPTEL.
                </p>
                <br />
                <p>
                    Outside of academics, I volunteer with elderly care
                    organisations, enjoy learning Korean, and love building AI
                    side projects. Feel free to explore each section of this
                    portfolio to learn more!
                </p>
                <br />
                <p>
                    You can reach me through the{' '}
                    <Link to="/contact">contact page</Link> or directly at{' '}
                    <a href="mailto:rk0148@srmist.edu.in">
                        rk0148@srmist.edu.in
                    </a>
                </p>
            </div>
        </div>
    );
};


export default About;

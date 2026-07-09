import React, { useEffect, useState } from 'react';
import { Link } from '../general';
import { useLocation } from 'react-router';

export interface VerticalNavbarProps {}

const VerticalNavbar: React.FC<VerticalNavbarProps> = (props) => {
    const location = useLocation();
    const [isHome, setIsHome] = useState(false);

    useEffect(() => {
        setIsHome(location.pathname === '/');
        return () => {};
    }, [location.pathname]);

    return !isHome ? (
        <div style={styles.navbar}>
            <div style={styles.header}>
                <h1 style={styles.headerText}>Rahul</h1>
                <h1 style={styles.headerText}>Krishna A</h1>
                <h3 style={styles.headerShowcase}>Showcase</h3>
            </div>
            <div style={styles.links}>
                <Link containerStyle={styles.link} to="" text="HOME" />
                <Link containerStyle={styles.link} to="summary" text="SUMMARY" />
                <Link containerStyle={styles.link} to="skills" text="SKILLS" />
                <Link containerStyle={styles.link} to="projects" text="PROJECTS" />
                <Link containerStyle={styles.link} to="education" text="EDUCATION" />
                <Link containerStyle={styles.link} to="experience" text="EXPERIENCE" />
                <Link containerStyle={styles.link} to="research" text="RESEARCH" />
                <Link containerStyle={styles.link} to="community" text="COMMUNITY" />
                <Link containerStyle={styles.link} to="certifications" text="CERTIFICATIONS" />
                <Link containerStyle={styles.link} to="hobbies" text="HOBBIES" />
                <Link containerStyle={styles.link} to="contact" text="CONTACT" />
            </div>
        </div>
    ) : (
        <></>
    );
};

const styles: StyleSheetCSS = {
    navbar: {
        width: 220,
        height: '100%',
        flexDirection: 'column',
        padding: 32,
        boxSizing: 'border-box',
        position: 'fixed',
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'column',
        marginBottom: 32,
    },
    headerText: {
        fontSize: 30,
        lineHeight: 1,
    },
    headerShowcase: {
        marginTop: 10,
    },
    links: {
        flexDirection: 'column',
        flex: 1,
    },
    link: {
        marginBottom: 18,
    },
};

export default VerticalNavbar;

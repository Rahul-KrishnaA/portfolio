import React from 'react';
import { Link } from '../general';
import { useNavigate } from 'react-router';

export interface HomeProps {}

const Home: React.FC<HomeProps> = (props) => {
    const navigate = useNavigate();

    const goToContact = () => {
        navigate('/contact');
    };

    return (
        <div style={styles.page}>
            <div style={styles.header}>
                <h1 style={styles.name}>Rahul Krishna A</h1>
                <h2>Computer Science Undergraduate</h2>
                <h3 style={styles.subtitle}>SRM IST Â· CGPA 9.86/10 Â· Class of 2027</h3>
            </div>
            <div style={styles.buttons}>
                <Link containerStyle={styles.link} to="summary" text="SUMMARY" />
                <Link containerStyle={styles.link} to="skills" text="SKILLS" />
                <Link containerStyle={styles.link} to="projects" text="PROJECTS" />
                <Link containerStyle={styles.link} to="education" text="EDUCATION" />
                <Link containerStyle={styles.link} to="experience" text="EXPERIENCE" />
                <Link containerStyle={styles.link} to="certifications" text="CERTS" />
                <Link containerStyle={styles.link} to="contact" text="CONTACT" />
            </div>
            <div style={styles.forHireContainer} onMouseDown={goToContact} />
        </div>
    );
};

const styles: StyleSheetCSS = {
    page: {
        left: 0,
        right: 0,
        top: 0,
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        height: '100%',
    },
    header: {
        textAlign: 'center',
        marginBottom: 48,
        marginTop: 48,
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
    },
    subtitle: {
        marginTop: 8,
        fontWeight: 'normal',
    },
    buttons: {
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    link: {
        padding: 12,
    },
    forHireContainer: {
        marginTop: 48,
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        cursor: 'pointer',
    },
    name: {
        fontSize: 64,
        marginBottom: 16,
        lineHeight: 0.9,
    },
};

export default Home;

import React from 'react';
import ResumeDownload from './ResumeDownload';

export interface ProjectsProps {}

interface ProjectEntryProps {
    title: string;
    period: string;
    context: string;
    tags: string[];
    domain: string;
    description: string;
    link?: string;
    liveDemo?: string;
}

const ProjectEntry: React.FC<ProjectEntryProps> = ({
    title,
    period,
    context,
    tags,
    domain,
    description,
    link,
    liveDemo,
}) => (
    <div style={styles.entry}>
        <div style={styles.headerRow}>
            <h2>{title}</h2>
            <b><p>{period}</p></b>
        </div>
        <div style={styles.subRow}>
            <p style={styles.context}>{context}</p>
            <div style={styles.links}>
                {liveDemo && (
                    <a href={liveDemo} target="_blank" rel="noreferrer" style={styles.linkItem}>
                        <h4>Live Demo</h4>
                    </a>
                )}
                {link && (
                    <a href={link} target="_blank" rel="noreferrer" style={styles.linkItem}>
                        <h4>GitHub</h4>
                    </a>
                )}
            </div>
        </div>
        <p style={styles.domain}><i>{domain}</i></p>
        <div style={styles.tagRow}>
            {tags.map((t) => (
                <span key={t} style={styles.tag}>{t}</span>
            ))}
        </div>
        <div className="text-block">
            <p>{description}</p>
        </div>
    </div>
);

const Projects: React.FC<ProjectsProps> = (props) => {
    return (
        <div className="site-page-content">
            <ResumeDownload />
            <h1>Projects</h1>
            <br />
            <p>
                A selection of engineering and AI/ML projects spanning
                industrial automation, natural language processing, computer
                vision, and finance.
            </p>
            <br />

            <ProjectEntry
                title="LexRAG — Retrieval Augmented Generation System"
                period="Jul 2025 – Present"
                context="Personal / Academic Project"
                domain="Natural Language Processing / AI / Search Systems"
                tags={['Python', 'RAG', 'Streamlit', 'LangChain', 'OpenAI GPT', 'Vector Database', 'Prompt Engineering']}
                description="AI-driven regulatory compliance analyser using Retrieval-Augmented Generation (RAG) to evaluate laws against organisational policies. Uses vector databases for semantic search and LLMs for contextual analysis and compliance reporting."
            />

            <ProjectEntry
                title="Superimposition of Cut-Section with Tire Profile @ Standard Rim (IP-Phase 1)"
                period="Mar 2025 – Jul 2025"
                context="Apollo Tyres Ltd — Global R&D & Tyre Testing Division"
                domain="Automotive Engineering / Computer-Aided Design / Industrial Analytics"
                tags={['Python', 'PyAutoCAD', 'AutoCAD', 'Digital Image Processing', 'NumPy', 'OpenCV', 'MATLAB']}
                description="A 4-month industrial project at Apollo Tyres Ltd under the Global R&D and Tyre Testing division. The project focused on superimposition of tyre cut-sections with standard rim profiles during IP-Phase 1 inspection. Developed Python-based automation using PyAutoCAD and image processing techniques to analyse tyre geometry, rim standards, and profile alignment for inspection and validation purposes."
            />

            <ProjectEntry
                title="Blood Bank — Donation Management System"
                period="Jun 2026"
                context="SIC Hackathon 2026"
                domain="Web Application / Healthcare / Data Structures"
                tags={['Python', 'Streamlit', 'JavaScript', 'HTML', 'CSS', 'Hash Table', 'Priority Queue', 'Stack']}
                description="A Blood Donation Management System built during the SIC Hackathon 2026. Implements classic data structures — hash tables for O(1) donor indexing, priority queues for urgency-based donor–recipient matching, and stacks for request history management. Features a live web interface deployed on Netlify with real-time donor search and blood group filtering."
                liveDemo="https://bloodbankjeelrahul.netlify.app"
                link="https://github.com/Rahul-KrishnaA/SIC-Blood-Donation-Management"
            />

            <ProjectEntry
                title="AI Finance Assistant"
                period="Jan 2025 – May 2025"
                context="Personal Project"
                domain="Artificial Intelligence / FinTech / Machine Learning"
                tags={['Python', 'OpenAI GPT', 'LangChain', 'NLP', 'Financial Data', 'API Integration', 'Streamlit']}
                description="An AI-powered personal finance assistant built with Python and Streamlit that helps users manage expenses, set savings goals, and get smart financial insights using natural language input."
                link="https://github.com/Rahul-KrishnaA/Ai-Finance-Assistant"
            />

            <ProjectEntry
                title="Handwritten Digit Recognition Using CNN and OpenCV"
                period="Jul 2024 – Nov 2024"
                context="Personal Project"
                domain="Computer Vision / Deep Learning / Machine Learning"
                tags={['Python', 'OpenCV', 'TensorFlow', 'Keras', 'CNN', 'NumPy', 'MNIST']}
                description="A deep learning project that recognises handwritten digits using a Convolutional Neural Network (CNN) trained on the MNIST dataset, with real-time digit drawing and prediction using OpenCV."
                link="https://github.com/Rahul-KrishnaA/Handwritten-Digit-Recognition-using-CNN-and-OpenCV"
            />

            <ProjectEntry
                title="Safe Zone Detection Using ConvexHull"
                period="Jan 2025 – May 2025"
                context="Personal Project"
                domain="Computer Vision / Image Processing / Machine Learning"
                tags={['Python', 'OpenCV', 'Convex Hull Algorithm', 'NumPy', 'Image Processing', 'Folium']}
                description="A geographic safety visualisation tool that uses Convex Hull geometry to compute and display whether a user-specified location lies within a safe zone formed by real-world GPS coordinates, with interactive mapping via Folium."
                link="https://github.com/Rahul-KrishnaA/Safe-Zone-Detection-using-Convexhull"
            />
        </div>
    );
};

const styles: StyleSheetCSS = {
    entry: {
        flexDirection: 'column',
        marginBottom: 32,
        borderBottom: '1px solid #c0c0c0',
        paddingBottom: 24,
    },
    headerRow: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    subRow: {
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    context: {
        color: '#333',
    },
    links: {
        display: 'flex',
        flexDirection: 'row',
        gap: 16,
    },
    linkItem: {
        marginLeft: 8,
    },
    domain: {
        color: '#555',
        marginBottom: 8,
        fontSize: 13,
    },
    tagRow: {
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    tag: {
        backgroundColor: '#c0c0c0',
        border: '1px solid #808080',
        padding: '1px 8px',
        fontSize: 12,
        marginRight: 5,
        marginBottom: 5,
        display: 'inline-block',
    },
};

export default Projects;

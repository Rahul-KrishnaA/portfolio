import React from 'react';

export interface ResearchProps {}

interface ProjectEntryProps {
    title: string;
    period: string;
    tags: string[];
    domain: string;
    description: string;
}

const ProjectEntry: React.FC<ProjectEntryProps> = ({
    title,
    period,
    tags,
    domain,
    description,
}) => (
    <div style={styles.entry}>
        <div style={styles.headerRow}>
            <h2>{title}</h2>
            <b><p>{period}</p></b>
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

const Research: React.FC<ResearchProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Research</h1>
            <h3>& AI / ML Investigations</h3>
            <br />
            <p>
                These are AI, machine learning, and computer vision projects I've
                built as independent research and personal investigations.
            </p>
            <br />

            <ProjectEntry
                title="LexRAG — Retrieval Augmented Generation System"
                period="Jul 2025 – Present"
                domain="Natural Language Processing / AI / Search Systems"
                tags={['Python', 'RAG', 'Streamlit', 'LangChain', 'OpenAI GPT', 'Vector Database', 'Prompt Engineering']}
                description="AI-driven regulatory compliance analyser using Retrieval-Augmented Generation (RAG) to evaluate laws against organisational policies. Employs vector databases for semantic search and LLMs for contextual analysis."
            />

            <ProjectEntry
                title="AI Finance Assistant"
                period="Jan 2025 – May 2025"
                domain="Artificial Intelligence / FinTech / Machine Learning"
                tags={['Python', 'OpenAI GPT', 'LangChain', 'NLP', 'Streamlit', 'API Integration']}
                description="An AI-powered personal finance assistant that helps users manage expenses, set savings goals, and obtain smart financial insights using natural language input. Built with Python and Streamlit."
            />

            <ProjectEntry
                title="Handwritten Digit Recognition Using CNN and OpenCV"
                period="Jul 2024 – Nov 2024"
                domain="Computer Vision / Deep Learning / Machine Learning"
                tags={['Python', 'OpenCV', 'TensorFlow', 'Keras', 'CNN', 'NumPy', 'MNIST']}
                description="A deep learning project that recognises handwritten digits using a Convolutional Neural Network (CNN) trained on the MNIST dataset, with real-time digit drawing and prediction using OpenCV."
            />

            <ProjectEntry
                title="Safe Zone Detection Using ConvexHull"
                period="Jan 2025 – May 2025"
                domain="Computer Vision / Image Processing / Machine Learning"
                tags={['Python', 'OpenCV', 'Convex Hull Algorithm', 'NumPy', 'Folium', 'Image Processing']}
                description="A geographic safety visualisation tool that uses Convex Hull geometry to compute and display whether a user-specified location lies within a safe zone formed by real-world GPS coordinates, with interactive mapping via Folium."
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
    domain: {
        color: '#444',
        marginBottom: 8,
        marginTop: 4,
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

export default Research;

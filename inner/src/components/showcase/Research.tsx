import React from 'react';
import FileActions from './FileActions';

export interface ResearchProps {}

const Research: React.FC<ResearchProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Research</h1>
            <br />

            <div style={styles.entry}>
                <div style={styles.headerRow}>
                    <h2>LexRAG — Retrieval Augmented Generation System</h2>
                    <b><p>Jul 2025 – Present</p></b>
                </div>
                <p style={styles.domain}>
                    <i>Natural Language Processing / AI / Legal Tech / Search Systems</i>
                </p>
                <div style={styles.tagRow}>
                    {['Python', 'RAG', 'Streamlit', 'LangChain', 'OpenAI GPT', 'Vector Database', 'Prompt Engineering', 'GitHub'].map((t) => (
                        <span key={t} style={styles.tag}>{t}</span>
                    ))}
                </div>
                <div className="text-block">
                    <p>
                        An AI-driven regulatory compliance analyser built using
                        Retrieval-Augmented Generation (RAG) to evaluate
                        organisational policies against legal and regulatory
                        frameworks. Employs vector databases for semantic search
                        and large language models for contextual analysis and
                        gap identification.
                    </p>
                    <br />
                    <p>
                        <b>Publication status:</b> Conference presentation
                        completed. Paper is currently undergoing the publication
                        process — submission is in progress and under review.
                    </p>
                </div>
                <div style={styles.paperRow}>
                    <p><b>Paper</b></p>
                    <FileActions filePath="/certifications/lexrag-paper.pdf" />
                </div>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    entry: {
        flexDirection: 'column',
        marginBottom: 32,
        paddingBottom: 24,
    },
    headerRow: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    domain: {
        color: 'var(--os-text-muted)',
        marginBottom: 8,
        marginTop: 4,
    },
    tagRow: {
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    tag: {
        backgroundColor: 'var(--os-chrome-bg)',
        border: '1px solid #808080',
        padding: '1px 8px',
        fontSize: 12,
        marginRight: 5,
        marginBottom: 5,
        display: 'inline-block',
    },
    paperRow: {
        alignItems: 'center',
        marginTop: 16,
    },
};

export default Research;

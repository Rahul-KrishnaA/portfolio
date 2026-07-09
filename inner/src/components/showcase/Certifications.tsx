import React from 'react';

export interface CertificationsProps {}

interface CertCardProps {
    title: string;
    issuer: string;
    date: string;
    pdfPath: string;
    credentialId?: string;
}

const CertCard: React.FC<CertCardProps> = ({
    title,
    issuer,
    date,
    pdfPath,
    credentialId,
}) => (
    <div style={styles.card}>
        <div style={styles.cardContent}>
            <h3 style={styles.certTitle}>{title}</h3>
            <p style={styles.issuer}>{issuer}</p>
            <p style={styles.date}>{date}</p>
            {credentialId && (
                <p style={styles.credId}>
                    <sub>ID: {credentialId}</sub>
                </p>
            )}
        </div>
        <a href={pdfPath} target="_blank" rel="noreferrer">
            <button className="site-button" style={styles.viewBtn}>
                View
            </button>
        </a>
    </div>
);

const CERTS: CertCardProps[] = [
    {
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services (AWS)',
        date: 'Feb 2026 – Feb 2029',
        pdfPath: '/certifications/aws-cloud-practitioner.pdf',
        credentialId: 'ab4be7a32bfa488ea4998724f9de7457',
    },
    {
        title: 'Oracle Cloud Infrastructure 2025 Certified Foundations Associate',
        issuer: 'Oracle University',
        date: 'Jan 2026',
        pdfPath: '/certifications/oracle-cloud.pdf',
        credentialId: '325437098OCI25FNDCFA',
    },
    {
        title: 'SAP Certified — SAP Generative AI Developer',
        issuer: 'SAP',
        date: 'Mar 2026 – Mar 2027',
        pdfPath: '/certifications/sap-genai.pdf',
    },
    {
        title: 'SAP ERP Certificate',
        issuer: 'SAP',
        date: '2025',
        pdfPath: '/certifications/sap-erp.pdf',
    },
    {
        title: 'MongoDB Associate Developer',
        issuer: 'MongoDB',
        date: 'Mar 2026',
        pdfPath: '/certifications/mongodb-associate.pdf',
    },
    {
        title: 'Alteryx Designer Core Certification',
        issuer: 'Alteryx',
        date: 'Jan 2026 – Jan 2028',
        pdfPath: '/certifications/alteryx-designer.pdf',
    },
    {
        title: 'AR VR Consultant',
        issuer: 'IT-ITeS Sector Skill Council (NASSCOM) / NCVET',
        date: 'Feb 2025',
        pdfPath: '/certifications/ar-vr-consultant.pdf',
        credentialId: 'AETNA0021QG-06-IT-00471-2023-V1.1',
    },
    {
        title: 'Deloitte Australia — Data Analytics',
        issuer: 'Deloitte Australia',
        date: '2025',
        pdfPath: '/certifications/deloitte-analytics.pdf',
    },
    {
        title: 'Programming in Java',
        issuer: 'NPTEL',
        date: 'Nov 2024',
        pdfPath: '/certifications/nptel-java.pdf',
    },
    {
        title: 'Introduction to Database Systems',
        issuer: 'NPTEL',
        date: 'May 2025',
        pdfPath: '/certifications/nptel-database.pdf',
    },
    {
        title: 'Introduction to Machine Learning',
        issuer: 'NPTEL',
        date: 'Sept 2025',
        pdfPath: '/certifications/nptel-ml.pdf',
    },
];

const Certifications: React.FC<CertificationsProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Certifications</h1>
            <br />
            <p>
                A collection of professional certifications earned across cloud
                platforms, data technologies, AI, and software development.
            </p>
            <br />
            <div style={styles.grid}>
                {CERTS.map((cert) => (
                    <CertCard key={cert.pdfPath} {...cert} />
                ))}
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    grid: {
        flexDirection: 'column',
        width: '100%',
    },
    card: {
        border: '2px solid #808080',
        backgroundColor: '#f0f0f0',
        padding: 16,
        marginBottom: 12,
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
        boxSizing: 'border-box',
    },
    cardContent: {
        flexDirection: 'column',
        flex: 1,
    },
    certTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    issuer: {
        color: '#444',
        marginBottom: 2,
    },
    date: {
        color: '#666',
        fontSize: 13,
    },
    credId: {
        color: '#888',
        marginTop: 4,
    },
    viewBtn: {
        minWidth: 72,
        height: 28,
        marginLeft: 16,
        flexShrink: 0,
    },
};

export default Certifications;

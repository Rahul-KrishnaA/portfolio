import React from 'react';
import { useWindowManager } from '../../contexts/WindowManagerContext';
import CertificateViewer from '../applications/CertificateViewer';

export interface CertificationsProps {}

interface CertCardProps {
    title: string;
    issuer: string;
    date: string;
    filePath: string;
    credentialId?: string;
}

const getFileName = (filePath: string): string =>
    filePath.split('/').pop() || filePath;

const getFileType = (filePath: string): 'pdf' | 'image' => {
    const ext = filePath.split('.').pop()?.toLowerCase();
    return ext === 'jpg' || ext === 'jpeg' || ext === 'png' ? 'image' : 'pdf';
};

const CertCard: React.FC<CertCardProps> = ({
    title,
    issuer,
    date,
    filePath,
    credentialId,
}) => {
    const { windows, openWindow, focusWindow, closeWindow, minimizeWindow } =
        useWindowManager();

    const openCertificate = () => {
        if (windows[filePath]) {
            focusWindow(filePath);
            return;
        }
        const fileName = getFileName(filePath);
        const cascadeOffset = (Object.keys(windows).length % 6) * 24;
        openWindow(
            filePath,
            fileName,
            'fileIcon',
            <CertificateViewer
                fileUrl={filePath}
                fileName={fileName}
                fileType={getFileType(filePath)}
                cascadeOffset={cascadeOffset}
                onInteract={() => focusWindow(filePath)}
                onMinimize={() => minimizeWindow(filePath)}
                onClose={() => closeWindow(filePath)}
                key={filePath}
            />
        );
    };

    return (
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
            <div style={styles.btnGroup}>
                <button
                    className="site-button"
                    style={styles.actionBtn}
                    onClick={openCertificate}
                >
                    View
                </button>
                <a href={filePath} download={getFileName(filePath)}>
                    <button className="site-button" style={styles.actionBtn}>
                        Download
                    </button>
                </a>
            </div>
        </div>
    );
};

const CERTS: CertCardProps[] = [
    {
        title: 'AWS Certified Cloud Practitioner',
        issuer: 'Amazon Web Services (AWS)',
        date: 'Feb 2026 – Feb 2029',
        filePath: '/certifications/aws-cloud-practitioner.pdf',
        credentialId: 'ab4be7a32bfa488ea4998724f9de7457',
    },
    {
        title: 'Oracle Cloud Infrastructure 2025 Certified Foundations Associate',
        issuer: 'Oracle University',
        date: 'Jan 2026',
        filePath: '/certifications/oracle-cloud.pdf',
        credentialId: '325437098OCI25FNDCFA',
    },
    {
        title: 'SAP Certified — SAP Generative AI Developer',
        issuer: 'SAP',
        date: 'Mar 2026 – Mar 2027',
        filePath: '/certifications/sap-genai.pdf',
    },
    {
        title: 'SAP ERP Certificate',
        issuer: 'SAP',
        date: '2025',
        filePath: '/certifications/sap-erp.pdf',
    },
    {
        title: 'MongoDB Associate Developer',
        issuer: 'MongoDB',
        date: 'Mar 2026',
        filePath: '/certifications/mongodb-associate.pdf',
    },
    {
        title: 'Alteryx Designer Core Certification',
        issuer: 'Alteryx',
        date: 'Jan 2026 – Jan 2028',
        filePath: '/certifications/alteryx-designer.pdf',
    },
    {
        title: 'AR VR Consultant',
        issuer: 'IT-ITeS Sector Skill Council (NASSCOM) / NCVET',
        date: 'Feb 2025',
        filePath: '/certifications/ar-vr-consultant.pdf',
        credentialId: 'AETNA0021QG-06-IT-00471-2023-V1.1',
    },
    {
        title: 'Deloitte Australia — Data Analytics',
        issuer: 'Deloitte Australia',
        date: '2025',
        filePath: '/certifications/deloitte-analytics.pdf',
    },
    {
        title: 'Programming in Java',
        issuer: 'NPTEL',
        date: 'Nov 2024',
        filePath: '/certifications/nptel-java.pdf',
    },
    {
        title: 'Introduction to Database Systems',
        issuer: 'NPTEL',
        date: 'May 2025',
        filePath: '/certifications/nptel-database.pdf',
    },
    {
        title: 'Introduction to Machine Learning',
        issuer: 'NPTEL',
        date: 'Sept 2025',
        filePath: '/certifications/nptel-ml.pdf',
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
                    <CertCard key={cert.filePath} {...cert} />
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
    btnGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 16,
        flexShrink: 0,
    },
    actionBtn: {
        minWidth: 72,
        height: 28,
        marginLeft: 8,
    },
};

export default Certifications;

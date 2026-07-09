import React from 'react';
import FileActions from './FileActions';

export interface CommunityProps {}

const Community: React.FC<CommunityProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Community</h1>
            <h3>& Volunteering</h3>
            <br />

            <div style={styles.headerContainer}>
                <div style={styles.header}>
                    <div style={styles.headerRow}>
                        <h1>Sree Poornathrayeesa Vridhasadanam</h1>
                    </div>
                    <div style={styles.headerRow}>
                        <h3>Volunteer — Elderly Care Support</h3>
                        <b>
                            <p>Jun 2025 – Jul 2025</p>
                        </b>
                    </div>
                </div>
            </div>
            <div className="text-block">
                <p>
                    Completed a 5-week community connect internship at Sree
                    Poornathrayeesa Vridhasadanam, a charitable trust supporting
                    elderly care. Assisted in office activities, community
                    engagement initiatives, and daily operational support.
                    Demonstrated initiative, teamwork, and strong work ethic
                    while contributing to social welfare activities.
                </p>
                <br />
                <ul>
                    <li><p>Elderly Care, Community Service, Social Welfare</p></li>
                    <li><p>Assisted with administrative and operational tasks</p></li>
                    <li><p>Engaged in community outreach programs</p></li>
                </ul>
            </div>

            <div style={styles.certificatesSection}>
                <h3>Certificates</h3>
                <br />
                <div style={styles.certRow}>
                    <div style={styles.certCard}>
                        <p><b>NGO Volunteer Certificate</b></p>
                        <br />
                        <FileActions filePath="/community/ngo.pdf" />
                    </div>
                </div>
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
    },
    headerRow: {
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    certificatesSection: {
        flexDirection: 'column',
        marginTop: 32,
    },
    certRow: {
        flexWrap: 'wrap',
        gap: 16,
    },
    certCard: {
        flexDirection: 'column',
        border: '2px solid #808080',
        padding: 16,
        minWidth: 200,
        backgroundColor: '#f0f0f0',
        marginRight: 16,
        marginBottom: 16,
    },
};

export default Community;

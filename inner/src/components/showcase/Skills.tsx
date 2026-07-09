import React from 'react';

export interface SkillsProps {}

interface SkillCategoryProps {
    title: string;
    skills: string[];
}

const SkillCategory: React.FC<SkillCategoryProps> = ({ title, skills }) => (
    <div style={styles.category}>
        <h3>{title}</h3>
        <br />
        <div style={styles.tagContainer}>
            {skills.map((skill) => (
                <span key={skill} style={styles.tag}>
                    {skill}
                </span>
            ))}
        </div>
        <br />
    </div>
);

const Skills: React.FC<SkillsProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Skills</h1>
            <br />
            <SkillCategory
                title="Programming Languages"
                skills={['Python', 'C', 'C++', 'Java', 'HTML', 'CSS', 'JavaScript', 'SQL']}
            />
            <SkillCategory
                title="Libraries & Frameworks"
                skills={[
                    'OpenCV',
                    'TensorFlow',
                    'Keras',
                    'NumPy',
                    'LangChain',
                    'Streamlit',
                    'PyAutoCAD',
                    'Folium',
                    'React',
                ]}
            />
            <SkillCategory
                title="Databases"
                skills={['MySQL', 'MongoDB', 'Vector Database']}
            />
            <SkillCategory
                title="Tools & Platforms"
                skills={[
                    'AutoCAD',
                    'MATLAB',
                    'Git',
                    'AWS',
                    'Oracle Cloud',
                    'SAP BTP',
                    'Alteryx',
                ]}
            />
            <SkillCategory
                title="Concepts"
                skills={[
                    'Machine Learning',
                    'Deep Learning',
                    'Computer Vision',
                    'Digital Image Processing',
                    'Data Structures & Algorithms',
                    'Object-Oriented Programming',
                    'Retrieval-Augmented Generation (RAG)',
                    'Natural Language Processing',
                    'Prompt Engineering',
                    'Robotics',
                    'MVC Architecture',
                ]}
            />
            <div style={styles.category}>
                <h3>Languages</h3>
                <br />
                <div className="text-block">
                    <ul>
                        <li><p>English — Native Proficiency</p></li>
                        <li><p>Malayalam — Native Proficiency</p></li>
                        <li><p>Tamil — Native Proficiency</p></li>
                        <li><p>Hindi — Professional Working Proficiency</p></li>
                        <li><p>Korean — Elementary Proficiency</p></li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

const styles: StyleSheetCSS = {
    category: {
        flexDirection: 'column',
        marginBottom: 8,
    },
    tagContainer: {
        flexWrap: 'wrap',
        gap: 8,
    },
    tag: {
        backgroundColor: '#c0c0c0',
        border: '1px solid #808080',
        padding: '2px 10px',
        fontSize: 13,
        marginRight: 6,
        marginBottom: 6,
        display: 'inline-block',
    },
};

export default Skills;

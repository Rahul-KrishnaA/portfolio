import React from 'react';

export interface HobbiesProps {}

const Hobbies: React.FC<HobbiesProps> = (props) => {
    return (
        <div className="site-page-content">
            <h1>Hobbies</h1>
            <h3>& Interests</h3>
            <br />
            <div className="text-block">
                <h3>Competitive Programming & DSA</h3>
                <br />
                <p>
                    I regularly practise competitive programming and data
                    structures & algorithms on platforms like LeetCode and
                    Codeforces. Problem-solving is both a passion and a way to
                    sharpen my logical thinking skills.
                </p>
            </div>
            <br />
            <div className="text-block">
                <h3>Learning Korean</h3>
                <br />
                <p>
                    I've been learning Korean as a hobby and have reached
                    elementary proficiency. Language learning gives me a
                    different kind of challenge outside of code, and I enjoy the
                    cultural exposure it brings.
                </p>
            </div>
            <br />
            <div className="text-block">
                <h3>AI / ML Side Projects</h3>
                <br />
                <p>
                    Beyond academics and internships, I enjoy building AI and
                    ML experiments on my own time — experimenting with new
                    models, RAG pipelines, and computer vision applications.
                    Many of these end up becoming serious projects.
                </p>
            </div>
            <br />
            <div className="text-block">
                <h3>Automotive Engineering</h3>
                <br />
                <p>
                    My internship at Apollo Tyres sparked a deep interest in
                    automotive engineering and the intersection of computing
                    with mechanical systems. I enjoy reading about tyre
                    dynamics, vehicle design, and industrial automation.
                </p>
            </div>
            <br />
            <div className="text-block">
                <h3>Reading & Research</h3>
                <br />
                <p>
                    I enjoy reading research papers in AI, NLP, and computer
                    vision, and keeping up with the latest developments in
                    large language models and generative AI.
                </p>
            </div>
        </div>
    );
};

export default Hobbies;

import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const About = () => {
    return (
        <>
            <SEO 
                title="About Us"
                description="Learn about YYZ Data Matrix Inc's mission to empower professionals with practical data skills through expert-led Business Intelligence and Data Analytics training."
                keywords="About YYZ Data Matrix, Data Analytics Training Company, BI Instructors, Microsoft Certified Trainers"
                url="/about"
            />
            
            {/* HERO SECTION */}
            <div className="page-header" style={{ padding: '6rem 0', background: 'var(--hero-bg)', textAlign: 'center', borderBottom: '1px solid var(--border-color)' }}>
                <div className="container">
                    <h1 className="section-title" style={{ fontSize: '3.5rem', marginBottom: '1rem', background: 'linear-gradient(to right, var(--secondary-color), var(--primary-color))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Empowering Professionals With Practical, Job-Ready Data Skills
                    </h1>
                    <p className="section-desc" style={{ fontSize: '1.2rem', maxWidth: '800px', margin: '0 auto' }}>
                        We help learners build analytical skills, confidence, and practical experience for data-driven work.
                    </p>
                </div>
            </div>

            {/* MISSION SECTION */}
            <section className="section bg-light" style={{ padding: '5rem 0' }}>
                <div className="container">
                    <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center' }}>
                        <h2 style={{ fontSize: '2.5rem', color: 'var(--primary-color)', marginBottom: '1.5rem' }}>
                            Training That Builds Competence, Confidence, and Career Momentum
                        </h2>
                        <p style={{ fontSize: '1.1rem', lineHeight: '1.8', color: 'var(--text-main)', marginBottom: '1.5rem' }}>
                            As data becomes increasingly vital in driving business decisions, our professional development programs equip you to harness its potential. We specialize in providing comprehensive training and coaching in business analysis, data analytics, and business intelligence.
                        </p>
                        <p style={{ fontSize: '1.2rem', lineHeight: '1.8', fontWeight: 'bold', color: 'var(--secondary-color)', background: 'var(--bg-alt)', padding: '1.5rem', borderRadius: '12px', borderLeft: '4px solid var(--primary-color)' }}>
                            You won't just learn how to use tools — you'll learn how to think like an analyst.
                        </p>
                    </div>
                </div>
            </section>

            {/* WHO WE ARE SECTION */}
            <section className="section bg-alt" style={{ padding: '5rem 0' }}>
                <div className="container">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4rem', alignItems: 'center' }}>
                        <div>
                            <h2 style={{ fontSize: '2.5rem', color: 'var(--secondary-color)', marginBottom: '1.5rem' }}>Industry-Experienced. Practical. Results-Focused.</h2>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '1.1rem' }}>
                                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary-color)' }}>
                                        <i className="fa-solid fa-certificate" style={{ color: 'var(--primary-color)' }}></i>
                                    </div>
                                    <span><strong>Microsoft Power BI Certified</strong> instructors</span>
                                </li>
                                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary-color)' }}>
                                        <i className="fa-solid fa-chart-pie" style={{ color: 'var(--primary-color)' }}></i>
                                    </div>
                                    <span>Professionally qualified and experienced in finance and business</span>
                                </li>
                                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary-color)' }}>
                                        <i className="fa-solid fa-briefcase" style={{ color: 'var(--primary-color)' }}></i>
                                    </div>
                                    <span>Real world and real time projects</span>
                                </li>
                                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--primary-color)' }}>
                                        <i className="fa-solid fa-laptop-code" style={{ color: 'var(--primary-color)' }}></i>
                                    </div>
                                    <span>Practical project-based teaching methodology</span>
                                </li>
                            </ul>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '2rem' }}>
                            <img src="/icons/powerbi-badge.png" alt="Microsoft Power BI Certified" style={{ width: '200px', height: '200px', borderRadius: '50%', boxShadow: 'var(--box-shadow)' }} />
                            <img src="/icons/pl300-badge.png" alt="PL-300 Course Completed" style={{ width: '200px', height: '200px', borderRadius: '50%', boxShadow: 'var(--box-shadow)' }} onError={(e) => { e.target.style.display = 'none'; }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* TRAINING PHILOSOPHY */}
            <section className="section bg-light" style={{ padding: '5rem 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 className="section-title">Learn by Doing — Not Just by Watching</h2>
                    <p className="section-desc" style={{ marginBottom: '3rem' }}>We believe in applying skills, not merely consuming content. Our activities include:</p>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', maxWidth: '1000px', margin: '0 auto' }}>
                        <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '15px', border: '1px solid var(--glass-border)', boxShadow: 'var(--box-shadow)' }}>
                            <i className="fa-solid fa-chart-column" style={{ fontSize: '2rem', color: 'var(--accent-color)', marginBottom: '1rem' }}></i>
                            <h4 style={{ margin: 0 }}>Building Dashboards</h4>
                        </div>
                        <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '15px', border: '1px solid var(--glass-border)', boxShadow: 'var(--box-shadow)' }}>
                            <i className="fa-solid fa-database" style={{ fontSize: '2rem', color: 'var(--accent-color)', marginBottom: '1rem' }}></i>
                            <h4 style={{ margin: 0 }}>Writing SQL Queries</h4>
                        </div>
                        <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '15px', border: '1px solid var(--glass-border)', boxShadow: 'var(--box-shadow)' }}>
                            <i className="fa-solid fa-magnifying-glass-chart" style={{ fontSize: '2rem', color: 'var(--accent-color)', marginBottom: '1rem' }}></i>
                            <h4 style={{ margin: 0 }}>Analyzing Business Cases</h4>
                        </div>
                        <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '15px', border: '1px solid var(--glass-border)', boxShadow: 'var(--box-shadow)' }}>
                            <i className="fa-solid fa-calculator" style={{ fontSize: '2rem', color: 'var(--accent-color)', marginBottom: '1rem' }}></i>
                            <h4 style={{ margin: 0 }}>Building Analytical Models</h4>
                        </div>
                        <div style={{ background: 'var(--glass-bg)', padding: '1.5rem', borderRadius: '15px', border: '1px solid var(--glass-border)', boxShadow: 'var(--box-shadow)' }}>
                            <i className="fa-solid fa-file-csv" style={{ fontSize: '2rem', color: 'var(--accent-color)', marginBottom: '1rem' }}></i>
                            <h4 style={{ margin: 0 }}>Working With Realistic Datasets</h4>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHY STUDENTS CHOOSE YYZ DATA MATRIX */}
            <section className="section bg-alt" style={{ padding: '5rem 0' }}>
                <div className="container">
                    <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>Why Students Choose Us</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginBottom: '4rem' }}>
                        
                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1rem' }}>
                            <i className="fa-solid fa-check" style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}></i>
                            <div>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Personalized Guidance</h4>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Tailored support to help you master difficult concepts faster.</p>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1rem' }}>
                            <i className="fa-solid fa-check" style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}></i>
                            <div>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Industry-Aligned Curriculum</h4>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Skills directly linked to the demands of today's job market.</p>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1rem' }}>
                            <i className="fa-solid fa-check" style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}></i>
                            <div>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Realistic Business Scenarios</h4>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Practice applying your tools to problems you'll actually face at work.</p>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1rem' }}>
                            <i className="fa-solid fa-check" style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}></i>
                            <div>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Practical Projects</h4>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Leave with a portfolio of completed work.</p>
                            </div>
                        </div>
                        
                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1rem' }}>
                            <i className="fa-solid fa-check" style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}></i>
                            <div>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Supportive Learning Environment</h4>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Learn alongside peers driven to improve their careers.</p>
                            </div>
                        </div>

                        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', gap: '1rem' }}>
                            <i className="fa-solid fa-check" style={{ color: 'var(--primary-color)', fontSize: '1.5rem' }}></i>
                            <div>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Career-Relevant Skills</h4>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>We don't teach tools in a vacuum; we teach you how to be an analyst.</p>
                            </div>
                        </div>

                    </div>

                    <div style={{ textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '1.5rem' }}>Ready to Take the Next Step?</h3>
                        <Link to="/courses" className="btn btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem' }}>Explore Our Courses</Link>
                    </div>
                </div>
            </section>
        </>
    );
};

export default About;

import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const Home = () => {
    return (
        <>
            <SEO
                title="Master the Data Skills Companies Use | YYZ Data Matrix"
                description="Build dashboards, write SQL, and automate Excel to solve real business problems. Hands-on training covering Power BI, SQL, and Advanced Excel."
                keywords="Business Intelligence, Data Analytics, Power BI Training, SQL Courses, Advanced Excel, Financial Modeling, MS Access Training, Data Consultant"
                url="/"
            />
            {/* HERO SECTION */}
            <section id="home" className="hero">
                <div className="container hero-container" style={{ flexDirection: 'column', alignItems: 'flex-start', paddingTop: '4rem', paddingBottom: '4rem', position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem', marginBottom: '4rem', width: '100%' }}>
                        <div className="hero-content" style={{ flex: '1 1 500px', marginBottom: '0' }}>
                            <h1 className="hero-title">Build the Data Skills Employers Expect</h1>
                            <p className="hero-subtitle" style={{ marginBottom: '0.5rem' }}>
                                <strong style={{ color: 'var(--primary-color)', fontSize: '1.2em' }}>Become a job ready data analyst in 16 weeks</strong>
                            </p>
                            <p className="hero-subtitle">
                                <strong>Learn Power BI, SQL, Excel, and MS Access through realistic business projects designed to build practical skills and a portfolio you can demonstrate.</strong>
                            </p>
                            <div className="hero-buttons" style={{ justifyContent: 'flex-start', marginTop: '2rem' }}>
                                <Link to="/courses" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Compare Courses</Link>
                                <Link to="/courses" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '1rem 2rem', fontSize: '1.1rem' }}>Explore Courses <i className="fa-solid fa-arrow-right"></i></Link>
                            </div>

                            <div style={{ display: 'flex', gap: '1.5rem', marginTop: '3rem', flexWrap: 'wrap' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontWeight: '600' }}>
                                    <i className="fa-solid fa-video" style={{ color: 'var(--primary-color)' }}></i> Live Online
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontWeight: '600' }}>
                                    <i className="fa-solid fa-laptop-code" style={{ color: 'var(--primary-color)' }}></i> Guided Projects
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontWeight: '600' }}>
                                    <i className="fa-solid fa-comment-dots" style={{ color: 'var(--primary-color)' }}></i> Instructor Feedback
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontWeight: '600' }}>
                                    <i className="fa-solid fa-briefcase" style={{ color: 'var(--primary-color)' }}></i> Portfolio Projects
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-light)', fontWeight: '600' }}>
                                    <i className="fa-solid fa-certificate" style={{ color: 'var(--primary-color)' }}></i> Certificate of Completion
                                </div>
                            </div>
                        </div>

                        <div className="hero-image-wrapper" style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
                            <div style={{ position: 'relative', width: '100%', maxWidth: '650px', transform: 'perspective(1000px) rotateY(-5deg) rotateX(2deg)', transition: 'transform 0.3s ease' }} onMouseOver={(e) => e.currentTarget.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)'} onMouseOut={(e) => e.currentTarget.style.transform = 'perspective(1000px) rotateY(-5deg) rotateX(2deg)'}>
                                <img src="/images/hero-dashboard-light.jpg" alt="Business Intelligence Dashboard" className="show-light" style={{ width: '100%', borderRadius: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border-color)' }} />
                                <img src="/images/hero-dashboard-dark.jpg" alt="Business Intelligence Dashboard" className="show-dark" style={{ width: '100%', borderRadius: '15px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '1px solid var(--border-color)' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* WHO THIS IS FOR SECTION */}
            <section className="section bg-light" style={{ padding: '5rem 0' }}>
                <div className="container">
                    <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '3rem' }}>Built for learners at different stages of their careers</h2>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Aspiring Data Analysts</h4>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Build foundations in data analysis, Power BI, SQL, and analytical problem-solving.</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Excel & Business Users</h4>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Move beyond spreadsheets into automated reporting and BI.</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Finance & Operations Professionals</h4>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Analyze business data faster and communicate insights more effectively.</p>
                        </div>
                        <div className="glass-panel" style={{ padding: '2rem' }}>
                            <h4 style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--primary-color)' }}>Career Changers</h4>
                            <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Build practical Power BI, SQL, Excel, and MS Access projects that demonstrate your analytical skills.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* FEATURED COURSES SECTION */}
            <section id="courses-slider" className="section bg-alt" style={{ padding: '5rem 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }} className="slider-header">
                        <div>
                            <h2 className="section-title" style={{ marginBottom: 0 }}>Build the Skills You Need Next</h2>
                            <p className="section-desc" style={{ marginTop: '0.5rem' }}>Choose a focused track in Power BI, SQL, Excel, or MS Access and learn through guided, practical projects.</p>
                        </div>
                    </div>

                    <div className="courses-grid" style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem'
                    }}>
                        <Link to="/courses#powerbi" className="service-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                            <div className="service-icon" style={{ background: 'linear-gradient(135deg, #f2c811, #d97706)' }}><i className="fa-solid fa-chart-bar"></i></div>
                            <h3>Power BI Data Analyst</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span><i className="fa-solid fa-signal"></i> Beginner-Friendly</span>
                                <span>&bull;</span>
                                <span><i className="fa-solid fa-clock"></i> 8 Weeks</span>
                                <span>&bull;</span>
                                <span><i className="fa-solid fa-laptop-code"></i> Project-Based</span>
                            </div>
                            <p style={{ flex: 1, marginBottom: '1.5rem', color: 'var(--text-light)' }}>Clean and transform data with Power Query, build analytical data models, write DAX measures, and create interactive dashboards that answer real business questions.</p>
                            <span style={{ color: 'var(--primary-color)', fontWeight: '600', display: 'inline-block' }}>Explore Power BI <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i></span>
                        </Link>

                        <Link to="/courses#sql" className="service-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                            <div className="service-icon" style={{ background: 'linear-gradient(135deg, #00758f, #0284c7)' }}><i className="fa-solid fa-database"></i></div>
                            <h3>SQL for Data Analysis</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span><i className="fa-solid fa-signal"></i> Beginner-Friendly</span>
                                <span>&bull;</span>
                                <span><i className="fa-solid fa-clock"></i> 6 Weeks</span>
                                <span>&bull;</span>
                                <span><i className="fa-solid fa-laptop-code"></i> Project-Based</span>
                            </div>
                            <p style={{ flex: 1, marginBottom: '1.5rem', color: 'var(--text-light)' }}>Learn to query relational databases, combine data across tables, summarize large datasets, and answer business questions using SQL.</p>
                            <span style={{ color: 'var(--primary-color)', fontWeight: '600', display: 'inline-block' }}>Explore SQL <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i></span>
                        </Link>

                        <Link to="/courses#excel" className="service-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                            <div className="service-icon" style={{ background: 'linear-gradient(135deg, #107c41, #16a34a)' }}><i className="fa-solid fa-file-excel"></i></div>
                            <h3>Advanced Excel for Business Analysis</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span><i className="fa-solid fa-signal"></i> Intermediate</span>
                                <span>&bull;</span>
                                <span><i className="fa-solid fa-clock"></i> 4 Weeks</span>
                                <span>&bull;</span>
                                <span><i className="fa-solid fa-laptop-code"></i> Project-Based</span>
                            </div>
                            <p style={{ flex: 1, marginBottom: '1.5rem', color: 'var(--text-light)' }}>Use advanced formulas, PivotTables, Power Query, financial models, and automation to turn repetitive spreadsheets into efficient reporting tools.</p>
                            <span style={{ color: 'var(--primary-color)', fontWeight: '600', display: 'inline-block' }}>Explore Advanced Excel <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i></span>
                        </Link>

                        <Link to="/courses#access" className="service-card" style={{ display: 'flex', flexDirection: 'column', textDecoration: 'none', color: 'inherit' }}>
                            <div className="service-icon" style={{ background: 'linear-gradient(135deg, #a4373a, #7f1d1d)' }}><i className="fa-solid fa-folder-tree"></i></div>
                            <h3>MS Access Database Development</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: '600', marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                <span><i className="fa-solid fa-signal"></i> Intermediate</span>
                                <span>&bull;</span>
                                <span><i className="fa-solid fa-clock"></i> 4 Weeks</span>
                                <span>&bull;</span>
                                <span><i className="fa-solid fa-laptop-code"></i> Project-Based</span>
                            </div>
                            <p style={{ flex: 1, marginBottom: '1.5rem', color: 'var(--text-light)' }}>Build robust relational databases from scratch. Learn to design tables, create complex queries, design user-friendly forms, and automate workflows.</p>
                            <span style={{ color: 'var(--primary-color)', fontWeight: '600', display: 'inline-block' }}>Explore MS Access <i className="fa-solid fa-arrow-right" style={{ marginLeft: '0.5rem' }}></i></span>
                        </Link>
                    </div>
                </div>
            </section>

            {/* WHY YYZ DATA MATRIX WORKS */}
            <section className="section bg-light" style={{ padding: '5rem 0' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="section-title">A Guided, Practical Learning Experience</h2>
                        <p className="section-desc" style={{ margin: '0 auto' }}>Learn by doing, not just watching.</p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <div className="card-icon" style={{ marginBottom: '1.5rem', width: '50px', height: '50px' }}><i className="fa-solid fa-laptop-file"></i></div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Project-Based Learning</h3>
                            <p style={{ color: 'var(--text-light)' }}>Work with realistic sales, finance, and operations datasets to complete guided projects from start to finish.</p>
                        </div>

                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <div className="card-icon" style={{ marginBottom: '1.5rem', width: '50px', height: '50px' }}><i className="fa-solid fa-chalkboard-user"></i></div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Instructor Feedback</h3>
                            <p style={{ color: 'var(--text-light)' }}>Get feedback on exercises, projects, and questions so you understand not only what works, but why.</p>
                        </div>

                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <div className="card-icon" style={{ marginBottom: '1.5rem', width: '50px', height: '50px' }}><i className="fa-solid fa-users"></i></div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Interactive Workshops</h3>
                            <p style={{ color: 'var(--text-light)' }}>Work through live business cases, demonstrations, and problem-solving exercises with an instructor.</p>
                        </div>

                        <div className="glass-panel" style={{ padding: '2.5rem' }}>
                            <div className="card-icon" style={{ marginBottom: '1.5rem', width: '50px', height: '50px' }}><i className="fa-solid fa-sitemap"></i></div>
                            <h3 style={{ fontSize: '1.3rem', marginBottom: '1rem' }}>Industry-Aligned Curriculum</h3>
                            <p style={{ color: 'var(--text-light)' }}>Practice the analyst workflow from cleaning and modeling data to analysis, visualization, and communicating recommendations.</p>
                        </div>

                    </div>
                </div>
            </section>

            {/* WHAT YOU'LL BUILD SECTION */}
            <section className="section bg-main" style={{ padding: '5rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
                <div className="container">
                    <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
                        <h2 className="section-title">What You'll Build</h2>
                        <p className="section-desc" style={{ margin: '0 auto' }}>Complete practical business projects that demonstrate what you can do.</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '180px', background: 'linear-gradient(135deg, #2d3748, #1a202c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#f2c811' }}>
                                <i className="fa-solid fa-chart-line"></i>
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Financial Performance Dashboard</h4>
                                <span style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '1rem' }}>POWER BI</span>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: 0 }}>Clean messy ledger data with Power Query, build a star schema, and write DAX measures to analyze Year-over-Year growth.</p>
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '180px', background: 'linear-gradient(135deg, #2d3748, #1a202c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#00758f' }}>
                                <i className="fa-solid fa-server"></i>
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Customer Retention Analysis</h4>
                                <span style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '1rem' }}>SQL</span>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: 0 }}>Write complex JOINs and window functions to identify churn risk across thousands of rows of transactional data.</p>
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '180px', background: 'linear-gradient(135deg, #2d3748, #1a202c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#107c41' }}>
                                <i className="fa-solid fa-table-list"></i>
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Automated Sales Reporting</h4>
                                <span style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '1rem' }}>EXCEL</span>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: 0 }}>Replace manual copy-pasting by building a dynamic reporting tool using Advanced Formulas and PivotTables.</p>
                            </div>
                        </div>
                        <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ height: '180px', background: 'linear-gradient(135deg, #2d3748, #1a202c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#a4373a' }}>
                                <i className="fa-solid fa-boxes-stacked"></i>
                            </div>
                            <div style={{ padding: '2rem' }}>
                                <h4 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Inventory Management System</h4>
                                <span style={{ color: 'var(--primary-color)', fontSize: '0.85rem', fontWeight: 'bold', display: 'block', marginBottom: '1rem' }}>MS ACCESS</span>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', margin: 0 }}>Design a complete relational database with custom data entry forms, automated tracking queries, and professional management reports.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* INSTRUCTOR SECTION */}
            <section className="section bg-alt" style={{ padding: '5rem 0' }}>
                <div className="container">
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '4rem' }}>
                        <div style={{ flex: '1 1 400px' }}>
                            <h2 className="section-title">Learn from an Industry Professional</h2>
                            <p style={{ color: 'var(--text-light)', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '2rem' }}>
                                I'm Rauf Anwar, a finance and data analytics leader with over 20 years of experience in multinational organizations across healthcare, manufacturing, automotive, and oil & gas industries. Through practical training and real-world insights, I help professionals build skills in data analytics, business intelligence, digital transformation, and performance management.
                            </p>
                            <ul style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><i className="fa-solid fa-chart-line" style={{ color: 'var(--primary-color)' }}></i> 20+ Years of Industry Experience</li>
                                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><i className="fa-solid fa-globe" style={{ color: 'var(--primary-color)' }}></i> Multinational Enterprise Experience</li>
                                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><i className="fa-solid fa-industry" style={{ color: 'var(--primary-color)' }}></i> Healthcare, Manufacturing, Auto, & Oil/Gas</li>
                                <li style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}><i className="fa-solid fa-chalkboard-teacher" style={{ color: 'var(--primary-color)' }}></i> Practical Training & Mentorship</li>
                            </ul>
                        </div>
                        <div style={{ flex: '1 1 400px', display: 'flex', justifyContent: 'center' }}>
                            <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center', maxWidth: '350px' }}>
                                <div style={{ width: '120px', height: '120px', borderRadius: '50%', margin: '0 auto 1.5rem auto', overflow: 'hidden', border: '3px solid var(--primary-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--card-bg)' }}>
                                    <img src="/images/instructor.jpg" alt="Rauf Anwar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                </div>
                                <h3 style={{ marginBottom: '0.5rem' }}>Rauf Anwar</h3>
                                <p style={{ color: 'var(--primary-color)', fontWeight: '600', marginBottom: '1rem' }}>Finance & Data Analytics Leader</p>
                                <p style={{ color: 'var(--text-light)', fontSize: '0.95rem' }}>Expert in Data Analytics, Business Intelligence, and Digital Transformation.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* SOCIAL PROOF / TESTIMONIALS (Placeholder Structure) */}
            <section className="section bg-light" style={{ padding: '5rem 0' }}>
                <div className="container" style={{ textAlign: 'center' }}>
                    <h2 className="section-title">What Our Learners Say</h2>
                    <p className="section-desc" style={{ marginBottom: '3rem' }}>Hear from professionals who have elevated their careers through our practical training.</p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                        {/* TODO: Add legitimate testimonials here when available from the site owner. */}
                        <div className="glass-panel" style={{ padding: '2rem', opacity: 0.9 }}>
                            <div style={{ color: '#f59e0b', marginBottom: '1rem' }}>
                                <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                            </div>
                            <p style={{ color: 'var(--text-light)', fontStyle: 'italic', marginBottom: '1.5rem' }}>"The hands-on projects were exactly what I needed to bridge the gap between theory and actual business applications. I was able to build a portfolio that landed me my current role."</p>
                            <h4 style={{ margin: 0 }}>[Student Name]</h4>
                            <span style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>Data Analyst, [Company]</span>
                        </div>
                        <div className="glass-panel" style={{ padding: '2rem', opacity: 0.9 }}>
                            <div style={{ color: '#f59e0b', marginBottom: '1rem' }}>
                                <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                            </div>
                            <p style={{ color: 'var(--text-light)', fontStyle: 'italic', marginBottom: '1.5rem' }}>"The instructors didn't just teach DAX and SQL; they taught how to think about data from a business perspective. The guidance was invaluable."</p>
                            <h4 style={{ margin: 0 }}>[Student Name]</h4>
                            <span style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>Business Analyst, [Company]</span>
                        </div>
                        <div className="glass-panel" style={{ padding: '2rem', opacity: 0.9 }}>
                            <div style={{ color: '#f59e0b', marginBottom: '1rem' }}>
                                <i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i><i className="fa-solid fa-star"></i>
                            </div>
                            <p style={{ color: 'var(--text-light)', fontStyle: 'italic', marginBottom: '1.5rem' }}>"I highly recommend the Power BI track. The curriculum is perfectly aligned with what employers are asking for in interviews."</p>
                            <h4 style={{ margin: 0 }}>[Student Name]</h4>
                            <span style={{ fontSize: '0.9rem', color: 'var(--primary-color)' }}>Financial Analyst, [Company]</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* E-LEARNING COMPARISON SECTION */}
            <section className="section bg-alt" style={{ padding: '5rem 0' }}>
                <div className="container">
                    <div className="platform-comparison fade-in" style={{ margin: 0 }}>
                        <h3>How We Compare</h3>
                        <p className="comparison-subtitle">Why YYZ Data Matrix is the best choice for Business Intelligence training</p>
                        <div className="comparison-table">
                            <div className="comparison-row header-row">
                                <div className="feature-col">Feature</div>
                                <div className="us-col">YYZ Data Matrix</div>
                                <div className="competitor-col">Coursera</div>
                                <div className="competitor-col">Udemy</div>
                                <div className="competitor-col">DataCamp</div>
                            </div>
                            <div className="comparison-row">
                                <div className="feature-col">Enterprise-Level Real Projects</div>
                                <div className="us-col"><i className="fa-solid fa-check text-success"></i> Yes</div>
                                <div className="competitor-col"><i className="fa-solid fa-check text-success"></i> Yes</div>
                                <div className="competitor-col"><i className="fa-solid fa-minus" style={{color: 'var(--text-color-light)'}}></i> Variable</div>
                                <div className="competitor-col"><i className="fa-solid fa-xmark text-danger"></i> No</div>
                            </div>
                            <div className="comparison-row">
                                <div className="feature-col">Live 1-on-1 Support & Q&A</div>
                                <div className="us-col"><i className="fa-solid fa-check text-success"></i> Yes</div>
                                <div className="competitor-col"><i className="fa-solid fa-xmark text-danger"></i> No</div>
                                <div className="competitor-col"><i className="fa-solid fa-xmark text-danger"></i> No</div>
                                <div className="competitor-col"><i className="fa-solid fa-xmark text-danger"></i> No</div>
                            </div>
                            <div className="comparison-row">
                                <div className="feature-col">Career & Portfolio Focus</div>
                                <div className="us-col"><i className="fa-solid fa-check text-success"></i> High</div>
                                <div className="competitor-col"><i className="fa-solid fa-minus" style={{color: 'var(--text-color-light)'}}></i> Medium</div>
                                <div className="competitor-col"><i className="fa-solid fa-minus" style={{color: 'var(--text-color-light)'}}></i> Low</div>
                                <div className="competitor-col"><i className="fa-solid fa-minus" style={{color: 'var(--text-color-light)'}}></i> Medium</div>
                            </div>
                            <div className="comparison-row">
                                <div className="feature-col">Custom Dashboard Building</div>
                                <div className="us-col"><i className="fa-solid fa-check text-success"></i> From Scratch</div>
                                <div className="competitor-col"><i className="fa-solid fa-minus" style={{color: 'var(--text-color-light)'}}></i> Academic</div>
                                <div className="competitor-col"><i className="fa-solid fa-minus" style={{color: 'var(--text-color-light)'}}></i> Variable</div>
                                <div className="competitor-col"><i className="fa-solid fa-minus" style={{color: 'var(--text-color-light)'}}></i> Guided</div>
                            </div>
                            <div className="comparison-row">
                                <div className="feature-col">Verified Certification</div>
                                <div className="us-col"><i className="fa-solid fa-check text-success"></i> Yes</div>
                                <div className="competitor-col"><i className="fa-solid fa-check text-success"></i> Yes</div>
                                <div className="competitor-col"><i className="fa-solid fa-check text-success"></i> Yes</div>
                                <div className="competitor-col"><i className="fa-solid fa-check text-success"></i> Yes</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* FINAL CTA SECTION */}
            <section className="section" style={{ padding: '6rem 0', background: 'linear-gradient(135deg, var(--bg-main), var(--bg-alt))', borderTop: '1px solid var(--border-color)' }}>
                <div className="container" style={{ textAlign: 'center', maxWidth: '800px' }}>
                    <h2 style={{ fontSize: '3rem', marginBottom: '1.5rem', color: 'var(--secondary-color)', fontWeight: '800' }}>Not Sure Which Course Is Right for You?</h2>
                    <p style={{ fontSize: '1.2rem', color: 'var(--text-light)', marginBottom: '3rem', lineHeight: '1.6' }}>
                        Compare the Power BI, SQL, Excel, and MS Access tracks to find the program that best matches your goals and experience.
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                        <Link to="/courses" className="btn btn-primary" style={{ padding: '1.2rem 2.5rem', fontSize: '1.1rem' }}>Compare Courses</Link>
                        <Link to="/contact" className="btn btn-secondary" style={{ padding: '1.2rem 2.5rem', fontSize: '1.1rem' }}>Talk to an Instructor</Link>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Home;

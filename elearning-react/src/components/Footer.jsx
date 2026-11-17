import React from 'react';
import { Link } from 'react-router-dom';
import packageJson from '../../package.json';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-brand">
                    <Link to="/" className="logo footer-logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', marginBottom: '1rem', gap: '12px' }}>
                        <img src="/images/logo.webp" alt="Logo" style={{ height: '55px', width: '55px', borderRadius: '6px', objectFit: 'cover' }} />
                        <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'white' }}>YYZ Data Matrix Inc</span>
                    </Link>
                    <p>Empowering your career through expert data analytics and business intelligence training.</p>
                </div>
                <div className="footer-links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/courses">Courses</Link></li>
                        <li><Link to="/pricing">Pricing</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/privacy">Privacy Policy</Link></li>
                    </ul>
                </div>

            </div>
            <div className="footer-bottom">
                <div
                    className="container"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: '0.4rem 0.65rem',
                        textAlign: 'center'
                    }}
                >
                    <span>&copy; {new Date().getFullYear()} YYZ Data Matrix Inc. All rights reserved.</span>
                    <span style={{ color: 'var(--text-light)' }} aria-hidden="true">|</span>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Release v{packageJson.version}</span>
                    <span style={{ color: 'var(--text-light)' }} aria-hidden="true">|</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.9rem', color: '#94a3b8' }}>
                        <span>Powered by</span>
                        <a
                            href="https://prynivo.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.4rem',
                                color: '#f8fafc',
                                fontWeight: 600,
                                textDecoration: 'none'
                            }}
                        >
                            <img
                                src="/images/prynivo-logo.webp"
                                alt="Prynivo"
                                width="18"
                                height="19"
                                style={{ height: '18px', width: 'auto', display: 'block', objectFit: 'contain' }}
                            />
                            <span style={{ color: '#93c5fd', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                                prynivo.com
                            </span>
                        </a>
                    </span>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

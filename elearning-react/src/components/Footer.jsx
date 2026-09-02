import React from 'react';
import { Link } from 'react-router-dom';
import packageJson from '../../package.json';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container footer-container">
                <div className="footer-brand">
                    <Link to="/" className="logo footer-logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', marginBottom: '1rem', gap: '12px' }}>
                        <img src="/images/logo.jpg" alt="Logo" style={{ height: '55px', width: '55px', borderRadius: '6px', objectFit: 'cover' }} />
                        <span style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--text-color)' }}>YYZ Data Matrix Inc</span>
                    </Link>
                    <p>Empowering your career through expert data analytics and business intelligence training.</p>
                </div>
                <div className="footer-links">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About Us</Link></li>
                        <li><Link to="/courses">Courses</Link></li>
                        <li><Link to="/contact">Contact Us</Link></li>
                        <li><Link to="/privacy">Privacy Policy</Link></li>
                    </ul>
                </div>

            </div>
            <div className="footer-bottom">
                <div className="container" style={{ textAlign: 'center' }}>
                    <p style={{ margin: 0 }}>
                        &copy; {new Date().getFullYear()} YYZ Data Matrix Inc. All rights reserved.
                        <span style={{ margin: '0 0.5rem', color: 'var(--text-light)' }}>|</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-light)' }}>Release v{packageJson.version}</span>
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;

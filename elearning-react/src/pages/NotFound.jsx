import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

const NotFound = () => {
    return (
        <section className="section bg-main" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '5rem 2rem' }}>
            <SEO 
                title="Page Not Found | YYZ Data Matrix" 
                description="The page you are looking for does not exist. Navigate back to our Power BI, SQL, and Data Analytics courses."
            />
            <h1 style={{ fontSize: '6rem', color: 'var(--primary-color)', marginBottom: '1rem', fontWeight: '800' }}>404</h1>
            <h2 style={{ fontSize: '2rem', marginBottom: '2rem' }}>Oops! Page Not Found</h2>
            <p style={{ color: 'var(--text-light)', fontSize: '1.2rem', marginBottom: '3rem', maxWidth: '600px' }}>
                We can't seem to find the page you're looking for. It might have been removed, had its name changed, or is temporarily unavailable.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                <Link to="/" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Back to Home</Link>
                <Link to="/courses" className="btn btn-secondary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>View Courses</Link>
            </div>
        </section>
    );
};

export default NotFound;

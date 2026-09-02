import React from 'react';

const Privacy = () => {
    return (
        <>
            <section className="page-header">
                <div className="container">
                    <h1 className="section-title">Privacy Policy</h1>
                    <p className="section-desc">Last updated: August 2026</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="content-box">
                        <p>At YYZ Data Matrix Inc, we are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our professional development services.</p>
                        
                        <h2>1. Information We Collect</h2>
                        <p>We may collect personal information such as your name, email address, phone number, and professional details when you register for our courses, sign up for our newsletter, or contact us through our website. We also automatically collect certain information about your device and browsing behavior using cookies.</p>

                        <h2>2. How We Use Your Information</h2>
                        <p>We use the information we collect to:</p>
                        <ul>
                            <li style={{color: 'var(--text-light)', marginLeft: '2rem', listStyleType: 'disc', marginBottom: '0.5rem'}}>Provide and deliver the training services you request.</li>
                            <li style={{color: 'var(--text-light)', marginLeft: '2rem', listStyleType: 'disc', marginBottom: '0.5rem'}}>Respond to your inquiries and offer customer support.</li>
                            <li style={{color: 'var(--text-light)', marginLeft: '2rem', listStyleType: 'disc', marginBottom: '0.5rem'}}>Send you updates, marketing communications, and relevant course recommendations.</li>
                            <li style={{color: 'var(--text-light)', marginLeft: '2rem', listStyleType: 'disc', marginBottom: '0.5rem'}}>Analyze website usage to improve our platform and user experience.</li>
                        </ul>

                        <h2>3. Data Protection and Security</h2>
                        <p>We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. While we strive to use commercially acceptable means to protect your personal data, no method of transmission over the Internet is 100% secure.</p>

                        <h2>4. Sharing Your Information</h2>
                        <p>We do not sell, trade, or rent your personal identification information to others. We may share generic aggregated demographic information not linked to any personal identification information with our business partners and trusted affiliates for the purposes outlined above.</p>

                        <h2>5. Your Rights</h2>
                        <p>You have the right to request access to the personal information we hold about you, to request corrections to any inaccuracies, or to request the deletion of your personal data. To exercise these rights, please contact us using the information provided on our Contact page.</p>

                        <h2>6. Contact Us</h2>
                        <p>If you have any questions about this Privacy Policy, the practices of this site, or your dealings with this site, please contact us at info@yyzdatamatrix.com.</p>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Privacy;

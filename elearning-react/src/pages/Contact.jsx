import React, { useState } from 'react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import SEO from '../components/SEO';

const Contact = () => {
    const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
    const [status, setStatus] = useState({ submitting: false, success: false, error: null });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ submitting: true, success: false, error: null });
        try {
            await addDoc(collection(db, 'messages'), {
                ...formData,
                createdAt: serverTimestamp(),
                read: false
            });

            await addDoc(collection(db, 'notifications'), {
                userId: 'admin',
                type: 'message',
                title: 'New Contact Message',
                message: `From: ${formData.name} - ${formData.subject}`,
                read: false,
                createdAt: serverTimestamp(),
                link: '/admin'
            });

            setStatus({ submitting: false, success: true, error: null });
            setFormData({ name: '', email: '', subject: '', message: '' });
        } catch (err) {
            setStatus({ submitting: false, success: false, error: err.message });
        }
    };

    return (
        <>
            <SEO
                title="Contact Us"
                description="Get in touch with YYZ Data Matrix Inc for inquiries about our Business Intelligence courses, coaching, and corporate training programs."
                keywords="Contact YYZ Data Matrix, BI Training Inquiry, Business Analytics Support, Mississauga Data Training"
                url="/contact"
            />
            <section className="page-header">
                <div className="container">
                    <h1 className="section-title">Get in Touch</h1>
                    <p className="section-desc">We're here to help you advance your career in Business Intelligence.</p>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="contact-content">
                        <div className="contact-info">
                            <div className="info-card">
                                <i className="fa-solid fa-location-dot"></i>
                                <div>
                                    <h3>Our Location</h3>
                                    <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>3913 Stoneham Way<br />Mississauga, ON L5N 6Y6, Canada</p>
                                </div>
                            </div>
                            <div className="info-card">
                                <i className="fa-solid fa-envelope"></i>
                                <div>
                                    <h3>Email Us</h3>
                                    <p style={{ color: 'var(--text-light)', marginTop: '0.5rem' }}>info@yyzdatamatrix.com<br />support@yyzdatamatrix.com</p>
                                </div>
                            </div>
                            <div className="info-card">
                                <i className="fa-solid fa-phone"></i>
                                <div>
                                    <h3>Call Us</h3>
                                    <p style={{ color: 'var(--text-light)', marginTop: '0.5rem', lineHeight: '1.6' }}>
                                        <strong>Phone:</strong> +1 (647) 454-6366<br />
                                        <strong>WhatsApp:</strong> +1 (289) 633-6886
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="contact-form">
                            {status.success && (
                                <div className="alert alert-success" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #10b981' }}>
                                    Your message has been sent successfully. We will get back to you soon!
                                </div>
                            )}
                            {status.error && (
                                <div className="alert alert-danger" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', padding: '1rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #ef4444' }}>
                                    Failed to send message: {status.error}
                                </div>
                            )}
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="name">Full Name</label>
                                    <input type="text" id="name" className="form-control" placeholder="Your Name" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="email">Email Address</label>
                                    <input type="email" id="email" className="form-control" placeholder="xxx@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="subject">Subject</label>
                                    <input type="text" id="subject" className="form-control" placeholder="How can we help?" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label htmlFor="message">Message</label>
                                    <textarea id="message" rows="5" className="form-control" placeholder="Write your message here..." value={formData.message} onChange={e => setFormData({ ...formData, message: e.target.value })} required></textarea>
                                </div>
                                <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={status.submitting}>
                                    {status.submitting ? 'Sending...' : 'Send Message'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
};

export default Contact;

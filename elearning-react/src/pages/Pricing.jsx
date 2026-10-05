import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';
import { getCourses, getSections } from '../services/courseService';
import { createSubscription, getUserSubscriptions } from '../services/subscriptionService';
import PaymentModal from '../components/PaymentModal';
import './Courses.css';

const Pricing = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const [activeTab, setActiveTab] = useState('powerbi');
    const [courses, setCourses] = useState({});
    const [sections, setSections] = useState([]);
    const [userSubscriptions, setUserSubscriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (['powerbi', 'sql', 'access', 'excel'].includes(hash)) {
            setActiveTab(hash);
        }
    }, [location.hash]);

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            setError(null);
            try {
                const courseData = await getCourses();
                const courseMap = {};
                courseData.forEach(c => courseMap[c.id] = c);
                setCourses(courseMap);

                const courseSections = await getSections(activeTab);
                courseSections.sort((a, b) => a.id.localeCompare(b.id));
                setSections(courseSections);

                if (user) {
                    const subs = await getUserSubscriptions(user.uid);
                    setUserSubscriptions(subs);
                }
            } catch (error) {
                console.error("Error loading pricing data:", error);
                setError(error.message || "Failed to load data.");
            } finally {
                setLoading(false);
            }
        };
        initData();
    }, [user, activeTab]);

    const hasAccess = (sectionId, type) => {
        if (!user) return false;
        return userSubscriptions.some(sub =>
            sub.courseId === activeTab &&
            (sub.sectionId === 'all' || sub.sectionId === sectionId) &&
            sub.type === type
        );
    };

    const handleSubscribe = (sectionId, type, amount, title) => {
        if (!user) {
            navigate('/signin');
            return;
        }
        setPaymentData({
            courseId: activeTab,
            sectionId,
            type,
            amount,
            title: `Subscription for ${title} (${type === 'video' ? 'Video Lectures' : 'Live Online'})`
        });
        setPaymentModalOpen(true);
    };

    const handlePaymentSuccess = async (transaction) => {
        if (!paymentData || !user) return;

        try {
            await createSubscription(
                user.uid,
                paymentData.courseId,
                paymentData.sectionId,
                paymentData.type,
                paymentData.amount,
                transaction.method
            );

            const subs = await getUserSubscriptions(user.uid);
            setUserSubscriptions(subs);
            alert(`Successfully subscribed to ${paymentData.title}!`);
            navigate('/courses#' + activeTab);
        } catch (err) {
            console.error("Subscription error:", err);
            alert("Failed to create subscription.");
        }
    };

    const currentCourse = courses[activeTab] || { title: 'Course', overallVideoRate: 499, overallLiveRate: 999 };

    return (
        <>
            <SEO 
                title="Course Pricing | YYZ Data Matrix"
                description="Invest in your future with our Business Intelligence tracks."
            />
            <section className="section bg-light" style={{ padding: '8rem 0 4rem 0', minHeight: '80vh' }}>
                <div className="container" style={{ maxWidth: '1000px' }}>
                    <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                        <h1 style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '1rem' }}>Invest in Your Data Career</h1>
                        <p style={{ fontSize: '1.2rem', color: 'var(--text-light)' }}>Choose the learning style that fits you best.</p>
                    </div>

                    <div className="dashboard-tabs" style={{ justifyContent: 'center', marginBottom: '3rem' }}>
                        <button className={`tab-btn ${activeTab === 'powerbi' ? 'active' : ''}`} onClick={() => setActiveTab('powerbi')}>
                            <i className="fa-solid fa-chart-simple"></i> Power BI
                        </button>
                        <button className={`tab-btn ${activeTab === 'sql' ? 'active' : ''}`} onClick={() => setActiveTab('sql')}>
                            <i className="fa-solid fa-database"></i> SQL
                        </button>
                        <button className={`tab-btn ${activeTab === 'access' ? 'active' : ''}`} onClick={() => setActiveTab('access')}>
                            <i className="fa-solid fa-table-list"></i> MS Access
                        </button>
                        <button className={`tab-btn ${activeTab === 'excel' ? 'active' : ''}`} onClick={() => setActiveTab('excel')}>
                            <i className="fa-solid fa-file-excel"></i> Excel
                        </button>
                    </div>

                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading pricing plans...</div>
                    ) : activeTab !== 'powerbi' ? (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', marginTop: '2rem' }}>
                            <i className={`fa-solid ${activeTab === 'sql' ? 'fa-database' : activeTab === 'access' ? 'fa-table-list' : 'fa-file-excel'}`} style={{ fontSize: '3rem', color: 'var(--primary-color)', marginBottom: '1rem' }}></i>
                            <h2>Pricing Coming Soon</h2>
                            <p style={{ color: 'var(--text-light)', marginTop: '1rem' }}>We are currently finalizing the curriculum and pricing for this track. Please check back later!</p>
                        </div>
                    ) : (
                        <>
                            <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--secondary-color)' }}>Full Course Bundles</h2>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem', paddingBottom: '3rem' }}>
                                {/* Video Tier */}
                                <div className="glass-panel" style={{ padding: '2rem 2rem 3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%', border: '2px solid var(--primary-color)' }}>
                                    <div style={{ display: 'inline-block', padding: '0.4rem 1.2rem', marginBottom: '1.5rem', visibility: 'hidden' }}>
                                        ★ RECOMMENDED
                                    </div>
                                    <h2>Self-Paced Video</h2>
                                    <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--text-main)', margin: '1.5rem 0' }}>
                                        ${currentCourse.overallVideoRate}
                                    </div>
                                    <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Lifetime access to all video lectures and project files.</p>
                                    <ul style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', flex: 1 }}>
                                        <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }}></i> Full Course Access</li>
                                        <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }}></i> Downloadable Datasets</li>
                                        <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }}></i> Certificate of Completion</li>
                                    </ul>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '1rem' }}
                                        disabled={hasAccess('all', 'video')}
                                        onClick={() => handleSubscribe('all', 'video', currentCourse.overallVideoRate, 'Full Course')}
                                    >
                                        {hasAccess('all', 'video') ? 'Enrolled (Video)' : 'Enroll in Video Course'}
                                    </button>
                                </div>

                                {/* Live Tier */}
                                <div className="glass-panel highlight-card" style={{ padding: '2rem 2rem 3rem 2rem', textAlign: 'center', display: 'flex', flexDirection: 'column', height: '100%', border: '2px solid var(--primary-color)' }}>
                                    <div style={{ display: 'inline-block', background: 'var(--primary-color)', color: 'white', padding: '0.4rem 1.2rem', borderRadius: '20px', fontWeight: 'bold', fontSize: '0.85rem', marginBottom: '1.5rem', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' }}>
                                        ★ RECOMMENDED
                                    </div>
                                    <h2>Live Coaching</h2>
                                    <div style={{ fontSize: '3rem', fontWeight: '800', color: 'var(--primary-color)', margin: '1.5rem 0' }}>
                                        ${currentCourse.overallLiveRate}
                                    </div>
                                    <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>Everything in Video, plus live 1-on-1 mentorship.</p>
                                    <ul style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem', flex: 1 }}>
                                        <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }}></i> <strong>Live 1-on-1 Sessions</strong></li>
                                        <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }}></i> Resume & Portfolio Review</li>
                                        <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }}></i> Direct Instructor Q&A</li>
                                        <li><i className="fa-solid fa-check" style={{ color: '#10b981', marginRight: '0.5rem' }}></i> All Video Content Included</li>
                                    </ul>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', padding: '1rem', background: '#ff5722', boxShadow: '0 4px 15px rgba(255,87,34,0.4)' }}
                                        disabled={hasAccess('all', 'live')}
                                        onClick={() => handleSubscribe('all', 'live', currentCourse.overallLiveRate, 'Full Course')}
                                    >
                                        {hasAccess('all', 'live') ? 'Enrolled (Live)' : 'Enroll in Live Coaching'}
                                    </button>
                                </div>
                            </div>

                            <div style={{ marginTop: '5rem' }}>
                                <h2 style={{ textAlign: 'center', marginBottom: '1rem', color: 'var(--secondary-color)' }}>Individual Module Pricing</h2>
                                <p style={{ textAlign: 'center', color: 'var(--text-light)', marginBottom: '3rem' }}>Prefer to learn piecemeal? Purchase individual modules to suit your specific needs.</p>
                                
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                    {sections.length > 0 ? sections.map((section, idx) => (
                                        <div key={section.id} className="glass-panel" style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                                            <div style={{ flex: '1 1 300px' }}>
                                                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Module {idx + 1}: {section.title || `Module ${idx + 1}`}</h3>
                                                <p style={{ color: 'var(--text-light)', margin: 0, fontSize: '0.9rem' }}>Access specific topics only.</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                    disabled={hasAccess(section.id, 'video')}
                                                    onClick={() => handleSubscribe(section.id, 'video', section.videoRate || 99, `Module ${idx + 1}`)}
                                                >
                                                    <i className="fa-solid fa-video"></i> {hasAccess(section.id, 'video') ? 'Enrolled' : `Video ($${section.videoRate || 99})`}
                                                </button>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ padding: '0.6rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                                                    disabled={hasAccess(section.id, 'live')}
                                                    onClick={() => handleSubscribe(section.id, 'live', section.liveRate || 199, `Module ${idx + 1}`)}
                                                >
                                                    <i className="fa-solid fa-headset"></i> {hasAccess(section.id, 'live') ? 'Enrolled' : `Live ($${section.liveRate || 199})`}
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', color: 'var(--text-light)' }}>
                                            Module pricing is not available yet for this track.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {paymentData && (
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setPaymentModalOpen(false)}
                        amount={paymentData.amount}
                        itemDescription={paymentData.title}
                        paymentData={paymentData}
                        onSuccess={handlePaymentSuccess}
                    />
                )}
            </section>
        </>
    );
};

export default Pricing;

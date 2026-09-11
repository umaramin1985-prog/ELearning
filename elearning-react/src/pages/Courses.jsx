import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';

import { getCourses, getSections } from '../services/courseService';
import { createSubscription, getUserSubscriptions } from '../services/subscriptionService';
import { getUserSessions, createSession, deleteSession } from '../services/scheduleService';
import { subscribeToActiveSessions } from '../services/liveSessionService';
import PaymentModal from '../components/PaymentModal';
import CalendarView from '../components/CalendarView';
import ScheduleModal from '../components/ScheduleModal';
import { getRatingsForCourse } from '../services/ratingService';
import StarRating from '../components/StarRating';
import ReviewModal from '../components/ReviewModal';
import './Courses.css';

const Courses = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('powerbi');
    const location = useLocation();

    useEffect(() => {
        const hash = location.hash.replace('#', '');
        if (['powerbi', 'sql', 'access', 'excel'].includes(hash)) {
            setActiveTab(hash);
        }
    }, [location.hash]);

    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    const isAdmin = user && adminEmails.includes(user.email?.toLowerCase());

    // State for Dynamic Data
    const [courses, setCourses] = useState({});
    const [sections, setSections] = useState([]);
    const [userSubscriptions, setUserSubscriptions] = useState([]);
    const [userSessions, setUserSessions] = useState([]);
    const [liveSessions, setLiveSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Payment Modal State
    const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
    const [paymentData, setPaymentData] = useState(null);

    // Schedule Modal State
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);
    const [expandedModules, setExpandedModules] = useState({});
    const toggleModule = (moduleId) => {
        setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
    };

    // Ratings State
    const [courseRatings, setCourseRatings] = useState([]);
    const [reviewModalData, setReviewModalData] = useState({ isOpen: false, sectionId: null, sectionTitle: '', initialRating: null });

    useEffect(() => {
        const loadRatings = async () => {
            const ratings = await getRatingsForCourse(activeTab);
            setCourseRatings(ratings);
        };
        loadRatings();
    }, [activeTab]);

    const getRatingData = (sectionId) => {
        const relevantRatings = courseRatings.filter(r => r.sectionId === sectionId);
        if (relevantRatings.length === 0) return { avg: 0, count: 0 };
        const sum = relevantRatings.reduce((acc, r) => acc + r.rating, 0);
        return { avg: sum / relevantRatings.length, count: relevantRatings.length };
    };

    const getUserReview = (sectionId) => {
        if (!user) return null;
        return courseRatings.find(r => r.userId === user.uid && r.sectionId === sectionId);
    };

    useEffect(() => {
        const initData = async () => {
            setLoading(true);
            try {
                // Fetch Courses and Sections (Hardcoding 'powerbi' fetch for now)
                const courseData = await getCourses();
                const courseMap = {};
                courseData.forEach(c => courseMap[c.id] = c);
                setCourses(courseMap);

                const powerBiSections = await getSections('powerbi');
                powerBiSections.sort((a, b) => a.id.localeCompare(b.id));
                setSections(powerBiSections);

                // Fetch User Subscriptions & Sessions
                if (user) {
                    const subs = await getUserSubscriptions(user.uid);
                    setUserSubscriptions(subs);

                    const sess = await getUserSessions(user.uid);
                    const formattedSessions = sess.map(s => ({
                        ...s,
                        start: s.startTime?.toDate ? s.startTime.toDate() : new Date(s.startTime),
                        end: s.endTime?.toDate ? s.endTime.toDate() : new Date(s.endTime),
                    }));
                    setUserSessions(formattedSessions);
                }
            } catch (error) {
                console.error("Error loading dashboard data:", error);
                // We don't set error state here so the fallback UI can render
            } finally {
                setLoading(false);
            }
        };
        initData();

        const unsubscribeLive = subscribeToActiveSessions((sessions) => {
            setLiveSessions(sessions);
        });

        return () => {
            unsubscribeLive();
        };
    }, [user]);

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

            // Refresh subscriptions
            const subs = await getUserSubscriptions(user.uid);
            setUserSubscriptions(subs);
            alert(`Successfully subscribed to ${paymentData.title}!`);

            if (paymentData.type === 'video' && paymentData.sectionId !== 'all') {
                const section = sections.find(s => s.id === paymentData.sectionId);
                if (section && section.videoLink) {
                    window.open(section.videoLink, '_blank');
                }
            }
        } catch (err) {
            console.error("Subscription error:", err);
            alert("Failed to create subscription.");
        }
    };

    const handleScheduleSubmit = async (data) => {
        try {
            const targetUserId = data.userId || user.uid;
            await createSession(targetUserId, activeTab, 'all', data.title, data.start, data.end, '');
            alert("Session requested successfully!");
            setIsScheduleModalOpen(false);
            window.location.reload();
        } catch (err) {
            console.error("Error creating session:", err);
            alert("Failed to create session.");
        }
    };

    const currentCourse = courses[activeTab] || { title: 'Microsoft Power BI', overallVideoRate: 499, overallLiveRate: 999 };
    const totalSpent = userSubscriptions.reduce((acc, sub) => acc + sub.amount, 0);

    // Fallback pricing if Firestore sections are empty
    const getSectionPricing = (index, fallbackVideo, fallbackLive) => {
        const section = sections[index];
        return {
            id: section?.id || `module-${index + 1}`,
            videoRate: section?.videoRate || fallbackVideo,
            liveRate: section?.liveRate || fallbackLive
        };
    };

    const renderModuleHeader = (moduleNum, moduleTitle, moduleId) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
            <span className="module-number">{moduleNum}</span>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>{moduleTitle}</h3>
                    {(hasAccess('all', 'video') || hasAccess('all', 'live') || hasAccess(moduleId, 'video') || hasAccess(moduleId, 'live')) && (
                        <button
                            className="btn btn-secondary"
                            style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                            onClick={(e) => {
                                e.stopPropagation();
                                setReviewModalData({ isOpen: true, sectionId: moduleId, sectionTitle: moduleTitle, initialRating: getUserReview(moduleId) });
                            }}
                        >
                            {getUserReview(moduleId) ? 'Update Review' : 'Rate Module'}
                        </button>
                    )}
                </div>
                {(() => {
                    const r = getRatingData(moduleId);
                    return (
                        <div style={{ marginTop: '0.2rem' }}>
                            <StarRating rating={r.avg} totalReviews={r.count} />
                        </div>
                    );
                })()}
            </div>
        </div>
    );

    // Live sessions are now handled globally in GlobalLiveBanner

    return (
        <>
            <SEO
                title="Our Courses | Power BI, SQL, Excel & Access"
                description="Explore our comprehensive training modules in Microsoft Power BI, SQL Database Management, Advanced Excel, and MS Access. Enhance your BI skills today."
                keywords="Power BI Courses, SQL Training, Excel Advanced Class, MS Access Certification, Business Intelligence Online Course"
                url="/courses"
            />
            <section className="dashboard-section">
                <div className={`container dashboard-container ${isAdmin ? 'admin-mode' : ''}`}>
                    <div className="dashboard-header">
                        {user ? (
                            <div className="profile-section">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" className="profile-avatar" />
                                ) : (
                                    <div className="profile-initial">
                                        {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <h1>Welcome, {user.displayName || user.email}</h1>
                                    {!isAdmin && <p className="subscription-total">Total Invested in Learning: <strong>${totalSpent}</strong></p>}
                                    {isAdmin && <p className="subscription-total">Administrator Mode</p>}
                                </div>
                            </div>
                        ) : (
                            <div className="profile-section" style={{ justifyContent: 'center' }}>
                                <div>
                                    <h1>Our Courses <span style={{ color: 'var(--primary-color)' }}>&</span> Tracks</h1>
                                    <p className="subscription-total">Log in to subscribe and access your learning materials.</p>
                                </div>
                            </div>
                        )}
                        {!isAdmin && <p>Select a track to view the course syllabus and details.</p>}
                    </div>

                    <div className="dashboard-tabs">
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
                        {user && !isAdmin && (
                            <button className={`tab-btn ${activeTab === 'myschedule' ? 'active' : ''}`} onClick={() => setActiveTab('myschedule')}>
                                <i className="fa-solid fa-calendar"></i> My Schedule
                            </button>
                        )}
                    </div>

                    <div className="dashboard-content">
                        {loading ? (
                            <div className="admin-loading">Loading course data...</div>
                        ) : (
                            <>
                                {activeTab === 'powerbi' && (
                                    <div className="course-content fade-in">
                                        <div className="course-header powerbi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', padding: '3rem', background: 'var(--hero-bg)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ flex: '1 1 400px' }}>
                                                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--secondary-color)' }}>Become a Job-Ready Power BI Analyst</h2>
                                                <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem', fontStyle: 'italic', color: 'var(--primary-color)' }}>"What is Power BI? Beauty with Brain"</h3>
                                                {(() => {
                                                    const ratingData = getRatingData('all');
                                                    return (
                                                        <div style={{ marginBottom: '1rem' }}>
                                                            <StarRating rating={ratingData.avg} totalReviews={ratingData.count} />
                                                        </div>
                                                    );
                                                })()}
                                                <p className="subtitle" style={{ fontSize: '1.2rem', color: 'var(--text-main)', marginBottom: '1.5rem', lineHeight: '1.6' }}>
                                                    Master data modeling, DAX, and storytelling to turn raw data into decisions. Build a professional portfolio and gain the confidence to lead analytics projects.
                                                </p>
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => {
                                                            document.querySelector('.course-overall-pricing').scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                    >
                                                        Unlock Full Course
                                                    </button>
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => {
                                                            document.querySelector('.demo-video-container').scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-play"></i> Watch Free Demo
                                                    </button>
                                                    {(hasAccess('all', 'video') || hasAccess('all', 'live')) && (
                                                        <button
                                                            className="btn btn-secondary"
                                                            onClick={() => setReviewModalData({ isOpen: true, sectionId: 'all', sectionTitle: currentCourse.title, initialRating: getUserReview('all') })}
                                                        >
                                                            {getUserReview('all') ? 'Update Your Review' : 'Leave a Review'}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                        </div>

                                        <div className="course-grid" style={{ margin: '4rem 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
                                            <div className="glass-panel highlight-card" style={{ padding: '2.5rem' }}>
                                                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Why Learn Power BI?</h3>
                                                <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', fontSize: '1.1rem', color: 'var(--text-main)' }}>
                                                    <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><i className="fa-solid fa-briefcase" style={{ color: 'var(--accent-color)', fontSize: '1.5rem' }}></i> <strong>High Demand:</strong> The #1 requested skill for Data Analysts.</li>
                                                    <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><i className="fa-solid fa-building" style={{ color: 'var(--accent-color)', fontSize: '1.5rem' }}></i> <strong>Corporate Standard:</strong> Used by 97% of Fortune 500 companies.</li>
                                                    <li style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}><i className="fa-solid fa-arrow-trend-up" style={{ color: 'var(--accent-color)', fontSize: '1.5rem' }}></i> <strong>Career Growth:</strong> Directly linked to higher salary brackets in analytics.</li>
                                                </ul>
                                                <div className="demo-video-container" style={{ marginTop: '2.5rem' }}>
                                                    <h4 style={{ marginBottom: '1rem' }}>See the Course in Action</h4>
                                                    <video
                                                        className="demo-video"
                                                        controls
                                                        style={{ width: '100%', borderRadius: '15px', boxShadow: 'var(--box-shadow)', background: '#000' }}
                                                    >
                                                        <source src="/videos/powerbi-demo.mp4" type="video/mp4" />
                                                        Your browser does not support the video tag.
                                                    </video>
                                                </div>
                                            </div>

                                            <div className="glass-panel" style={{ padding: '2.5rem' }}>
                                                <h3 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', color: 'var(--primary-color)' }}>Why Train With Us?</h3>
                                                <p style={{ color: 'var(--text-light)', marginBottom: '2rem', fontSize: '1.1rem' }}>A structured, guided approach designed to ensure you finish what you start and leave with a real portfolio.</p>

                                                <ul style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                                                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                                        <div style={{ background: 'var(--bg-alt)', padding: '0.8rem', borderRadius: '10px' }}><i className="fa-solid fa-project-diagram" style={{ color: 'var(--primary-color)' }}></i></div>
                                                        <div>
                                                            <strong>Enterprise-Level Projects</strong>
                                                            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>Build dashboards that reflect real corporate complexity.</p>
                                                        </div>
                                                    </li>
                                                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                                        <div style={{ background: 'var(--bg-alt)', padding: '0.8rem', borderRadius: '10px' }}><i className="fa-solid fa-headset" style={{ color: 'var(--primary-color)' }}></i></div>
                                                        <div>
                                                            <strong>Live Support & Q&A</strong>
                                                            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>Get unstuck immediately with access to expert instructors.</p>
                                                        </div>
                                                    </li>
                                                    <li style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
                                                        <div style={{ background: 'var(--bg-alt)', padding: '0.8rem', borderRadius: '10px' }}><i className="fa-solid fa-certificate" style={{ color: 'var(--primary-color)' }}></i></div>
                                                        <div>
                                                            <strong>Verified Certification</strong>
                                                            <p style={{ margin: 0, color: 'var(--text-light)', fontSize: '0.9rem' }}>Earn a credential you can add directly to your LinkedIn.</p>
                                                        </div>
                                                    </li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="process-flow-section" style={{ margin: '3rem 0' }}>
                                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                                <img
                                                    src="/images/powerbi_process_flow_wide_light.jpg"
                                                    alt="Power BI Process Flow"
                                                    className="show-light"
                                                    style={{ width: '100%', height: 'auto', borderRadius: '15px', boxShadow: 'var(--box-shadow)' }}
                                                />
                                                <img
                                                    src="/images/powerbi_process_flow_wide.jpg"
                                                    alt="Power BI Process Flow"
                                                    className="show-dark"
                                                    style={{ width: '100%', height: 'auto', borderRadius: '15px', boxShadow: 'var(--box-shadow)' }}
                                                />
                                            </div>

                                            <div className="process-flow-text glass-panel" style={{ padding: '2rem', borderRadius: '15px' }}>
                                                <h4 style={{ color: 'var(--text-main)', fontSize: '1.2rem' }}>Power BI Suite process flow:</h4>
                                                <ol style={{ paddingLeft: '1.5rem', marginTop: '1rem' }}>
                                                    <li style={{ marginBottom: '0.8rem' }}><strong>Data Input / collection (A)</strong> from various sources, Power Query manipulates and arrange according to requirement as <strong>finished product (B)</strong></li>
                                                    <li style={{ marginBottom: '0.8rem' }}><strong>Product (B)</strong> is Examine and Analyzed through Power Pivot and DAX Measures as <strong>Product (C)</strong></li>
                                                    <li><strong>Product (C)</strong> is Communicate, Convince and Carry-On through Power Visual</li>
                                                </ol>
                                            </div>
                                        </div>

                                        <div className="course-modules">
                                            {/* Module 1 */}
                                            <div className="module-card">
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                                    {renderModuleHeader(1, "Power Query & Data Cleaning (ETL)", "module-1")}

                                                </div>
                                                <div className="module-content fade-in">
                                                    <div className="module-image-container">
                                                        <img src="/images/modules/data_cleaning_dark_1787127656632.jpg" alt="Data Cleaning" className="module-image show-dark" />
                                                        <img src="/images/modules/data_cleaning_light_1787127237461.jpg" alt="Data Cleaning" className="module-image show-light" />
                                                    </div>
                                                    <p className="module-intro-text">
                                                        Power Query is not for designing and developing reports, it meant to collect, clean, arrange and load data - also called as “Data prep Engine”
                                                    </p>
                                                    <h4 style={{ marginBottom: '1rem' }}>Key Topics:</h4>
                                                    <ul>
                                                        <li><strong>Connecting to Data Sources:</strong> Excel, CSV, Web, SQL Server, SharePoint, APIs, and more.</li>
                                                        <li><strong>Data Cleaning Techniques:</strong> Removing duplicates, handling nulls, formatting columns.</li>
                                                        <li><strong>Transformations:</strong> Pivot/unpivot, merge, append, split columns.</li>
                                                        <li><strong>M Code Basics:</strong> Introduction to the Power Query formula language for advanced transformations.</li>
                                                    </ul>
                                                    <div className="module-conclusion">
                                                        🚀 Conclusion: "By the end of Module-1, you'll confidently transform messy data from any source into clean, report-ready datasets".
                                                    </div>



                                                </div>
                                            </div>

                                            {/* Module 2 */}
                                            <div className="module-card">
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                                    {renderModuleHeader(2, "Power Pivot, DAX, and Data Analytics", "module-2")}

                                                </div>
                                                <div className="module-content fade-in">
                                                    <div className="module-image-container">
                                                        <img src="/images/modules/dax_analytics_dark_1787127668269.jpg" alt="DAX and Analytics" className="module-image show-dark" />
                                                        <img src="/images/modules/dax_analytics_light_1787127247401.jpg" alt="DAX and Analytics" className="module-image show-light" />
                                                    </div>
                                                    <div className="module-intro-text">
                                                        <div style={{ fontWeight: 'bold', fontSize: '1.2rem', marginBottom: '0.5rem' }}>The Brain behind BI</div>
                                                        <p style={{ fontSize: '1rem', margin: 0 }}>
                                                            DAX (Data Analysis Expression) is a formula language used in Power BI to create normal, custom calculations and aggregation for Data Analysis.
                                                        </p>
                                                    </div>
                                                    <h4 style={{ marginBottom: '1rem' }}>Key Topics:</h4>
                                                    <ul>
                                                        <li><strong>Calculated Columns vs Measures:</strong> Understand when to use Calculated Columns vs Measures for better insights.</li>
                                                        <li><strong>Advanced DAX Patterns & Functions:</strong> Dynamic titles, Ranking (e.g., Top N customers), Segmentation (e.g., customer tiers), Cumulative totals and rolling averages.</li>
                                                        <li><strong>Aggregation & Iterators:</strong> SUM, SUMX, AVERAGE, AVERAGEX, MINX, MAXX, RANKX, COUNTROWS, DISTINCTCOUNT.</li>
                                                        <li><strong>Filter & Context Control:</strong> CALCULATE, CALCULATETABLE, KEEPFILTERS, REMOVEFILTERS.</li>
                                                        <li><strong>Time Intelligence:</strong> YTD, MTD, QTD, SAMEPERIODLASTYEAR.</li>
                                                        <li><strong>Table & Data Modeling:</strong> SUMMARIZECOLUMNS, SUMMARIZE, ADDCOLUMNS, CROSSJOIN, GENERATE.</li>
                                                        <li><strong>Relationship Indigence:</strong> RELATED, RELATEDTABLE, CROSSFILTER, ALLSELECTED.</li>
                                                        <li><strong>Advance Logic & Hierarchies:</strong> SWITCH, DIVIDE, PATH, PATHITEM, EARLIER.</li>
                                                    </ul>


                                                </div>
                                            </div>

                                            {/* Module 3 */}
                                            <div className="module-card">
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                                    {renderModuleHeader(3, "Data Visualization & Storytelling", "module-3")}

                                                </div>
                                                <div className="module-content fade-in">
                                                    <div className="module-image-container">
                                                        <img src="/images/modules/data_visualization_dark_1787127678048.jpg" alt="Data Visualization" className="module-image show-dark" />
                                                        <img src="/images/modules/data_visualization_light_1787127256757.jpg" alt="Data Visualization" className="module-image show-light" />
                                                    </div>
                                                    <p className="module-intro-text">
                                                        Anyone can build charts. Great analyst tell stories that drive decisions. Master dashboard, design, visual storytelling, and interactive analytics to transform complex data into clear, actionable business insights. Develop the skills that elevate you from data analyst to Strategic Advisor by creating compelling dashboards that capture attention, built trust, and inspire meaningful action.
                                                    </p>
                                                    <h4 style={{ marginBottom: '1rem' }}>Key Topics:</h4>
                                                    <ul>
                                                        <li><strong>Choose the right Visual:</strong> Select the perfect Visual for Every Business Question</li>
                                                        <li><strong>Custom Visuals:</strong> Advanced and Marketplace Visual</li>
                                                        <li><strong>Design Principles:</strong> Dashboard Design Psychology & UX Best Practices</li>
                                                        <li><strong>Storytelling Techniques:</strong> Executive Storytelling & Insight Communication</li>
                                                    </ul>
                                                    <div className="module-conclusion analysis-section">
                                                        <strong>Analyzing dashboards from:</strong>
                                                        <br />Human psychology & decision-making behavior
                                                        <br />Information hierarchy and cognitive load
                                                        <br />Consistency across tools like Power BI and Tableau.
                                                    </div>


                                                </div>
                                            </div>

                                            {/* Module 4 */}
                                            <div className="module-card">
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                                    {renderModuleHeader(4, "Data Modeling and Optimization", "module-4")}

                                                </div>
                                                <div className="module-content fade-in">
                                                    <div className="module-image-container">
                                                        <img src="/images/modules/data_modeling_dark_1787127687751.jpg" alt="Data Modeling" className="module-image show-dark" />
                                                        <img src="/images/modules/data_modeling_light_1787127265917.jpg" alt="Data Modeling" className="module-image show-light" />
                                                    </div>
                                                    <p className="module-intro-text">
                                                        Anyone can connect data. Top analyst built models that scale. Master data modelling, relationship design, and performance optimization techniques that transform complex datasets into fast, reliable and business-ready analytics, creating the foundation for powerful reporting and informed decision making
                                                    </p>
                                                    <h4 style={{ marginBottom: '1rem' }}>Key Topics:</h4>
                                                    <ul>
                                                        <li><strong>Enterprise data Modeling:</strong> Star schema, Snowflake Schema and best practice</li>
                                                        <li><strong>Relationship Design:</strong> One-to-Many, Many-to-Many, & Filter Context</li>
                                                        <li><strong>Performance Optimization:</strong> Normaliziation, Denormalization & Model Efficiency</li>
                                                        <li><strong>Advanced DAX Engineering:</strong> Measures, Calculated Table and Business Logic</li>
                                                    </ul>


                                                </div>
                                            </div>

                                            {/* Module 5 */}
                                            <div className="module-card">
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                                    {renderModuleHeader(5, "Power BI Service & Publishing", "module-5")}

                                                </div>
                                                <div className="module-content fade-in">
                                                    <div className="module-image-container">
                                                        <img src="/images/modules/cloud_publishing_dark_1787127698462.jpg" alt="Cloud Publishing" className="module-image show-dark" />
                                                        <img src="/images/modules/cloud_publishing_light_1787127276852.jpg" alt="Cloud Publishing" className="module-image show-light" />
                                                    </div>
                                                    <p className="module-intro-text">
                                                        Transition from report creator to Enterprise BI professional. Learn to publish, secure, automate, and manage Power BI solutions in the cloud, ensuring scalable, reliable, and governed access to insights that empower collaboration and drive confident business decisions.
                                                    </p>
                                                    <h4 style={{ marginBottom: '1rem' }}>Key Topics:</h4>
                                                    <ul>
                                                        <li><strong>Power BI Service Architecture & Workspace Management</strong></li>
                                                        <li><strong>Report Publishing & Automated Data Refresh</strong></li>
                                                        <li><strong>Enterprise Security:</strong> Row-Level Security (RLS) & Access Control</li>
                                                        <li><strong>Monitoring, Troubleshooting & Refresh Optimization</strong></li>
                                                    </ul>


                                                </div>
                                            </div>

                                            {/* Module 6 */}
                                            <div className="module-card">
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
                                                    {renderModuleHeader(6, "From Raw Data to Executive Dashboards", "module-6")}

                                                </div>
                                                <div className="module-content fade-in">
                                                    <div className="module-image-container">
                                                        <img src="/images/modules/executive_dashboard_dark_1787127707989.jpg" alt="Executive Dashboards" className="module-image show-dark" />
                                                        <img src="/images/modules/executive_dashboard_light_1787127285637.jpg" alt="Executive Dashboards" className="module-image show-light" />
                                                    </div>
                                                    <p className="module-intro-text">
                                                        Turn theory into practice through a comprehensive end-to-end project. Learn how to transform raw business data into executive-ready dashboard by combining data preparation, modeling, analytics, visualization, and storytelling techniques into insights that drive strategy in business decisions.
                                                    </p>
                                                    <h4 style={{ marginBottom: '1rem' }}>Key Topics:</h4>
                                                    <ul>
                                                        <li><strong>Business Requirements Analysis and KPI Definition</strong></li>
                                                        <li><strong>Master Data Creation and Data Source Integration</strong></li>
                                                        <li><strong>Dataset Architecture & Data Mapping</strong></li>
                                                        <li><strong>Executive Dashboard Design & Report Development</strong></li>
                                                        <li><strong>End-to-End Business Intelligence Project</strong></li>
                                                        <li><strong>Presenting Insights to Stakeholders</strong></li>
                                                    </ul>


                                                </div>
                                            </div>

                                        </div>
                                    </div>
                                )}

                                {activeTab === 'myschedule' && (
                                    <div className="course-content fade-in">
                                        <h2>My Live Classes</h2>
                                        <p>View your scheduled live sessions below.</p>
                                        <CalendarView
                                            events={userSessions}
                                            onSelectEvent={async (event) => {
                                                const wantsToDelete = window.confirm(
                                                    `Session: ${event.title}\n\nDo you want to delete this session? (Click Cancel to keep or join it)`
                                                );

                                                if (wantsToDelete) {
                                                    try {
                                                        await deleteSession(event.id);
                                                        alert("Session deleted successfully.");
                                                        window.location.reload();
                                                    } catch (err) {
                                                        console.error(err);
                                                        alert("Failed to delete session.");
                                                    }
                                                } else if (event.meetingLink) {
                                                    window.open(event.meetingLink, '_blank');
                                                }
                                            }}
                                            onSelectSlot={(slotInfo) => {
                                                setSelectedSlotInfo(slotInfo);
                                                setIsScheduleModalOpen(true);
                                            }}
                                        />
                                    </div>
                                )}

                                {(activeTab === 'sql' || activeTab === 'access' || activeTab === 'excel') && (
                                    <div className="course-content placeholder-content fade-in">
                                        <i className={`fa-solid ${activeTab === 'sql' ? 'fa-database' : activeTab === 'access' ? 'fa-table-list' : 'fa-file-excel'} placeholder-icon`}></i>
                                        <h2>Course Content</h2>
                                        <p>Coming Soon! This section will be updated with the syllabus.</p>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {paymentData && (
                    <PaymentModal
                        isOpen={isPaymentModalOpen}
                        onClose={() => setPaymentModalOpen(false)}
                        amount={paymentData.amount}
                        itemDescription={paymentData.title}
                        onSuccess={handlePaymentSuccess}
                    />
                )}

                <ScheduleModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    slotInfo={selectedSlotInfo}
                    onSubmit={handleScheduleSubmit}
                    isAdmin={isAdmin}
                />
            </section>
        </>
    );
};

export default Courses;

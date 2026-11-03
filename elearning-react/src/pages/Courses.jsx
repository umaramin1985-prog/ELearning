import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import SEO from '../components/SEO';
import { useAuth } from '../contexts/AuthContext';

import { getCourses, getSections } from '../services/courseService';
import { createSubscription, getUserSubscriptions } from '../services/subscriptionService';
import { getUserSessions, createSession, deleteSession } from '../services/scheduleService';
import { getUserClasses } from '../services/classService';
import { getUserGrades, calculateLetterGrade } from '../services/gradeService';
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
        if (['powerbi', 'sql', 'access', 'excel', 'myschedule', 'mygrades'].includes(hash)) {
            setActiveTab(hash);
        }
    }, [location.hash]);

    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    const isAdmin = user && adminEmails.includes(user.email?.toLowerCase());

    // State for Dynamic Data
    const [courses, setCourses] = useState({});
    const [sections, setSections] = useState([]);
    const [userSubscriptions, setUserSubscriptions] = useState([]);
    const [userClasses, setUserClasses] = useState([]);
    const [userGrades, setUserGrades] = useState([]);
    const [userSessions, setUserSessions] = useState([]);
    const [loading, setLoading] = useState(true);

    // Schedule Modal State
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
    const [selectedSlotInfo, setSelectedSlotInfo] = useState(null);
    const [selectedUserSession, setSelectedUserSession] = useState(null);
    const [certificateData, setCertificateData] = useState(null);
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

                // Fetch User Subscriptions, Classes, Grades & Sessions
                if (user) {
                    const [subs, cls, grds, sess] = await Promise.all([
                        getUserSubscriptions(user.uid),
                        getUserClasses(user.uid),
                        getUserGrades(user.uid),
                        getUserSessions(user.uid)
                    ]);
                    setUserSubscriptions(subs);
                    setUserClasses(cls);
                    setUserGrades(grds);

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
    }, [user]);

    const hasAccess = (sectionId, type) => {
        if (!user) return false;
        return userSubscriptions.some(sub =>
            sub.courseId === activeTab &&
            (sub.sectionId === 'all' || sub.sectionId === sectionId) &&
            sub.type === type
        );
    };

    const isEnrolled = (sectionId) => {
        const subEnrolled = hasAccess('all', 'video') || hasAccess('all', 'live') || hasAccess(sectionId, 'video') || hasAccess(sectionId, 'live');
        const classEnrolled = userClasses.some(
            c => c.courseId === activeTab && (c.sectionId === 'all' || c.sectionId === sectionId)
        );
        return subEnrolled || classEnrolled;
    };

    const isCompleted = (sectionId) => {
        if (!user) return false;
        const subCompleted = userSubscriptions.some(sub =>
            sub.courseId === activeTab &&
            (sub.sectionId === 'all' || sub.sectionId === sectionId) &&
            sub.status === 'completed'
        );
        const classCompleted = userClasses.some(
            c => c.courseId === activeTab && (c.sectionId === 'all' || c.sectionId === sectionId) && c.status === 'completed'
        );
        const gradeExists = userGrades.some(
            g => g.courseId === activeTab && (g.sectionId === 'all' || g.sectionId === sectionId)
        );
        return subCompleted || classCompleted || gradeExists;
    };

    const getSectionGrade = (sectionId) => {
        if (!user) return null;
        const directGrade = userGrades.find(g => g.courseId === activeTab && g.sectionId === sectionId);
        if (directGrade) return directGrade;
        const allGrade = userGrades.find(g => g.courseId === activeTab && g.sectionId === 'all');
        if (allGrade) return allGrade;
        const subWithGrade = userSubscriptions.find(
            sub => sub.courseId === activeTab && (sub.sectionId === sectionId || sub.sectionId === 'all') && sub.letterGrade
        );
        return subWithGrade || null;
    };

    // Handle Stripe redirect on mount
    useEffect(() => {
        if (!user) return;
        
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');
        
        if (paymentStatus === 'success') {
            const courseId = urlParams.get('courseId');
            const sectionId = urlParams.get('sectionId');
            const type = urlParams.get('type');
            const amount = parseFloat(urlParams.get('amount'));

            if (courseId && sectionId && type && !isNaN(amount)) {
                // Clear URL params to prevent duplicate submissions on refresh
                window.history.replaceState(null, '', window.location.pathname + window.location.hash);
                
                // create subscription
                createSubscription(
                    user.uid,
                    courseId,
                    sectionId,
                    type,
                    amount,
                    'stripe'
                ).then(() => {
                    // refresh subscriptions
                    getUserSubscriptions(user.uid).then(subs => setUserSubscriptions(subs));
                    alert(`Successfully subscribed to the course!`);
                    
                    if (type === 'video' && sectionId !== 'all') {
                        const section = sections.find(s => s.id === sectionId);
                        if (section && section.videoLink) {
                            window.open(section.videoLink, '_blank');
                        }
                    }
                }).catch(err => {
                    console.error("Subscription error:", err);
                    alert("Failed to finalize subscription. Please contact support.");
                });
            }
        } else if (paymentStatus === 'cancel') {
            window.history.replaceState(null, '', window.location.pathname + window.location.hash);
            alert("Payment was cancelled.");
        }
    }, [user, sections]);

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

    const renderModuleHeader = (moduleNum, moduleTitle, moduleId) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.75rem, 2vw, 1.5rem)', width: '100%' }}>
            <span className="module-number">{moduleNum}</span>
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <h3 style={{ margin: 0 }}>{moduleTitle}</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isCompleted(moduleId) ? (
                            <>
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                    <i className="fa-solid fa-circle-check"></i> Completed
                                </span>
                                {(() => {
                                    const g = getSectionGrade(moduleId);
                                    if (!g) return null;
                                    return (
                                        <span
                                            title={g.remarks ? `Instructor Feedback: ${g.remarks}` : 'Official Grade'}
                                            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-color)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
                                        >
                                            <i className="fa-solid fa-award"></i> Grade: {g.letterGrade} ({g.score}%)
                                        </span>
                                    );
                                })()}
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
                            </>
                        ) : isEnrolled(moduleId) ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', borderRadius: '20px', fontSize: '0.78rem', fontWeight: 600, background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-color)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                <i className="fa-solid fa-book-open"></i> Enrolled
                            </span>
                        ) : null}
                    </div>
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
            <script type="application/ld+json">
                {JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Course",
                    "name": "Power BI Certification Training",
                    "description": "Master data modeling, DAX, and storytelling to turn raw data into decisions.",
                    "provider": {
                        "@type": "Organization",
                        "name": "YYZ Data Matrix",
                        "sameAs": "https://yyzdm.ca"
                    }
                })}
            </script>
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
                                    {!isAdmin && userClasses.length > 0 && (
                                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.45rem' }}>
                                            {userClasses.map(cls => (
                                                <span
                                                    key={cls.id}
                                                    style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.35rem',
                                                        padding: '0.22rem 0.7rem',
                                                        borderRadius: '16px',
                                                        fontSize: '0.8rem',
                                                        fontWeight: 600,
                                                        background: 'rgba(var(--primary-rgb), 0.12)',
                                                        color: 'var(--primary-color)',
                                                        border: '1px solid rgba(var(--primary-rgb), 0.25)'
                                                    }}
                                                >
                                                    <i className="fa-solid fa-users"></i> Cohort: {cls.name}
                                                </span>
                                            ))}
                                        </div>
                                    )}
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
                            <>
                                <button className={`tab-btn ${activeTab === 'myschedule' ? 'active' : ''}`} onClick={() => setActiveTab('myschedule')}>
                                    <i className="fa-solid fa-calendar"></i> My Schedule
                                </button>
                                <button className={`tab-btn ${activeTab === 'mygrades' ? 'active' : ''}`} onClick={() => setActiveTab('mygrades')}>
                                    <i className="fa-solid fa-award"></i> My Grades
                                </button>
                            </>
                        )}
                    </div>

                    <div className="dashboard-content">
                        {loading ? (
                            <div className="admin-loading">Loading course data...</div>
                        ) : (
                            <>
                                {activeTab === 'powerbi' && (
                                    <div className="course-content fade-in">
                                        <div className="course-header powerbi-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '2rem', padding: 'clamp(1.5rem, 5vw, 3rem)', background: 'var(--hero-bg)', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
                                            <div style={{ flex: '1 1 min(100%, 400px)' }}>
                                                <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--secondary-color)' }}>Become a Job-Ready Power BI Analyst</h2>
                                                <div className="tagline-container">
                                                    <h3 style={{ fontSize: '1.5rem', marginBottom: '0.2rem', fontStyle: 'italic', color: 'var(--primary-color)' }}>What is Power BI?</h3>
                                                    <div className="beauty-brains-wrapper">
                                                        <div className="beauty-brains-glow"></div>
                                                        <h3 className="beauty-brains-text">
                                                            <span className="beauty-brains-gradient">Beauty</span>
                                                            <span className="beauty-brains-with">with</span>
                                                            <span className="brains-wrapper">
                                                                <span className="beauty-brains-gradient">Brains</span>
                                                                <svg className="brains-underline" viewBox="0 0 100 14" preserveAspectRatio="none">
                                                                    <path d="M2,10 Q50,14 98,4" fill="none" stroke="#ec4899" strokeWidth="3" strokeLinecap="round" />
                                                                </svg>
                                                            </span>
                                                        </h3>
                                                    </div>
                                                </div>
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
                                                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                    {!(hasAccess('all', 'video') || hasAccess('all', 'live')) && (
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={() => {
                                                                navigate(`/pricing#${activeTab}`);
                                                            }}
                                                        >
                                                            Unlock Full Course
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => {
                                                            document.querySelector('.demo-video-container')?.scrollIntoView({ behavior: 'smooth' });
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-play"></i> Watch Free Demo
                                                    </button>
                                                    {isCompleted('all') ? (
                                                        <>
                                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: '30px', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                                                <i className="fa-solid fa-graduation-cap"></i> Course Completed
                                                            </span>
                                                            {(() => {
                                                                const g = getSectionGrade('all');
                                                                if (!g) return null;
                                                                return (
                                                                    <span
                                                                        title={g.remarks ? `Instructor Feedback: ${g.remarks}` : 'Official Course Grade'}
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: '30px', fontSize: '0.9rem', fontWeight: 700, background: 'rgba(245, 158, 11, 0.15)', color: 'var(--accent-color)', border: '1px solid rgba(245, 158, 11, 0.35)' }}
                                                                    >
                                                                        <i className="fa-solid fa-award"></i> Final Grade: {g.letterGrade} ({g.score}%)
                                                                    </span>
                                                                );
                                                            })()}
                                                            <button
                                                                className="btn btn-secondary"
                                                                onClick={() => setReviewModalData({ isOpen: true, sectionId: 'all', sectionTitle: currentCourse.title, initialRating: getUserReview('all') })}
                                                            >
                                                                {getUserReview('all') ? 'Update Your Review' : 'Leave a Review'}
                                                            </button>
                                                        </>
                                                    ) : (hasAccess('all', 'video') || hasAccess('all', 'live')) ? (
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1rem', borderRadius: '30px', fontSize: '0.9rem', fontWeight: 600, background: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-color)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                                                            <i className="fa-solid fa-book-open"></i> Full Course Enrolled
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>

                                        </div>

                                        <div className="course-grid" style={{ margin: 'clamp(2rem, 5vw, 4rem) 0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: 'clamp(1rem, 4vw, 2rem)' }}>
                                            <div className="glass-panel highlight-card" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
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

                                            <div className="glass-panel" style={{ padding: 'clamp(1.5rem, 4vw, 2.5rem)' }}>
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

                                                <div style={{ marginTop: '2.5rem', paddingTop: '2.5rem', borderTop: '1px solid var(--border-color)' }}>
                                                    <h4 style={{ fontSize: '1.2rem', marginBottom: '1rem', color: 'var(--text-main)' }}>View Sample Projects</h4>
                                                    <p style={{ color: 'var(--text-light)', fontSize: '0.95rem', marginBottom: '1.5rem' }}>Explore the actual Power BI dashboards you will learn to build during this course.</p>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        <a href="/docs/Historical Sales Report.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', textDecoration: 'none' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                                <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444', fontSize: '1.2rem' }}></i>
                                                                Historical Sales Report
                                                            </span>
                                                            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.9rem', opacity: 0.7 }}></i>
                                                        </a>
                                                        <a href="/docs/Efficiency Report.pdf" target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', textDecoration: 'none' }}>
                                                            <span style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                                                                <i className="fa-solid fa-file-pdf" style={{ color: '#ef4444', fontSize: '1.2rem' }}></i>
                                                                Efficiency Report
                                                            </span>
                                                            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: '0.9rem', opacity: 0.7 }}></i>
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="process-flow-section" style={{ margin: '3rem 0' }}>
                                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                                <img src="/images/powerbi_process_flow_wide_light.webp" width="800" height="400"
                                                    alt="Power BI Process Flow"
                                                    className="show-light"
                                                    style={{ width: '100%', height: 'auto', borderRadius: '15px', boxShadow: 'var(--box-shadow)' }}
                                                />
                                                <img src="/images/powerbi_process_flow_wide_dark.webp" width="800" height="400"
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
                                            <div className="module-card" style={{ padding: expandedModules['module-1'] ? 'clamp(1.25rem, 3vw, 2.5rem)' : '1.25rem clamp(1rem, 3vw, 2.5rem)' }}>
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: expandedModules['module-1'] ? '1.5rem' : '0', marginBottom: expandedModules['module-1'] ? '1.5rem' : '0', cursor: 'pointer' }} onClick={() => toggleModule('module-1')}>
                                                    {renderModuleHeader(1, "Power Query & Data Cleaning (ETL)", "module-1")}
                                                    <i className={`fa-solid fa-chevron-${expandedModules['module-1'] ? 'up' : 'down'}`} style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginLeft: '1rem' }}></i>
                                                </div>
                                                {expandedModules['module-1'] && (
                                                    <div className="module-content fade-in">
                                                        <div className="module-image-container">
                                                            <img src="/images/modules/mod_1_dark.webp" alt="Data Cleaning" className="module-image show-dark" width="400" height="250" />
                                                            <img src="/images/modules/mod_1_light.webp" alt="Data Cleaning" className="module-image show-light" width="400" height="250" />
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
                                                )}
                                            </div>

                                            {/* Module 2 */}
                                            <div className="module-card" style={{ padding: expandedModules['module-2'] ? 'clamp(1.25rem, 3vw, 2.5rem)' : '1.25rem clamp(1rem, 3vw, 2.5rem)' }}>
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: expandedModules['module-2'] ? '1.5rem' : '0', marginBottom: expandedModules['module-2'] ? '1.5rem' : '0', cursor: 'pointer' }} onClick={() => toggleModule('module-2')}>
                                                    {renderModuleHeader(2, "Power Pivot, DAX, and Data Analytics", "module-2")}
                                                    <i className={`fa-solid fa-chevron-${expandedModules['module-2'] ? 'up' : 'down'}`} style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginLeft: '1rem' }}></i>
                                                </div>
                                                {expandedModules['module-2'] && (
                                                    <div className="module-content fade-in">
                                                        <div className="module-image-container">
                                                            <img src="/images/modules/mod_2_dark.webp" alt="DAX and Analytics" className="module-image show-dark" width="400" height="250" />
                                                            <img src="/images/modules/mod_2_light.webp" alt="DAX and Analytics" className="module-image show-light" width="400" height="250" />
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
                                                )}
                                            </div>

                                            {/* Module 3 */}
                                            <div className="module-card" style={{ padding: expandedModules['module-3'] ? 'clamp(1.25rem, 3vw, 2.5rem)' : '1.25rem clamp(1rem, 3vw, 2.5rem)' }}>
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: expandedModules['module-3'] ? '1.5rem' : '0', marginBottom: expandedModules['module-3'] ? '1.5rem' : '0', cursor: 'pointer' }} onClick={() => toggleModule('module-3')}>
                                                    {renderModuleHeader(3, "Data Visualization & Storytelling", "module-3")}
                                                    <i className={`fa-solid fa-chevron-${expandedModules['module-3'] ? 'up' : 'down'}`} style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginLeft: '1rem' }}></i>
                                                </div>
                                                {expandedModules['module-3'] && (
                                                    <div className="module-content fade-in">
                                                        <div className="module-image-container">
                                                            <img src="/images/modules/mod_3_dark.webp" alt="Data Visualization" className="module-image show-dark" width="400" height="250" />
                                                            <img src="/images/modules/mod_3_light.webp" alt="Data Visualization" className="module-image show-light" width="400" height="250" />
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
                                                )}
                                            </div>

                                            {/* Module 4 */}
                                            <div className="module-card" style={{ padding: expandedModules['module-4'] ? 'clamp(1.25rem, 3vw, 2.5rem)' : '1.25rem clamp(1rem, 3vw, 2.5rem)' }}>
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: expandedModules['module-4'] ? '1.5rem' : '0', marginBottom: expandedModules['module-4'] ? '1.5rem' : '0', cursor: 'pointer' }} onClick={() => toggleModule('module-4')}>
                                                    {renderModuleHeader(4, "Data Modeling and Optimization", "module-4")}
                                                    <i className={`fa-solid fa-chevron-${expandedModules['module-4'] ? 'up' : 'down'}`} style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginLeft: '1rem' }}></i>
                                                </div>
                                                {expandedModules['module-4'] && (
                                                    <div className="module-content fade-in">
                                                        <div className="module-image-container">
                                                            <img src="/images/modules/mod_4_dark.webp" alt="Data Modeling" className="module-image show-dark" width="400" height="250" />
                                                            <img src="/images/modules/mod_4_light.webp" alt="Data Modeling" className="module-image show-light" width="400" height="250" />
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
                                                )}
                                            </div>

                                            {/* Module 5 */}
                                            <div className="module-card" style={{ padding: expandedModules['module-5'] ? 'clamp(1.25rem, 3vw, 2.5rem)' : '1.25rem clamp(1rem, 3vw, 2.5rem)' }}>
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: expandedModules['module-5'] ? '1.5rem' : '0', marginBottom: expandedModules['module-5'] ? '1.5rem' : '0', cursor: 'pointer' }} onClick={() => toggleModule('module-5')}>
                                                    {renderModuleHeader(5, "Power BI Service & Publishing", "module-5")}
                                                    <i className={`fa-solid fa-chevron-${expandedModules['module-5'] ? 'up' : 'down'}`} style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginLeft: '1rem' }}></i>
                                                </div>
                                                {expandedModules['module-5'] && (
                                                    <div className="module-content fade-in">
                                                        <div className="module-image-container">
                                                            <img src="/images/modules/mod_5_dark.webp" alt="Cloud Publishing" className="module-image show-dark" width="400" height="250" />
                                                            <img src="/images/modules/mod_5_light.webp" alt="Cloud Publishing" className="module-image show-light" width="400" height="250" />
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
                                                )}
                                            </div>

                                            {/* Module 6 */}
                                            <div className="module-card" style={{ padding: expandedModules['module-6'] ? 'clamp(1.25rem, 3vw, 2.5rem)' : '1.25rem clamp(1rem, 3vw, 2.5rem)' }}>
                                                <div className="module-header" style={{ justifyContent: 'space-between', paddingBottom: expandedModules['module-6'] ? '1.5rem' : '0', marginBottom: expandedModules['module-6'] ? '1.5rem' : '0', cursor: 'pointer' }} onClick={() => toggleModule('module-6')}>
                                                    {renderModuleHeader(6, "From Raw Data to Executive Dashboards", "module-6")}
                                                    <i className={`fa-solid fa-chevron-${expandedModules['module-6'] ? 'up' : 'down'}`} style={{ fontSize: '1.2rem', color: 'var(--primary-color)', marginLeft: '1rem' }}></i>
                                                </div>
                                                {expandedModules['module-6'] && (
                                                    <div className="module-content fade-in">
                                                        <div className="module-image-container">
                                                            <img src="/images/modules/mod_6_dark.webp" alt="Executive Dashboards" className="module-image show-dark" width="400" height="250" />
                                                            <img src="/images/modules/mod_6_light.webp" alt="Executive Dashboards" className="module-image show-light" width="400" height="250" />
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
                                                )}
                                            </div>

                                        </div>
                                    </div>
                                )}

                                 {activeTab === 'myschedule' && (
                                    <div className="course-content fade-in">
                                        <h2>My Live Classes</h2>
                                        <p>View your scheduled live sessions below. Click on any time slot to request a session, or click an existing session to join or manage it.</p>
                                        <CalendarView
                                            events={userSessions}
                                            onSelectEvent={(event) => {
                                                setSelectedUserSession(event);
                                            }}
                                            onSelectSlot={(slotInfo) => {
                                                setSelectedSlotInfo(slotInfo);
                                                setIsScheduleModalOpen(true);
                                            }}
                                        />
                                    </div>
                                )}

                                {activeTab === 'mygrades' && user && !isAdmin && (
                                    <div className="course-content fade-in">
                                        <div className="glass-panel" style={{ padding: '2rem', borderRadius: '16px' }}>
                                            <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>
                                                <i className="fa-solid fa-award" style={{ color: 'var(--accent-color)', marginRight: '0.6rem' }}></i>
                                                My Grades &amp; Academic Standing
                                            </h2>
                                            <p style={{ color: 'var(--text-light)', marginBottom: '2rem' }}>
                                                View your official course and module grades, percentage scores, and personalized instructor feedback.
                                            </p>

                                            {userGrades.length === 0 ? (
                                                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-light)' }}>
                                                    <i className="fa-solid fa-graduation-cap" style={{ fontSize: '3rem', opacity: 0.4, marginBottom: '1rem', display: 'block' }}></i>
                                                    <h3 style={{ margin: '0 0 0.5rem 0', color: 'var(--text-main)' }}>No Grades Posted Yet</h3>
                                                    <p style={{ margin: 0 }}>Once your instructor marks your enrolled course or module as completed, your official grade and feedback will appear here.</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {(() => {
                                                        const avgScore = Math.round(
                                                            userGrades.reduce((sum, g) => sum + Number(g.score || 0), 0) / userGrades.length
                                                        );
                                                        const overallLetter = calculateLetterGrade(avgScore);
                                                        return (
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
                                                                <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-alt)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.4rem' }}>Completed Assessments</div>
                                                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary-color)' }}>{userGrades.length}</div>
                                                                </div>
                                                                <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-alt)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.4rem' }}>Average Score</div>
                                                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: '#10b981' }}>{avgScore}%</div>
                                                                </div>
                                                                <div style={{ padding: '1.25rem', borderRadius: '12px', background: 'var(--bg-alt)', border: '1px solid var(--border-color)', textAlign: 'center' }}>
                                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-light)', marginBottom: '0.4rem' }}>Overall Standing</div>
                                                                    <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--accent-color)' }}>{overallLetter}</div>
                                                                </div>
                                                            </div>
                                                        );
                                                    })()}

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                                        {userGrades.map(g => {
                                                            const courseTitle = courses[g.courseId]?.title || (g.courseId === 'powerbi' ? 'Microsoft Power BI' : g.courseId);
                                                            const sectionObj = sections.find(s => s.id === g.sectionId);
                                                            const sectionLabel = g.sectionId === 'all' ? 'Full Course Certification' : (sectionObj?.title || g.sectionId);
                                                            return (
                                                                <div
                                                                    key={g.id}
                                                                    style={{
                                                                        padding: '1.5rem',
                                                                        borderRadius: '12px',
                                                                        background: 'var(--bg-alt)',
                                                                        border: '1px solid var(--border-color)',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        flexWrap: 'wrap',
                                                                        gap: '1.25rem'
                                                                    }}
                                                                >
                                                                    <div style={{ flex: '1 1 280px' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                                                            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{courseTitle}</h3>
                                                                            <span style={{ fontSize: '0.85rem', padding: '0.2rem 0.65rem', borderRadius: '12px', background: 'rgba(var(--primary-rgb), 0.12)', color: 'var(--primary-color)', fontWeight: 600 }}>
                                                                                {sectionLabel}
                                                                            </span>
                                                                            {g.className && (
                                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                                                                                    &bull; Class: {g.className}
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        {g.remarks ? (
                                                                            <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-main)', fontStyle: 'italic', background: 'var(--bg-main)', padding: '0.75rem 1rem', borderRadius: '8px', borderLeft: '3px solid var(--primary-color)' }}>
                                                                                <strong>Instructor Feedback:</strong> &ldquo;{g.remarks}&rdquo;
                                                                            </p>
                                                                        ) : (
                                                                            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-light)' }}>
                                                                                Successfully completed and verified by instructor.
                                                                            </p>
                                                                        )}
                                                                    </div>

                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                                                        <div style={{ textAlign: 'right' }}>
                                                                            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10b981', lineHeight: 1.1 }}>
                                                                                {g.letterGrade} <span style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-main)' }}>({g.score}%)</span>
                                                                            </div>
                                                                            <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '0.25rem' }}>
                                                                                {g.updatedAt?.toDate ? new Date(g.updatedAt.toDate()).toLocaleDateString() : 'Completed'}
                                                                            </div>
                                                                        </div>
                                                                        <button
                                                                            className="btn btn-primary"
                                                                            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                                                                            onClick={() => {
                                                                                setCertificateData({
                                                                                    studentName: user.displayName || user.email,
                                                                                    courseTitle,
                                                                                    sectionLabel,
                                                                                    letterGrade: g.letterGrade,
                                                                                    score: g.score,
                                                                                    className: g.className || null,
                                                                                    date: g.updatedAt?.toDate ? new Date(g.updatedAt.toDate()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                                                                                });
                                                                            }}
                                                                        >
                                                                            <i className="fa-solid fa-certificate" style={{ marginRight: '0.35rem' }}></i>
                                                                            Certificate
                                                                        </button>
                                                                        <button
                                                                            className="btn btn-secondary"
                                                                            style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                                                                            onClick={() => {
                                                                                setActiveTab(g.courseId || 'powerbi');
                                                                                setReviewModalData({
                                                                                    isOpen: true,
                                                                                    sectionId: g.sectionId,
                                                                                    sectionTitle: sectionLabel,
                                                                                    initialRating: getUserReview(g.sectionId)
                                                                                });
                                                                            }}
                                                                        >
                                                                            <i className="fa-solid fa-star" style={{ color: '#f59e0b', marginRight: '0.35rem' }}></i>
                                                                            {getUserReview(g.sectionId) ? 'Update Review' : 'Leave Review'}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {(activeTab === 'sql' || activeTab === 'access' || activeTab === 'excel') && (
                                    <div className="course-content placeholder-content fade-in">
                                        <i className={`fa-solid ${activeTab === 'sql' ? 'fa-database' : activeTab === 'access' ? 'fa-table-list' : 'fa-file-excel'} placeholder-icon`}></i>
                                        <h2>{activeTab === 'sql' ? 'SQL for Data Analysis' : activeTab === 'access' ? 'MS Access Database Development' : 'Advanced Excel for Business Analysis'}</h2>
                                        <p style={{ maxWidth: '520px', margin: '0.75rem auto 1.5rem auto' }}>
                                            Coming Soon! We are finalizing the interactive modules and datasets for this track. Request early access or custom coaching below.
                                        </p>
                                        <button
                                            className="btn btn-primary"
                                            onClick={() => navigate(`/contact?subject=${encodeURIComponent(`Early Access Inquiry: ${activeTab.toUpperCase()} Track`)}`)}
                                        >
                                            <i className="fa-solid fa-bell" style={{ marginRight: '0.5rem' }}></i> Notify Me / Request Early Access
                                        </button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {selectedUserSession && (
                    <div className="payment-modal-overlay" onClick={() => setSelectedUserSession(null)}>
                        <div className="payment-modal-content" style={{ maxWidth: '440px', textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                            <button className="payment-modal-close" onClick={() => setSelectedUserSession(null)}>&times;</button>
                            <h2 style={{ marginBottom: '0.5rem' }}>{selectedUserSession.title}</h2>
                            {selectedUserSession.className && (
                                <p style={{ margin: '0 0 0.5rem 0', color: 'var(--primary-color)', fontWeight: 600, fontSize: '0.9rem' }}>
                                    <i className="fa-solid fa-users" style={{ marginRight: '0.35rem' }}></i>
                                    Class: {selectedUserSession.className}
                                </p>
                            )}
                            <p className="payment-description" style={{ marginBottom: '1.5rem' }}>
                                {selectedUserSession.start?.toLocaleString()} &ndash; {selectedUserSession.end?.toLocaleString()}
                            </p>
                            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                                {selectedUserSession.meetingLink && (
                                    <a
                                        href={selectedUserSession.meetingLink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-primary"
                                        style={{ padding: '0.6rem 1.2rem', textDecoration: 'none' }}
                                    >
                                        <i className="fa-solid fa-video" style={{ marginRight: '0.4rem' }}></i> Join Session
                                    </a>
                                )}
                                <button
                                    className="btn"
                                    style={{ background: '#ef4444', color: 'white', padding: '0.6rem 1.2rem' }}
                                    onClick={async () => {
                                        try {
                                            await deleteSession(selectedUserSession.id);
                                            setUserSessions(prev => prev.filter(s => s.id !== selectedUserSession.id));
                                            setSelectedUserSession(null);
                                        } catch (err) {
                                            console.error(err);
                                            alert("Failed to delete session.");
                                        }
                                    }}
                                >
                                    <i className="fa-solid fa-trash" style={{ marginRight: '0.4rem' }}></i> Cancel Session
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: '0.6rem 1.2rem' }}
                                    onClick={() => setSelectedUserSession(null)}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {certificateData && (
                    <div className="payment-modal-overlay" onClick={() => setCertificateData(null)}>
                        <div
                            className="payment-modal-content"
                            style={{ maxWidth: '720px', padding: '2.5rem', textAlign: 'center', border: '3px double var(--primary-color)' }}
                            onClick={e => e.stopPropagation()}
                        >
                            <button className="payment-modal-close" onClick={() => setCertificateData(null)}>&times;</button>
                            <div id="printable-certificate" style={{ padding: '1.5rem', borderRadius: '12px', background: 'var(--bg-alt)', border: '1px solid var(--border-color)' }}>
                                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                                    <img src="/images/logo.webp" alt="YYZ Data Matrix Inc" style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary-color)', letterSpacing: '0.5px' }}>
                                        YYZ DATA MATRIX INC.
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--text-light)', marginBottom: '0.5rem' }}>
                                    Certificate of Achievement
                                </div>
                                <p style={{ margin: '0.5rem 0', color: 'var(--text-light)', fontSize: '0.95rem' }}>This is to certify that</p>
                                <h2 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: '0.5rem 0 0.75rem 0', fontFamily: 'var(--font-heading)' }}>
                                    {certificateData.studentName}
                                </h2>
                                <p style={{ margin: '0.5rem 0', color: 'var(--text-light)', fontSize: '0.95rem' }}>
                                    has successfully completed the Business Intelligence training requirements for
                                </p>
                                <h3 style={{ fontSize: '1.45rem', color: 'var(--primary-color)', margin: '0.6rem 0 0.3rem 0' }}>
                                    {certificateData.courseTitle} &mdash; {certificateData.sectionLabel}
                                </h3>
                                {certificateData.letterGrade && (
                                    <div style={{ margin: '0.9rem 0' }}>
                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.35rem 1rem', borderRadius: '20px', background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', fontWeight: 700, fontSize: '0.95rem', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                            <i className="fa-solid fa-award"></i> Official Standing: {certificateData.letterGrade} ({certificateData.score}%)
                                        </span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem', textAlign: 'left' }}>
                                    <div>
                                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>Rauf Anwar</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>MBA, CMA, CPA, PMP, PL-300 Certified</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 600 }}>Lead Instructor, YYZ Data Matrix Inc</div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>Date Issued</div>
                                        <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>{certificateData.date}</div>
                                    </div>
                                </div>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1.5rem' }}>
                                <button className="btn btn-primary" onClick={() => window.print()}>
                                    <i className="fa-solid fa-print" style={{ marginRight: '0.4rem' }}></i> Print / Save PDF
                                </button>
                                <button className="btn btn-secondary" onClick={() => setCertificateData(null)}>
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <ScheduleModal
                    isOpen={isScheduleModalOpen}
                    onClose={() => setIsScheduleModalOpen(false)}
                    slotInfo={selectedSlotInfo}
                    onSubmit={handleScheduleSubmit}
                    isAdmin={isAdmin}
                />

                <ReviewModal
                    isOpen={reviewModalData.isOpen}
                    onClose={async (didSubmit) => {
                        setReviewModalData({ isOpen: false, sectionId: null, sectionTitle: '', initialRating: null });
                        if (didSubmit) {
                            const ratings = await getRatingsForCourse(activeTab);
                            setCourseRatings(ratings);
                        }
                    }}
                    courseId={activeTab}
                    sectionId={reviewModalData.sectionId}
                    sectionTitle={reviewModalData.sectionTitle}
                    initialRating={reviewModalData.initialRating}
                />
            </section>
        </>
    );
};

export default Courses;

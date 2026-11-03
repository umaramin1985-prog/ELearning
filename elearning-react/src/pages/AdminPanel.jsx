import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { getCourses, getSections, saveCourse, saveSection, seedInitialCourses } from '../services/courseService';
import { getAllSubscriptions, getAllTransactions, createSubscription, deleteSubscription, updateSubscriptionStatus } from '../services/subscriptionService';
import { getAllSessions, createSession, createClassSession, deleteSession } from '../services/scheduleService';
import { getAllClasses, createClass, updateClass, deleteClass, updateClassCompletionStatus } from '../services/classService';
import { calculateLetterGrade, saveStudentGrade, getAllGrades } from '../services/gradeService';
import CalendarView from '../components/CalendarView';
import { useAuth } from '../contexts/AuthContext';
import './AdminPanel.css';
import { startLiveSession, endAllActiveSessions } from '../services/liveSessionService';
import { getRatingsForCourse } from '../services/ratingService';
import StarRating from '../components/StarRating';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // users, pricing, subscriptions, calendar, messages, live-classes, reviews
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Data states
    const [users, setUsers] = useState([]);
    const [userFilterQuery, setUserFilterQuery] = useState('');
    
    // Pricing states
    const [courses, setCourses] = useState([]);
    const selectedCourse = 'powerbi';
    const [sections, setSections] = useState([]);
    const [courseRates, setCourseRates] = useState({ videoRate: 0, liveRate: 0 });

    // Subscriptions states
    const [subscriptions, setSubscriptions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [subFilterQuery, setSubFilterQuery] = useState('');
    const [subStatusFilter, setSubStatusFilter] = useState('all');
    const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);
    const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [newSubscriptionData, setNewSubscriptionData] = useState({ userId: '', courseId: 'powerbi', sectionId: 'all', type: 'video', amount: 0 });

    // Calendar states
    const [sessions, setSessions] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [newSessionData, setNewSessionData] = useState({ targetType: 'class', classId: '', userId: '', courseId: '', sectionId: '', title: '', startTime: '09:00', endTime: '10:00' });
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);

    // Classes (Cohorts / Batches) states
    const [classesList, setClassesList] = useState([]);
    const [showClassModal, setShowClassModal] = useState(false);
    const [editingClassId, setEditingClassId] = useState(null);
    const [classFormData, setClassFormData] = useState({ name: '', courseId: 'powerbi', sectionId: 'all', studentIds: [] });
    const [studentSearchQuery, setStudentSearchQuery] = useState('');
    const [classToDelete, setClassToDelete] = useState(null);

    // Grading states
    const [gradesMap, setGradesMap] = useState({});
    const [gradingSubModal, setGradingSubModal] = useState({ isOpen: false, sub: null, score: 90, remarks: '' });
    const [gradingClassModal, setGradingClassModal] = useState({ isOpen: false, cls: null, studentGrades: {} });

    // Live Classes
    const [newLiveClassCourseId, setNewLiveClassCourseId] = useState('powerbi');
    const [newLiveClassSectionId, setNewLiveClassSectionId] = useState('all');
    const [newLiveClassSections, setNewLiveClassSections] = useState([]);
    const [newLiveClassTitle, setNewLiveClassTitle] = useState('');
    
    // Direct Live Classes
    const [directLiveClassUserId, setDirectLiveClassUserId] = useState('');
    const [directLiveClassTitle, setDirectLiveClassTitle] = useState('');

    // Class Cohort Live Classes
    const [cohortLiveClassId, setCohortLiveClassId] = useState('');
    const [cohortLiveClassTitle, setCohortLiveClassTitle] = useState('');

    // Reviews
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        const fetchLiveClassSections = async () => {
            if (newLiveClassCourseId) {
                const secs = await getSections(newLiveClassCourseId);
                secs.sort((a, b) => a.id.localeCompare(b.id));
                setNewLiveClassSections(secs);
                setNewLiveClassSectionId('all');
                
                const course = courses.find(c => c.id === newLiveClassCourseId);
                setNewLiveClassTitle(course ? `Live Session: ${course.title}` : 'Live Session: Entire Course');
            }
        };
        fetchLiveClassSections();
    }, [newLiveClassCourseId, courses]);

    const fetchData = async () => {
        setLoading(true);
        setError('');
        try {
            if (activeTab === 'users') {
                await fetchUsers();
            } else if (activeTab === 'classes') {
                await fetchClassesData();
            } else if (activeTab === 'pricing') {
                await fetchPricingData();
            } else if (activeTab === 'subscriptions') {
                await fetchSubscriptionsData();
            } else if (activeTab === 'calendar') {
                await fetchSessionsData();
            } else if (activeTab === 'messages') {
                await fetchMessagesData();
            } else if (activeTab === 'live-classes') {
                if (courses.length === 0) await fetchPricingData();
                if (users.length === 0) await fetchUsers();
                if (classesList.length === 0) await fetchClassesData();
            } else if (activeTab === 'reviews') {
                await fetchReviewsData();
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError('Failed to load data. Are you sure you have permission?');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const fetchUsers = async () => {
        const usersCol = collection(db, 'users');
        const userSnapshot = await getDocs(usersCol);
        const userList = userSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
        const usersWithRoles = userList.map(u => ({
            ...u,
            isAdmin: u.email && adminEmails.includes(u.email.toLowerCase())
        }));

        usersWithRoles.sort((a, b) => {
            if (a.isAdmin && !b.isAdmin) return -1;
            if (!a.isAdmin && b.isAdmin) return 1;
            return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
        });

        setUsers(usersWithRoles);
    };

    const fetchPricingData = async () => {
        await seedInitialCourses();
        const coursesData = await getCourses();
        setCourses(coursesData);
        if (coursesData.length > 0) {
            const course = coursesData.find(c => c.id === selectedCourse);
            if (course) {
                setCourseRates({ videoRate: course.overallVideoRate || 0, liveRate: course.overallLiveRate || 0 });
            }
            const sectionsData = await getSections(selectedCourse);
            sectionsData.sort((a, b) => a.id.localeCompare(b.id));
            setSections(sectionsData);
        }
    };

    const fetchGradesData = async () => {
        const allGrades = await getAllGrades();
        const map = {};
        allGrades.forEach(g => {
            map[`${g.userId}_${g.courseId}_${g.sectionId}`] = g;
        });
        setGradesMap(map);
    };

    const fetchSubscriptionsData = async () => {
        const [subs, trans] = await Promise.all([
            getAllSubscriptions(),
            getAllTransactions(),
            fetchGradesData()
        ]);
        setSubscriptions(subs);
        setTransactions(trans);
        
        // Ensure users are loaded so we can map User ID to Name
        if (users.length === 0) {
            await fetchUsers();
        }
    };

    const fetchMessagesData = async () => {
        const msgsCol = collection(db, 'messages');
        const snap = await getDocs(msgsCol);
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        list.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
        setMessages(list);
    };

    const fetchReviewsData = async () => {
        try {
            let currentCourses = courses;
            if (currentCourses.length === 0) {
                currentCourses = await getCourses();
            }
            
            let allReviews = [];
            for (const course of currentCourses) {
                const courseRatings = await getRatingsForCourse(course.id);
                allReviews = [...allReviews, ...courseRatings];
            }
            
            allReviews.sort((a, b) => {
                const timeA = a.updatedAt && typeof a.updatedAt.toMillis === 'function' ? a.updatedAt.toMillis() : 0;
                const timeB = b.updatedAt && typeof b.updatedAt.toMillis === 'function' ? b.updatedAt.toMillis() : 0;
                return timeB - timeA;
            });
            
            setReviews(allReviews);
        } catch (error) {
            console.error("Error fetching reviews:", error);
            throw error;
        }
    };

    const getUserDisplayName = (userId) => {
        const user = users.find(u => u.id === userId);
        if (!user) return userId;
        return user.displayName || user.email || userId;
    };

    const fetchSessionsData = async () => {
        const sess = await getAllSessions();
        const formattedSessions = sess.map(s => ({
            ...s,
            start: s.startTime?.toDate ? s.startTime.toDate() : new Date(s.startTime),
            end: s.endTime?.toDate ? s.endTime.toDate() : new Date(s.endTime),
        }));
        setSessions(formattedSessions);
        
        // Also ensure we have users and classes for the dropdown
        if (users.length === 0) await fetchUsers();
        if (classesList.length === 0) {
            const cls = await getAllClasses();
            setClassesList(cls);
        }
    };

    const fetchClassesData = async () => {
        const [cls] = await Promise.all([
            getAllClasses(),
            fetchGradesData()
        ]);
        setClassesList(cls);
        if (users.length === 0) await fetchUsers();
        if (subscriptions.length === 0) {
            const subs = await getAllSubscriptions();
            setSubscriptions(subs);
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            await deleteDoc(doc(db, 'users', userToDelete.id));
            setUsers(users.filter(u => u.id !== userToDelete.id));
            setUserToDelete(null);
            alert('User deleted successfully.');
        } catch (err) {
            console.error(err);
            alert('Failed to delete user: ' + err.message);
        }
    };

    const handleSaveCourseRates = async () => {
        try {
            await saveCourse(selectedCourse, {
                overallVideoRate: parseFloat(courseRates.videoRate),
                overallLiveRate: parseFloat(courseRates.liveRate)
            });
            alert("Course rates updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to update course rates.");
        }
    };

    const handleSectionRateChange = (index, field, value) => {
        const newSections = [...sections];
        newSections[index][field] = value;
        setSections(newSections);
    };

    const handleSaveSection = async (section) => {
        try {
            await saveSection(selectedCourse, section.id, {
                videoRate: parseFloat(section.videoRate),
                liveRate: parseFloat(section.liveRate)
            });
            alert(`${section.title} rates updated successfully!`);
        } catch (error) {
            console.error(error);
            alert(`Failed to update ${section.title} rates.`);
        }
    };

    const handleDeleteSubscription = async () => {
        if (!subscriptionToDelete) return;
        try {
            await deleteSubscription(subscriptionToDelete);
            setSubscriptions(subscriptions.filter(s => s.id !== subscriptionToDelete));
            setSubscriptionToDelete(null);
            alert('Subscription deleted successfully.');
        } catch (error) {
            console.error(error);
            alert('Failed to delete subscription: ' + error.message);
        }
    };

    const handleToggleSubscriptionStatus = async (sub) => {
        if (sub.status === 'completed') {
            try {
                await updateSubscriptionStatus(sub.id, 'active', {
                    userId: sub.userId,
                    courseId: sub.courseId,
                    sectionId: sub.sectionId
                });
                setSubscriptions(subscriptions.map(s =>
                    s.id === sub.id ? { ...s, status: 'active' } : s
                ));
            } catch (error) {
                console.error(error);
                alert('Failed to update course status: ' + error.message);
            }
        } else {
            handleOpenGradeSubModal(sub);
        }
    };

    const handleOpenGradeSubModal = (sub) => {
        const existingGrade = gradesMap[`${sub.userId}_${sub.courseId}_${sub.sectionId}`];
        setGradingSubModal({
            isOpen: true,
            sub,
            score: existingGrade?.score ?? sub.score ?? 90,
            remarks: existingGrade?.remarks ?? sub.remarks ?? ''
        });
    };

    const handleSaveSubGrade = async () => {
        const { sub, score, remarks } = gradingSubModal;
        if (!sub) return;
        const numScore = Number(score);
        if (isNaN(numScore) || numScore < 0 || numScore > 100) {
            alert('Please enter a valid percentage score between 0 and 100.');
            return;
        }
        try {
            await saveStudentGrade({
                userId: sub.userId,
                courseId: sub.courseId,
                sectionId: sub.sectionId,
                score: numScore,
                remarks,
                gradedBy: currentUser?.uid || null,
                subscriptionId: sub.id,
                sendNotification: true
            });
            setGradingSubModal({ isOpen: false, sub: null, score: 90, remarks: '' });
            await fetchSubscriptionsData();
        } catch (error) {
            console.error(error);
            alert('Failed to save grade: ' + error.message);
        }
    };

    const handleAddSubscription = async () => {
        if (!newSubscriptionData.userId) {
            alert('Please select a user.');
            return;
        }
        try {
            await createSubscription(
                newSubscriptionData.userId,
                newSubscriptionData.courseId,
                newSubscriptionData.sectionId,
                newSubscriptionData.type,
                parseFloat(newSubscriptionData.amount),
                'admin_grant'
            );
            setShowAddSubscriptionModal(false);
            await fetchSubscriptionsData();
            alert('Subscription added successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to add subscription: ' + error.message);
        }
    };

    const handleSelectSlot = (slotInfo) => {
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        if (slotInfo.start < now) {
            return;
        }
        setSelectedSlot(slotInfo);
        setShowScheduleModal(true);
    };

    const handleScheduleSession = async () => {
        if (!newSessionData.title) {
            alert('Please enter a session title.');
            return;
        }
        if (newSessionData.targetType === 'class' && !newSessionData.classId) {
            alert('Please select a class.');
            return;
        }
        if (newSessionData.targetType === 'user' && !newSessionData.userId) {
            alert('Please select a user.');
            return;
        }

        const sessionStartDate = new Date(selectedSlot.start);
        const [startH, startM] = newSessionData.startTime.split(':');
        sessionStartDate.setHours(parseInt(startH, 10), parseInt(startM, 10), 0, 0);

        const sessionEndDate = new Date(selectedSlot.start);
        const [endH, endM] = newSessionData.endTime.split(':');
        sessionEndDate.setHours(parseInt(endH, 10), parseInt(endM, 10), 0, 0);

        if (sessionEndDate <= sessionStartDate) {
            alert('End time must be after start time.');
            return;
        }

        try {
            if (newSessionData.targetType === 'class') {
                const targetClass = classesList.find(c => c.id === newSessionData.classId);
                if (!targetClass) {
                    alert('Selected class not found.');
                    return;
                }
                await createClassSession(
                    targetClass,
                    newSessionData.title,
                    sessionStartDate,
                    sessionEndDate,
                    'mock_zoom_link'
                );
            } else {
                await createSession(
                    newSessionData.userId,
                    newSessionData.courseId || selectedCourse,
                    newSessionData.sectionId || 'all',
                    newSessionData.title,
                    sessionStartDate,
                    sessionEndDate,
                    'mock_zoom_link'
                );
            }
            setShowScheduleModal(false);
            setNewSessionData({ targetType: 'class', classId: '', userId: '', courseId: '', sectionId: '', title: '', startTime: '09:00', endTime: '10:00' });
            await fetchSessionsData();
            alert('Session scheduled successfully!');
        } catch (error) {
            console.error(error);
            alert('Failed to schedule session.');
        }
    };

    const handleOpenCreateClassModal = () => {
        setEditingClassId(null);
        setClassFormData({ name: '', courseId: 'powerbi', sectionId: 'all', studentIds: [] });
        setStudentSearchQuery('');
        setShowClassModal(true);
    };

    const handleOpenEditClassModal = (cls) => {
        setEditingClassId(cls.id);
        setClassFormData({
            name: cls.name || '',
            courseId: cls.courseId || 'powerbi',
            sectionId: cls.sectionId || 'all',
            studentIds: Array.isArray(cls.studentIds) ? [...cls.studentIds] : []
        });
        setStudentSearchQuery('');
        setShowClassModal(true);
    };

    const handleToggleStudentInClass = (studentId) => {
        setClassFormData(prev => {
            const exists = prev.studentIds.includes(studentId);
            return {
                ...prev,
                studentIds: exists
                    ? prev.studentIds.filter(id => id !== studentId)
                    : [...prev.studentIds, studentId]
            };
        });
    };

    const handleSaveClass = async () => {
        if (!classFormData.name.trim()) {
            alert('Please enter a class name.');
            return;
        }
        if (classFormData.studentIds.length === 0) {
            alert('Please select at least one student for the class.');
            return;
        }
        try {
            if (editingClassId) {
                await updateClass(editingClassId, {
                    name: classFormData.name.trim(),
                    courseId: classFormData.courseId,
                    sectionId: classFormData.sectionId,
                    studentIds: classFormData.studentIds
                });
            } else {
                await createClass(
                    classFormData.name,
                    classFormData.courseId,
                    classFormData.sectionId,
                    classFormData.studentIds
                );
            }
            setShowClassModal(false);
            await fetchClassesData();
        } catch (error) {
            console.error(error);
            alert('Failed to save class: ' + error.message);
        }
    };

    const handleDeleteClassConfirm = async () => {
        if (!classToDelete) return;
        try {
            await deleteClass(classToDelete.id, classToDelete.courseId);
            setClassesList(classesList.filter(c => c.id !== classToDelete.id));
            setClassToDelete(null);
        } catch (error) {
            console.error(error);
            alert('Failed to delete class: ' + error.message);
        }
    };

    const handleToggleClassStatus = async (cls) => {
        if (cls.status === 'completed') {
            try {
                await updateClassCompletionStatus(cls, 'active', subscriptions);
                await fetchClassesData();
            } catch (error) {
                console.error(error);
                alert('Failed to update class status: ' + error.message);
            }
        } else {
            handleOpenGradeClassModal(cls);
        }
    };

    const handleOpenGradeClassModal = (cls) => {
        const studentIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];
        const initialGrades = {};
        studentIds.forEach(sid => {
            const existing = gradesMap[`${sid}_${cls.courseId}_${cls.sectionId}`];
            initialGrades[sid] = {
                score: existing?.score ?? 90,
                remarks: existing?.remarks ?? ''
            };
        });
        setGradingClassModal({
            isOpen: true,
            cls,
            studentGrades: initialGrades
        });
    };

    const handleSaveClassGrades = async () => {
        const { cls, studentGrades } = gradingClassModal;
        if (!cls) return;
        const studentIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];

        for (const sid of studentIds) {
            const g = studentGrades[sid] || { score: 90, remarks: '' };
            const num = Number(g.score);
            if (isNaN(num) || num < 0 || num > 100) {
                alert(`Please enter a valid score (0-100) for ${getUserDisplayName(sid)}.`);
                return;
            }
        }

        try {
            await Promise.all(
                studentIds.map(sid => {
                    const g = studentGrades[sid] || { score: 90, remarks: '' };
                    return saveStudentGrade({
                        userId: sid,
                        courseId: cls.courseId,
                        sectionId: cls.sectionId,
                        score: Number(g.score),
                        remarks: g.remarks || '',
                        classId: cls.id,
                        className: cls.name,
                        gradedBy: currentUser?.uid || null,
                        sendNotification: true
                    });
                })
            );
            await updateClass(cls.id, { courseId: cls.courseId, status: 'completed' });
            setGradingClassModal({ isOpen: false, cls: null, studentGrades: {} });
            await fetchClassesData();
        } catch (error) {
            console.error(error);
            alert('Failed to save class grades: ' + error.message);
        }
    };

    const handleStartClassLiveSession = async (cls, customTitle = '') => {
        const title = customTitle.trim() || `Live Class: ${cls.name}`;
        try {
            const session = await startLiveSession('class', cls.id, title, currentUser.uid, {
                classId: cls.id,
                className: cls.name,
                studentIds: Array.isArray(cls.studentIds) ? cls.studentIds : []
            });
            navigate(`/live-class/${session.roomId}`);
        } catch (err) {
            console.error(err);
            alert('Failed to start class live session.');
        }
    };

    const handleStartCohortLiveClassForm = async (e) => {
        e.preventDefault();
        const targetClass = classesList.find(c => c.id === cohortLiveClassId);
        if (!targetClass) {
            alert('Please select a class.');
            return;
        }
        await handleStartClassLiveSession(targetClass, cohortLiveClassTitle);
    };

    const handleDeleteSession = async () => {
        if (!selectedSession) return;
        try {
            await deleteSession(selectedSession.id, selectedSession.relatedSessionIds);
            setSessions(sessions.filter(s => s.id !== selectedSession.id));
            setSelectedSession(null);
            alert('Session deleted successfully.');
        } catch (error) {
            console.error(error);
            alert('Failed to delete session: ' + error.message);
        }
    };

    const handleStartLiveClass = async (e) => {
        e.preventDefault();
        if (!newLiveClassCourseId || !newLiveClassSectionId || !newLiveClassTitle) {
            alert("Please provide a course, section, and title.");
            return;
        }
        try {
            const session = await startLiveSession(newLiveClassCourseId, newLiveClassSectionId, newLiveClassTitle, currentUser.uid);
            navigate(`/live-class/${session.roomId}`);
        } catch (err) {
            console.error(err);
            alert("Failed to start live class.");
        }
    };

    const handleStartDirectLiveClass = async (e) => {
        e.preventDefault();
        if (!directLiveClassUserId || !directLiveClassTitle) {
            alert("Please provide a user and title.");
            return;
        }
        try {
            const session = await startLiveSession('direct', directLiveClassUserId, directLiveClassTitle, currentUser.uid);
            navigate(`/live-class/${session.roomId}`);
        } catch (err) {
            console.error(err);
            alert("Failed to start direct live class.");
        }
    };

    const handleDeleteMessage = async (id) => {
        if (!window.confirm("Are you sure you want to delete this message?")) return;
        try {
            await deleteDoc(doc(db, 'messages', id));
            setMessages(messages.filter(m => m.id !== id));
        } catch (error) {
            console.error(error);
            alert('Failed to delete message.');
        }
    };

    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    return (
        <section className="admin-section">
            <div className="container admin-container">
                <div className="admin-header">
                    <h1>Admin Control Panel</h1>
                    <p>Manage users, pricing, and subscriptions.</p>
                </div>

                <div className="admin-tabs-grouped">
                    <div className={`admin-tab-group ${['users', 'classes', 'subscriptions'].includes(activeTab) ? 'has-active' : ''}`}>
                        <span className="admin-tab-group-label">
                            <i className="fas fa-user-graduate"></i> Students & Cohorts
                        </span>
                        <div className="admin-tab-group-items">
                            <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
                            <button className={`admin-tab-btn ${activeTab === 'classes' ? 'active' : ''}`} onClick={() => setActiveTab('classes')}>Classes</button>
                            <button className={`admin-tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`} onClick={() => setActiveTab('subscriptions')}>Subscriptions</button>
                        </div>
                    </div>

                    <div className={`admin-tab-group ${['calendar', 'live-classes'].includes(activeTab) ? 'has-active' : ''}`}>
                        <span className="admin-tab-group-label">
                            <i className="fas fa-chalkboard-teacher"></i> Teaching & Schedule
                        </span>
                        <div className="admin-tab-group-items">
                            <button className={`admin-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar</button>
                            <button className={`admin-tab-btn ${activeTab === 'live-classes' ? 'active' : ''}`} onClick={() => setActiveTab('live-classes')}>Live Classes</button>
                        </div>
                    </div>

                    <div className={`admin-tab-group ${['pricing', 'reviews', 'messages'].includes(activeTab) ? 'has-active' : ''}`}>
                        <span className="admin-tab-group-label">
                            <i className="fas fa-sliders-h"></i> Catalog & Feedback
                        </span>
                        <div className="admin-tab-group-items">
                            <button className={`admin-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}>Course Pricing</button>
                            <button className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Course Reviews</button>
                            <button className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>Form Submissions</button>
                        </div>
                    </div>
                </div>

                {error && <div className="admin-error">{error}</div>}

                {loading ? (
                    <div className="admin-loading">Loading...</div>
                ) : (
                    <div className="admin-content fade-in">
                        {activeTab === 'users' && (
                            <div className="admin-table-container">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                    <div>
                                        <h2 style={{ margin: 0 }}>Registered Users ({users.length})</h2>
                                        <p style={{ margin: '0.25rem 0 0 0', color: 'var(--text-color-light)', fontSize: '0.9rem' }}>
                                            View student contact details, professional background, and account status.
                                        </p>
                                    </div>
                                    <div style={{ minWidth: '260px', flex: '0 1 320px' }}>
                                        <input
                                            type="text"
                                            placeholder="Search by name, email, phone, or company..."
                                            value={userFilterQuery}
                                            onChange={e => setUserFilterQuery(e.target.value)}
                                            style={{ width: '100%', padding: '0.6rem 0.9rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                                        />
                                    </div>
                                </div>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Profile</th>
                                            <th>Name</th>
                                            <th>Email &amp; Phone</th>
                                            <th>Background</th>
                                            <th>Role</th>
                                            <th>Joined At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(() => {
                                            const filteredUsers = users.filter(u => {
                                                if (!userFilterQuery.trim()) return true;
                                                const q = userFilterQuery.toLowerCase();
                                                return (
                                                    (u.displayName && u.displayName.toLowerCase().includes(q)) ||
                                                    (u.email && u.email.toLowerCase().includes(q)) ||
                                                    (u.phone && u.phone.toLowerCase().includes(q)) ||
                                                    (u.company && u.company.toLowerCase().includes(q)) ||
                                                    (u.position && u.position.toLowerCase().includes(q))
                                                );
                                            });
                                            if (filteredUsers.length === 0) {
                                                return <tr><td colSpan="7" className="admin-no-data">No matching users found.</td></tr>;
                                            }
                                            return filteredUsers.map((u) => (
                                                <tr key={u.id}>
                                                    <td>
                                                        {u.photoURL ? (
                                                            <img src={u.photoURL} alt="Avatar" className="admin-avatar" />
                                                        ) : (
                                                            <div className="admin-avatar-initial">{(u.displayName || u.email || '?').charAt(0).toUpperCase()}</div>
                                                        )}
                                                    </td>
                                                    <td><strong>{u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'N/A'}</strong></td>
                                                    <td>
                                                        <div>{u.email}</div>
                                                        {u.phone && (
                                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-color-light)', marginTop: '0.2rem' }}>
                                                                <i className="fa-solid fa-phone" style={{ fontSize: '0.72rem', marginRight: '0.3rem' }}></i>
                                                                {u.phone}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {u.category ? (
                                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.15rem' }}>
                                                                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                                                                    {u.category}
                                                                </span>
                                                                {(u.position || u.company) && (
                                                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-color-light)' }}>
                                                                        {[u.position, u.company].filter(Boolean).join(' @ ')}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.82rem', color: 'var(--text-color-light)' }}>Not completed</span>
                                                        )}
                                                    </td>
                                                    <td>
                                                        <span className={`badge ${u.isAdmin ? 'live' : 'video'}`}>
                                                            {u.isAdmin ? 'Admin' : 'User'}
                                                        </span>
                                                    </td>
                                                    <td>{u.createdAt?.toDate ? new Date(u.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                                                    <td>
                                                        {!u.isAdmin && (
                                                            <button className="admin-delete-btn" onClick={() => setUserToDelete(u)} title="Delete User">
                                                                <i className="fa-solid fa-trash"></i> Delete
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ));
                                        })()}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {userToDelete && (
                            <div className="payment-modal-overlay">
                                <div className="payment-modal-content" style={{textAlign: 'center'}}>
                                    <h2>Confirm Deletion</h2>
                                    <p className="payment-description">Are you sure you want to permanently delete the user <strong>{userToDelete.email}</strong>?</p>
                                    <div className="form-row mt-2" style={{gap: '1rem', display: 'flex', justifyContent: 'center'}}>
                                        <button className="admin-action-btn" onClick={handleDeleteUser} style={{background: '#ef4444'}}>Yes, Delete</button>
                                        <button className="admin-action-btn" onClick={() => setUserToDelete(null)} style={{background: 'gray'}}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'classes' && (
                            <div className="admin-classes-container">
                                <div className="admin-table-container">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <div>
                                            <h2 style={{ margin: 0 }}>Classes & Student Cohorts</h2>
                                            <p style={{ margin: '0.3rem 0 0 0', color: 'var(--text-color-light)', fontSize: '0.9rem' }}>
                                                Create multi-student classes to schedule group coaching sessions, launch live video rooms, or mark cohorts complete.
                                            </p>
                                        </div>
                                        <button className="admin-action-btn" onClick={handleOpenCreateClassModal}>
                                            <i className="fa-solid fa-plus" style={{ marginRight: '0.5rem' }}></i> Create Class
                                        </button>
                                    </div>

                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Class Name</th>
                                                <th>Course & Section</th>
                                                <th>Students</th>
                                                <th>Status</th>
                                                <th>Created</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {classesList.length === 0 ? (
                                                <tr><td colSpan="6" className="admin-no-data">No classes created yet. Click &quot;Create Class&quot; to group students together.</td></tr>
                                            ) : (
                                                classesList.map(cls => {
                                                    const studentIds = Array.isArray(cls.studentIds) ? cls.studentIds : [];
                                                    return (
                                                        <tr key={cls.id}>
                                                            <td><strong>{cls.name}</strong></td>
                                                            <td>
                                                                <div>{cls.courseId === 'powerbi' ? 'Power BI' : cls.courseId}</div>
                                                                <span style={{ fontSize: '0.8rem', color: 'var(--text-color-light)' }}>
                                                                    {cls.sectionId === 'all' ? 'Full Course' : cls.sectionId}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                                                                    <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--primary-color)' }}>
                                                                        {studentIds.length} {studentIds.length === 1 ? 'Student' : 'Students'}
                                                                    </span>
                                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', maxWidth: '320px' }}>
                                                                        {studentIds.map(sid => (
                                                                            <span key={sid} style={{ fontSize: '0.75rem', padding: '0.15rem 0.5rem', borderRadius: '12px', background: 'var(--bg-alt)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}>
                                                                                {getUserDisplayName(sid)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td>
                                                                <span className={`badge ${cls.status === 'completed' ? 'completed' : 'active-status'}`}>
                                                                    {cls.status === 'completed' ? 'Completed' : 'Active'}
                                                                </span>
                                                            </td>
                                                            <td>{cls.createdAt?.toDate ? new Date(cls.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                                                    <button
                                                                        className="admin-action-btn-small"
                                                                        onClick={() => handleStartClassLiveSession(cls)}
                                                                        title="Start Live Video Session for this Class"
                                                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                                                                    >
                                                                        <i className="fa-solid fa-video"></i> Live
                                                                    </button>
                                                                    <button
                                                                        className="admin-action-btn-small"
                                                                        onClick={() => handleOpenEditClassModal(cls)}
                                                                        title="Edit Class / Manage Students"
                                                                        style={{ background: 'var(--bg-alt)', color: 'var(--text-main)', border: '1px solid var(--border-color)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                                                                    >
                                                                        <i className="fa-solid fa-pen-to-square"></i> Edit
                                                                    </button>
                                                                    {cls.status === 'completed' && (
                                                                        <button
                                                                            className="admin-action-btn-small"
                                                                            onClick={() => handleOpenGradeClassModal(cls)}
                                                                            title="Edit Student Grades for this Class"
                                                                            style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                                                                        >
                                                                            <i className="fa-solid fa-award"></i> Grades
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        className={`admin-status-btn ${cls.status === 'completed' ? 'reopen' : 'complete'}`}
                                                                        onClick={() => handleToggleClassStatus(cls)}
                                                                        title={cls.status === 'completed' ? 'Mark Class as Active' : 'Grade & Mark Class as Completed'}
                                                                    >
                                                                        <i className={`fa-solid ${cls.status === 'completed' ? 'fa-rotate-left' : 'fa-check'}`}></i>
                                                                        {cls.status === 'completed' ? 'Mark Active' : 'Grade & Complete'}
                                                                    </button>
                                                                    <button
                                                                        className="admin-delete-btn"
                                                                        onClick={() => setClassToDelete(cls)}
                                                                        style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }}
                                                                        title="Delete Class"
                                                                    >
                                                                        <i className="fa-solid fa-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {gradingClassModal.isOpen && gradingClassModal.cls && (
                                    <div className="payment-modal-overlay">
                                        <div className="payment-modal-content" style={{ maxWidth: '620px' }}>
                                            <button className="payment-modal-close" onClick={() => setGradingClassModal({ isOpen: false, cls: null, studentGrades: {} })}>&times;</button>
                                            <h2>Grade Class: {gradingClassModal.cls.name}</h2>
                                            <p className="payment-description">
                                                Assign percentage scores (0–100%) and optional feedback for each student in <strong>{gradingClassModal.cls.name}</strong> ({gradingClassModal.cls.sectionId === 'all' ? 'Full Course' : gradingClassModal.cls.sectionId}).
                                            </p>

                                            <div style={{ maxHeight: '360px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem', paddingRight: '0.25rem' }}>
                                                {(Array.isArray(gradingClassModal.cls.studentIds) ? gradingClassModal.cls.studentIds : []).map(sid => {
                                                    const g = gradingClassModal.studentGrades[sid] || { score: 90, remarks: '' };
                                                    const letter = calculateLetterGrade(g.score);
                                                    return (
                                                        <div key={sid} style={{ padding: '0.9rem', borderRadius: '8px', background: 'var(--bg-alt)', border: '1px solid var(--border-color)' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                                <strong>{getUserDisplayName(sid)}</strong>
                                                                <span className="badge completed" style={{ fontSize: '0.85rem' }}>
                                                                    Grade: {letter} ({g.score}%)
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                                                <div className="form-group" style={{ flex: '0 0 120px', marginBottom: 0 }}>
                                                                    <label style={{ fontSize: '0.78rem' }}>Score (%)</label>
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        value={g.score}
                                                                        onChange={e => setGradingClassModal(prev => ({
                                                                            ...prev,
                                                                            studentGrades: {
                                                                                ...prev.studentGrades,
                                                                                [sid]: { ...g, score: e.target.value }
                                                                            }
                                                                        }))}
                                                                    />
                                                                </div>
                                                                <div className="form-group" style={{ flex: 1, minWidth: '180px', marginBottom: 0 }}>
                                                                    <label style={{ fontSize: '0.78rem' }}>Instructor Remarks (Optional)</label>
                                                                    <input
                                                                        type="text"
                                                                        placeholder="e.g. Great dashboard design & DAX!"
                                                                        value={g.remarks}
                                                                        onChange={e => setGradingClassModal(prev => ({
                                                                            ...prev,
                                                                            studentGrades: {
                                                                                ...prev.studentGrades,
                                                                                [sid]: { ...g, remarks: e.target.value }
                                                                            }
                                                                        }))}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            <button className="admin-action-btn" onClick={handleSaveClassGrades} style={{ width: '100%' }}>
                                                <i className="fa-solid fa-award" style={{ marginRight: '0.5rem' }}></i>
                                                Save Grades & Mark Class Complete
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {showClassModal && (
                                    <div className="payment-modal-overlay">
                                        <div className="payment-modal-content" style={{ maxWidth: '540px' }}>
                                            <button className="payment-modal-close" onClick={() => setShowClassModal(false)}>&times;</button>
                                            <h2>{editingClassId ? 'Edit Class' : 'Create New Class'}</h2>

                                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                <label>Class / Cohort Name</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Power BI Evening Cohort - Nov 2026"
                                                    value={classFormData.name}
                                                    onChange={e => setClassFormData({ ...classFormData, name: e.target.value })}
                                                />
                                            </div>

                                            <div className="form-row" style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Course</label>
                                                    <select
                                                        className="rate-input"
                                                        style={{ maxWidth: '100%' }}
                                                        value={classFormData.courseId}
                                                        onChange={e => setClassFormData({ ...classFormData, courseId: e.target.value })}
                                                    >
                                                        <option value="powerbi">Power BI</option>
                                                    </select>
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Section / Module</label>
                                                    <select
                                                        className="rate-input"
                                                        style={{ maxWidth: '100%' }}
                                                        value={classFormData.sectionId}
                                                        onChange={e => setClassFormData({ ...classFormData, sectionId: e.target.value })}
                                                    >
                                                        <option value="all">Full Course</option>
                                                        <option value="module-1">Module 1</option>
                                                        <option value="module-2">Module 2</option>
                                                        <option value="module-3">Module 3</option>
                                                        <option value="module-4">Module 4</option>
                                                        <option value="module-5">Module 5</option>
                                                        <option value="module-6">Module 6</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                                    <label style={{ margin: 0 }}>
                                                        Assign Students ({classFormData.studentIds.length} selected)
                                                    </label>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            type="button"
                                                            onClick={() => setClassFormData(prev => ({ ...prev, studentIds: users.filter(u => !u.isAdmin).map(u => u.id) }))}
                                                            style={{ background: 'none', border: 'none', color: 'var(--primary-color)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600 }}
                                                        >
                                                            Select All
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setClassFormData(prev => ({ ...prev, studentIds: [] }))}
                                                            style={{ background: 'none', border: 'none', color: 'var(--text-color-light)', cursor: 'pointer', fontSize: '0.8rem' }}
                                                        >
                                                            Clear
                                                        </button>
                                                    </div>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="Search students by name or email..."
                                                    value={studentSearchQuery}
                                                    onChange={e => setStudentSearchQuery(e.target.value)}
                                                    style={{ marginBottom: '0.6rem' }}
                                                />
                                                <div style={{ maxHeight: '220px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '0.5rem', background: 'var(--bg-main)' }}>
                                                    {users
                                                        .filter(u => !u.isAdmin)
                                                        .filter(u => {
                                                            if (!studentSearchQuery.trim()) return true;
                                                            const q = studentSearchQuery.toLowerCase();
                                                            return (
                                                                (u.displayName && u.displayName.toLowerCase().includes(q)) ||
                                                                (u.email && u.email.toLowerCase().includes(q))
                                                            );
                                                        })
                                                        .map(u => {
                                                            const checked = classFormData.studentIds.includes(u.id);
                                                            return (
                                                                <label
                                                                    key={u.id}
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: '0.75rem',
                                                                        padding: '0.5rem 0.6rem',
                                                                        borderRadius: '6px',
                                                                        cursor: 'pointer',
                                                                        marginBottom: '0.2rem',
                                                                        background: checked ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent',
                                                                        color: 'var(--text-main)'
                                                                    }}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={checked}
                                                                        onChange={() => handleToggleStudentInClass(u.id)}
                                                                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                                                                    />
                                                                    <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                                                                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{u.displayName || 'Unnamed Student'}</span>
                                                                        <span style={{ fontSize: '0.78rem', color: 'var(--text-color-light)' }}>{u.email}</span>
                                                                    </div>
                                                                </label>
                                                            );
                                                        })}
                                                    {users.filter(u => !u.isAdmin).length === 0 && (
                                                        <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-color-light)', fontSize: '0.85rem' }}>
                                                            No non-admin students registered yet.
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <button className="admin-action-btn mt-2" onClick={handleSaveClass} style={{ width: '100%' }}>
                                                {editingClassId ? 'Save Changes' : 'Create Class'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {classToDelete && (
                                    <div className="payment-modal-overlay">
                                        <div className="payment-modal-content" style={{ textAlign: 'center' }}>
                                            <h2>Delete Class</h2>
                                            <p className="payment-description">
                                                Are you sure you want to delete the class <strong>{classToDelete.name}</strong>?
                                            </p>
                                            <div className="form-row mt-2" style={{ gap: '1rem', display: 'flex', justifyContent: 'center' }}>
                                                <button className="admin-action-btn" onClick={handleDeleteClassConfirm} style={{ background: '#ef4444' }}>Yes, Delete</button>
                                                <button className="admin-action-btn" onClick={() => setClassToDelete(null)} style={{ background: 'gray' }}>Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'pricing' && (
                            <div className="admin-pricing-container">
                                <h2>Course & Module Pricing ({selectedCourse})</h2>
                                
                                <div className="pricing-card overall-pricing">
                                    <h3>Overall Course Rates</h3>
                                    <div className="pricing-inputs">
                                        <div className="form-group">
                                            <label>Full Course Video Rate ($)</label>
                                            <input type="number" value={courseRates.videoRate} onChange={(e) => setCourseRates({...courseRates, videoRate: e.target.value})} />
                                        </div>
                                        <div className="form-group">
                                            <label>Full Course Live Rate ($)</label>
                                            <input type="number" value={courseRates.liveRate} onChange={(e) => setCourseRates({...courseRates, liveRate: e.target.value})} />
                                        </div>
                                        <button className="admin-action-btn" onClick={handleSaveCourseRates}>Save Overall Rates</button>
                                    </div>
                                </div>

                                <div className="admin-table-container mt-2">
                                    <h3>Section Rates</h3>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Module</th>
                                                <th>Video Rate ($)</th>
                                                <th>Live Online Rate ($)</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sections.map((section, index) => (
                                                <tr key={section.id}>
                                                    <td>{section.title}</td>
                                                    <td>
                                                        <input 
                                                            type="number" 
                                                            value={section.videoRate || 0} 
                                                            onChange={(e) => handleSectionRateChange(index, 'videoRate', e.target.value)}
                                                            className="rate-input"
                                                        />
                                                    </td>
                                                    <td>
                                                        <input 
                                                            type="number" 
                                                            value={section.liveRate || 0} 
                                                            onChange={(e) => handleSectionRateChange(index, 'liveRate', e.target.value)}
                                                            className="rate-input"
                                                        />
                                                    </td>
                                                    <td>
                                                        <button className="admin-action-btn-small" onClick={() => handleSaveSection(section)}>Save</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'subscriptions' && (
                            <div className="admin-subscriptions-container">
                                <div className="revenue-stats">
                                    <div className="stat-card">
                                        <h3>Total Revenue</h3>
                                        <p className="stat-value">${totalRevenue.toFixed(2)}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Total Subscriptions</h3>
                                        <p className="stat-value">{subscriptions.length}</p>
                                    </div>
                                    <div className="stat-card">
                                        <h3>Completed Enrollments</h3>
                                        <p className="stat-value" style={{ color: '#10b981' }}>
                                            {subscriptions.filter(s => s.status === 'completed').length}
                                        </p>
                                    </div>
                                </div>

                                <div className="admin-table-container mt-2">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                                        <h2 style={{ margin: 0 }}>All Subscriptions</h2>
                                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                                            <input
                                                type="text"
                                                placeholder="Search student or course..."
                                                value={subFilterQuery}
                                                onChange={e => setSubFilterQuery(e.target.value)}
                                                style={{ minWidth: '220px', padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                                            />
                                            <select
                                                value={subStatusFilter}
                                                onChange={e => setSubStatusFilter(e.target.value)}
                                                style={{ padding: '0.55rem 0.85rem', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)' }}
                                            >
                                                <option value="all">All Statuses</option>
                                                <option value="active">Active Only</option>
                                                <option value="completed">Completed Only</option>
                                            </select>
                                            <button className="admin-action-btn" onClick={() => setShowAddSubscriptionModal(true)}>
                                                <i className="fa-solid fa-plus" style={{ marginRight: '0.5rem' }}></i> Add Subscription
                                            </button>
                                        </div>
                                    </div>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Course</th>
                                                <th>Section</th>
                                                <th>Type</th>
                                                <th>Amount ($)</th>
                                                <th>Status</th>
                                                <th>Grade</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {(() => {
                                                const filteredSubs = subscriptions.filter(sub => {
                                                    const isComp = sub.status === 'completed';
                                                    if (subStatusFilter === 'completed' && !isComp) return false;
                                                    if (subStatusFilter === 'active' && isComp) return false;
                                                    if (!subFilterQuery.trim()) return true;
                                                    const q = subFilterQuery.toLowerCase();
                                                    const uName = getUserDisplayName(sub.userId).toLowerCase();
                                                    return (
                                                        uName.includes(q) ||
                                                        (sub.courseId && sub.courseId.toLowerCase().includes(q)) ||
                                                        (sub.sectionId && sub.sectionId.toLowerCase().includes(q))
                                                    );
                                                });
                                                if (filteredSubs.length === 0) {
                                                    return <tr><td colSpan="9" className="admin-no-data">No matching subscriptions found.</td></tr>;
                                                }
                                                return filteredSubs.map((sub) => {
                                                    const gradeRecord = gradesMap[`${sub.userId}_${sub.courseId}_${sub.sectionId}`];
                                                    const displayLetter = gradeRecord?.letterGrade || sub.letterGrade;
                                                    const displayScore = gradeRecord?.score ?? sub.score;
                                                    const displayRemarks = gradeRecord?.remarks || sub.remarks;
                                                    return (
                                                        <tr key={sub.id}>
                                                            <td><strong>{getUserDisplayName(sub.userId)}</strong></td>
                                                            <td>{sub.courseId}</td>
                                                            <td>{sub.sectionId === 'all' ? 'Full Course' : sub.sectionId}</td>
                                                            <td><span className={`badge ${sub.type}`}>{sub.type}</span></td>
                                                            <td>${sub.amount}</td>
                                                            <td>
                                                                <span className={`badge ${sub.status === 'completed' ? 'completed' : 'active-status'}`}>
                                                                    {sub.status === 'completed' ? 'Completed' : 'Active'}
                                                                </span>
                                                            </td>
                                                            <td>
                                                                {displayLetter ? (
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                                                                        <span className="badge completed" style={{ width: 'fit-content' }}>
                                                                            <i className="fa-solid fa-award" style={{ marginRight: '0.3rem' }}></i>
                                                                            {displayLetter} ({displayScore}%)
                                                                        </span>
                                                                        {displayRemarks && (
                                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-color-light)', maxWidth: '180px', whiteSpace: 'normal' }}>
                                                                                &ldquo;{displayRemarks}&rdquo;
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                ) : (
                                                                    <span style={{ color: 'var(--text-color-light)' }}>&mdash;</span>
                                                                )}
                                                            </td>
                                                            <td>{sub.createdAt ? new Date(sub.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                                                            <td>
                                                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                                                    {sub.status === 'completed' && (
                                                                        <button
                                                                            className="admin-action-btn-small"
                                                                            onClick={() => handleOpenGradeSubModal(sub)}
                                                                            title="Edit Grade & Remarks"
                                                                            style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem' }}
                                                                        >
                                                                            <i className="fa-solid fa-award"></i> Grade
                                                                        </button>
                                                                    )}
                                                                    <button
                                                                        className={`admin-status-btn ${sub.status === 'completed' ? 'reopen' : 'complete'}`}
                                                                        onClick={() => handleToggleSubscriptionStatus(sub)}
                                                                        title={sub.status === 'completed' ? 'Reopen / Mark as Active' : 'Assign Grade & Mark Complete'}
                                                                    >
                                                                        <i className={`fa-solid ${sub.status === 'completed' ? 'fa-rotate-left' : 'fa-check'}`}></i>
                                                                        {sub.status === 'completed' ? 'Mark Active' : 'Grade & Complete'}
                                                                    </button>
                                                                    <button className="admin-delete-btn" onClick={() => setSubscriptionToDelete(sub.id)} style={{padding: '0.35rem 0.6rem', fontSize: '0.8rem'}} title="Delete Subscription">
                                                                        <i className="fa-solid fa-trash"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                });
                                            })()}
                                        </tbody>
                                    </table>
                                </div>

                                {gradingSubModal.isOpen && gradingSubModal.sub && (
                                    <div className="payment-modal-overlay">
                                        <div className="payment-modal-content" style={{ maxWidth: '460px' }}>
                                            <button className="payment-modal-close" onClick={() => setGradingSubModal({ isOpen: false, sub: null, score: 90, remarks: '' })}>&times;</button>
                                            <h2>Assign Course Grade</h2>
                                            <p className="payment-description">
                                                Student: <strong>{getUserDisplayName(gradingSubModal.sub.userId)}</strong><br />
                                                Course: <strong>{gradingSubModal.sub.courseId === 'powerbi' ? 'Power BI' : gradingSubModal.sub.courseId}</strong> ({gradingSubModal.sub.sectionId === 'all' ? 'Full Course' : gradingSubModal.sub.sectionId})
                                            </p>

                                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                                                    <label style={{ margin: 0 }}>Score (0–100%)</label>
                                                    <span className="badge completed" style={{ fontSize: '0.9rem', padding: '0.3rem 0.7rem' }}>
                                                        Letter Grade: {calculateLetterGrade(gradingSubModal.score)}
                                                    </span>
                                                </div>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={gradingSubModal.score}
                                                    onChange={e => setGradingSubModal({ ...gradingSubModal, score: e.target.value })}
                                                />
                                            </div>

                                            <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                                                <label>Instructor Remarks / Feedback (Optional)</label>
                                                <textarea
                                                    rows="3"
                                                    placeholder="e.g. Outstanding work on the DAX measures and executive dashboard!"
                                                    value={gradingSubModal.remarks}
                                                    onChange={e => setGradingSubModal({ ...gradingSubModal, remarks: e.target.value })}
                                                    style={{ width: '100%', padding: '0.7rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)', fontFamily: 'inherit', resize: 'vertical' }}
                                                />
                                            </div>

                                            <button className="admin-action-btn" onClick={handleSaveSubGrade} style={{ width: '100%' }}>
                                                <i className="fa-solid fa-award" style={{ marginRight: '0.5rem' }}></i>
                                                Save Grade & Mark Complete
                                            </button>
                                        </div>
                                    </div>
                                )}
                                
                                {showAddSubscriptionModal && (
                                    <div className="payment-modal-overlay">
                                        <div className="payment-modal-content">
                                            <button className="payment-modal-close" onClick={() => setShowAddSubscriptionModal(false)}>&times;</button>
                                            <h2>Add Subscription</h2>
                                            
                                            <div className="form-group">
                                                <label>Select User</label>
                                                <select className="rate-input" style={{maxWidth: '100%'}} value={newSubscriptionData.userId} onChange={e => setNewSubscriptionData({...newSubscriptionData, userId: e.target.value})}>
                                                    <option value="">-- Select User --</option>
                                                    {users.map(u => (
                                                        <option key={u.id} value={u.id}>{u.email}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Course</label>
                                                <select className="rate-input" style={{maxWidth: '100%'}} value={newSubscriptionData.courseId} onChange={e => setNewSubscriptionData({...newSubscriptionData, courseId: e.target.value})}>
                                                    <option value="powerbi">Power BI</option>
                                                </select>
                                            </div>
                                            <div className="form-group">
                                                <label>Section</label>
                                                <select className="rate-input" style={{maxWidth: '100%'}} value={newSubscriptionData.sectionId} onChange={e => setNewSubscriptionData({...newSubscriptionData, sectionId: e.target.value})}>
                                                    <option value="all">Full Course</option>
                                                    <option value="module-1">Module 1</option>
                                                    <option value="module-2">Module 2</option>
                                                    <option value="module-3">Module 3</option>
                                                    <option value="module-4">Module 4</option>
                                                    <option value="module-5">Module 5</option>
                                                    <option value="module-6">Module 6</option>
                                                </select>
                                            </div>
                                            <div className="form-row">
                                                <div className="form-group">
                                                    <label>Type</label>
                                                    <select className="rate-input" style={{maxWidth: '100%'}} value={newSubscriptionData.type} onChange={e => setNewSubscriptionData({...newSubscriptionData, type: e.target.value})}>
                                                        <option value="video">Video</option>
                                                        <option value="live">Live Online</option>
                                                    </select>
                                                </div>
                                                <div className="form-group">
                                                    <label>Amount ($)</label>
                                                    <input type="number" value={newSubscriptionData.amount} onChange={e => setNewSubscriptionData({...newSubscriptionData, amount: e.target.value})} />
                                                </div>
                                            </div>
                                            
                                            <button className="admin-action-btn mt-2" onClick={handleAddSubscription} style={{width: '100%'}}>Add Subscription</button>
                                        </div>
                                    </div>
                                )}

                                {subscriptionToDelete && (
                                    <div className="payment-modal-overlay">
                                        <div className="payment-modal-content" style={{textAlign: 'center'}}>
                                            <h2>Confirm Deletion</h2>
                                            <p className="payment-description">Are you sure you want to permanently delete this subscription? The user will immediately lose access.</p>
                                            <div className="form-row mt-2" style={{gap: '1rem', display: 'flex', justifyContent: 'center'}}>
                                                <button className="admin-action-btn" onClick={handleDeleteSubscription} style={{background: '#ef4444'}}>Yes, Delete</button>
                                                <button className="admin-action-btn" onClick={() => setSubscriptionToDelete(null)} style={{background: 'gray'}}>Cancel</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'calendar' && (
                            <div className="admin-calendar-container">
                                <h2>Master Schedule</h2>
                                <p>Click and drag on the calendar to schedule a new live session for a class or an individual student.</p>
                                <CalendarView 
                                    events={sessions} 
                                    isAdmin={true} 
                                    onSelectSlot={handleSelectSlot}
                                    onSelectEvent={(event) => setSelectedSession(event)}
                                />
                                
                                {selectedSession && (
                                    <div className="payment-modal-overlay">
                                        <div className="payment-modal-content" style={{textAlign: 'center'}}>
                                            <button className="payment-modal-close" onClick={() => setSelectedSession(null)}>&times;</button>
                                            <h2>Manage Session</h2>
                                            <p className="payment-description" style={{marginBottom: '1rem'}}>
                                                <strong>{selectedSession.title}</strong><br/>
                                                {selectedSession.classId ? (
                                                    <>
                                                        Class: <strong>{selectedSession.className}</strong> ({Array.isArray(selectedSession.studentIds) ? selectedSession.studentIds.length : 0} students)<br/>
                                                    </>
                                                ) : (
                                                    <>
                                                        User: {getUserDisplayName(selectedSession.userId)}<br/>
                                                    </>
                                                )}
                                                {selectedSession.start.toLocaleString()} - {selectedSession.end.toLocaleString()}
                                            </p>
                                            <div className="form-row mt-2" style={{gap: '1rem', display: 'flex', justifyContent: 'center'}}>
                                                <button className="admin-action-btn" onClick={handleDeleteSession} style={{background: '#ef4444'}}>Delete Session</button>
                                                <button className="admin-action-btn" onClick={() => setSelectedSession(null)} style={{background: 'gray'}}>Close</button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {showScheduleModal && (
                                    <div className="payment-modal-overlay">
                                        <div className="payment-modal-content">
                                            <button className="payment-modal-close" onClick={() => setShowScheduleModal(false)}>&times;</button>
                                            <h2>Schedule Session</h2>
                                            <p>{selectedSlot?.start.toLocaleString()} to {selectedSlot?.end.toLocaleString()}</p>
                                            
                                            <div className="form-group" style={{ marginBottom: '1rem' }}>
                                                <label>Schedule For</label>
                                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewSessionData({ ...newSessionData, targetType: 'class' })}
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.6rem',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)',
                                                            background: newSessionData.targetType === 'class' ? 'var(--primary-color)' : 'var(--bg-main)',
                                                            color: newSessionData.targetType === 'class' ? 'white' : 'var(--text-main)',
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-users" style={{ marginRight: '0.4rem' }}></i> Entire Class
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setNewSessionData({ ...newSessionData, targetType: 'user' })}
                                                        style={{
                                                            flex: 1,
                                                            padding: '0.6rem',
                                                            borderRadius: '6px',
                                                            border: '1px solid var(--border-color)',
                                                            background: newSessionData.targetType === 'user' ? 'var(--primary-color)' : 'var(--bg-main)',
                                                            color: newSessionData.targetType === 'user' ? 'white' : 'var(--text-main)',
                                                            fontWeight: 600,
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        <i className="fa-solid fa-user" style={{ marginRight: '0.4rem' }}></i> Single Student
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="form-group">
                                                <label>Title</label>
                                                <input type="text" value={newSessionData.title} onChange={e => setNewSessionData({...newSessionData, title: e.target.value})} placeholder="e.g. Power BI Live Workshop" style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}} />
                                            </div>

                                            {newSessionData.targetType === 'class' ? (
                                                <div className="form-group">
                                                    <label>Select Class</label>
                                                    <select
                                                        style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                                        value={newSessionData.classId}
                                                        onChange={e => {
                                                            const cls = classesList.find(c => c.id === e.target.value);
                                                            setNewSessionData({
                                                                ...newSessionData,
                                                                classId: e.target.value,
                                                                title: newSessionData.title || (cls ? `${cls.name} Coaching Session` : '')
                                                            });
                                                        }}
                                                    >
                                                        <option value="">-- Select Class --</option>
                                                        {classesList.map(cls => (
                                                            <option key={cls.id} value={cls.id}>
                                                                {cls.name} ({Array.isArray(cls.studentIds) ? cls.studentIds.length : 0} students)
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            ) : (
                                                <div className="form-group">
                                                    <label>Select User</label>
                                                    <select style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}} value={newSessionData.userId} onChange={e => setNewSessionData({...newSessionData, userId: e.target.value})}>
                                                        <option value="">-- Select User --</option>
                                                        {users.filter(u => !u.isAdmin).map(u => (
                                                            <option key={u.id} value={u.id}>{u.email}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>Start Time</label>
                                                    <input type="time" style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}} value={newSessionData.startTime} onChange={e => setNewSessionData({...newSessionData, startTime: e.target.value})} />
                                                </div>
                                                <div className="form-group" style={{ flex: 1 }}>
                                                    <label>End Time</label>
                                                    <input type="time" style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}} value={newSessionData.endTime} onChange={e => setNewSessionData({...newSessionData, endTime: e.target.value})} />
                                                </div>
                                            </div>
                                            
                                            <button className="admin-action-btn mt-2" onClick={handleScheduleSession} style={{width: '100%'}}>Schedule</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'messages' && (
                            <div className="admin-section fade-in" style={{ padding: 0 }}>
                                <div className="admin-table-container">
                                    <h3>Form Submissions</h3>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Subject</th>
                                                <th>Message</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {messages.map(msg => (
                                                <tr key={msg.id}>
                                                    <td>{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                                    <td><strong>{msg.name}</strong></td>
                                                    <td><a href={`mailto:${msg.email}`} style={{ color: 'var(--primary-color)' }}>{msg.email}</a></td>
                                                    <td>{msg.subject}</td>
                                                    <td style={{ maxWidth: '350px', whiteSpace: 'normal', lineHeight: '1.5' }}>{msg.message}</td>
                                                    <td>
                                                        <button className="admin-action-btn-small" style={{background: '#ef4444'}} onClick={() => handleDeleteMessage(msg.id)}>
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {messages.length === 0 && (
                                                <tr><td colSpan="6" style={{textAlign: 'center'}}>No messages found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'live-classes' && (
                            <div className="admin-section fade-in" style={{ padding: 0 }}>
                                <h3>Manage Live Classes</h3>
                                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem'}}>
                                    <p style={{margin: 0, color: 'var(--text-light)'}}>Start a new video conferencing session for a specific course or directly with a user.</p>
                                    <button className="btn" style={{background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold'}} onClick={async () => {
                                        if (window.confirm('Are you sure you want to forcibly end ALL currently active live sessions? This is useful if old sessions were not ended properly.')) {
                                            try {
                                                await endAllActiveSessions();
                                                alert('All active sessions have been ended.');
                                            } catch (err) {
                                                console.error(err);
                                                alert('Failed to end active sessions.');
                                            }
                                        }
                                    }}>End All Active Sessions (Cleanup)</button>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                                    <form onSubmit={handleStartLiveClass} style={{flex: '1 1 min(100%, 300px)', background: 'var(--bg-alt)', padding: 'clamp(1.25rem, 3vw, 2rem)', borderRadius: '10px', border: '1px solid var(--border-color)'}}>
                                        <h4 style={{marginBottom: '1.5rem'}}>Course Session</h4>
                                        <div className="form-group" style={{marginBottom: '1.5rem'}}>
                                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Select Course</label>
                                            <select 
                                                value={newLiveClassCourseId} 
                                                onChange={(e) => {
                                                    setNewLiveClassCourseId(e.target.value);
                                                    setNewLiveClassTitle('');
                                                }}
                                                className="form-control"
                                                style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                            >
                                                {courses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{marginBottom: '1.5rem'}}>
                                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Select Module</label>
                                            <select 
                                                value={newLiveClassSectionId} 
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setNewLiveClassSectionId(val);
                                                    if (val === 'all') {
                                                        const course = courses.find(c => c.id === newLiveClassCourseId);
                                                        setNewLiveClassTitle(course ? `Live Session: ${course.title}` : 'Live Session: Entire Course');
                                                    } else {
                                                        const section = newLiveClassSections.find(s => s.id === val);
                                                        if (section) {
                                                            setNewLiveClassTitle(`Live Session: ${section.title || section.id}`);
                                                        }
                                                    }
                                                }}
                                                className="form-control"
                                                style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                            >
                                                <option value="all">Entire Course</option>
                                                {newLiveClassSections.map(s => (
                                                    <option key={s.id} value={s.id}>{s.title || s.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{marginBottom: '1.5rem'}}>
                                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Session Title / Topic</label>
                                            <input 
                                                type="text" 
                                                value={newLiveClassTitle}
                                                onChange={(e) => setNewLiveClassTitle(e.target.value)}
                                                placeholder="e.g. Week 3: Advanced DAX"
                                                required
                                                style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Start Live Class</button>
                                    </form>

                                    <form onSubmit={handleStartCohortLiveClassForm} style={{flex: '1 1 min(100%, 280px)', background: 'var(--bg-alt)', padding: 'clamp(1.25rem, 3vw, 2rem)', borderRadius: '10px', border: '1px solid var(--border-color)'}}>
                                        <h4 style={{marginBottom: '1.5rem'}}>Class Cohort Session</h4>
                                        <div className="form-group" style={{marginBottom: '1.5rem'}}>
                                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Select Class</label>
                                            <select
                                                value={cohortLiveClassId}
                                                onChange={(e) => {
                                                    const id = e.target.value;
                                                    setCohortLiveClassId(id);
                                                    const cls = classesList.find(c => c.id === id);
                                                    if (cls) {
                                                        setCohortLiveClassTitle(`Live Class: ${cls.name}`);
                                                    }
                                                }}
                                                className="form-control"
                                                style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                            >
                                                <option value="">-- Select a Class --</option>
                                                {classesList.map(cls => (
                                                    <option key={cls.id} value={cls.id}>
                                                        {cls.name} ({Array.isArray(cls.studentIds) ? cls.studentIds.length : 0} students)
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{marginBottom: '1.5rem'}}>
                                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Session Title / Topic</label>
                                            <input
                                                type="text"
                                                value={cohortLiveClassTitle}
                                                onChange={(e) => setCohortLiveClassTitle(e.target.value)}
                                                placeholder="e.g. Cohort A Live Workshop"
                                                required
                                                style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Start Cohort Live Class</button>
                                    </form>

                                    <form onSubmit={handleStartDirectLiveClass} style={{flex: '1 1 min(100%, 280px)', background: 'var(--bg-alt)', padding: 'clamp(1.25rem, 3vw, 2rem)', borderRadius: '10px', border: '1px solid var(--border-color)'}}>
                                        <h4 style={{marginBottom: '1.5rem'}}>Direct User Session</h4>
                                        <div className="form-group" style={{marginBottom: '1.5rem'}}>
                                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Select User</label>
                                            <select 
                                                value={directLiveClassUserId} 
                                                onChange={(e) => setDirectLiveClassUserId(e.target.value)}
                                                className="form-control"
                                                style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                            >
                                                <option value="">-- Select a User --</option>
                                                {users.filter(u => !u.isAdmin).map(u => (
                                                    <option key={u.id} value={u.id}>{u.displayName || u.email || u.id}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="form-group" style={{marginBottom: '1.5rem'}}>
                                            <label style={{display: 'block', marginBottom: '0.5rem', fontWeight: 500}}>Session Title / Topic</label>
                                            <input 
                                                type="text" 
                                                value={directLiveClassTitle}
                                                onChange={(e) => setDirectLiveClassTitle(e.target.value)}
                                                placeholder="e.g. 1-on-1 Mentorship"
                                                required
                                                style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}}
                                            />
                                        </div>
                                        <button type="submit" className="btn btn-primary" style={{width: '100%'}}>Start Direct Class</button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {activeTab === 'reviews' && (
                            <div className="admin-section fade-in" style={{ padding: 0 }}>
                                <h3>Course Reviews</h3>
                                <p style={{marginBottom: '1rem', color: 'var(--text-light)'}}>See what students are saying about the courses and modules.</p>
                                
                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Course</th>
                                                <th>Section</th>
                                                <th>Rating</th>
                                                <th>Written Review</th>
                                                <th>Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {reviews.length === 0 ? (
                                                <tr><td colSpan="6" style={{textAlign: 'center'}}>No reviews found.</td></tr>
                                            ) : (
                                                reviews.map(r => (
                                                    <tr key={r.id}>
                                                        <td>{r.userName || r.userId}</td>
                                                        <td>{r.courseId}</td>
                                                        <td>{r.sectionId}</td>
                                                        <td><StarRating rating={r.rating} /></td>
                                                        <td style={{ maxWidth: '300px', whiteSpace: 'normal', fontStyle: r.review ? 'normal' : 'italic', color: r.review ? 'inherit' : 'var(--text-light)' }}>
                                                            {r.review || 'No written comment'}
                                                        </td>
                                                        <td>{r.updatedAt?.toDate ? r.updatedAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

export default AdminPanel;

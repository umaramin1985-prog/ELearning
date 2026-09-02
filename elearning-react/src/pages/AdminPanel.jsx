import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { getCourses, getSections, saveCourse, saveSection, seedInitialCourses } from '../services/courseService';
import { getAllSubscriptions, getAllTransactions, createSubscription, deleteSubscription } from '../services/subscriptionService';
import { getAllSessions, createSession, deleteSession } from '../services/scheduleService';
import CalendarView from '../components/CalendarView';
import { subscribeToActiveChats, subscribeToChat, sendMessage, markChatReadByAdmin } from '../services/chatService';
import { useAuth } from '../contexts/AuthContext';
import './AdminPanel.css';
import { startLiveSession } from '../services/liveSessionService';
import { getRatingsForCourse } from '../services/ratingService';
import StarRating from '../components/StarRating';
import { useNavigate } from 'react-router-dom';

const AdminPanel = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('users'); // users, pricing, subscriptions, calendar, messages, live-chat, live-classes
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // Live Chat states
    const [activeChats, setActiveChats] = useState([]);
    const [selectedChatUser, setSelectedChatUser] = useState(null);
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');

    // Data states
    const [users, setUsers] = useState([]);
    
    // Pricing states
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('powerbi');
    const [sections, setSections] = useState([]);
    const [courseRates, setCourseRates] = useState({ videoRate: 0, liveRate: 0 });

    // Subscriptions states
    const [subscriptions, setSubscriptions] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [showAddSubscriptionModal, setShowAddSubscriptionModal] = useState(false);
    const [subscriptionToDelete, setSubscriptionToDelete] = useState(null);
    const [userToDelete, setUserToDelete] = useState(null);
    const [newSubscriptionData, setNewSubscriptionData] = useState({ userId: '', courseId: 'powerbi', sectionId: 'all', type: 'video', amount: 0 });

    // Calendar states
    const [sessions, setSessions] = useState([]);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [newSessionData, setNewSessionData] = useState({ userId: '', courseId: '', sectionId: '', title: '', startTime: '09:00', endTime: '10:00' });
    const [selectedSession, setSelectedSession] = useState(null);
    const [messages, setMessages] = useState([]);

    // Live Classes
    const [newLiveClassCourseId, setNewLiveClassCourseId] = useState('powerbi');
    const [newLiveClassSectionId, setNewLiveClassSectionId] = useState('all');
    const [newLiveClassSections, setNewLiveClassSections] = useState([]);
    const [newLiveClassTitle, setNewLiveClassTitle] = useState('');
    
    // Direct Live Classes
    const [directLiveClassUserId, setDirectLiveClassUserId] = useState('');
    const [directLiveClassTitle, setDirectLiveClassTitle] = useState('');

    // Reviews
    const [reviews, setReviews] = useState([]);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    // Added to import chatService functions
    // (Needs to be imported at the top, I'll add imports in a separate chunk)

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
            } else if (activeTab === 'pricing') {
                await fetchPricingData();
            } else if (activeTab === 'subscriptions') {
                await fetchSubscriptionsData();
            } else if (activeTab === 'calendar') {
                await fetchSessionsData();
            } else if (activeTab === 'messages') {
                await fetchMessagesData();
            } else if (activeTab === 'live-chat') {
                if (users.length === 0) await fetchUsers();
                // Subscription handled via useEffect
            } else if (activeTab === 'live-classes') {
                if (courses.length === 0) await fetchPricingData();
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

    const fetchSubscriptionsData = async () => {
        const subs = await getAllSubscriptions();
        const trans = await getAllTransactions();
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

    useEffect(() => {
        let unsubscribeChats;
        if (activeTab === 'live-chat') {
            unsubscribeChats = subscribeToActiveChats((chats) => {
                setActiveChats(chats);
            });
        }
        return () => {
            if (unsubscribeChats) unsubscribeChats();
        };
    }, [activeTab]);

    useEffect(() => {
        let unsubscribeMessages;
        if (activeTab === 'live-chat' && selectedChatUser) {
            unsubscribeMessages = subscribeToChat(selectedChatUser, (msgs) => {
                setChatMessages(msgs);
            });
            markChatReadByAdmin(selectedChatUser).catch(console.error);
        }
        return () => {
            if (unsubscribeMessages) unsubscribeMessages();
        };
    }, [activeTab, selectedChatUser]);

    const handleSendAdminMessage = async (e) => {
        e.preventDefault();
        if (chatInput.trim() === '' || !selectedChatUser) return;
        
        const text = chatInput;
        setChatInput('');
        try {
            await sendMessage(selectedChatUser, currentUser.uid, text, true);
        } catch (error) {
            console.error('Error sending message:', error);
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
        
        // Also ensure we have users for the dropdown
        if (users.length === 0) await fetchUsers();
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
        if (!newSessionData.userId || !newSessionData.title) {
            alert('User and Title are required');
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
            await createSession(
                newSessionData.userId,
                newSessionData.courseId || selectedCourse,
                newSessionData.sectionId || 'all',
                newSessionData.title,
                sessionStartDate,
                sessionEndDate,
                'mock_zoom_link'
            );
            setShowScheduleModal(false);
            setNewSessionData({ userId: '', courseId: '', sectionId: '', title: '', startTime: '09:00', endTime: '10:00' });
            await fetchSessionsData();
            alert('Session scheduled successfully!');
        } catch (error) {
            alert('Failed to schedule session.');
        }
    };

    const handleDeleteSession = async () => {
        if (!selectedSession) return;
        try {
            await deleteSession(selectedSession.id);
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
            alert('Failed to delete message.');
        }
    };

    const totalRevenue = transactions.reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

    // Prepare chat users list by merging all non-admin users with activeChats data
    const chatUsersList = users.filter(u => !u.isAdmin).map(u => {
        const activeChat = activeChats.find(c => c.userId === u.id);
        return {
            userId: u.id,
            userName: u.displayName || u.email || u.id,
            unreadByAdmin: activeChat ? activeChat.unreadByAdmin : false,
            lastMessage: activeChat ? activeChat.lastMessage : 'No messages yet',
            lastMessageAt: activeChat ? activeChat.lastMessageAt : null
        };
    }).sort((a, b) => {
        const aTime = a.lastMessageAt?.toMillis?.() || 0;
        const bTime = b.lastMessageAt?.toMillis?.() || 0;
        if (aTime !== bTime) return bTime - aTime;
        return a.userName.localeCompare(b.userName);
    });

    return (
        <section className="admin-section">
            <div className="container admin-container">
                <div className="admin-header">
                    <h1>Admin Control Panel</h1>
                    <p>Manage users, pricing, and subscriptions.</p>
                </div>

                <div className="admin-tabs">
                    <button className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>Users</button>
                    <button className={`admin-tab-btn ${activeTab === 'pricing' ? 'active' : ''}`} onClick={() => setActiveTab('pricing')}>Course Pricing</button>
                    <button className={`admin-tab-btn ${activeTab === 'subscriptions' ? 'active' : ''}`} onClick={() => setActiveTab('subscriptions')}>Subscriptions</button>
                    <button className={`admin-tab-btn ${activeTab === 'calendar' ? 'active' : ''}`} onClick={() => setActiveTab('calendar')}>Calendar</button>
                    <button className={`admin-tab-btn ${activeTab === 'messages' ? 'active' : ''}`} onClick={() => setActiveTab('messages')}>Form Submissions</button>
                    <button className={`admin-tab-btn ${activeTab === 'live-classes' ? 'active' : ''}`} onClick={() => setActiveTab('live-classes')}>Live Classes</button>
                    <button className={`admin-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Course Reviews</button>
                </div>

                {error && <div className="admin-error">{error}</div>}

                {loading ? (
                    <div className="admin-loading">Loading...</div>
                ) : (
                    <div className="admin-content fade-in">
                        {activeTab === 'users' && (
                            <div className="admin-table-container">
                                <h2>Registered Users</h2>
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Profile</th>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Role</th>
                                            <th>Joined At</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.length === 0 ? (
                                            <tr><td colSpan="5" className="admin-no-data">No users found.</td></tr>
                                        ) : (
                                            users.map((u) => (
                                                <tr key={u.id}>
                                                    <td>
                                                        {u.photoURL ? (
                                                            <img src={u.photoURL} alt="Avatar" className="admin-avatar" />
                                                        ) : (
                                                            <div className="admin-avatar-initial">{(u.displayName || u.email || '?').charAt(0).toUpperCase()}</div>
                                                        )}
                                                    </td>
                                                    <td><strong>{u.displayName || 'N/A'}</strong></td>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        <span className={`badge ${u.isAdmin ? 'live' : 'video'}`}>
                                                            {u.isAdmin ? 'Admin' : 'User'}
                                                        </span>
                                                    </td>
                                                    <td>{u.createdAt ? new Date(u.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                                                    <td>
                                                        {!u.isAdmin && (
                                                            <button className="admin-delete-btn" onClick={() => setUserToDelete(u)} title="Delete User">
                                                                <i className="fa-solid fa-trash"></i> Delete
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))
                                        )}
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
                                </div>

                                <div className="admin-table-container mt-2">
                                    <h2 style={{ marginBottom: '1.5rem' }}>All Subscriptions</h2>
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>User</th>
                                                <th>Course</th>
                                                <th>Section</th>
                                                <th>Type</th>
                                                <th>Amount ($)</th>
                                                <th>Date</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {subscriptions.length === 0 ? (
                                                <tr><td colSpan="7" className="admin-no-data">No subscriptions found.</td></tr>
                                            ) : (
                                                subscriptions.map((sub) => (
                                                    <tr key={sub.id}>
                                                        <td><strong>{getUserDisplayName(sub.userId)}</strong></td>
                                                        <td>{sub.courseId}</td>
                                                        <td>{sub.sectionId}</td>
                                                        <td><span className={`badge ${sub.type}`}>{sub.type}</span></td>
                                                        <td>${sub.amount}</td>
                                                        <td>{sub.createdAt ? new Date(sub.createdAt.toDate()).toLocaleDateString() : 'N/A'}</td>
                                                        <td>
                                                            <button className="admin-delete-btn" onClick={() => setSubscriptionToDelete(sub.id)} style={{padding: '0.2rem 0.5rem', fontSize: '0.8rem'}}>
                                                                <i className="fa-solid fa-trash"></i>
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                
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
                                <p>Click and drag on the calendar to schedule a new live session for a user.</p>
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
                                                User: {getUserDisplayName(selectedSession.userId)}<br/>
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
                                            
                                            <div className="form-group">
                                                <label>Title</label>
                                                <input type="text" value={newSessionData.title} onChange={e => setNewSessionData({...newSessionData, title: e.target.value})} placeholder="e.g. 1-on-1 Power BI Coaching" style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}} />
                                            </div>
                                            <div className="form-group">
                                                <label>Select User</label>
                                                <select style={{width: '100%', padding: '0.8rem', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-main)', color: 'var(--text-main)'}} value={newSessionData.userId} onChange={e => setNewSessionData({...newSessionData, userId: e.target.value})}>
                                                    <option value="">-- Select User --</option>
                                                    {users.filter(u => !u.isAdmin).map(u => (
                                                        <option key={u.id} value={u.id}>{u.email}</option>
                                                    ))}
                                                </select>
                                            </div>
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
                            <div className="admin-section fade-in">
                                <h3>Form Submissions</h3>
                                <div className="table-container">
                                    <table className="admin-table">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Name</th>
                                                <th>Email</th>
                                                <th>Subject</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {messages.map(msg => (
                                                <tr key={msg.id}>
                                                    <td>{msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleDateString() : 'N/A'}</td>
                                                    <td>{msg.name}</td>
                                                    <td><a href={`mailto:${msg.email}`}>{msg.email}</a></td>
                                                    <td>{msg.subject}</td>
                                                    <td>
                                                        <button className="admin-action-btn-small" style={{background: '#ef4444'}} onClick={() => handleDeleteMessage(msg.id)}>
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                            {messages.length === 0 && (
                                                <tr><td colSpan="5" style={{textAlign: 'center'}}>No messages found.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'live-classes' && (
                            <div className="admin-section fade-in">
                                <h3>Manage Live Classes</h3>
                                <p style={{marginBottom: '1rem', color: 'var(--text-light)'}}>Start a new video conferencing session for a specific course or directly with a user.</p>
                                
                                <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                                    <form onSubmit={handleStartLiveClass} style={{flex: '1 1 400px', background: 'var(--bg-alt)', padding: '2rem', borderRadius: '10px', border: '1px solid var(--border-color)'}}>
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

                                    <form onSubmit={handleStartDirectLiveClass} style={{flex: '1 1 400px', background: 'var(--bg-alt)', padding: '2rem', borderRadius: '10px', border: '1px solid var(--border-color)'}}>
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
                            <div className="admin-section fade-in">
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

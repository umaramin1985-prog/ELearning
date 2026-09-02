import React, { useState, useEffect, useRef } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { subscribeToActiveSessions } from '../services/liveSessionService';
import { getUserSubscriptions } from '../services/subscriptionService';
import './NotificationDropdown.css';

const NotificationDropdown = () => {
    const [notifications, setNotifications] = useState([]);
    const [liveSessions, setLiveSessions] = useState([]);
    const [userSubscriptions, setUserSubscriptions] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const { user } = useAuth();
    const navigate = useNavigate();
    const dropdownRef = useRef(null);
    const previousUnreadCountRef = useRef(0);

    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    const isAdmin = user && adminEmails.includes(user.email?.toLowerCase());

    useEffect(() => {
        if (!user) return;

        const notifCol = collection(db, 'notifications');
        let unsubUser, unsubAdmin;

        const handleSnapshot = (snapshot, isForAdmin = false) => {
            const newNotifs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setNotifications(prev => {
                const filtered = prev.filter(n => (isForAdmin ? n.userId !== 'admin' : n.userId === 'admin'));
                const merged = [...filtered, ...newNotifs];
                merged.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
                
                const currentUnreadCount = merged.filter(n => !n.read).length;
                if (currentUnreadCount > previousUnreadCountRef.current) {
                    try {
                        const audio = new Audio('/sounds/notification.mp3');
                        audio.play().catch(e => console.log('Audio play failed', e));
                    } catch (err) {}
                }
                previousUnreadCountRef.current = currentUnreadCount;
                
                return merged;
            });
        };

        const qUser = query(notifCol, where('userId', '==', user.uid));
        unsubUser = onSnapshot(qUser, (snap) => handleSnapshot(snap, false));

        if (isAdmin) {
            const qAdmin = query(notifCol, where('userId', '==', 'admin'));
            unsubAdmin = onSnapshot(qAdmin, (snap) => handleSnapshot(snap, true));
        }

        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        
        // Live session data
        const fetchSubscriptions = async () => {
            try {
                const subs = await getUserSubscriptions(user.uid);
                setUserSubscriptions(subs);
            } catch (error) {
                console.error("Error fetching subscriptions:", error);
            }
        };
        fetchSubscriptions();

        const unsubscribeLive = subscribeToActiveSessions((sessions) => {
            setLiveSessions(sessions);
        });
        
        return () => {
            unsubUser();
            if (unsubAdmin) unsubAdmin();
            unsubscribeLive();
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [user, isAdmin]);

    const markAsRead = async (id, link) => {
        if (id && id.toString().startsWith('live-')) {
            if (link) {
                navigate(link);
                setIsOpen(false);
            }
            return;
        }
        try {
            await updateDoc(doc(db, 'notifications', id), { read: true });
            if (link) {
                navigate(link);
                setIsOpen(false);
            }
        } catch (error) {
            console.error('Error marking as read', error);
        }
    };

    const clearAllRead = async () => {
        const readNotifications = notifications.filter(n => n.read);
        if (readNotifications.length === 0) return;
        
        try {
            const batch = writeBatch(db);
            readNotifications.forEach(n => {
                batch.delete(doc(db, 'notifications', n.id));
            });
            await batch.commit();
        } catch (error) {
            console.error('Error clearing read notifications', error);
        }
    };

    const accessibleLiveSessions = isAdmin ? [] : liveSessions.filter(session => {
        return userSubscriptions.some(sub => 
            sub.courseId === session.courseId && 
            (sub.sectionId === 'all' || session.sectionId === 'all' || sub.sectionId === session.sectionId)
        );
    });

    const liveNotifications = accessibleLiveSessions.map(session => ({
        id: `live-${session.id}`,
        type: 'session',
        title: `LIVE NOW: ${session.title}`,
        message: 'A live session is currently in progress. Click to join.',
        createdAt: session.startedAt,
        read: false,
        link: `/live-class/${session.roomId}`
    }));

    const allNotifications = [...liveNotifications, ...notifications];
    const unreadCount = allNotifications.filter(n => !n.read).length;

    return (
        <div className="notification-dropdown-container" ref={dropdownRef}>
            <button className="notification-bell" onClick={() => setIsOpen(!isOpen)}>
                <i className="fa-solid fa-bell"></i>
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>

            {isOpen && (
                <div className="notification-dropdown-menu">
                    <div className="notification-header">
                        <h4>Notifications</h4>
                        <button className="clear-all-btn" onClick={clearAllRead} title="Clear Read Notifications">
                            <i className="fa-solid fa-trash-can"></i>
                        </button>
                    </div>
                    <div className="notification-list">
                        {allNotifications.length === 0 ? (
                            <div className="notification-empty">No notifications</div>
                        ) : (
                            allNotifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    className={`notification-item ${!notif.read ? 'unread' : ''}`}
                                    onClick={() => markAsRead(notif.id, notif.link)}
                                >
                                    <div className="notification-icon">
                                        {notif.type === 'session' ? <i className="fa-solid fa-video"></i> : <i className="fa-solid fa-envelope"></i>}
                                    </div>
                                    <div className="notification-content">
                                        <div className="notification-title">{notif.title}</div>
                                        <div className="notification-message">{notif.message}</div>
                                        <div className="notification-time">
                                            {notif.createdAt ? new Date(notif.createdAt.toMillis()).toLocaleString() : 'Just now'}
                                        </div>
                                    </div>
                                    {!notif.read && <div className="notification-dot"></div>}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { subscribeToActiveSessions } from '../services/liveSessionService';
import { getUserSubscriptions } from '../services/subscriptionService';
import './GlobalLiveBanner.css';

const GlobalLiveBanner = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [liveSessions, setLiveSessions] = useState([]);
    const [userSubscriptions, setUserSubscriptions] = useState([]);

    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    const isAdmin = user && adminEmails.includes(user.email?.toLowerCase());

    useEffect(() => {
        const fetchSubscriptions = async () => {
            if (user) {
                try {
                    const subs = await getUserSubscriptions(user.uid);
                    setUserSubscriptions(subs);
                } catch (error) {
                    console.error("Error fetching subscriptions for banner:", error);
                }
            } else {
                setUserSubscriptions([]);
            }
        };

        fetchSubscriptions();

        const unsubscribeLive = subscribeToActiveSessions((sessions) => {
            setLiveSessions(sessions);
        });

        return () => {
            unsubscribeLive();
        };
    }, [user]);

    if (isAdmin || location.pathname.startsWith('/live-class')) {
        return null;
    }

    // Determine which live sessions the user can join
    const accessibleLiveSessions = liveSessions.filter(session => {
        if (session.courseId === 'direct' && session.sectionId === user.uid) {
            return true;
        }
        return userSubscriptions.some(sub => 
            sub.courseId === session.courseId && 
            (sub.sectionId === 'all' || session.sectionId === 'all' || sub.sectionId === session.sectionId)
        );
    }).sort((a, b) => {
        const timeA = typeof a.startedAt?.toMillis === 'function' ? a.startedAt.toMillis() : 0;
        const timeB = typeof b.startedAt?.toMillis === 'function' ? b.startedAt.toMillis() : 0;
        return timeB - timeA;
    }).slice(0, 1);

    if (accessibleLiveSessions.length === 0) {
        return null;
    }

    return (
        <div className="global-live-banner-container">
            {accessibleLiveSessions.map(session => (
                <div key={session.id} className="live-session-banner">
                    <div>
                        <h3 style={{margin: 0, color: 'white', display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <span style={{display: 'inline-block', width: '10px', height: '10px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite'}}></span>
                            LIVE NOW: {session.title}
                        </h3>
                    </div>
                    <button className="btn" style={{background: 'white', color: 'var(--primary-color)', padding: '8px 20px'}} onClick={() => navigate(`/live-class/${session.roomId}`)}>
                        Join Live Class
                    </button>
                </div>
            ))}
        </div>
    );
};

export default GlobalLiveBanner;

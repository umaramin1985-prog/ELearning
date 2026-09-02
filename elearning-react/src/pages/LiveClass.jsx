import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLiveSessionByRoomId, endLiveSession } from '../services/liveSessionService';
import { getUserSubscriptions } from '../services/subscriptionService';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import '@livekit/components-styles';
import './LiveClass.css';

const LiveClass = () => {
    const { roomId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [token, setToken] = useState("");

    useEffect(() => {
        const verifyAccess = async () => {
            if (!user) {
                navigate('/signin');
                return;
            }

            try {
                const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
                const userIsAdmin = adminEmails.includes(user.email?.toLowerCase());
                setIsAdmin(userIsAdmin);

                const currentSession = await getLiveSessionByRoomId(roomId);
                
                if (!currentSession) {
                    setError("This live class has ended or does not exist.");
                    setLoading(false);
                    return;
                }

                setSession(currentSession);

                // If not admin, check if subscribed to the course/module
                if (!userIsAdmin) {
                    if (currentSession.courseId === 'direct' && currentSession.sectionId === user.uid) {
                        // User is the specific target of this direct session
                    } else {
                        const subscriptions = await getUserSubscriptions(user.uid);
                        const isSubscribed = subscriptions.some(sub => 
                            sub.courseId === currentSession.courseId && 
                            (sub.sectionId === 'all' || currentSession.sectionId === 'all' || sub.sectionId === currentSession.sectionId)
                        );
                        
                        if (!isSubscribed) {
                            setError("You are not subscribed to the required module for this live class.");
                            setLoading(false);
                            return;
                        }
                    }
                }

                // Fetch LiveKit Token
                try {
                    const username = user.displayName || user.email.split('@')[0];
                    const response = await fetch(`/api/livekit-token?room=${roomId}&username=${encodeURIComponent(username)}`);
                    const data = await response.json();
                    
                    if (response.ok && data.token) {
                        setToken(data.token);
                    } else {
                        setError("Failed to get meeting token.");
                    }
                } catch (err) {
                    console.error("Token fetch error:", err);
                    setError("Failed to communicate with meeting server.");
                }

                setLoading(false);
            } catch (err) {
                console.error("Access verification error:", err);
                setError("An error occurred while trying to join the class.");
                setLoading(false);
            }
        };

        verifyAccess();
    }, [roomId, user, navigate]);

    const handleEndClass = async () => {
        if (isAdmin && session) {
            try {
                await endLiveSession(session.id);
                navigate('/admin');
            } catch (err) {
                console.error("Failed to end session:", err);
            }
        }
    };

    if (loading) {
        return <div className="live-class-loading"><h2>Joining Live Class...</h2></div>;
    }

    if (error) {
        return (
            <div className="live-class-error">
                <h2>Access Denied</h2>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={() => navigate('/courses')}>Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="live-class-container">
            <div className="live-class-header">
                <h2>{session.title || 'Live Class'}</h2>
                {isAdmin && (
                    <button className="btn btn-danger" onClick={handleEndClass}>End Class for Everyone</button>
                )}
                {!isAdmin && (
                    <button className="btn btn-secondary" onClick={() => navigate('/courses')}>Leave Class</button>
                )}
            </div>
            
            <div className="livekit-container" style={{ height: 'calc(100vh - 150px)', width: '100%' }}>
                {token === "" ? (
                    <div className="live-class-loading"><h2>Connecting to LiveClass...</h2></div>
                ) : (
                    <LiveKitRoom
                        video={true}
                        audio={true}
                        token={token}
                        serverUrl={import.meta.env.VITE_LIVEKIT_URL}
                        data-lk-theme="default"
                        style={{ height: '100%' }}
                        onDisconnected={() => {
                            if (!isAdmin) {
                                navigate('/courses');
                            } else {
                                handleEndClass();
                            }
                        }}
                    >
                        <VideoConference />
                        <RoomAudioRenderer />
                    </LiveKitRoom>
                )}
            </div>
        </div>
    );
};

export default LiveClass;

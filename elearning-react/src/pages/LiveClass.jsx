import React, { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getLiveSessionByRoomId, endLiveSession, subscribeToLiveSessionByRoomId } from '../services/liveSessionService';
import { getUserSubscriptions } from '../services/subscriptionService';
import { LiveKitRoom, VideoConference, RoomAudioRenderer } from '@livekit/components-react';
import { DisconnectReason } from 'livekit-client';
import '@livekit/components-styles';
import './LiveClass.css';

const LiveClass = ({ roomId: propRoomId, isMinimized = false, onClose }) => {
    const { roomId: paramsRoomId } = useParams();
    const roomId = propRoomId || paramsRoomId;
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);
    const [error, setError] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [token, setToken] = useState("");
    const [isPipActive, setIsPipActive] = useState(false);
    const initializedRoomRef = useRef(null);
    const sessionEndedRef = useRef(false);
    const containerRef = useRef(null);

    const roomOptions = useMemo(() => ({
        // Keep video tracks streaming continuously even when switching tabs/windows or using Picture-in-Picture
        adaptiveStream: false,
        dynacast: true,
        disconnectOnPageLeave: false,
    }), []);

    const getBestVideoElement = useCallback(() => {
        const root = containerRef.current || document;
        const videos = Array.from(root.querySelectorAll('video')).filter(
            (v) => v.readyState >= 2 && v.videoWidth > 0 && !v.paused
        );
        if (videos.length === 0) return null;

        // Prefer remote participant / screen-share video over local self-view when multiple videos exist
        const remoteVideo = videos.find((v) => {
            const tile = v.closest('[data-lk-local-participant]');
            return tile && tile.getAttribute('data-lk-local-participant') === 'false';
        });
        return remoteVideo || videos[0];
    }, []);

    const togglePictureInPicture = useCallback(async () => {
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
                setIsPipActive(false);
                return;
            }
            const targetVideo = getBestVideoElement();
            if (!targetVideo) {
                alert('No active video stream found yet. Make sure a camera or screen share is turned on.');
                return;
            }
            targetVideo.disablePictureInPicture = false;
            await targetVideo.requestPictureInPicture();
            setIsPipActive(true);
        } catch (err) {
            console.error('Picture-in-Picture error:', err);
        }
    }, [getBestVideoElement]);

    // Enable automatic Picture-in-Picture on active video elements & MediaSession API
    useEffect(() => {
        if (!token) return;

        const configureVideosForPiP = () => {
            const root = containerRef.current || document;
            const allVideos = Array.from(root.querySelectorAll('video'));
            allVideos.forEach((v) => {
                v.disablePictureInPicture = false;
                v.autoPictureInPicture = false;
            });
            const best = getBestVideoElement();
            if (best) {
                best.autoPictureInPicture = true;
            }
        };

        const handleEnterPiP = () => setIsPipActive(true);
        const handleLeavePiP = () => setIsPipActive(false);

        const handleVisibilityChange = async () => {
            if (document.visibilityState === 'hidden' && !document.pictureInPictureElement) {
                const targetVideo = getBestVideoElement();
                if (targetVideo && typeof targetVideo.requestPictureInPicture === 'function') {
                    try {
                        targetVideo.disablePictureInPicture = false;
                        await targetVideo.requestPictureInPicture();
                    } catch {
                        // Browser may require user gesture or site setting for auto-PiP
                    }
                }
            }
        };

        document.addEventListener('enterpictureinpicture', handleEnterPiP, true);
        document.addEventListener('leavepictureinpicture', handleLeavePiP, true);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const intervalId = window.setInterval(configureVideosForPiP, 1500);

        if ('mediaSession' in navigator && typeof navigator.mediaSession.setActionHandler === 'function') {
            try {
                navigator.mediaSession.setActionHandler('enterpictureinpicture', async () => {
                    const targetVideo = getBestVideoElement();
                    if (targetVideo && !document.pictureInPictureElement) {
                        targetVideo.disablePictureInPicture = false;
                        await targetVideo.requestPictureInPicture();
                    }
                });
            } catch {
                // Ignore if browser does not support enterpictureinpicture action
            }
        }

        return () => {
            window.clearInterval(intervalId);
            document.removeEventListener('enterpictureinpicture', handleEnterPiP, true);
            document.removeEventListener('leavepictureinpicture', handleLeavePiP, true);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [token, getBestVideoElement]);

    const fetchMeetingToken = useCallback(async (currentUser, targetRoomId) => {
        const username = currentUser.displayName || currentUser.email.split('@')[0];
        const response = await fetch(
            `/api/livekit-token?room=${encodeURIComponent(targetRoomId)}&username=${encodeURIComponent(username)}&userId=${encodeURIComponent(currentUser.uid)}`
        );
        const data = await response.json();
        if (response.ok && data.token) {
            setToken(data.token);
            return true;
        }
        return false;
    }, []);

    useEffect(() => {
        let unsubscribe = null;
        if (roomId) {
            unsubscribe = subscribeToLiveSessionByRoomId(roomId, (updatedSession) => {
                if (!loading && (!updatedSession || !updatedSession.isActive)) {
                    sessionEndedRef.current = true;
                    setToken(""); // Clearing the token forcefully unmounts the LiveKitRoom
                    setError("This live class has been ended by the administrator.");
                }
            });
        }
        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [roomId, loading]);

    useEffect(() => {
        const verifyAccess = async () => {
            if (!user) {
                navigate('/signin');
                return;
            }

            const roomUserKey = `${roomId}_${user.uid}`;
            if (initializedRoomRef.current === roomUserKey) {
                return;
            }
            initializedRoomRef.current = roomUserKey;

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

                // If not admin, check if subscribed to the course/module or included in the class
                if (!userIsAdmin) {
                    if (currentSession.courseId === 'direct' && currentSession.sectionId === user.uid) {
                        // User is the specific target of this direct session
                    } else if (currentSession.courseId === 'class' && Array.isArray(currentSession.studentIds) && currentSession.studentIds.includes(user.uid)) {
                        // User is a member of this live class cohort
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
                    const ok = await fetchMeetingToken(user, roomId);
                    if (!ok) {
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
    }, [roomId, user, navigate, fetchMeetingToken]);

    const handleLeaveClass = useCallback(() => {
        if (document.pictureInPictureElement) {
            document.exitPictureInPicture().catch(() => {});
        }
        if (onClose) onClose();
        navigate(isAdmin ? '/admin' : '/courses');
    }, [onClose, navigate, isAdmin]);

    const handleEndClass = async () => {
        if (isAdmin && session) {
            try {
                sessionEndedRef.current = true;
                if (document.pictureInPictureElement) {
                    document.exitPictureInPicture().catch(() => {});
                }
                await endLiveSession(session.id);
                if (onClose) onClose();
                navigate('/admin');
            } catch (err) {
                console.error("Failed to end session:", err);
            }
        }
    };

    const handleRoomDisconnected = useCallback(async (reason) => {
        if (sessionEndedRef.current) {
            return;
        }
        // Only leave the page when the participant explicitly clicks the Leave button
        if (reason === DisconnectReason.CLIENT_INITIATED) {
            handleLeaveClass();
            return;
        }
        // If disconnected unexpectedly (e.g., tab/window switch or brief network drop),
        // keep the call alive and automatically re-fetch token to reconnect if the session is still active.
        if (user && roomId) {
            try {
                const activeSession = await getLiveSessionByRoomId(roomId);
                if (activeSession && activeSession.isActive) {
                    await fetchMeetingToken(user, roomId);
                }
            } catch (err) {
                console.error("Error reconnecting to live session:", err);
            }
        }
    }, [handleLeaveClass, user, roomId, fetchMeetingToken]);

    if (loading) {
        if (isMinimized) return null;
        return <div className="live-class-loading"><h2>Joining Live Class...</h2></div>;
    }

    if (error) {
        if (isMinimized) return null;
        return (
            <div className="live-class-error">
                <h2>Access Denied</h2>
                <p>{error}</p>
                <button className="btn btn-primary" onClick={handleLeaveClass}>Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div className={`live-class-container ${isMinimized ? 'minimized' : ''}`}>
            <div className="live-class-header">
                <h2 title={session.title || 'Live Class'}>
                    {isMinimized && <span className="live-dot-indicator"></span>}
                    {session.title || 'Live Class'}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {isMinimized ? (
                        <button
                            type="button"
                            className="btn btn-primary"
                            style={{ padding: '5px 10px', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                            onClick={() => navigate(`/live-class/${encodeURIComponent(roomId)}`)}
                            title="Expand back to full-screen classroom"
                        >
                            <i className="fa-solid fa-expand"></i> Expand
                        </button>
                    ) : (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: '8px 14px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                            onClick={() => navigate(isAdmin ? '/admin' : '/courses')}
                            title="Minimize video call to corner while browsing the site"
                        >
                            <i className="fa-solid fa-compress"></i> Minimize
                        </button>
                    )}
                    {typeof document !== 'undefined' && document.pictureInPictureEnabled && (
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ padding: isMinimized ? '5px 10px' : '8px 14px', fontSize: isMinimized ? '0.8rem' : '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
                            onClick={togglePictureInPicture}
                            title="Pop out a floating mini video window that stays visible on top of other tabs and apps"
                        >
                            <i className="fa-solid fa-clone"></i>
                            {isMinimized ? 'PiP' : (isPipActive ? 'Exit Floating Video' : 'Floating Video (PiP)')}
                        </button>
                    )}
                    {isAdmin && (
                        <button
                            className="btn btn-danger"
                            style={isMinimized ? { padding: '5px 10px', fontSize: '0.8rem' } : undefined}
                            onClick={handleEndClass}
                        >
                            {isMinimized ? 'End' : 'End Class for Everyone'}
                        </button>
                    )}
                    {!isAdmin && (
                        <button
                            className="btn btn-secondary"
                            style={isMinimized ? { padding: '5px 10px', fontSize: '0.8rem' } : undefined}
                            onClick={handleLeaveClass}
                        >
                            {isMinimized ? 'Leave' : 'Leave Class'}
                        </button>
                    )}
                </div>
            </div>
            
            <div ref={containerRef} className="livekit-container" style={{ height: isMinimized ? 'calc(100% - 44px)' : 'calc(100vh - 150px)', width: '100%' }}>
                {token === "" ? (
                    <div className="live-class-loading"><h2>Connecting to LiveClass...</h2></div>
                ) : (
                    <LiveKitRoom
                        video={true}
                        audio={true}
                        token={token}
                        serverUrl={import.meta.env.VITE_LIVEKIT_URL}
                        options={roomOptions}
                        data-lk-theme="default"
                        style={{ height: '100%' }}
                        onDisconnected={handleRoomDisconnected}
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

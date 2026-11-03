import React, { useEffect, useState, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
    const { user, logout } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(null);
    const verifiedUidRef = useRef(null);

    useEffect(() => {
        if (!user) {
            verifiedUidRef.current = null;
            setIsAuthorized(false);
            return;
        }

        if (verifiedUidRef.current === user.uid) {
            setIsAuthorized(true);
            return;
        }

        const checkUser = async () => {
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    verifiedUidRef.current = null;
                    await logout();
                    setIsAuthorized(false);
                } else {
                    verifiedUidRef.current = user.uid;
                    setIsAuthorized(true);
                }
            } catch (err) {
                console.error('Error checking user profile', err);
                // Keep authenticated session alive on transient network errors
                verifiedUidRef.current = user.uid;
                setIsAuthorized(true);
            }
        };

        checkUser();
    }, [user, logout]);

    if (isAuthorized === null) {
        return <Loader fullScreen />;
    }

    if (!isAuthorized) {
        return <Navigate to="/signin" />;
    }
    
    return children;
};

export default ProtectedRoute;

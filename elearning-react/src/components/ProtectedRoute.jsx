import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Loader from './Loader';

const ProtectedRoute = ({ children }) => {
    const { user, logout } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        if (!user) {
            setIsAuthorized(false);
            return;
        }

        const checkUser = async () => {
            try {
                const userRef = doc(db, 'users', user.uid);
                const userSnap = await getDoc(userRef);
                if (!userSnap.exists()) {
                    await logout();
                    setIsAuthorized(false);
                } else {
                    setIsAuthorized(true);
                }
            } catch (err) {
                console.error('Error checking user profile', err);
                setIsAuthorized(false);
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

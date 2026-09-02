import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Loader from './Loader';

const AdminRoute = ({ children }) => {
    const { user, logout } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(null);

    useEffect(() => {
        if (!user) {
            setIsAuthorized(false);
            return;
        }

        const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];

        const checkAdmin = async () => {
            if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
                setIsAuthorized(false);
                return;
            }

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
                console.error('Error checking admin profile', err);
                setIsAuthorized(false);
            }
        };

        checkAdmin();
    }, [user, logout]);

    if (isAuthorized === null) {
        return <Loader fullScreen />;
    }

    if (!isAuthorized) {
        return <Navigate to="/courses" />;
    }
    
    return children;
};

export default AdminRoute;

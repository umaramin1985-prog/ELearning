import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from './ChatWidget';
import GlobalLiveBanner from './GlobalLiveBanner';
import AccessibilityWidget from './AccessibilityWidget';
import ProtectedRoute from './ProtectedRoute';
import LiveClass from '../pages/LiveClass';

const Layout = () => {
    const location = useLocation();
    const [activeRoomId, setActiveRoomId] = useState(null);

    const match = location.pathname.match(/^\/live-class\/([^/]+)/);
    const routeRoomId = match ? decodeURIComponent(match[1]) : null;
    const isLiveClassRoute = Boolean(routeRoomId);

    useEffect(() => {
        if (routeRoomId && routeRoomId !== activeRoomId) {
            setActiveRoomId(routeRoomId);
        }
    }, [routeRoomId, activeRoomId]);

    const effectiveRoomId = routeRoomId || activeRoomId;

    return (
        <>
            <Header />
            {!effectiveRoomId && <GlobalLiveBanner />}
            {effectiveRoomId && (
                <ProtectedRoute>
                    <LiveClass
                        roomId={effectiveRoomId}
                        isMinimized={!isLiveClassRoute}
                        onClose={() => setActiveRoomId(null)}
                    />
                </ProtectedRoute>
            )}
            <main style={isLiveClassRoute ? { display: 'none' } : undefined}>
                <Outlet />
            </main>
            <ChatWidget />
            <AccessibilityWidget />
            {!isLiveClassRoute && <Footer />}
        </>
    );
};

export default Layout;

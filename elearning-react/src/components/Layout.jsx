import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import ChatWidget from './ChatWidget';
import GlobalLiveBanner from './GlobalLiveBanner';
import AccessibilityWidget from './AccessibilityWidget';

const Layout = () => {
    return (
        <>
            <Header />
            <GlobalLiveBanner />
            <main>
                <Outlet />
            </main>
            <ChatWidget />
            <AccessibilityWidget />
            <Footer />
        </>
    );
};

export default Layout;

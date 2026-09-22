import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import NotificationDropdown from './NotificationDropdown';

const Header = () => {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    const adminEmails = import.meta.env.VITE_ADMIN_EMAILS ? import.meta.env.VITE_ADMIN_EMAILS.split(',').map(e => e.trim().toLowerCase()) : [];
    const isAdmin = user && user.email && adminEmails.includes(user.email.toLowerCase());

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.setAttribute('data-theme', 'dark');
            setIsDarkMode(true);
        } else {
            document.body.removeAttribute('data-theme');
            setIsDarkMode(false);
        }

        const handleScroll = () => {
            if (window.scrollY > 50) {
                setIsScrolled(true);
            } else {
                setIsScrolled(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Handle hash links scrolling
    useEffect(() => {
        if (location.hash) {
            const element = document.getElementById(location.hash.substring(1));
            if (element) {
                const headerOffset = 80;
                if (window.lenis) {
                     window.lenis.scrollTo(element, { offset: -headerOffset, duration: 1.2 });
                } else {
                     const elementPosition = element.getBoundingClientRect().top;
                     const offsetPosition = elementPosition + window.scrollY - headerOffset;
                     
                     window.scrollTo({
                          top: offsetPosition,
                          behavior: 'smooth'
                     });
                }
            }
        } else {
            if (window.lenis) {
                 window.lenis.scrollTo(0, { duration: 1.2 });
            } else {
                 window.scrollTo(0, 0);
            }
        }
    }, [location]);

    const toggleTheme = () => {
        if (isDarkMode) {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('theme', 'light');
            setIsDarkMode(false);
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('theme', 'dark');
            setIsDarkMode(true);
        }
    };

    const closeMobileMenu = () => {
        setIsMobileMenuOpen(false);
    };

    return (
        <header className={`header ${isScrolled ? 'scrolled' : ''}`}>

            <div className="container header-container">
                <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '12px' }}>
                    <img src="/images/logo.webp" alt="Logo" style={{ height: '55px', width: '55px', borderRadius: '6px', objectFit: 'cover' }} />
                    <span className="logo-text">YYZ Data Matrix Inc</span>
                </Link>
                <nav className={`nav ${isMobileMenuOpen ? 'active' : ''}`}>
                    <ul className="nav-list">
                        <li><Link to="/" className="nav-link" onClick={closeMobileMenu}>Home</Link></li>
                        <li><Link to="/about" className="nav-link" onClick={closeMobileMenu}>About Us</Link></li>
                        <li><Link to="/courses" className="nav-link" onClick={closeMobileMenu}>Courses</Link></li>
                        <li><Link to="/pricing" className="nav-link" onClick={closeMobileMenu}>Pricing</Link></li>
                        {isAdmin && <li><Link to="/admin" className="nav-link" onClick={closeMobileMenu}>Admin Panel</Link></li>}
                        {!user ? (
                            <li className="mobile-nav-item"><Link to="/signin" className="nav-link" onClick={closeMobileMenu}>Sign In</Link></li>
                        ) : (
                            <>
                                <li className="mobile-nav-item"><Link to="/profile" className="nav-link" onClick={closeMobileMenu}>Profile</Link></li>
                                <li className="mobile-nav-item"><button className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }} onClick={() => { handleLogout(); closeMobileMenu(); }}>Log Out</button></li>
                            </>
                        )}
                        <li className="mobile-nav-item"><Link to="/contact" className="nav-link" onClick={closeMobileMenu}>Contact Us</Link></li>
                    </ul>
                </nav>
                <div className="header-actions">
                    <Link to="/courses" className="btn btn-primary nav-btn" style={{ padding: '0.6rem 1.2rem', marginRight: '0.5rem', display: 'none' }}>Start Learning</Link>
                    <style>{`
                        @media (min-width: 992px) {
                            .header-actions .btn-primary.nav-btn {
                                display: inline-block !important;
                            }
                        }
                    `}</style>
                    <button id="theme-toggle" className="theme-toggle" aria-label="Toggle Theme" onClick={toggleTheme}>
                        <i className={`fa-solid ${isDarkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                    </button>
                    <div className="mobile-toggle" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
                        <i className={`fa-solid ${isMobileMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
                    </div>
                    {!user ? (
                        <Link to="/signin" className="btn btn-secondary nav-btn" style={{ padding: '0.6rem 1.2rem' }}>Sign In</Link>
                    ) : (
                        <>
                            <NotificationDropdown />
                            <Link to="/profile" className="header-profile" style={{ display: 'flex', alignItems: 'center', marginRight: '0.5rem', textDecoration: 'none', marginLeft: '1rem' }} title="Profile Settings">
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt="Profile" referrerPolicy="no-referrer" style={{ width: '35px', height: '35px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color)' }} onError={(e) => {e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + (user.displayName || user.email || 'User') + '&background=random';}} />
                                ) : (
                                    <div style={{ width: '35px', height: '35px', borderRadius: '50%', backgroundColor: 'var(--primary-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {(user.displayName || user.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </Link>
                            <button onClick={handleLogout} className="btn btn-secondary nav-btn" style={{ padding: '0.6rem 1.2rem' }}>Log Out</button>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;

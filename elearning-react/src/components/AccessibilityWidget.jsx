import React, { useState, useEffect, useRef } from 'react';
import './AccessibilityWidget.css';

const AccessibilityWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [settings, setSettings] = useState({
        largeText: false,
        highContrast: false,
        dyslexicFont: false,
        highlightLinks: false,
        greyscale: false,
    });
    
    const widgetRef = useRef(null);

    useEffect(() => {
        // Apply classes to body based on settings
        const body = document.body;
        
        settings.largeText ? body.classList.add('a11y-large-text') : body.classList.remove('a11y-large-text');
        settings.highContrast ? body.classList.add('a11y-high-contrast') : body.classList.remove('a11y-high-contrast');
        settings.dyslexicFont ? body.classList.add('a11y-dyslexic-font') : body.classList.remove('a11y-dyslexic-font');
        settings.highlightLinks ? body.classList.add('a11y-highlight-links') : body.classList.remove('a11y-highlight-links');
        settings.greyscale ? body.classList.add('a11y-greyscale') : body.classList.remove('a11y-greyscale');
        
    }, [settings]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (widgetRef.current && !widgetRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSetting = (setting) => {
        setSettings(prev => ({
            ...prev,
            [setting]: !prev[setting]
        }));
    };

    return (
        <div className="a11y-widget-container" ref={widgetRef}>
            {isOpen && (
                <div className="a11y-menu">
                    <div className="a11y-header">
                        <h3>Accessibility Tools</h3>
                        <button className="a11y-close-btn" onClick={() => setIsOpen(false)}>
                            <i className="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div className="a11y-options">
                        <button 
                            className={`a11y-option-btn ${settings.largeText ? 'active' : ''}`}
                            onClick={() => toggleSetting('largeText')}
                        >
                            <i className="fa-solid fa-text-height"></i>
                            <span>Large Text</span>
                        </button>
                        <button 
                            className={`a11y-option-btn ${settings.highContrast ? 'active' : ''}`}
                            onClick={() => toggleSetting('highContrast')}
                        >
                            <i className="fa-solid fa-circle-half-stroke"></i>
                            <span>High Contrast</span>
                        </button>
                        <button 
                            className={`a11y-option-btn ${settings.dyslexicFont ? 'active' : ''}`}
                            onClick={() => toggleSetting('dyslexicFont')}
                        >
                            <i className="fa-solid fa-font"></i>
                            <span>Dyslexia Friendly</span>
                        </button>
                        <button 
                            className={`a11y-option-btn ${settings.highlightLinks ? 'active' : ''}`}
                            onClick={() => toggleSetting('highlightLinks')}
                        >
                            <i className="fa-solid fa-link"></i>
                            <span>Highlight Links</span>
                        </button>
                        <button 
                            className={`a11y-option-btn ${settings.greyscale ? 'active' : ''}`}
                            onClick={() => toggleSetting('greyscale')}
                        >
                            <i className="fa-solid fa-eye"></i>
                            <span>Greyscale</span>
                        </button>
                    </div>
                </div>
            )}
            <button 
                className="a11y-toggle-btn" 
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Toggle Accessibility Menu"
                title="Accessibility Options"
            >
                <i className="fa-solid fa-universal-access"></i>
            </button>
        </div>
    );
};

export default AccessibilityWidget;

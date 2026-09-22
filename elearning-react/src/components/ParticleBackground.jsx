import React, { useEffect, useRef } from 'react';

const ParticleBackground = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let width = canvas.width = window.innerWidth;
        let height = canvas.height = window.innerHeight;

        // Data Matrix characters: All alphabets and numbers (evenly distributed)
        const chars = '0123456789'.split('');

        const fontSize = 16;
        let columns = width / fontSize;
        const drops = [];

        // Initialize drops at random heights so they don't all fall in a straight line initially
        for (let x = 0; x < columns; x++) {
            drops[x] = Math.random() * (height / fontSize);
        }

        let animationFrameId;
        let lastTime = 0;
        const fps = 25; // Slightly slower than 60fps looks better for Matrix rain
        const interval = 1000 / fps;

        const draw = () => {
            // Check current theme to adjust colors dynamically
            const isDark = document.body.getAttribute('data-theme') === 'dark';

            // Translucent background to create trail effect
            // We use a very low opacity of the background color to let the previous frames fade out
            ctx.fillStyle = isDark ? 'rgba(15, 23, 42, 0.15)' : 'rgba(255, 255, 255, 0.15)';
            ctx.fillRect(0, 0, width, height);

            // Brand color for the matrix rain (Red/Amber gradient-like feel)
            // Using a subtle red opacity so it doesn't distract from the actual content
            ctx.fillStyle = isDark ? 'rgba(239, 68, 68, 0.4)' : 'rgba(220, 38, 38, 0.3)';
            ctx.font = `${fontSize}px 'Outfit', monospace`;
            ctx.textAlign = 'center';

            for (let i = 0; i < drops.length; i++) {
                const text = chars[Math.floor(Math.random() * chars.length)];

                // Draw the character
                ctx.fillText(text, i * fontSize + (fontSize / 2), drops[i] * fontSize);

                // Reset drop to top randomly to keep continuous flow
                if (drops[i] * fontSize > height && Math.random() > 0.975) {
                    drops[i] = 0;
                }

                drops[i]++;
            }
        };

        const render = (time) => {
            animationFrameId = requestAnimationFrame(render);
            const delta = time - lastTime;

            if (delta > interval) {
                draw();
                lastTime = time - (delta % interval);
            }
        };

        animationFrameId = requestAnimationFrame(render);

        const handleResize = () => {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
            columns = width / fontSize;

            // Add new drops if width increased
            while (drops.length < columns) {
                drops.push(Math.random() * (height / fontSize));
            }
        };

        window.addEventListener('resize', handleResize);

        // Setup a MutationObserver to listen for theme changes so the matrix trail color adapts instantly
        const observer = new MutationObserver(() => {
            // Just force a full clear on theme change to prevent ugly trails
            const isDark = document.body.getAttribute('data-theme') === 'dark';
            ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
            ctx.fillRect(0, 0, width, height);
        });
        observer.observe(document.body, { attributes: true, attributeFilter: ['data-theme'] });

        return () => {
            cancelAnimationFrame(animationFrameId);
            window.removeEventListener('resize', handleResize);
            observer.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                display: 'block',
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none',
                opacity: 0.5
            }}
        />
    );
};

export default ParticleBackground;

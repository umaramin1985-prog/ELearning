import { useEffect } from 'react';

export default function useScrollAnimation() {
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const observeElements = () => {
      const selectors = [
        '.section', 
        '.about-card', 
        '.service-card', 
        '.course-card', 
        '.module-card', 
        '.hero-content',
        '.hero-image',
        '.feature-box'
      ];
      
      const elements = document.querySelectorAll(selectors.join(', '));
      elements.forEach(el => {
        if (!el.classList.contains('animate-on-scroll') && !el.classList.contains('animate-visible')) {
          el.classList.add('animate-on-scroll');
          observer.observe(el);
        }
      });
    };

    observeElements();

    const mutationObserver = new MutationObserver((mutations) => {
      let shouldObserve = false;
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length > 0) {
          shouldObserve = true;
        }
      });
      if (shouldObserve) {
        // Use requestAnimationFrame to let React finish rendering
        requestAnimationFrame(() => {
          observeElements();
        });
      }
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, []);
}

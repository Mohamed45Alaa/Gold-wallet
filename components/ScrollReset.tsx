'use client';

import { useEffect } from 'react';

export function ScrollReset() {
    useEffect(() => {
        // Enforce top scroll on mount
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

        // Optional: Handle aggressive browser scroll restoration
        if ('scrollRestoration' in history) {
            history.scrollRestoration = 'manual';
        }

        // Handle route changes / reloads specifically if needed for Next.js app router
        const handleUnload = () => {
            window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
        };

        window.addEventListener('beforeunload', handleUnload);
        return () => window.removeEventListener('beforeunload', handleUnload);

    }, []);

    return null;
}

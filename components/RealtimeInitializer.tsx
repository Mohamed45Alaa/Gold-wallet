'use client';

import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useStore } from '@/lib/store';
import { subscribeToGoldBars, subscribeToCashEntries, subscribeToSettings, subscribeToMeta } from '@/lib/services';

export function RealtimeInitializer() {
    const { setGoldBars, setCashEntries, setSettings, setMarketData, setHydrated, setUser, setUserMeta } = useStore();

    // 1. Auth & Firestore Subscriptions
    useEffect(() => {
        let unsubscribeGold: () => void;
        let unsubscribeCash: () => void;
        let unsubscribeSettings: () => void;

        const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
            setUser(user);

            if (user) {
                // STATE 3: AUTHENTICATED USER
                // Subscribe to PER-USER data
                unsubscribeGold = subscribeToGoldBars(user.uid, (bars) => {
                    setGoldBars(bars);
                });
                unsubscribeCash = subscribeToCashEntries(user.uid, (entries) => {
                    setCashEntries(entries);
                });
                unsubscribeSettings = subscribeToSettings(user.uid, (settings) => {
                    setSettings({
                        priceMode: settings.priceMode,
                        manualGramPrice: settings.manualGramPrice,
                        manualXauPrice: settings.manualXauPrice ?? null,
                        manualUsdPrice: settings.manualUsdPrice ?? null,
                        subscription: settings.subscription
                    });
                });

                // Subscribe to Meta (Onboarding)
                subscribeToMeta(user.uid, (meta) => {
                    setUserMeta(meta);
                });

                setHydrated(true); // Data flowing
            } else {
                // STATE 2: GUEST (user === null)
                // Clear Data
                setGoldBars([]);
                setCashEntries([]);
                setSettings({
                    priceMode: 'manualGram',
                    manualGramPrice: null,
                    manualXauPrice: null,
                    manualUsdPrice: null,
                    subscription: { active: false }
                });

                // CRITICAL: Render FULL Dashboard (Static Zero State)
                // DO NOT subscribe to anything (Private data is private)
                setHydrated(true);

                // Unsub if exists
                if (unsubscribeGold) unsubscribeGold();
                if (unsubscribeCash) unsubscribeCash();
                if (unsubscribeSettings) unsubscribeSettings();
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeGold) unsubscribeGold();
            if (unsubscribeCash) unsubscribeCash();
            if (unsubscribeSettings) unsubscribeSettings();
        };
    }, [setGoldBars, setCashEntries, setSettings, setHydrated, setUser, setUserMeta]);

    // 2. Market Data Polling (5s)
    useEffect(() => {
        const fetchGoldPrice = async () => {
            try {
                const res = await fetch('/api/prices');
                const data = await res.json();
                if (data.status === 'success') {
                    setMarketData(data.xauPrice, data.usdRate, data.saghaPrice || 0);
                }
            } catch (error) {
                console.error("Price fetch failed", error);
            }
        };

        fetchGoldPrice(); // Initial
        const interval = setInterval(fetchGoldPrice, 5000);

        return () => clearInterval(interval);
    }, [setMarketData]);

    return null; // Headless component
}

"use client";

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import { db } from './firebase';
import { GoldBar, CashEntry, Settings } from './types';

export function useGoldData() {
    const [data, setData] = useState<GoldBar[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = query(collection(db, 'goldBars'), orderBy('date', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as GoldBar));
            setData(items);
            setLoading(false);
        }, (err) => {
            console.error("Gold fetch error", err);
            setLoading(false);
        });
        return () => unsub();
    }, []);
    return { goldBars: data, loading };
}

export function useCashData() {
    const [data, setData] = useState<CashEntry[]>([]);

    useEffect(() => {
        const q = query(collection(db, 'cashEntries'), orderBy('date', 'desc'));
        const unsub = onSnapshot(q, (snap) => {
            const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as CashEntry));
            setData(items);
        });
        return () => unsub();
    }, []);
    return { cashEntries: data };
}

export function useSettings() {
    const [settings, setSettings] = useState<Settings | null>(null);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
            if (doc.exists()) {
                setSettings({ id: doc.id, ...doc.data() } as Settings);
            } else {
                setSettings({ id: 'global', manualGramPrice: null });
            }
        });
        return () => unsub();
    }, []);
    return { settings };
}

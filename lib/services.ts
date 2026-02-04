import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    onSnapshot,
    query,
    orderBy,
    Timestamp,
    setDoc
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface GoldBar {
    id: string;
    date: string; // ISO String for basic persistence
    weight: number;
    price: number; // Total Purchase Price (EGP)
    manufacturingCost: number; // Per Gram
    cashback: number; // Per Gram
    netCost: number; // (Price + (Mfg * Weight) - (Cashback * Weight)) - AUTO CALC ON CLIENT USUALLY, but schema says store derived?
    // Schema says: netCost is derived (AUTO). Let's calculate on save or just client?
    // User Prompt: "Derived (AUTO)" and listed in schema. Better to store it to lock it in time.

    isSold: boolean;
    soldPrice?: number;
    soldDate?: string;
}

export interface CashEntry {
    id: string;
    fullAmount: number;
    description: string;
    date: string;
}

export interface Subscription {
    active: boolean;
    startDate: Timestamp;
    endDate: Timestamp;
    plan: string;
    activatedBy?: string;
}

export interface GlobalSettings {
    priceMode: 'manualGram' | 'usdOunce' | 'auto';
    manualGramPrice: number | null;
    manualXauPrice?: number | null;
    manualUsdPrice?: number | null;
    subscription?: Subscription;
}

// Collections
const COLLECTION_GOLD = 'goldBars';
const COLLECTION_CASH = 'cashEntries';
const COLLECTION_SETTINGS = 'settings';

// --- Gold Bars ---

export const subscribeToGoldBars = (userId: string, callback: (bars: GoldBar[]) => void) => {
    // STRICT: users/{userId}/goldBars
    const q = query(collection(db, "users", userId, COLLECTION_GOLD), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const bars: GoldBar[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as GoldBar));
        callback(bars);
    });
};

export const addGoldBar = async (userId: string, bar: Omit<GoldBar, 'id'>) => {
    // STRICT: users/{userId}/goldBars
    await addDoc(collection(db, "users", userId, COLLECTION_GOLD), bar);
};

export const sellGoldBar = async (userId: string, id: string, soldPrice: number, soldDate: string) => {
    // STRICT: users/{userId}/goldBars/{id}
    const ref = doc(db, "users", userId, COLLECTION_GOLD, id);
    await updateDoc(ref, {
        isSold: true,
        soldPrice,
        soldDate
    });
};

export const deleteGoldBar = async (userId: string, id: string) => {
    // STRICT: users/{userId}/goldBars/{id}
    await deleteDoc(doc(db, "users", userId, COLLECTION_GOLD, id));
};

// --- Cash Entries ---

export const updateGoldBar = async (userId: string, id: string, data: Partial<GoldBar>) => {
    // STRICT: users/{userId}/goldBars/{id}
    const ref = doc(db, "users", userId, COLLECTION_GOLD, id);
    await updateDoc(ref, data);
};

export const updateGoldBarDate = async (userId: string, id: string, date: string) => {
    // STRICT: users/{userId}/goldBars/{id}
    // Update ONLY the date field to prevent undefined values
    const ref = doc(db, "users", userId, COLLECTION_GOLD, id);
    await updateDoc(ref, { date });
};

export const subscribeToCashEntries = (userId: string, callback: (entries: CashEntry[]) => void) => {
    // STRICT: users/{userId}/cashEntries
    const q = query(collection(db, "users", userId, COLLECTION_CASH), orderBy('date', 'desc'));
    return onSnapshot(q, (snapshot) => {
        const entries: CashEntry[] = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as CashEntry));
        callback(entries);
    });
};

export const addCashEntry = async (userId: string, entry: Omit<CashEntry, 'id'>) => {
    // STRICT: users/{userId}/cashEntries
    await addDoc(collection(db, "users", userId, COLLECTION_CASH), entry);
};

export const deleteCashEntry = async (userId: string, id: string) => {
    // STRICT: users/{userId}/cashEntries/{id}
    await deleteDoc(doc(db, "users", userId, COLLECTION_CASH, id));
};

export const updateCashEntry = async (
    userId: string,
    id: string,
    data: {
        fullAmount: number;
        description: string;
        date: string;
    }
) => {
    // STRICT: users/{userId}/cashEntries/{id}
    const ref = doc(db, "users", userId, COLLECTION_CASH, id);
    await updateDoc(ref, data);
};

// --- Settings ---

export const subscribeToSettings = (userId: string, callback: (settings: GlobalSettings) => void) => {
    // STRICT: users/{userId}/settings/global
    const ref = doc(db, "users", userId, COLLECTION_SETTINGS, 'global');
    return onSnapshot(ref, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data() as GlobalSettings);
        } else {
            // Create default if missing - ONLY if auth user
            if (userId) {
                const defaultSettings: GlobalSettings = {
                    priceMode: 'manualGram',
                    manualGramPrice: null,
                    manualXauPrice: null,
                    manualUsdPrice: null,
                    subscription: {
                        active: false,
                        startDate: Timestamp.now(),
                        endDate: Timestamp.now(),
                        plan: 'free'
                    }
                };
                setDoc(ref, defaultSettings).catch(e => console.error("Auto-create settings failed", e));
                callback(defaultSettings);
            } else {
                callback({ priceMode: 'manualGram', manualGramPrice: null });
            }
        }
    });
};

export const updateSettings = async (userId: string, data: Partial<GlobalSettings>) => {
    const ref = doc(db, "users", userId, COLLECTION_SETTINGS, 'global');
    await setDoc(ref, data, { merge: true });
};

export const updateManualGramPrice = async (userId: string, price: number | null) => {
    await updateSettings(userId, { manualGramPrice: price });
};

export const updateManualXauPrice = async (userId: string, price: number | null) => {
    await updateSettings(userId, { manualXauPrice: price });
};


// --- Meta / Onboarding ---

export const subscribeToMeta = (userId: string, callback: (meta: any) => void) => {
    const ref = doc(db, "users", userId, "meta", "onboarding");
    return onSnapshot(ref, (docSnap) => {
        if (docSnap.exists()) {
            callback(docSnap.data());
        } else {
            callback({ onboardingDone: false });
        }
    });
};

export const completeOnboarding = async (userId: string) => {
    const ref = doc(db, "users", userId, "meta", "onboarding");
    await setDoc(ref, { onboardingDone: true }, { merge: true });
};

// Migration and Meta Removed as per "NO migration" instruction.

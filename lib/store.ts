import { create } from 'zustand'
import { Timestamp } from 'firebase/firestore';

export type PriceMode = 'manualGram' | 'usdOunce' | 'auto';

export interface SubscriptionState {
    active: boolean;
    startDate?: Timestamp;
    endDate?: Timestamp;
    plan?: string;
}

interface GlobalState {
    // Market Data (Auto API)
    xauPrice: number;
    usdRate: number;
    saghaPrice: number;

    // User Settings & Manual Data
    priceMode: PriceMode;
    manualGramPrice: number | null;
    manualXauPrice: number | null;
    manualUsdPrice: number | null;

    subscription: SubscriptionState;

    // Legacy flags mapping to new system
    isManualMode: boolean; // Computed: priceMode === 'manualGram'
    isManualXauMode: boolean; // Computed: priceMode === 'usdOunce' (loosely)

    isHydrated: boolean;

    // Data
    goldBars: any[];
    cashEntries: any[];

    // Auth
    currentUser: any | null;
    userMeta: { onboardingDone: boolean } | null;
    setUser: (user: any | null) => void;
    setUserMeta: (meta: any) => void;
    isAdminAuthenticated: boolean;
    setAdminAuthenticated: (val: boolean) => void;

    // Actions
    setMarketData: (xau: number, usd: number, sagha: number) => void;
    setSettings: (settings: {
        priceMode?: PriceMode,
        manualGramPrice?: number | null,
        manualXauPrice?: number | null,
        manualUsdPrice?: number | null,
        subscription?: SubscriptionState
    }) => void;

    // Legacy Actions (Compatibility Wrappers)
    setManualGramPrice: (price: number | null) => void;
    toggleManualMode: () => void; // Now switches between Auto <-> Manual Gram
    setManualXauPrice: (price: number | null) => void;
    toggleManualXauMode: () => void; // Now switches Auto <-> Ounce Mode

    setHydrated: (state: boolean) => void;
    setGoldBars: (bars: any[]) => void;
    setCashEntries: (entries: any[]) => void;

    // Derived Helpers (The Core Logic)
    getEffectiveGramPrice: () => number; // Renamed for clarity, aliased to getGramPrice
    getGramPrice: () => number;
    getXauPrice: () => number;
    getUsdRate: () => number;

    getCashTotal: () => number;
    getGoldAssetsValue: () => number;
    getTotalProfit: () => number;
    getTotalPortfolioValue: () => number;
}

export const useStore = create<GlobalState>((set, get) => ({
    xauPrice: 0,
    usdRate: 0,
    saghaPrice: 0,

    // Default: Manual Gram Mode
    priceMode: 'manualGram',
    manualGramPrice: null,
    manualXauPrice: null,
    manualUsdPrice: null,

    subscription: { active: false },

    // Computed props (getters handled in components usually, but simple flags here for compat)
    isManualMode: true,
    isManualXauMode: false,

    isHydrated: false,
    goldBars: [],
    cashEntries: [],

    currentUser: null,
    userMeta: null,
    setUser: (user) => set({ currentUser: user }),
    setUserMeta: (meta) => set({ userMeta: meta }),
    isAdminAuthenticated: false,
    setAdminAuthenticated: (val) => set({ isAdminAuthenticated: val }),

    setMarketData: (xau, usd, sagha) => set({ xauPrice: xau, usdRate: usd, saghaPrice: sagha }),

    setSettings: (settings) => set((state) => {
        const newState = { ...state, ...settings };
        // Update compatibility flags
        newState.isManualMode = newState.priceMode === 'manualGram';
        newState.isManualXauMode = newState.priceMode === 'usdOunce';
        return newState;
    }),

    // Legacy Action Wrappers (maintain API for now, components will update)
    setManualGramPrice: (price) => set({ manualGramPrice: price }),
    toggleManualMode: () => set((state) => {
        const newMode = state.priceMode === 'manualGram' ? 'auto' : 'manualGram';
        return { priceMode: newMode, isManualMode: newMode === 'manualGram', isManualXauMode: false };
    }),

    setManualXauPrice: (price) => set({ manualXauPrice: price }),
    toggleManualXauMode: () => set((state) => {
        const newMode = state.priceMode === 'usdOunce' ? 'auto' : 'usdOunce';
        return { priceMode: newMode, isManualXauMode: newMode === 'usdOunce', isManualMode: false };
    }),

    setHydrated: (state: boolean) => set({ isHydrated: state }),
    setGoldBars: (bars) => set({ goldBars: bars }),
    setCashEntries: (entries) => set({ cashEntries: entries }),

    // --- CORE PRIORITY LOGIC ---
    getGramPrice: () => get().getEffectiveGramPrice(),

    getEffectiveGramPrice: () => {
        const {
            priceMode, subscription,
            manualGramPrice, manualXauPrice, manualUsdPrice,
            xauPrice: apiXau, usdRate: apiUsd
        } = get();

        const isSubActive = subscription?.active;

        if (isSubActive && priceMode === 'auto') {
            if (apiXau === 0 || apiUsd === 0) return 0;
            return (apiXau / 31.1035) * apiUsd;
        }

        if (priceMode === 'manualGram') {
            return manualGramPrice || 0;
        }

        if (priceMode === 'usdOunce') {
            const oz = manualXauPrice || 0;
            const usd = manualUsdPrice || 0;
            return (oz * usd) / 31.1035;
        }
        return 0;
    },

    getXauPrice: () => {
        const { priceMode, subscription, manualXauPrice, xauPrice: apiXau } = get();
        if (subscription?.active && priceMode === 'auto') return apiXau;
        if (priceMode === 'usdOunce') return manualXauPrice || 0;
        return apiXau;
    },

    getUsdRate: () => {
        const { priceMode, subscription, manualUsdPrice, usdRate: apiUsd } = get();
        if (subscription?.active && priceMode === 'auto') return apiUsd;
        if (priceMode === 'usdOunce') return manualUsdPrice || 0;
        return apiUsd;
    },

    getCashTotal: () => {
        const { cashEntries } = get();
        return cashEntries.reduce((acc, entry) => acc + (entry.fullAmount || 0), 0);
    },

    getGoldAssetsValue: () => {
        const { goldBars } = get();
        const currentGramPrice = get().getGramPrice();
        return goldBars.reduce((acc, bar) => {
            if (bar.isSold) return acc;
            return acc + (bar.weight * currentGramPrice);
        }, 0);
    },

    getTotalProfit: () => {
        const { goldBars } = get();
        const currentGramPrice = get().getGramPrice();

        return goldBars.reduce((acc, bar) => {
            const netCost = (bar.netCost !== undefined) ? bar.netCost : (bar.price - ((bar.cashback || 0) * bar.weight));
            if (bar.isSold && bar.soldPrice) {
                return acc + (bar.soldPrice - netCost);
            } else {
                const currentValue = bar.weight * currentGramPrice;
                return acc + (currentValue - netCost);
            }
        }, 0);
    },

    getTotalPortfolioValue: () => {
        const cash = get().getCashTotal();
        const gold = get().getGoldAssetsValue();
        return cash + gold;
    }
}))

import { create } from 'zustand'

interface GlobalState {
    // Market Data (Auto)
    xauPrice: number;
    usdRate: number;

    // Computed / User Settings
    manualGramPrice: number | null; // If set, overrides calculated gram price
    isManualMode: boolean;
    isHydrated: boolean;

    // Data
    goldBars: any[]; // Using specific types in a real app, strict typing below
    cashEntries: any[];

    // Auth
    currentUser: any | null;
    userMeta: { onboardingDone: boolean } | null;
    setUser: (user: any | null) => void;
    setUserMeta: (meta: any) => void;

    // Actions
    setMarketData: (xau: number, usd: number) => void;
    setManualGramPrice: (price: number | null) => void;
    toggleManualMode: () => void;
    setHydrated: (state: boolean) => void;
    setGoldBars: (bars: any[]) => void;
    setCashEntries: (entries: any[]) => void;

    // Derived Helpers (State accessors)
    getGramPrice: () => number;
    getCashTotal: () => number;
    getGoldAssetsValue: () => number;
    getTotalProfit: () => number;
    getTotalPortfolioValue: () => number;
}

export const useStore = create<GlobalState>((set, get) => ({
    xauPrice: 0,
    usdRate: 0,
    manualGramPrice: null,
    isManualMode: false,
    isHydrated: false,
    goldBars: [],
    cashEntries: [],

    currentUser: null,
    userMeta: null,
    setUser: (user) => set({ currentUser: user }),
    setUserMeta: (meta) => set({ userMeta: meta }),

    setMarketData: (xau, usd) => set({ xauPrice: xau, usdRate: usd }),

    setManualGramPrice: (price) => set({ manualGramPrice: price }),

    toggleManualMode: () => set((state) => ({ isManualMode: !state.isManualMode })),
    setHydrated: (state) => set({ isHydrated: state }),
    setGoldBars: (bars) => set({ goldBars: bars }),
    setCashEntries: (entries) => set({ cashEntries: entries }),

    getGramPrice: () => {
        const { xauPrice, usdRate, manualGramPrice, isManualMode } = get();
        if (isManualMode && manualGramPrice) {
            return manualGramPrice;
        }
        if (xauPrice === 0 || usdRate === 0) return 0;
        return (xauPrice / 31.1) * usdRate;
    },

    getCashTotal: () => {
        const { cashEntries } = get();
        return cashEntries.reduce((acc, entry) => acc + (entry.fullAmount || 0), 0);
    },

    getGoldAssetsValue: () => {
        const { goldBars } = get();
        const currentGramPrice = get().getGramPrice();
        // Sum of CURRENT VALUE of UNSOLD bars
        return goldBars.reduce((acc, bar) => {
            if (bar.isSold) return acc;
            return acc + (bar.weight * currentGramPrice);
        }, 0);
    },

    getTotalProfit: () => {
        const { goldBars } = get();
        const currentGramPrice = get().getGramPrice();

        return goldBars.reduce((acc, bar) => {
            // Net Cost logic: Price - (Cashback * Weight)
            // (Assuming normalized data in bar: weight, price, cashback)
            const netCost = (bar.netCost !== undefined) ? bar.netCost : (bar.price - ((bar.cashback || 0) * bar.weight));

            if (bar.isSold && bar.soldPrice) {
                // Realized P/L
                return acc + (bar.soldPrice - netCost);
            } else {
                // Unrealized P/L
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

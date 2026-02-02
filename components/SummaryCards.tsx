'use client';

import { useStore } from '@/lib/store';
import { useMemo } from 'react';
import { formatCurrency } from '@/lib/format';
import { GoldBar, CashEntry } from '@/lib/services';
import { Coins, Wallet, TrendingUp } from 'lucide-react';

export function SummaryCards() {
    const { getCashTotal, getGoldAssetsValue, getTotalProfit, isHydrated } = useStore();

    if (!isHydrated) return null;

    // We can just call them directly in the body since they read current state?
    // BUT Zustand hooks selector vs vanilla get():
    // The component needs to RE-RENDER when state changes.
    // 'useStore()' (lines 10) subscribes to the WHOLE store. 
    // So any state change triggers re-render, and we just call getters.
    // This is performant enough for this size app.

    const goldTotal = getGoldAssetsValue();
    const cashTotal = getCashTotal();
    const totalPL = getTotalProfit();

    // Stats object for backward compat with return JSX
    const stats = { goldTotal, cashTotal, totalPL };

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 w-full mb-8 md:mb-12">
            {/* Gold Assets */}
            <div className="relative p-6 rounded-2xl bg-card border shadow-[0_0_20px_rgba(255,215,0,0.15)] overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Coins className="w-24 h-24 text-gold" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-muted-foreground font-medium mb-2">أصول الذهب</h3>
                    <div className="flex items-baseline dir-ltr">
                        <span className="numeric text-3xl font-bold text-foreground">
                            {formatCurrency(stats.goldTotal)}
                        </span>
                        <span className="ms-1 text-sm text-muted-foreground">ج.م</span>
                    </div>
                </div>
            </div>

            {/* Available Cash */}
            <div className="relative p-6 rounded-2xl bg-card border shadow-[0_0_20px_rgba(16,185,129,0.15)] overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="w-24 h-24 text-emerald-500" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-muted-foreground font-medium mb-2">السيولة المتاحة</h3>
                    <div className="flex items-baseline dir-ltr">
                        <span className="numeric text-3xl font-bold text-foreground">
                            {formatCurrency(stats.cashTotal)}
                        </span>
                        <span className="ms-1 text-sm text-muted-foreground">ج.م</span>
                    </div>
                </div>
            </div>

            {/* Probability / Loss */}
            <div className={`relative p-6 rounded-2xl bg-card border overflow-hidden ${stats.totalPL >= 0 ? 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'shadow-[0_0_20px_rgba(239,68,68,0.15)]'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className={`w-24 h-24 ${stats.totalPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-muted-foreground font-medium mb-2">الأرباح / الخسائر</h3>
                    <div className={`flex items-baseline dir-ltr ${stats.totalPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                        <span className="numeric text-3xl font-bold">
                            {stats.totalPL > 0 ? '+' : ''}{formatCurrency(stats.totalPL)}
                        </span>
                        <span className="ms-1 text-sm opacity-80">ج.م</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

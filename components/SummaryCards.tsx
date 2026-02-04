'use client';

import { useStore } from '@/lib/store';
import { useMemo } from 'react';
import { formatCurrency } from '@/lib/format';
import { GoldBar, CashEntry } from '@/lib/services';
import { Coins, Wallet, TrendingUp, PieChart } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SummaryCards() {
    const { getCashTotal, getGoldAssetsValue, getTotalProfit, isHydrated } = useStore();

    if (!isHydrated) return null;

    const goldTotal = getGoldAssetsValue();
    const cashTotal = getCashTotal();
    const totalPL = getTotalProfit();
    const portfolioTotal = goldTotal + cashTotal;

    const stats = { goldTotal, cashTotal, totalPL, portfolioTotal };

    return (
        <div className="flex flex-col gap-4 md:grid md:grid-cols-3 md:gap-6 w-full mb-8 md:mb-12">

            {/* 1. Portfolio Total (Mobile Order: 1) */}
            <div className="order-1 md:hidden relative p-6 rounded-2xl bg-card border shadow-[0_0_20px_rgba(255,255,255,0.1)] overflow-hidden text-center">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <PieChart className="w-24 h-24 text-primary" />
                </div>
                <div className="relative z-10 w-full">
                    <h3 className="text-muted-foreground font-medium mb-2">إجمالي المحفظة</h3>
                    <div className="flex items-baseline justify-center dir-ltr">
                        <span className="numeric text-4xl font-bold text-foreground">
                            {formatCurrency(stats.portfolioTotal)}
                        </span>
                        <span className="ms-1 text-sm text-muted-foreground">ج.م</span>
                    </div>
                </div>
            </div>

            {/* 2. Liquidity (Mobile Order: 2) */}
            <div className={cn(
                "order-2 md:order-none",
                "relative p-6 rounded-2xl bg-card border shadow-[0_0_20px_rgba(16,185,129,0.15)] overflow-hidden text-center md:text-start"
            )}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Wallet className="w-24 h-24 text-emerald-500" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-muted-foreground font-medium mb-2">السيولة المتاحة</h3>
                    <div className="flex items-baseline justify-center md:justify-start dir-ltr">
                        <span className="numeric text-3xl font-bold text-foreground">
                            {formatCurrency(stats.cashTotal)}
                        </span>
                        <span className="ms-1 text-sm text-muted-foreground">ج.م</span>
                    </div>
                </div>
            </div>

            {/* 3. Gold Assets (Mobile Order: 3) */}
            <div className={cn(
                "order-3 md:order-none",
                "relative p-6 rounded-2xl bg-card border shadow-[0_0_20px_rgba(255,215,0,0.15)] overflow-hidden text-center md:text-start"
            )}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Coins className="w-24 h-24 text-gold" />
                </div>
                <div className="relative z-10">
                    <h3 className="text-muted-foreground font-medium mb-2">أصول الذهب</h3>
                    <div className="flex items-baseline justify-center md:justify-start dir-ltr">
                        <span className="numeric text-3xl font-bold text-foreground">
                            {formatCurrency(stats.goldTotal)}
                        </span>
                        <span className="ms-1 text-sm text-muted-foreground">ج.م</span>
                    </div>
                </div>
            </div>

            {/* 4. Profit / Loss (Mobile Order: 4) */}
            <div className={cn(
                "order-4 md:order-none",
                `relative p-6 rounded-2xl bg-card border overflow-hidden ${stats.totalPL >= 0 ? 'shadow-[0_0_20px_rgba(16,185,129,0.15)]' : 'shadow-[0_0_20px_rgba(239,68,68,0.15)]'} text-center md:text-start`
            )}>
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <TrendingUp className={`w-24 h-24 ${stats.totalPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                </div>
                <div className="relative z-10">
                    <h3 className="text-muted-foreground font-medium mb-2">الأرباح / الخسائر</h3>
                    <div className={`flex items-baseline justify-center md:justify-start dir-ltr ${stats.totalPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
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

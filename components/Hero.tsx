'use client';

import { useStore } from '@/lib/store';
import { useMemo } from 'react';
import { formatCurrency, formatNumber } from '@/lib/format';
import { GoldBar, CashEntry } from '@/lib/services';

export function Hero() {
    const { goldBars, cashEntries, getTotalPortfolioValue, isHydrated } = useStore();
    const hasData = goldBars.length > 0 || cashEntries.length > 0;
    const totalValue = getTotalPortfolioValue();

    if (!isHydrated) return null;

    return (
        <div className="w-full py-12 flex flex-col items-center justify-center text-center space-y-4">
            <h2 className="text-muted-foreground text-lg md:text-xl font-medium">
                إجمالي قيمة المحفظة
            </h2>
            <div className="flex flex-row items-baseline justify-center gap-2 dir-ltr" dir="ltr">
                <span className="text-xl text-muted-foreground/50 font-medium translate-y-[-4px]">
                    ج.م
                </span>
                <span className="text-6xl md:text-8xl font-bold numeric leading-none tracking-tighter text-foreground drop-shadow-2xl">
                    {formatNumber(totalValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>

            {!hasData && (
                <p className="text-sm text-muted-foreground mt-2 animate-pulse">
                    ابدأ بإضافة ذهب أو سيولة لعرض قيمة محفظتك
                </p>
            )}
        </div>
    );
}

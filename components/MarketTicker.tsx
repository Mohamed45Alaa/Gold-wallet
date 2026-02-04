'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Pencil, Hash, Calculator, Scale, Check, Coins, DollarSign, Store, Zap, Gem } from 'lucide-react';
import { updateSettings, GlobalSettings } from '@/lib/services';
import { signInWithGoogle } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useState, useEffect } from 'react';
import { AutoModeGate } from './AutoModeGate';
import { differenceInDays, differenceInHours } from 'date-fns';

export function MarketTicker() {
    const {
        priceMode,
        manualGramPrice,
        manualUsdPrice,
        manualXauPrice,
        xauPrice: apiXau,
        usdRate: apiUsd,
        saghaPrice,
        isHydrated,
        getEffectiveGramPrice,
        currentUser,
        subscription,
        setMarketData // Added Action
    } = useStore();

    // Computed States
    const isSubActive = subscription?.active;

    // Strict locking: If Sub Active, we are in Auto Mode (API ONLY). -> NOW RELAXED
    const isGramMode = priceMode === 'manualGram';
    const isOunceMode = priceMode === 'usdOunce';

    const [editingField, setEditingField] = useState<string | null>(null);

    // Temp state for editing
    const [editGram, setEditGram] = useState<string>('');
    const [editUsd, setEditUsd] = useState<string>('');
    const [editOunce, setEditOunce] = useState<string>('');
    const [timeLeft, setTimeLeft] = useState(30);
    const [isHighlight, setIsHighlight] = useState(false);
    const [nextData, setNextData] = useState<any>(null); // Buffer for pre-fetched data
    const [isFetching, setIsFetching] = useState(false);

    // Effect: Sync state when mode changes or data loads
    useEffect(() => {
        if (!editingField) {
            setEditGram(manualGramPrice?.toString() || '');
            setEditUsd(manualUsdPrice?.toString() || '');
            setEditOunce(manualXauPrice?.toString() || '');
        }
    }, [manualGramPrice, manualUsdPrice, manualXauPrice, editingField]);

    // Unified 30s Timer - ONLY when Auto Mode is active
    useEffect(() => {
        if (!isSubActive) {
            // Reset state when manual mode
            setTimeLeft(30);
            setIsHighlight(false);
            setIsFetching(false);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev > 0) return prev - 1;
                return prev;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isSubActive]);

    // Fetch and Update at 0s - ONLY in Auto Mode
    useEffect(() => {
        // Guard: Do nothing if manual mode
        if (!isSubActive) return;

        if (timeLeft === 0 && !isFetching) {
            setIsFetching(true);
            fetch('/api/prices')
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success') {
                        // Update both prices simultaneously
                        setMarketData(data.xauPrice, data.usdRate, data.saghaPrice || 0);

                        // Flash animation
                        setIsHighlight(true);
                        setTimeout(() => setIsHighlight(false), 1000);

                        // Reset timer AFTER successful update
                        setTimeLeft(30);
                    }
                    setIsFetching(false);
                })
                .catch(err => {
                    console.error("Price fetch failed", err);
                    setIsFetching(false);
                    setTimeLeft(30); // Reset even on error
                });
        }
    }, [timeLeft, isFetching, setMarketData, isSubActive]);

    const handleSave = async () => {
        if (!currentUser) return;

        const updates: Partial<GlobalSettings> = {};
        let newMode = priceMode;

        // Detect changes
        const gramChanged = editGram !== (manualGramPrice?.toString() || '');
        const usdChanged = editUsd !== (manualUsdPrice?.toString() || '');
        const ounceChanged = editOunce !== (manualXauPrice?.toString() || '');

        if (gramChanged) {
            const val = parseFloat(editGram);
            if (!isNaN(val)) updates.manualGramPrice = val;
            newMode = 'manualGram';
        }

        if (usdChanged || ounceChanged) {
            const u = parseFloat(editUsd);
            const o = parseFloat(editOunce);
            if (!isNaN(u)) updates.manualUsdPrice = u;
            if (!isNaN(o)) updates.manualXauPrice = o;

            // If Gram didn't change, we definitely switch to Ounce mode.
            // If both changed, we default to Ounce mode as it's more "fundamental" (User inputting base vars).
            if (!gramChanged || (usdChanged || ounceChanged)) {
                newMode = 'usdOunce';
            }
            // Optional: If user ONLY changed Gram, we stay in Gram mode (handled above).
            // If user changed ALL, the logic below prioritization overrides Gram mode if we want.
            // Let's stick to: If Ounce/USD touched -> Ounce Mode. If only Gram touched -> Gram Mode.
        }

        // Strict Override: If Gram changed, use Gram Mode? No, "Manual (Calc)" is often preferred if inputs exist.
        // Let's assume if user explicitly edits Ounce/USD, they want that math.

        updates.priceMode = newMode;

        await updateSettings(currentUser.uid, updates);
        setEditingField(null);
    };

    const handleModeChange = async (val: string) => {
        if (!currentUser) return;
        if (val === 'manualGram' || val === 'usdOunce' || val === 'auto') {
            await updateSettings(currentUser.uid, { priceMode: val as any });
        }
    };

    if (!isHydrated) return <div className="animate-pulse h-32 bg-muted rounded-xl"></div>;

    // Prices for display
    const displayGram = getEffectiveGramPrice();
    const displayOunce = (isSubActive && priceMode === 'auto') ? apiXau : (manualXauPrice || 0);
    const displayUsd = (isSubActive && priceMode === 'auto') ? apiUsd : (manualUsdPrice || 0);

    return (
        <div className="w-full relative">
            {/* New Floating Gate Component */}
            <AutoModeGate />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
                {/* Controls & Status */}
                <div className="md:col-span-3 flex flex-col md:flex-row justify-between items-center bg-card border rounded-lg p-3 gap-4 shadow-sm">

                    {/* Pricing Mode Toggle */}
                    {/* Pricing Mode Toggle */}
                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto">
                        <Label className="whitespace-nowrap text-muted-foreground text-xs md:text-sm">نظام التسعير:</Label>
                        <ToggleGroup
                            type="single"
                            value={priceMode}
                            onValueChange={handleModeChange}
                        >
                            <ToggleGroupItem value="auto" aria-label="Toggle auto" disabled={!isSubActive} className={!isSubActive ? "opacity-50 grayscale pointer-events-none" : ""}>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="text-xs md:text-sm">تلقائي (API)</span>
                                </div>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="usdOunce" aria-label="Toggle usd ounce">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="text-xs md:text-sm">يدوي (دولار + أونصة)</span>
                                </div>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="manualGram" aria-label="Toggle manual gram">
                                <div className="flex items-center gap-2">
                                    <Gem className="w-3 h-3 md:w-4 md:h-4" />
                                    <span className="text-xs md:text-sm">يدوي عيار 24</span>
                                </div>
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>

                    {/* Status Badge */}
                    <div className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full">
                        {isSubActive ? (
                            <>
                                <Zap className="w-4 h-4 text-emerald-500 fill-emerald-500" />
                                <span className="text-xs font-semibold text-emerald-600">تسعير تلقائي (API)</span>
                                <span className="text-xs font-mono text-emerald-600/80 border-r border-emerald-200 pr-2 mr-1 min-w-[3ch] inline-block text-center">
                                    {timeLeft}s
                                </span>
                            </>
                        ) : (
                            <>
                                <Pencil className="w-4 h-4 text-amber-500" />
                                <span className="text-xs text-muted-foreground">
                                    {isGramMode ? 'تسعير يدوي (جرام)' : 'تسعير يدوي (حسابي)'}
                                </span>
                            </>
                        )}
                    </div>
                </div>

                {/* 1. Gram Price (The Big One) */}
                <div className={`bg-gradient-to-br from-background to-muted border rounded-2xl p-4 md:p-6 relative overflow-hidden group flex flex-col justify-center items-center text-center h-[110px] md:h-[125px] ${isOunceMode ? 'opacity-50 grayscale' : ''}`}>
                    <div className="absolute top-0 right-0 p-3 md:p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Scale className="w-12 h-12 md:w-16 md:h-16 text-primary" />
                    </div>

                    <div className="relative z-10 w-full">
                        <div className="flex flex-col items-center md:flex-row justify-center items-center mb-1 md:mb-2 gap-2">
                            <h3 className="text-muted-foreground font-medium order-2 md:order-1 text-xs md:text-base">عيار 24 (محسوب)</h3>
                            {isGramMode && (
                                <Button variant="ghost" size="icon" className="h-5 w-5 md:h-6 md:w-6 order-1 md:order-2 mb-1 md:mb-0" onClick={() => setEditingField(editingField === 'gram' ? null : 'gram')}>
                                    <Pencil className="w-3 h-3" />
                                </Button>
                            )}
                        </div>

                        {editingField === 'gram' ? (
                            <div className="flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <Input
                                    autoFocus
                                    className="h-8 md:h-10 text-xl md:text-2xl font-bold numeric w-28 md:w-32"
                                    value={editGram}
                                    onChange={(e) => setEditGram(e.target.value)}
                                />
                                <Button size="icon" className="h-8 w-8" onClick={handleSave}><Check className="w-4 h-4" /></Button>
                            </div>
                        ) : (
                            <div className="flex items-baseline justify-center gap-1 dir-ltr">
                                <span className="text-2xl md:text-3xl font-bold tracking-tight numeric text-foreground">
                                    {formatNumber(displayGram)}
                                </span>
                                <span className="text-xs md:text-sm text-muted-foreground">ج.م</span>
                            </div>
                        )}

                        <p className="text-[10px] text-muted-foreground mt-1 md:mt-2 opacity-70">
                            {(isSubActive && priceMode === 'auto') ? 'يتم التحديث تلقائياً من السوق' :
                                isGramMode ? 'تم تحديد السعر يدوياً' :
                                    'محسوب: (الأونصة × الدولار) ÷ 31.10'}
                        </p>
                    </div>
                </div>

                {/* 2. Ounce Price */}
                <div className={`border rounded-2xl p-4 md:p-6 flex flex-col justify-center gap-2 md:gap-4 relative overflow-hidden items-center text-center h-[110px] md:h-[125px] ${isOunceMode ? 'bg-background ring-1 ring-primary/20' : 'bg-muted/30'} ${isGramMode ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-center items-center mb-1 md:mb-2 z-10 relative w-full gap-2">
                        <span className="text-xs md:text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                            <Coins className="w-3 h-3 md:w-4 md:h-4" /> الأونصة (XAU)
                        </span>
                        {isOunceMode && (
                            <Button variant="ghost" size="icon" className="h-5 w-5 md:h-6 md:w-6" onClick={() => setEditingField(editingField === 'ounce' ? null : 'ounce')}>
                                <Pencil className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                    {editingField === 'ounce' ? (
                        <div className="flex items-center justify-center gap-2 z-10 relative">
                            <Input
                                className="h-8 md:h-10 text-xl md:text-2xl font-bold numeric w-28 md:w-32"
                                value={editOunce}
                                onChange={(e) => setEditOunce(e.target.value)}
                            />
                            <Button size="icon" className="h-8 w-8" onClick={handleSave}><Check className="w-3 h-3" /></Button>
                        </div>
                    ) : (
                        <div className={`text-2xl md:text-3xl font-bold numeric dir-ltr z-10 relative transition-all duration-300 px-3 py-1 rounded-lg ${isHighlight ? 'bg-emerald-50 text-emerald-600 price-flash' : ''}`}>
                            ${formatNumber(displayOunce)}
                        </div>
                    )}
                </div>

                {/* 3. USD Rate */}
                <div className={`border rounded-2xl p-4 md:p-6 flex flex-col justify-center gap-2 md:gap-4 relative overflow-hidden items-center text-center h-[110px] md:h-[125px] ${isOunceMode ? 'bg-background ring-1 ring-primary/20' : 'bg-muted/30'} ${isGramMode ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-center items-center mb-1 md:mb-2 z-10 relative w-full gap-2">
                        <span className="text-xs md:text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                            <DollarSign className="w-3 h-3 md:w-4 md:h-4" /> سعر الدولار (USD)
                        </span>
                        {isOunceMode && (
                            <Button variant="ghost" size="icon" className="h-5 w-5 md:h-6 md:w-6" onClick={() => setEditingField(editingField === 'usd' ? null : 'usd')}>
                                <Pencil className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                    {editingField === 'usd' ? (
                        <div className="flex items-center justify-center gap-2 z-10 relative">
                            <Input
                                className="h-8 md:h-10 text-xl md:text-2xl font-bold numeric w-28 md:w-32"
                                value={editUsd}
                                onChange={(e) => setEditUsd(e.target.value)}
                            />
                            <Button size="icon" className="h-8 w-8" onClick={handleSave}><Check className="w-3 h-3" /></Button>
                        </div>
                    ) : (
                        <div className={`text-2xl md:text-3xl font-bold numeric dir-ltr z-10 relative transition-all duration-300 px-3 py-1 rounded-lg ${isHighlight ? 'bg-emerald-50 text-emerald-600 price-flash' : ''}`}>
                            {formatNumber(displayUsd)}
                        </div>
                    )}
                </div>



            </div>
        </div>
    );
}

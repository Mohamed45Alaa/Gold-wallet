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
        subscription
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

    // Effect: Sync state when mode changes or data loads
    useEffect(() => {
        if (!editingField) {
            setEditGram(manualGramPrice?.toString() || '');
            setEditUsd(manualUsdPrice?.toString() || '');
            setEditOunce(manualXauPrice?.toString() || '');
        }
    }, [manualGramPrice, manualUsdPrice, manualXauPrice, editingField]);

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
                    <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                        <Label className="whitespace-nowrap text-muted-foreground">نظام التسعير:</Label>
                        <ToggleGroup
                            type="single"
                            value={priceMode}
                            onValueChange={handleModeChange}
                            className="dir-ltr"
                        >
                            <ToggleGroupItem value="auto" aria-label="Toggle auto" disabled={!isSubActive} className={!isSubActive ? "opacity-50 grayscale pointer-events-none" : ""}>
                                <div className="flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    <span>تلقائي (API)</span>
                                </div>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="usdOunce" aria-label="Toggle usd ounce">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4" />
                                    <span>يدوي (دولار + أونصة)</span>
                                </div>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="manualGram" aria-label="Toggle manual gram">
                                <div className="flex items-center gap-2">
                                    <Gem className="w-4 h-4" />
                                    <span>يدوي عيار 24</span>
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
                <div className={`bg-gradient-to-br from-background to-muted border rounded-xl p-6 relative overflow-hidden group flex flex-col items-center text-center ${isOunceMode ? 'opacity-50 grayscale' : ''}`}>
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Scale className="w-16 h-16 text-primary" />
                    </div>

                    <div className="relative z-10 w-full">
                        <div className="flex flex-col items-center md:flex-row justify-center items-center mb-2 gap-2">
                            <h3 className="text-muted-foreground font-medium order-2 md:order-1">عيار 24 (محسوب)</h3>
                            {isGramMode && (
                                <Button variant="ghost" size="icon" className="h-6 w-6 order-1 md:order-2 mb-2 md:mb-0" onClick={() => setEditingField(editingField === 'gram' ? null : 'gram')}>
                                    <Pencil className="w-3 h-3" />
                                </Button>
                            )}
                        </div>

                        {editingField === 'gram' ? (
                            <div className="flex items-center justify-center gap-2 animate-in fade-in slide-in-from-top-2">
                                <Input
                                    autoFocus
                                    className="h-10 text-2xl font-bold numeric w-32"
                                    value={editGram}
                                    onChange={(e) => setEditGram(e.target.value)}
                                />
                                <Button size="icon" onClick={handleSave}><Check className="w-4 h-4" /></Button>
                            </div>
                        ) : (
                            <div className="flex items-baseline justify-center gap-1 dir-ltr">
                                <span className="text-3xl font-bold tracking-tight numeric text-foreground">
                                    {formatNumber(displayGram)}
                                </span>
                                <span className="text-sm text-muted-foreground">ج.م</span>
                            </div>
                        )}

                        <p className="text-[10px] text-muted-foreground mt-2 opacity-70">
                            {(isSubActive && priceMode === 'auto') ? 'يتم التحديث تلقائياً من السوق' :
                                isGramMode ? 'تم تحديد السعر يدوياً' :
                                    'محسوب: (الأونصة × الدولار) ÷ 31.10'}
                        </p>
                    </div>
                </div>

                {/* 2. Ounce Price */}
                <div className={`border rounded-xl p-6 flex flex-col justify-center gap-4 relative overflow-hidden items-center text-center ${isOunceMode ? 'bg-background ring-1 ring-primary/20' : 'bg-muted/30'} ${isGramMode ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-center items-center mb-2 z-10 relative w-full gap-2">
                        <span className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                            <Coins className="w-4 h-4" /> الأونصة (XAU)
                        </span>
                        {isOunceMode && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingField(editingField === 'ounce' ? null : 'ounce')}>
                                <Pencil className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                    {editingField === 'ounce' ? (
                        <div className="flex items-center justify-center gap-2 z-10 relative">
                            <Input
                                className="h-10 text-2xl font-bold numeric w-32"
                                value={editOunce}
                                onChange={(e) => setEditOunce(e.target.value)}
                            />
                            <Button size="icon" className="h-8 w-8" onClick={handleSave}><Check className="w-3 h-3" /></Button>
                        </div>
                    ) : (
                        <div className="text-3xl font-bold numeric dir-ltr z-10 relative">
                            ${formatNumber(displayOunce)}
                        </div>
                    )}
                </div>

                {/* 3. USD Rate */}
                <div className={`border rounded-xl p-6 flex flex-col justify-center gap-4 relative overflow-hidden items-center text-center ${isOunceMode ? 'bg-background ring-1 ring-primary/20' : 'bg-muted/30'} ${isGramMode ? 'opacity-50 grayscale' : ''}`}>
                    <div className="flex justify-center items-center mb-2 z-10 relative w-full gap-2">
                        <span className="text-sm text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                            <DollarSign className="w-4 h-4" /> سعر الدولار (USD)
                        </span>
                        {isOunceMode && (
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditingField(editingField === 'usd' ? null : 'usd')}>
                                <Pencil className="w-3 h-3" />
                            </Button>
                        )}
                    </div>

                    {editingField === 'usd' ? (
                        <div className="flex items-center justify-center gap-2 z-10 relative">
                            <Input
                                className="h-10 text-2xl font-bold numeric w-32"
                                value={editUsd}
                                onChange={(e) => setEditUsd(e.target.value)}
                            />
                            <Button size="icon" className="h-8 w-8" onClick={handleSave}><Check className="w-3 h-3" /></Button>
                        </div>
                    ) : (
                        <div className="text-3xl font-bold numeric dir-ltr z-10 relative">
                            {formatNumber(displayUsd)}
                        </div>
                    )}
                </div>



            </div>
        </div>
    );
}

'use client';

import { useStore } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/format';
import { Pencil, RotateCcw } from 'lucide-react';
import { updateManualGramPrice } from '@/lib/services';
import { signInWithGoogle } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"

export function MarketTicker() {
    const { xauPrice, usdRate, getGramPrice, manualGramPrice, isManualMode, toggleManualMode, currentUser } = useStore();
    const gramPrice = getGramPrice();

    // Local state for editing manual price
    const [editPrice, setEditPrice] = useState<string>('');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (manualGramPrice) {
            setEditPrice(manualGramPrice.toString());
        }
    }, [manualGramPrice]);

    const handleSaveManual = async () => {
        const val = parseFloat(editPrice);
        if (!isNaN(val) && val > 0) {
            if (!currentUser) {
                await signInWithGoogle();
                return;
            }
            await updateManualGramPrice(currentUser.uid, val);
            if (!isManualMode) toggleManualMode(); // Auto-enable manual mode on save
            setIsOpen(false);
        }
    };

    const handleClearManual = async () => {
        if (!currentUser) {
            await signInWithGoogle();
            return;
        }
        await updateManualGramPrice(currentUser.uid, null);
        if (isManualMode && manualGramPrice) toggleManualMode(); // Disable manual mode if it was on
        setEditPrice('');
        setIsOpen(false);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full mb-8">
            {/* Ounce Price */}
            <div className="flex flex-col items-center p-4 bg-card/50 rounded-xl border backdrop-blur-sm">
                <span className="text-sm text-muted-foreground mb-1">سعر الأونصة (XAU)</span>
                <span className="numeric text-2xl font-bold text-gold">
                    ${formatNumber(xauPrice, { maximumFractionDigits: 2 })}
                </span>
            </div>

            {/* USD Rate */}
            <div className="flex flex-col items-center p-4 bg-card/50 rounded-xl border backdrop-blur-sm">
                <span className="text-sm text-muted-foreground mb-1">سعر الدولار (Sagha)</span>
                <span className="numeric text-2xl font-bold text-emerald-400">
                    ${formatCurrency(usdRate)}
                </span>
            </div>

            {/* Gram Price */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <div className="relative flex flex-col items-center p-4 bg-card/50 rounded-xl border backdrop-blur-sm ring-1 ring-gold/20">
                    <span className="text-sm text-muted-foreground mb-1 flex items-center gap-2">
                        سعر الجرام (عيار 24)
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-4 w-4 text-muted-foreground hover:text-foreground">
                                <Pencil className="h-3 w-3" />
                            </Button>
                        </DialogTrigger>
                    </span>
                    <div className="flex items-baseline dir-ltr">
                        <span className={`numeric text-3xl font-bold ${isManualMode && manualGramPrice ? 'text-amber-500' : 'text-foreground'}`}>
                            {formatCurrency(gramPrice)}
                        </span>
                        <span className="ms-1 text-sm text-muted-foreground">ج.م</span>
                    </div>
                    {isManualMode && manualGramPrice && (
                        <span className="absolute top-2 right-2 text-[10px] bg-amber-500/20 text-amber-500 px-1.5 py-0.5 rounded">
                            يدوي
                        </span>
                    )}
                </div>

                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل سعر الجرام يدوياً</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                        <div className="flex items-center gap-2">
                            <Input
                                type="number"
                                value={editPrice}
                                onChange={(e) => setEditPrice(e.target.value)}
                                placeholder="أدخل السعر..."
                                className="numeric text-left"
                            />
                        </div>
                        <div className="flex justify-between">
                            <Button variant="outline" onClick={handleClearManual} className="text-destructive">
                                إلغاء التعديل اليدوي
                            </Button>
                            <Button onClick={handleSaveManual}>
                                حفظ
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

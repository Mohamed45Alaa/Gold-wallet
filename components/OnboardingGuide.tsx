'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { completeOnboarding } from '@/lib/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, Check } from 'lucide-react';

export function OnboardingGuide() {
    const { currentUser, userMeta } = useStore();
    const [step, setStep] = useState(0); // 0=Idle, 1=Gold, 2=Cash

    useEffect(() => {
        if (currentUser && userMeta && userMeta.onboardingDone === false && step === 0) {
            // Start onboarding
            setStep(1);
        }
    }, [currentUser, userMeta, step]);

    useEffect(() => {
        if (step === 1) {
            const el = document.getElementById('gold-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else if (step === 2) {
            const el = document.getElementById('cash-section');
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [step]);

    const handleNext = async () => {
        if (step === 1) {
            setStep(2);
        } else if (step === 2) {
            if (currentUser) {
                await completeOnboarding(currentUser.uid);
            }
            setStep(0);
        }
    };

    if (step === 0) return null;

    return (
        <div className="fixed bottom-10 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-sm px-4">
            <Card className="shadow-2xl border-2 border-primary/20 bg-background/95 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-10">
                <CardContent className="p-6 relative">
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-background p-1 rounded-full border border-border">
                        <ArrowUp className="w-6 h-6 text-primary animate-bounce" />
                    </div>

                    <div className="text-center space-y-3 pt-2">
                        <h3 className="font-bold text-lg">
                            {step === 1 ? "سجّل ذهبك من هنا" : "سجّل أصولك النقدية من هنا"}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                            {step === 1
                                ? "تابع قيمة استثمارك لحظة بلحظة واعرف مكسبك أو خسارتك بسهولة"
                                : "اعرف السيولة المتاحة واحسب إجمالي محفظتك بدقة"
                            }
                        </p>
                        <Button onClick={handleNext} className="w-full gap-2">
                            {step === 1 ? "التالي" : "فهمت، ابدأ الآن"}
                            {step === 2 && <Check className="w-4 h-4" />}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Backdrop for focus */}
            <div className="fixed inset-0 bg-background/50 z-[-1] backdrop-blur-[1px]" onClick={handleNext} />
        </div>
    );
}

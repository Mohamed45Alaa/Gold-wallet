'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { updateSettings } from '@/lib/services';
import { Timestamp } from 'firebase/firestore';
import { addMonths, addWeeks, addDays, addMinutes, differenceInDays, differenceInHours, differenceInMinutes } from 'date-fns';
import { Lock, Unlock, Zap, Timer, CheckCircle2, ShieldAlert, XCircle, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";

const ADMIN_PASSWORD = "2303150";

export function AutoModeGate() {
    const { currentUser, subscription, priceMode, setSettings, isAdminAuthenticated, setAdminAuthenticated } = useStore();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [duration, setDuration] = useState('1M'); // Default
    const [showStatus, setShowStatus] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isSubActive = subscription?.active;

    // Countdown Logic
    const endDate = subscription?.endDate ? subscription.endDate.toDate() : new Date();
    const now = new Date();
    const daysLeft = isSubActive ? Math.max(0, differenceInDays(endDate, now)) : 0;
    const hoursLeft = isSubActive ? Math.max(0, differenceInHours(endDate, now) % 24) : 0;
    const minutesLeft = isSubActive ? Math.max(0, differenceInMinutes(endDate, now) % 60) : 0;

    // Strict timestamp check for expiration (fix for short durations)
    const isExpired = isSubActive && now.getTime() >= endDate.getTime();

    // Auto-Revert if expired
    useEffect(() => {
        if (isExpired && isSubActive && currentUser) {
            updateSettings(currentUser.uid, {
                subscription: {
                    active: false,
                    startDate: Timestamp.fromMillis(0),
                    endDate: Timestamp.fromMillis(0),
                    plan: ''
                },
                priceMode: 'manualGram' // Revert to Manual
            });
        }
    }, [isExpired, isSubActive, currentUser]);

    // Celebration Timer
    useEffect(() => {
        if (showCelebration) {
            const timer = setTimeout(() => {
                setShowCelebration(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [showCelebration]);

    if (!mounted) return null;

    const handleLogin = () => {
        if (password === ADMIN_PASSWORD) {
            setAdminAuthenticated(true);
            setPassword(''); // Clear password immediately after success
            setError('');
        } else {
            setError('كلمة المرور غير صحيحة');
        }
    };

    const handleActivate = async () => {
        if (!currentUser) return;

        let start = new Date();
        let end = new Date();
        let planLabel = "";

        // Parse duration
        if (duration.endsWith('min')) {
            const val = parseInt(duration);
            end = addMinutes(start, val);
            planLabel = `${val} Minute(s)`;
        } else if (duration.endsWith('d')) {
            const val = parseInt(duration);
            end = addDays(start, val);
            planLabel = `${val} Day(s)`;
        } else if (duration.endsWith('w')) {
            const val = parseInt(duration);
            end = addWeeks(start, val);
            planLabel = `${val} Week(s)`;
        } else if (duration.endsWith('M')) {
            const val = parseInt(duration);
            end = addMonths(start, val);
            planLabel = `${val} Month(s)`;
        } else {
            // Fallback old behavior (months)
            const val = parseInt(duration);
            end = addMonths(start, val);
            planLabel = `${val} Month(s)`;
        }

        await updateSettings(currentUser.uid, {
            subscription: {
                active: true,
                startDate: Timestamp.fromDate(start),
                endDate: Timestamp.fromDate(end),
                plan: planLabel
            },
            priceMode: 'auto'
        });

        setIsOpen(false);
        setAdminAuthenticated(false); // Require password next time
        setPassword('');
        setShowCelebration(true); // Trigger celebration
    };

    const handleCancel = async () => {
        if (!currentUser) return;

        await updateSettings(currentUser.uid, {
            subscription: {
                active: false,
                startDate: Timestamp.fromMillis(0),
                endDate: Timestamp.fromMillis(0),
                plan: ''
            },
            priceMode: 'manualGram'
        });
    };

    if (showCelebration) {
        return (
            <div className="fixed inset-0 z-[9999999] bg-black/90 backdrop-blur-md flex flex-col items-center justify-center text-center animate-in fade-in duration-500">
                <div className="scale-150 mb-8 animate-bounce duration-2000">
                    <div className="bg-yellow-500/20 p-8 rounded-full ring-4 ring-yellow-500/30 shadow-[0_0_100px_rgba(234,179,8,0.4)]">
                        <PartyPopper className="w-24 h-24 text-yellow-400" />
                    </div>
                </div>
                <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-yellow-400 to-yellow-200 mb-4 animate-pulse leading-relaxed pb-2">
                    مرحباً بك في النخبة!
                </h1>
                <p className="text-xl text-yellow-100/80 mb-8 max-w-md leading-relaxed">
                    تم تفعيل الاشتراك بنجاح. استمتع بمتابعة الأسعار الحية لحظة بلحظة.
                </p>
                <div className="flex gap-2">
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping delay-0"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping delay-150"></div>
                    <div className="w-3 h-3 bg-yellow-400 rounded-full animate-ping delay-300"></div>
                </div>
            </div>
        );
    }

    if (isSubActive && !isExpired) {
        // ACTIVE STATE FLOATING TRIGGER (Badge)
        if (!showStatus) {
            return (
                <div
                    className="fixed top-6 right-6 z-[999999] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200"
                    onClick={() => setShowStatus(true)}
                >
                    <div className="bg-emerald-950/80 backdrop-blur-xl border border-emerald-500/30 w-[160px] justify-center px-4 py-1.5 rounded-full shadow-[0_4px_20px_rgba(16,185,129,0.15)] flex items-center gap-2 group hover:shadow-[0_4px_25px_rgba(16,185,129,0.25)] transition-shadow">
                        <div className="bg-emerald-500/20 p-1.5 rounded-full relative">
                            <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400" />
                            <div className="absolute inset-0 bg-emerald-400/20 rounded-full animate-ping opacity-50"></div>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest leading-none group-hover:text-white transition-colors">
                            Auto Active
                        </span>
                    </div>
                </div>
            );
        }

        // FULL STATUS WINDOW (Modal)
        return (
            <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                <Card className="w-full max-w-sm bg-emerald-950/95 border-emerald-500/30 shadow-[0_0_50px_rgba(16,185,129,0.2)] relative animate-in zoom-in-95 duration-200">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-2 right-2 text-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-900/50"
                        onClick={() => setShowStatus(false)}
                    >
                        <span className="text-xl">×</span>
                    </Button>

                    <div className="p-8 flex flex-col items-center text-center space-y-6">
                        <div className="bg-emerald-500/10 p-4 rounded-full ring-1 ring-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                            <Zap className="w-8 h-8 text-emerald-400 fill-emerald-400/20" />
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-bold text-emerald-100 uppercase tracking-wide">Auto Mode Active</h2>
                            <p className="text-emerald-500/70 text-xs">Live prices directly from global markets</p>
                        </div>

                        <div className="flex flex-col items-center gap-1 bg-black/20 w-full py-4 rounded-xl border border-emerald-500/100">
                            <span className="text-xs text-emerald-500/60 uppercase tracking-widest mb-1">Time Remaining</span>
                            <div className="flex items-baseline gap-2 text-3xl font-mono font-bold text-emerald-400 tracking-wider">
                                {daysLeft > 0 && <span>{daysLeft}<span className="text-sm ml-1 text-emerald-600">d</span></span>}
                                <span>{hoursLeft}<span className="text-sm ml-1 text-emerald-600">h</span></span>
                                <span>{minutesLeft}<span className="text-sm ml-1 text-emerald-600">m</span></span>
                            </div>
                        </div>

                        <Button
                            variant="destructive"
                            className="w-full gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-900/50 hover:border-red-500/50 transition-all shadow-none hover:shadow-[0_0_20px_rgba(239,68,68,0.1)]"
                            onClick={() => {
                                handleCancel();
                                setShowStatus(false);
                            }}
                        >
                            <XCircle className="w-4 h-4" />
                            End Subscription
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // INACTIVE STATE TRIGGER
    if (!isOpen) {
        if (!currentUser) return null; // Hide if not logged in

        return (
            <div className="fixed top-4 right-4 z-[50] flex items-center h-10 md:h-12">
                <Button
                    onClick={() => { setIsOpen(true); setPassword(''); }} // Clear password on open
                    className="w-auto md:w-[220px] bg-background/80 hover:bg-background/90 backdrop-blur border shadow-xl gap-2 h-full rounded-full group transition-all px-4"
                    variant="outline"
                >
                    <div className="bg-muted p-1 rounded-full group-hover:bg-primary/20 transition-colors">
                        <Lock className="w-4 h-4 text-muted-foreground group-hover:text-primary" />
                    </div>
                    <span className="font-semibold text-xs md:text-sm text-muted-foreground group-hover:text-foreground">تفعيل تلقائي</span>
                </Button>
            </div>
        );
    }

    // FULL GATE UI
    return (
        <div className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-sm flex items-start md:items-center justify-center p-4 pt-12 md:pt-4">
            <Card className="w-full max-w-sm bg-card border-primary/20 shadow-[0_0_50px_rgba(234,179,8,0.1)] relative">
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => { setIsOpen(false); setAdminAuthenticated(false); setPassword(''); }}
                >
                    <span className="text-xl">×</span>
                </Button>

                <div className="p-6 space-y-6">
                    <div className="text-center space-y-2">
                        <div className="inline-flex p-3 rounded-full bg-primary/10 mb-2">
                            <ShieldAlert className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold">تفعيل التسعير التلقائي</h2>
                        <p className="text-xs text-muted-foreground">يتطلب هذا الوضع اشتراكاً نشطاً للوصول إلى الأسعار الحية من السوق العالمية.</p>
                    </div>

                    {!isAdminAuthenticated ? (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">كلمة مرور المسؤول</label>
                                <Input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="•••••••••"
                                    className="text-center tracking-[0.5em] font-mono"
                                    autoComplete="new-password"
                                />
                                {error && <p className="text-xs text-destructive text-center font-medium">{error}</p>}
                            </div>
                            <Button className="w-full font-bold" onClick={handleLogin}>
                                دخول
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2 mb-4">
                                <Unlock className="w-4 h-4 text-green-500" />
                                <span className="text-xs text-green-600 font-semibold">تم التحقق بنجاح</span>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">اختر مدة الاشتراك</label>
                                <Select value={duration} onValueChange={setDuration}>
                                    <SelectTrigger className="w-full text-center font-bold">
                                        <SelectValue placeholder="المدة" />
                                    </SelectTrigger>
                                    <SelectContent dir="rtl" className="z-[9999999] w-[--radix-select-trigger-width] max-h-[300px]">
                                        <SelectItem value="1min">1 دقيقة (Test)</SelectItem>
                                        <SelectItem value="10min">10 دقائق (Test)</SelectItem>
                                        <SelectItem value="1d">1 يوم (24 Hours)</SelectItem>
                                        <SelectItem value="1w">1 أسبوع (7 Days)</SelectItem>
                                        <SelectItem value="1M">شهر واحد (1 Month)</SelectItem>
                                        <SelectItem value="3M">3 أشهر (3 Months)</SelectItem>
                                        <SelectItem value="6M">6 أشهر (6 Months)</SelectItem>
                                        <SelectItem value="9M">9 أشهر (9 Months)</SelectItem>
                                        <SelectItem value="12M">سنة كاملة (12 Months)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
                                onClick={handleActivate}
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                تنشيط الآن
                            </Button>
                        </div>
                    )}
                </div>
            </Card>
        </div>
    );
}

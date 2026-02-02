'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { formatCurrency, formatNumber } from '@/lib/format';
import { formatDateDDMMYYYY, getTodayISO } from '@/lib/date';

import { addCashEntry, deleteCashEntry, updateCashEntry } from '@/lib/services';
import { signInWithGoogle } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, PlusCircle, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArabicHybridDateInput } from '@/components/ArabicHybridDateInput';

export function CashManagement() {
    const { cashEntries, currentUser } = useStore();
    const [amount, setAmount] = useState('');
    const [desc, setDesc] = useState('');
    const [date, setDate] = useState(getTodayISO());
    const [editEntry, setEditEntry] = useState<null | {
        id: string;
        fullAmount: string;
        description: string;
        date: string;
    }>(null);

    const handleAdd = async () => {
        let user = currentUser;

        if (!user) {
            alert("يجب تسجيل الدخول بجوجل أولاً");
            try {
                user = await signInWithGoogle();
                if (!user) return;
            } catch (e) {
                return;
            }
        }

        if (!amount) return;

        await addCashEntry(user.uid, {
            fullAmount: parseFloat(amount),
            description: desc || 'إيداع نقدي',
            date: date
        });
        setAmount('');
        setDesc('');
    };

    return (
        <div id="cash-section" className="w-full space-y-6">
            <div className="flex flex-col md:flex-row gap-6">
                {/* Add Form */}
                <Card className="w-full md:w-1/3 h-fit">
                    <CardHeader>
                        <CardTitle className="text-lg">إضافة سيولة</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>المبلغ (EGP)</Label>
                            <Input type="number" className="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                        </div>
                        <div className="space-y-2">
                            <Label>الوصف</Label>
                            <Input type="text" value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="مثال: بيع سبيكة..." />
                        </div>
                        <div className="space-y-2">
                            <Label>التاريخ</Label>
                            <ArabicHybridDateInput
                                value={date}
                                onChange={setDate}
                            />
                        </div>
                        <Button onClick={handleAdd} className="w-full gap-2">
                            <PlusCircle className="w-4 h-4" /> إضافة
                        </Button>
                    </CardContent>
                </Card>

                {/* List */}
                <div className="w-full md:w-2/3">
                    {/* Desktop Table */}
                    <div className="hidden md:block rounded-md border bg-card/50">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="text-center">التاريخ</TableHead>
                                    <TableHead className="text-center">الوصف</TableHead>
                                    <TableHead className="text-center">المبلغ</TableHead>
                                    <TableHead className="text-center">تعديل</TableHead>
                                    <TableHead className="text-center">حذف</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {cashEntries.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-12 text-muted-foreground text-sm">
                                            لا توجد عمليات
                                        </TableCell>
                                    </TableRow>
                                )}
                                {cashEntries.map((entry) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="numeric text-center">{formatDateDDMMYYYY(entry.date)}</TableCell>
                                        <TableCell className="text-center">{entry.description}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-baseline justify-center gap-1 dir-ltr text-emerald-500" dir="ltr">
                                                <span className="text-xs text-muted-foreground opacity-70">ج.م</span>
                                                <span className="numeric font-semibold">{formatNumber(entry.fullAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => setEditEntry({
                                                id: entry.id,
                                                fullAmount: String(entry.fullAmount),
                                                description: entry.description,
                                                date: entry.date,
                                            })}>
                                                <Pencil className="w-4 h-4 text-amber-500" />
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Button variant="ghost" size="icon" onClick={() => {
                                                if (!currentUser) return alert("يجب تسجيل الدخول بجوجل أولاً");
                                                deleteCashEntry(currentUser.uid, entry.id);
                                            }}>
                                                <Trash2 className="w-4 h-4 text-destructive/50 hover:text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Mobile Card Grid */}
                    <div className="grid grid-cols-1 gap-3 md:hidden">
                        {cashEntries.length === 0 && (
                            <div className="text-center py-8 text-muted-foreground border rounded-md bg-card/50">لا توجد عمليات</div>
                        )}
                        {cashEntries.map((entry) => (
                            <div key={entry.id} className="p-4 rounded-xl border bg-card flex justify-between items-center">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-baseline gap-1 dir-ltr text-emerald-500" dir="ltr">
                                        <span className="text-[10px] text-muted-foreground opacity-70">ج.م</span>
                                        <span className="numeric font-bold text-lg">{formatNumber(entry.fullAmount, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="text-sm text-foreground">{entry.description}</div>
                                    <div className="text-xs text-muted-foreground numeric">{formatDateDDMMYYYY(entry.date)}</div>
                                </div>
                                <div className="flex -me-2">
                                    <Button variant="ghost" size="icon" onClick={() => setEditEntry({
                                        id: entry.id,
                                        fullAmount: String(entry.fullAmount),
                                        description: entry.description,
                                        date: entry.date,
                                    })}>
                                        <Pencil className="w-4 h-4 text-amber-500" />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => {
                                        if (!currentUser) return alert("يجب تسجيل الدخول بجوجل أولاً");
                                        deleteCashEntry(currentUser.uid, entry.id);
                                    }}>
                                        <Trash2 className="w-4 h-4 text-destructive/50 hover:text-destructive" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Edit Dialog */}
            <Dialog open={!!editEntry} onOpenChange={(o) => !o && setEditEntry(null)}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>تعديل السيولة</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>المبلغ</Label>
                            <Input
                                type="number"
                                className="numeric"
                                value={editEntry?.fullAmount || ''}
                                onChange={(e) =>
                                    setEditEntry(prev => prev ? { ...prev, fullAmount: e.target.value } : null)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>الوصف</Label>
                            <Input
                                type="text"
                                value={editEntry?.description || ''}
                                onChange={(e) =>
                                    setEditEntry(prev => prev ? { ...prev, description: e.target.value } : null)
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>التاريخ</Label>
                            {editEntry && (
                                <ArabicHybridDateInput
                                    value={editEntry.date}
                                    onChange={(val) => setEditEntry(prev => prev ? { ...prev, date: val } : null)}
                                />
                            )}
                        </div>

                        <Button
                            onClick={async () => {
                                if (!currentUser) return alert("يجب تسجيل الدخول بجوجل أولاً");
                                if (editEntry) {
                                    await updateCashEntry(currentUser.uid, editEntry.id, {
                                        fullAmount: Number(editEntry.fullAmount),
                                        description: editEntry.description,
                                        date: editEntry.date,
                                    });
                                    setEditEntry(null);
                                }
                            }}
                            className="w-full"
                        >
                            حفظ التعديل
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

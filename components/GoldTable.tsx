'use client';

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { addGoldBar, sellGoldBar, deleteGoldBar, updateGoldBar, updateGoldBarDate, GoldBar } from '@/lib/services';
// import { updateGoldBar } from '@/lib/actions'; // REMOVED to avoid type conflict
import { signInWithGoogle } from '@/lib/auth';
import { formatDateDDMMYYYY, getTodayISO } from '@/lib/date';
import { formatCurrency, formatNumber } from '@/lib/format';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArabicHybridDateInput } from '@/components/ArabicHybridDateInput';
import { Plus, Trash2, Gavel, Eye } from 'lucide-react';
// GoldBar imported above

export function GoldTable() {
    const { goldBars, getGramPrice, currentUser } = useStore();
    const currentGramPrice = getGramPrice();

    // Add Bar State
    const [isAddOpen, setIsAddOpen] = useState(false);
    const [newBar, setNewBar] = useState({
        weight: '',
        price: '',
        manufacturingCost: '',
        cashback: '',
        date: getTodayISO()
    });

    // Sell Bar State
    const [sellId, setSellId] = useState<string | null>(null);
    const [sellPrice, setSellPrice] = useState('');
    const [sellDate, setSellDate] = useState(getTodayISO());

    // View/Edit Bar State
    const [viewBar, setViewBar] = useState<GoldBar | null>(null);
    const [editDate, setEditDate] = useState('');

    const handleAdd = async () => {
        let user = currentUser;

        if (!user) {
            alert("يجب تسجيل الدخول بجوجل أولاً");
            try {
                user = await signInWithGoogle();
                if (!user) return; // User cancelled
            } catch (e) {
                return; // Error handled in auth
            }
        }

        if (!newBar.weight || !newBar.price) return;

        const weight = parseFloat(newBar.weight);
        const price = parseFloat(newBar.price);
        const mfg = parseFloat(newBar.manufacturingCost) || 0;
        const cashback = parseFloat(newBar.cashback) || 0;

        const netCost = price - (cashback * weight);

        await addGoldBar(user.uid, {
            weight,
            price,
            manufacturingCost: mfg,
            cashback,
            netCost,
            date: newBar.date,
            isSold: false
        });

        setIsAddOpen(false);
        setNewBar({ weight: '', price: '', manufacturingCost: '', cashback: '', date: new Date().toISOString().split('T')[0] });
    };

    const handleSell = async () => {
        if (!sellId || !sellPrice || !currentUser) {
            if (!currentUser) alert("يجب تسجيل الدخول بجوجل أولاً");
            return;
        }
        await sellGoldBar(currentUser.uid, sellId, parseFloat(sellPrice), sellDate);
        setSellId(null);
        setSellPrice('');
    };

    const handleDelete = async (id: string) => {
        if (!currentUser) {
            alert("يجب تسجيل الدخول بجوجل أولاً");
            return;
        }
        await deleteGoldBar(currentUser.uid, id);
    }

    const handleUpdateDate = async () => {
        if (!currentUser || !viewBar || !editDate) return;
        await updateGoldBarDate(currentUser.uid, viewBar.id, editDate);
        // Update local state to reflect immediately if needed, or wait for realtime
        setViewBar({ ...viewBar, date: editDate });
    };

    const openView = (bar: GoldBar) => {
        setViewBar(bar);
        setEditDate(bar.date);
    };

    return (
        <div id="gold-section" className="w-full space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <h3 className="text-xl font-semibold">سبائك الذهب</h3>

                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                    <Button
                        onClick={async () => {
                            if (!currentUser) {
                                await signInWithGoogle();
                                return;
                            }
                            setIsAddOpen(true);
                        }}
                        className="gap-2 w-full md:w-auto"
                    >
                        <Plus className="w-4 h-4" /> إضافة سبيكة
                    </Button>
                    <DialogContent dir="rtl">
                        <DialogHeader>
                            <DialogTitle>إضافة سبيكة جديدة</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>التاريخ</Label>
                                    <ArabicHybridDateInput
                                        value={newBar.date}
                                        onChange={(iso) => setNewBar({ ...newBar, date: iso })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>الوزن (جرام)</Label>
                                    <Input type="number" step="0.01" className="numeric" value={newBar.weight} onChange={(e) => setNewBar({ ...newBar, weight: e.target.value })} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>إجمالي سعر الشراء (شامل المصنعية)</Label>
                                <Input type="number" step="0.01" className="numeric" value={newBar.price} onChange={(e) => setNewBar({ ...newBar, price: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>المصنعية (لكل جرام)</Label>
                                    <Input type="number" step="0.01" className="numeric" value={newBar.manufacturingCost} onChange={(e) => setNewBar({ ...newBar, manufacturingCost: e.target.value })} />
                                </div>
                                <div className="space-y-2">
                                    <Label>الكاش باك (لكل جرام)</Label>
                                    <Input type="number" step="0.01" className="numeric" value={newBar.cashback} onChange={(e) => setNewBar({ ...newBar, cashback: e.target.value })} />
                                </div>
                            </div>
                            <Button onClick={handleAdd} className="w-full mt-2">حفظ</Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="text-center">التاريخ</TableHead>
                            <TableHead className="text-center">الوزن</TableHead>
                            <TableHead className="text-center">صافي الذهب</TableHead>
                            <TableHead className="text-center">القيمة الحالية / البيع</TableHead>
                            <TableHead className="text-center">الربح / الخسارة</TableHead>
                            <TableHead className="text-center">إجراءات</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {goldBars.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
                                    لا توجد سبائك مسجلة
                                </TableCell>
                            </TableRow>
                        )}
                        {goldBars.map((bar) => {
                            const netCost = bar.netCost || (bar.price - (bar.cashback * bar.weight));
                            let currentValue = 0;
                            let pl = 0;
                            let isProfit = false;

                            if (bar.isSold && bar.soldPrice) {
                                currentValue = bar.soldPrice;
                                pl = bar.soldPrice - netCost;
                            } else {
                                currentValue = bar.weight * currentGramPrice;
                                pl = currentValue - netCost;
                            }
                            isProfit = pl >= 0;

                            return (
                                <TableRow key={bar.id} className={`${bar.isSold ? 'opacity-60 bg-muted/50' : ''}`}>
                                    <TableCell className="numeric text-center">{formatDateDDMMYYYY(bar.date)}</TableCell>
                                    <TableCell className="numeric text-center">{formatNumber(bar.weight, { maximumFractionDigits: 2 })}g</TableCell>
                                    <TableCell className="text-center">
                                        <div className="flex items-baseline justify-center gap-1 dir-ltr" dir="ltr">
                                            <span className="text-xs text-muted-foreground opacity-70">ج.م</span>
                                            <span className="numeric font-semibold">{formatNumber(netCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="numeric text-center">
                                        {bar.isSold ? (
                                            <div className="flex items-center justify-center gap-1 dir-ltr opacity-70" dir="ltr">
                                                <span className="text-xs text-muted-foreground line-through decoration-transparent">ج.م</span>
                                                <span className="numeric font-medium text-muted-foreground line-through decoration-transparent">{formatNumber(currentValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                <span className="text-[10px] text-muted-foreground no-underline">(مباع)</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-baseline justify-center gap-1 dir-ltr" dir="ltr">
                                                <span className="text-xs text-muted-foreground opacity-70">ج.م</span>
                                                <span className="numeric">{formatNumber(currentValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <div className={`flex items-baseline justify-center gap-1 dir-ltr font-bold ${isProfit ? 'text-profit' : 'text-loss'}`} dir="ltr">
                                            <span className="text-xs opacity-70">ج.م</span>
                                            <span className="numeric">{isProfit ? '+' : ''}{formatNumber(pl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="flex justify-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => openView(bar)}>
                                            <Eye className="w-4 h-4 text-primary" />
                                        </Button>
                                        {!bar.isSold && (
                                            <Button variant="ghost" size="icon" onClick={() => setSellId(bar.id)}>
                                                <Gavel className="w-4 h-4 text-amber-500" />
                                            </Button>
                                        )}
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(bar.id)}>
                                            <Trash2 className="w-4 h-4 text-destructive/50 hover:text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile Card Grid */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
                {goldBars.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground border rounded-md bg-card/50">لايوجد سبائك مسجلة</div>
                )}
                {goldBars.map((bar) => {
                    const netCost = bar.netCost || (bar.price - (bar.cashback * bar.weight));
                    let currentValue = 0;
                    let pl = 0;
                    let isProfit = false;
                    if (bar.isSold && bar.soldPrice) {
                        currentValue = bar.soldPrice;
                        pl = bar.soldPrice - netCost;
                    } else {
                        currentValue = bar.weight * currentGramPrice;
                        pl = currentValue - netCost;
                    }
                    isProfit = pl >= 0;

                    return (
                        <div key={bar.id} className={`p-4 rounded-xl border bg-card ${bar.isSold ? 'opacity-70 bg-muted/30' : ''}`}>
                            <div className="flex flex-col items-center mb-4 border-b pb-2 gap-1 text-center">
                                <span className="numeric font-bold text-lg text-primary">{formatDateDDMMYYYY(bar.date)}</span>
                                <span className="text-xs text-muted-foreground font-medium">تاريخ الشراء</span>
                            </div>
                            <div className="flex flex-col gap-3 text-sm">
                                <div className="flex justify-between items-center border-b border-muted/30 pb-2 mb-1">
                                    <span className="numeric font-bold dir-ltr text-lg">{formatNumber(bar.weight, { maximumFractionDigits: 2 })}g</span>
                                    <span className="text-xs text-muted-foreground">الوزن</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-baseline dir-ltr gap-1" dir="ltr">
                                        <span className="text-[10px] text-muted-foreground opacity-70">ج.م</span>
                                        <span className="numeric font-bold text-base">{formatNumber(netCost, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">صافي الذهب</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className="flex items-baseline dir-ltr">
                                        {bar.isSold ? (
                                            <div className="flex items-center gap-2 opacity-70" dir="ltr">
                                                <span className="text-[10px] text-muted-foreground no-underline">(مباع)</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-[10px] text-muted-foreground line-through decoration-transparent">ج.م</span>
                                                    <span className="numeric font-medium text-muted-foreground line-through decoration-transparent">{formatNumber(currentValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex items-baseline gap-1 dir-ltr" dir="ltr">
                                                <span className="text-[10px] text-muted-foreground opacity-70">ج.م</span>
                                                <span className="numeric font-bold text-foreground text-base">{formatNumber(currentValue, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-xs text-muted-foreground">القيمة الحالية</span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <div className={`flex items-baseline dir-ltr gap-1 font-bold ${isProfit ? 'text-profit' : 'text-loss'}`} dir="ltr">
                                        <span className="text-[10px] opacity-70">ج.م</span>
                                        <span className="numeric text-base">{isProfit ? '+' : ''}{formatNumber(pl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">الربح/الخسارة</span>
                                </div>
                            </div>
                            <div className="flex justify-center gap-4 mt-6 pt-2 border-t">
                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full" onClick={() => openView(bar)}>
                                    <Eye className="w-5 h-5 text-primary" />
                                </Button>
                                {!bar.isSold && (
                                    <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-amber-500/30 hover:bg-amber-500/10" onClick={() => setSellId(bar.id)}>
                                        <Gavel className="w-5 h-5 text-amber-500" />
                                    </Button>
                                )}
                                <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-destructive/30 hover:bg-destructive/10" onClick={() => handleDelete(bar.id)}>
                                    <Trash2 className="w-5 h-5 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Sell Dialog */}
            <Dialog open={!!sellId} onOpenChange={(open) => !open && setSellId(null)}>
                <DialogContent dir="rtl">
                    <DialogHeader>
                        <DialogTitle>بيع السبيكة</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>تاريخ البيع</Label>
                            <ArabicHybridDateInput
                                value={sellDate}
                                onChange={setSellDate}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>سعر البيع الاجمالي</Label>
                            <Input type="number" className="numeric" value={sellPrice} onChange={(e) => setSellPrice(e.target.value)} placeholder="المبلغ المستلم..." />
                        </div>
                        <Button onClick={handleSell} className="w-full">تأكيد البيع</Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* View/Detail Dialog */}
            <Dialog open={!!viewBar} onOpenChange={(open) => !open && setViewBar(null)}>
                <DialogContent dir="rtl" className="max-w-lg border-0 shadow-[0_0_0_1px_rgba(255,255,255,0.05),0_20px_60px_rgba(0,0,0,0.6),0_0_40px_rgba(59,130,246,0.15)]">
                    <DialogHeader>
                        <DialogTitle>تفاصيل السبيكة</DialogTitle>
                    </DialogHeader>
                    {viewBar && (() => {
                        const netCost = viewBar.netCost || (viewBar.price - (viewBar.cashback * viewBar.weight));
                        let currentValue = 0;
                        let pl = 0;
                        if (viewBar.isSold && viewBar.soldPrice) {
                            currentValue = viewBar.soldPrice;
                            pl = viewBar.soldPrice - netCost;
                        } else {
                            currentValue = viewBar.weight * currentGramPrice;
                            pl = currentValue - netCost;
                        }
                        const isProfit = pl >= 0;

                        const renderCurrency = (val: number, colorClass: string = "text-foreground") => (
                            <div className={`flex items-baseline justify-start gap-1 dir-ltr ${colorClass}`} dir="ltr">
                                <span className="text-[10px] text-muted-foreground opacity-70">ج.م</span>
                                <span className="numeric font-bold text-lg">{formatNumber(val, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                        );

                        return (
                            <div className="space-y-6">
                                {/* Editable Date Section */}
                                <div className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-2">
                                        <Label>التاريخ</Label>
                                        <ArabicHybridDateInput
                                            value={editDate}
                                            onChange={setEditDate}
                                        />
                                    </div>
                                    <Button onClick={handleUpdateDate} disabled={editDate === viewBar.date}>
                                        حفظ التعديل
                                    </Button>
                                </div>

                                {/* Financial Details Table */}
                                <div className="border rounded-md overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-muted/50">
                                            <tr>
                                                <th className="px-4 py-3 text-right font-medium text-muted-foreground vertical-align-middle">البيان</th>
                                                <th className="px-4 py-3 text-left font-medium text-muted-foreground vertical-align-middle">القيمة</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {/* Static Data */}
                                            <tr>
                                                <td className="px-4 py-3 text-muted-foreground font-medium align-middle">الوزن</td>
                                                <td className="px-4 py-3 align-middle">
                                                    <div className="flex items-baseline justify-start gap-1 dir-ltr" dir="ltr">
                                                        <span className="numeric font-bold text-lg">{formatNumber(viewBar.weight)}</span>
                                                        <span className="text-[10px] text-muted-foreground opacity-70">g</span>
                                                    </div>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-muted-foreground font-medium align-middle">سعر الشراء الكلي</td>
                                                <td className="px-4 py-3 align-middle">
                                                    {renderCurrency(viewBar.price, "text-amber-500")}
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="px-4 py-3 text-muted-foreground font-medium align-middle">صافي الذهب</td>
                                                <td className="px-4 py-3 align-middle">
                                                    {renderCurrency(netCost)}
                                                </td>
                                            </tr>

                                            {/* Divider */}
                                            <tr className="border-b border-muted/50">
                                                <td colSpan={2} className="p-0 h-2 bg-muted/10"></td>
                                            </tr>

                                            {/* Dynamic Data */}
                                            <tr>
                                                <td className="px-4 py-3 text-muted-foreground font-medium align-middle">{viewBar.isSold ? 'سعر البيع' : 'القيمة الحالية'}</td>
                                                <td className="px-4 py-3 align-middle">
                                                    {renderCurrency(currentValue, "text-amber-500")}
                                                </td>
                                            </tr>
                                            <tr className={isProfit ? 'bg-green-500/5' : 'bg-red-500/5'}>
                                                <td className={`px-4 py-3 font-medium align-middle ${isProfit ? 'text-green-600' : 'text-red-600'}`}>الربح / الخسارة</td>
                                                <td className="px-4 py-3 align-middle">
                                                    <div className={`flex items-baseline justify-start gap-1 dir-ltr ${isProfit ? 'text-green-600' : 'text-red-600'}`} dir="ltr">
                                                        <span className="text-[10px] opacity-70">ج.م</span>
                                                        <span className="numeric font-bold text-lg">{isProfit ? '+' : ''}{formatNumber(pl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>
        </div>
    );
}

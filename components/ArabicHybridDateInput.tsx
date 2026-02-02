"use client"

import { useState, useEffect } from "react"
import { CalendarIcon, Check } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { normalizeDigits } from "@/lib/format"
import { isValidDate } from "@/lib/date"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"

const AR_MONTHS = [
    { name: "يناير", value: "01" },
    { name: "فبراير", value: "02" },
    { name: "مارس", value: "03" },
    { name: "أبريل", value: "04" },
    { name: "مايو", value: "05" },
    { name: "يونيو", value: "06" },
    { name: "يوليو", value: "07" },
    { name: "أغسطس", value: "08" },
    { name: "سبتمبر", value: "09" },
    { name: "أكتوبر", value: "10" },
    { name: "نوفمبر", value: "11" },
    { name: "ديسمبر", value: "12" },
]

function pad(v: string | number) {
    return String(v).padStart(2, "0")
}

export function ArabicHybridDateInput({ value, onChange }: { value: string, onChange: (iso: string) => void }) {
    const [open, setOpen] = useState(false)
    const [text, setText] = useState("")

    // Parse ISO to DD/MM/YYYY for display
    useEffect(() => {
        if (!value) return
        const [y, m, d] = value.split("-")
        if (y && m && d) {
            setText(`${pad(d)}/${pad(m)}/${y}`)
        }
    }, [value])

    // Handle Manual Input (Masking)
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // 1. Normalize Arabic digits to Latin immediately
        const raw = normalizeDigits(e.target.value)

        // 2. Strip non-digits and slashes (we re-add slashes logic)
        let v = raw.replace(/[^0-9]/g, "")

        // 3. Strict Input Masking & Guardrails
        // Day Part (0-2 chars)
        if (v.length >= 2) {
            const dayPart = parseInt(v.slice(0, 2))
            if (dayPart > 31) v = "31" + v.slice(2) // Cap day at 31
            if (dayPart === 0 && v.length >= 2) v = "01" + v.slice(2) // Min day 01
        }

        // Month Part (3-4 chars)
        if (v.length >= 4) {
            const monthPart = parseInt(v.slice(2, 4))
            if (monthPart > 12) v = v.slice(0, 2) + "12" + v.slice(4) // Cap month at 12
            if (monthPart === 0) v = v.slice(0, 2) + "01" + v.slice(4) // Min month 01
        }

        // Auto-insert slashes for visual formatting
        if (v.length > 2) {
            v = v.slice(0, 2) + "/" + v.slice(2)
        }
        if (v.length > 5) {
            v = v.slice(0, 5) + "/" + v.slice(5)
        }
        if (v.length > 10) {
            v = v.slice(0, 10)
        }

        setText(v)

        // 4. Semantic Validation before Emit
        if (v.length === 10) {
            const [d, m, y] = v.split("/")
            const day = parseInt(d)
            const month = parseInt(m)
            const year = parseInt(y)

            if (isValidDate(year, month, day)) {
                // Formatting ensures padded output: 2026-02-05
                onChange(`${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`)
            } else {
                console.warn("Invalid date entered:", v)
            }
        }
    }

    // Modal State
    const [tempY, setTempY] = useState("2026")
    const [tempM, setTempM] = useState("01")
    const [tempD, setTempD] = useState("01")

    const handleOpen = () => {
        if (value) {
            const [y, m, d] = value.split("-")
            setTempY(y)
            setTempM(m)
            setTempD(d)
        } else {
            const now = new Date()
            setTempY(String(now.getFullYear()))
            setTempM(pad(now.getMonth() + 1))
            setTempD(pad(now.getDate()))
        }
        setOpen(true)
    }

    const handleConfirm = () => {
        // Confirm from modal is assumed valid selection logic, but double check
        const y = parseInt(tempY)
        const m = parseInt(tempM)
        const d = parseInt(tempD)

        if (isValidDate(y, m, d)) {
            onChange(`${tempY}-${tempM}-${tempD}`)
            setOpen(false)
        } else {
            // Should be impossible via UI selection, but safe to guard
            console.error("Invalid date selection from modal")
        }
    }

    // Auto-scroll to selected year
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                const el = document.getElementById(`year-${tempY}`)
                el?.scrollIntoView({
                    block: "center",
                    behavior: "instant"
                })
            }, 0)
            return () => clearTimeout(timer)
        }
    }, [open, tempY])

    return (
        <div className="relative">
            {/* INPUT */}
            <div className="relative">
                <input
                    type="text"
                    value={text}
                    placeholder="DD/MM/YYYY"
                    onChange={handleTextChange}
                    className="w-full h-10 px-3 pr-10 rounded-md border bg-background numeric text-left dir-ltr"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-foreground"
                    onClick={handleOpen}
                >
                    <CalendarIcon className="w-4 h-4" />
                </Button>
            </div>

            {/* MODAL */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-[400px] bg-card border shadow-xl">
                    <DialogHeader>
                        <DialogTitle className="text-center">اختر التاريخ</DialogTitle>
                    </DialogHeader>

                    <div className="grid grid-cols-3 gap-2 h-[200px] mt-4 dir-ltr">
                        {/* DAYS */}
                        <div className="border rounded-md overflow-hidden flex flex-col">
                            <div className="bg-muted p-2 text-center text-xs font-bold text-muted-foreground">يوم</div>
                            <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => {
                                    const dStr = pad(d)
                                    return (
                                        <div
                                            key={d}
                                            onClick={() => setTempD(dStr)}
                                            className={cn(
                                                "p-2 text-center text-sm rounded cursor-pointer hover:bg-accent",
                                                tempD === dStr && "bg-primary text-primary-foreground font-bold"
                                            )}
                                        >
                                            {dStr}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* MONTHS */}
                        <div className="border rounded-md overflow-hidden flex flex-col">
                            <div className="bg-muted p-2 text-center text-xs font-bold text-muted-foreground">شهر</div>
                            <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                                {AR_MONTHS.map((m) => (
                                    <div
                                        key={m.value}
                                        onClick={() => setTempM(m.value)}
                                        className={cn(
                                            "p-2 text-center text-sm rounded cursor-pointer hover:bg-accent flex flex-col items-center justify-center",
                                            tempM === m.value && "bg-primary text-primary-foreground font-bold"
                                        )}
                                    >
                                        <span>{m.name}</span>
                                        <span className="text-[10px] opacity-70">{m.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* YEARS */}
                        <div className="border rounded-md overflow-hidden flex flex-col">
                            <div className="bg-muted p-2 text-center text-xs font-bold text-muted-foreground">سنة</div>
                            <div className="flex-1 overflow-y-auto no-scrollbar p-1">
                                {Array.from({ length: 61 }, (_, i) => 1990 + i).map((y) => {
                                    const yStr = String(y)
                                    return (
                                        <div
                                            key={y}
                                            id={`year-${yStr}`}
                                            onClick={() => setTempY(yStr)}
                                            className={cn(
                                                "p-2 text-center text-sm rounded cursor-pointer hover:bg-accent",
                                                tempY === yStr && "bg-primary text-primary-foreground font-bold"
                                            )}
                                        >
                                            {yStr}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end mt-4">
                        <Button onClick={handleConfirm} className="w-full">
                            تأكيد
                            <Check className="w-4 h-4 ms-2" />
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

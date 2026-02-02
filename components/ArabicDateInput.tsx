"use client"

import { useState, useEffect } from "react"
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon } from "lucide-react"
import { formatDateDDMMYYYY } from "@/lib/date"

function toISO(dmy: string) {
    const parts = dmy.split("/")
    if (parts.length !== 3) return null
    const [d, m, y] = parts
    if (!d || !m || !y) return null
    if (d.length > 2 || m.length > 2 || y.length !== 4) return null

    // Basic validation that they are numbers
    if (isNaN(Number(d)) || isNaN(Number(m)) || isNaN(Number(y))) return null

    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
}

export function ArabicDateInput({
    value,
    onChange,
}: {
    value: string
    onChange: (iso: string) => void
}) {
    const [open, setOpen] = useState(false)
    const [text, setText] = useState(formatDateDDMMYYYY(value) || "")

    // Sync text if the external value changes (and isn't just what we just typed)
    // This is important if something else changes the date (like a reset)
    useEffect(() => {
        // Only update text if the formatted value is different from current text
        // to avoid fighting with user typing specific formats (e.g. leading zeros)
        const formatted = formatDateDDMMYYYY(value)
        if (formatted && toISO(text) !== value) {
            setText(formatted)
        }
    }, [value])


    return (
        <div className="relative">
            {/* INPUT */}
            <div className="relative">
                <input
                    type="text"
                    value={text}
                    placeholder="DD/MM/YYYY"
                    onChange={(e) => {
                        const v = e.target.value
                        setText(v)
                        const iso = toISO(v)
                        if (iso) onChange(iso)
                    }}
                    className="w-full h-10 px-3 pr-10 rounded-md border bg-background text-foreground numeric outline-none focus:ring-2 focus:ring-ring"
                />

                {/* CALENDAR ICON */}
                <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="absolute inset-y-0 right-2 flex items-center opacity-70 hover:opacity-100"
                >
                    <CalendarIcon className="w-4 h-4" />
                </button>
            </div>

            {/* CALENDAR */}
            {open && (
                <div className="absolute z-50 mt-2 rounded-md border bg-card p-2 shadow-lg">
                    <Calendar
                        mode="single"
                        selected={value ? new Date(value) : undefined}
                        onSelect={(d) => {
                            if (!d) return
                            const y = d.getFullYear()
                            const m = String(d.getMonth() + 1).padStart(2, "0")
                            const day = String(d.getDate()).padStart(2, "0")
                            const iso = `${y}-${m}-${day}`
                            onChange(iso)
                            setText(formatDateDDMMYYYY(iso))
                            setOpen(false)
                        }}
                        initialFocus
                    />
                </div>
            )}
        </div>
    )
}

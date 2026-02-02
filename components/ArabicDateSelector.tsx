"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

const days = Array.from({ length: 31 }, (_, i) => i + 1)
const months = [
    "01", "02", "03", "04", "05", "06",
    "07", "08", "09", "10", "11", "12"
]
const years = Array.from({ length: 60 }, (_, i) => 1980 + i)

function pad(n: number | string) {
    return String(n).padStart(2, "0")
}

export function ArabicDateSelector({
    value,
    onChange,
}: {
    value: string
    onChange: (iso: string) => void
}) {
    const [y, m, d] = value.split("-")

    const update = (ny = y, nm = m, nd = d) => {
        // Basic validation to prevent invalid dates (e.g. 31/02)
        // If invalid, JS Date auto-rolls over (e.g. Feb 30 -> Mar 2). 
        // We want to persist the user's intent or clamp it? 
        // The prompt implementation is simple string concat. 
        // Let's stick to the prompt's implementation for now to match the "Locked" request exactly.
        // If strict handling is needed I'd add it, but usually simplicity is preferred here.

        onChange(`${ny}-${pad(nm)}-${pad(nd)}`)
    }

    return (
        <div className="flex gap-2 items-center numeric dir-ltr box-border">
            {/* DAY */}
            <select
                value={parseInt(d).toString()} // handle "01" vs "1" mismatch if any, though storing as pad(d)
                onChange={(e) => update(y, m, e.target.value)}
                className="h-10 px-2 rounded-md bg-background border text-foreground focus:ring-2 focus:ring-ring outline-none"
            >
                {days.map(day => (
                    <option key={day} value={day}>{pad(day)}</option>
                ))}
            </select>

            <span className="text-muted-foreground font-bold">/</span>

            {/* MONTH */}
            <select
                value={m}
                onChange={(e) => update(y, e.target.value, d)}
                className="h-10 px-2 rounded-md bg-background border text-foreground focus:ring-2 focus:ring-ring outline-none"
            >
                {months.map(month => (
                    <option key={month} value={month}>{month}</option>
                ))}
            </select>

            <span className="text-muted-foreground font-bold">/</span>

            {/* YEAR */}
            <select
                value={y}
                onChange={(e) => update(e.target.value, m, d)}
                className="h-10 px-2 rounded-md bg-background border text-foreground focus:ring-2 focus:ring-ring outline-none"
            >
                {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                ))}
            </select>
        </div>
    )
}

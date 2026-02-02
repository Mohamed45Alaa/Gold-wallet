"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateInputProps {
    value?: string
    onChange: (isoDate: string) => void
    className?: string
}

export function DateInput({ value, onChange, className }: DateInputProps) {
    // ISO (YYYY-MM-DD) -> Display (DD/MM/YYYY)
    const formatIsoToDisplay = (iso: string | undefined) => {
        if (!iso) return ""
        const [y, m, d] = iso.split("-")
        if (!y || !m || !d) return ""
        return `${d}/${m}/${y}`
    }

    // Display (DD/MM/YYYY) -> ISO (YYYY-MM-DD)
    const formatDisplayToIso = (display: string) => {
        const [d, m, y] = display.split("/")
        if (!d || !m || !y) return ""
        return `${y}-${m}-${d}`
    }

    const [text, setText] = React.useState(() => formatIsoToDisplay(value))
    const [isCalendarOpen, setIsCalendarOpen] = React.useState(false)

    // Sync text if external value changes (and isn't just a formatting difference)
    React.useEffect(() => {
        const currentIsoFromText = formatDisplayToIso(text)
        if (value && value !== currentIsoFromText) {
            setText(formatIsoToDisplay(value))
        }
    }, [value, text])

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setText(val)

        // Strict DD/MM/YYYY regex
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(val)) {
            const iso = formatDisplayToIso(val)
            // Basic validity check (e.g. month <= 12) could be added here
            onChange(iso)
        }
    }

    const handleCalendarSelect = (date: Date | undefined) => {
        if (!date) return
        // Date -> ISO (YYYY-MM-DD) local time
        // We manually construct to avoid timezone shifts
        const y = date.getFullYear()
        const m = String(date.getMonth() + 1).padStart(2, "0")
        const d = String(date.getDate()).padStart(2, "0")
        const iso = `${y}-${m}-${d}`

        setText(`${d}/${m}/${y}`)
        onChange(iso)
        setIsCalendarOpen(false)
    }

    // Parse current ISO value to Date object for Calendar selected prop
    const currentDate = React.useMemo(() => {
        if (!value) return undefined
        const [y, m, d] = value.split("-").map(Number)
        if (!y || !m || !d) return undefined
        return new Date(y, m - 1, d)
    }, [value])

    return (
        <div className={cn("relative", className)}>
            <Input
                type="text"
                inputMode="numeric"
                placeholder="DD/MM/YYYY"
                value={text}
                onChange={handleTextChange}
                className="numeric date-input pr-10"
            />
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full w-10 text-muted-foreground hover:text-foreground"
                    >
                        <CalendarIcon className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={currentDate}
                        onSelect={handleCalendarSelect}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}

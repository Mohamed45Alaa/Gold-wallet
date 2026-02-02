"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

export function Calendar({
  className,
  classNames,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col gap-4",
        month: "space-y-4",
        caption: "flex justify-between items-center px-2",
        caption_label: "text-sm font-bold text-foreground",
        nav: "flex items-center gap-1",
        nav_button:
          "h-7 w-7 rounded-md border bg-muted hover:bg-accent transition",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell:
          "w-10 text-center text-xs font-semibold text-muted-foreground",
        row: "flex w-full",
        cell:
          "relative h-10 w-10 text-center text-sm flex items-center justify-center",
        day:
          "h-9 w-9 rounded-md hover:bg-accent cursor-pointer transition",
        day_today:
          "border border-primary text-primary font-bold",
        day_selected:
          "bg-primary text-primary-foreground font-bold",
        day_outside:
          "text-muted-foreground opacity-40",
        ...classNames,
      }}
      {...props}
    />
  )
}

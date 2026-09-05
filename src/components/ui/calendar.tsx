"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, isBefore, startOfDay } from "date-fns";
import { enUS, vi } from "date-fns/locale";
import { useLocale, useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CalendarProps {
  mode?: "single" | "range";
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  disabled?: (date: Date) => boolean;
  className?: string;
}

export function Calendar({ 
  mode = "single", 
  selected, 
  onSelect, 
  disabled,
  className 
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const locale = useLocale();
  const t = useTranslations("chrome.calendar.weekdays");
  const dateFnsLocale = locale === "vi" ? vi : enUS;

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const weekDays = [t("sun"), t("mon"), t("tue"), t("wed"), t("thu"), t("fri"), t("sat")];

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

  const handleSelect = (day: Date) => {
    if (disabled?.(day)) return;
    onSelect?.(day);
  };

  // Calculate padding days for start of month
  const firstDayOfMonth = startOfMonth(currentMonth);
  const startPadding = firstDayOfMonth.getDay(); // 0 = Sunday

  return (
    <div className={cn("p-3 bg-white rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevMonth}
          className="h-7 w-7"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy", { locale: dateFnsLocale })}
        </span>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextMonth}
          className="h-7 w-7"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Week days */}
      <div className="grid grid-cols-7 mb-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="text-center text-xs font-medium text-slate-500 py-1"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {/* Padding for start of month */}
        {Array.from({ length: startPadding }).map((_, i) => (
          <div key={`padding-${i}`} className="h-9" />
        ))}
        
        {days.map((day) => {
          const isSelected = selected && isSameDay(day, selected);
          const isTodayDate = isToday(day);
          const isDisabled = disabled?.(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => handleSelect(day)}
              disabled={isDisabled}
              className={cn(
                "h-9 w-9 rounded-md text-sm font-medium transition-colors",
                "hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500",
                isSelected && "bg-amber-500 text-white hover:bg-amber-600",
                isTodayDate && !isSelected && "bg-slate-100 text-slate-900",
                isDisabled && "opacity-50 cursor-not-allowed hover:bg-transparent",
                !isCurrentMonth && "text-slate-400"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

Calendar.displayName = "Calendar";

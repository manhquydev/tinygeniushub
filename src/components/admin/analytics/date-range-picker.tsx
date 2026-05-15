"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CalendarIcon } from "lucide-react";
import { format, subDays } from "date-fns";
import { vi } from "date-fns/locale";

interface DateRange {
  from?: Date;
  to?: Date;
}

interface DateRangePickerProps {
  onChange: (range: DateRange | undefined) => void;
  defaultValue?: DateRange;
}

const PRESETS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

export function DateRangePicker({ onChange, defaultValue }: DateRangePickerProps) {
  const [range, setRange] = useState<DateRange | undefined>(defaultValue);
  const [isOpen, setIsOpen] = useState(false);

  const handlePreset = (days: number) => {
    const to = new Date();
    const from = subDays(to, days);
    const newRange = { from, to };
    setRange(newRange);
    onChange(newRange);
    setIsOpen(false);
  };

  const handleCustomDate = (field: "from" | "to", value: string) => {
    const date = value ? new Date(value) : undefined;
    const newRange = {
      ...range,
      [field]: date,
    };
    setRange(newRange);
    if (newRange.from && newRange.to) {
      onChange(newRange as DateRange);
    }
  };

  const displayValue = () => {
    if (!range?.from) return "Choose a time period";
    if (!range.to || range.from.getTime() === range.to.getTime()) {
      return format(range.from, "dd/MM/yyyy", { locale: vi });
    }
    return `${format(range.from, "dd/MM/yyyy", { locale: vi })} - ${format(
      range.to,
      "dd/MM/yyyy",
      { locale: vi }
    )}`;
  };

  return (
    <div className="relative">
      <Button
        variant="outline"
        className="w-[280px] justify-start text-left font-normal"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="mr-2 h-4 w-4" />
        <span>{displayValue()}</span>
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 z-50 w-[320px] bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          {/* Presets */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Quick select</p>
            <div className="flex gap-2">
              {PRESETS.map((preset) => (
                <button
                  key={preset.days}
                  onClick={() => handlePreset(preset.days)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom dates */}
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-700">Or select a specific date</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">From date</label>
                <input
                  type="date"
                  value={range?.from ? format(range.from, "yyyy-MM-dd") : ""}
                  onChange={(e) => handleCustomDate("from", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Come day</label>
                <input
                  type="date"
                  value={range?.to ? format(range.to, "yyyy-MM-dd") : ""}
                  onChange={(e) => handleCustomDate("to", e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Close button */}
          <div className="mt-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {/* Backdrop to close picker */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

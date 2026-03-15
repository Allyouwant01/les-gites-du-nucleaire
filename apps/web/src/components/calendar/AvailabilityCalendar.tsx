'use client';

import { useState, useMemo, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AvailabilitySlot {
  startDate: string;
  endDate: string;
  isAvailable: boolean;
}

interface BookedRange {
  checkInDate: string;
  checkOutDate: string;
}

interface AvailabilityCalendarProps {
  availabilities: AvailabilitySlot[];
  bookedDates: BookedRange[];
  checkInDate: string;
  checkOutDate: string;
  onDateSelect: (checkIn: string, checkOut: string) => void;
  compact?: boolean;
}

const DAYS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];
const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function isSameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
}

function formatISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

type DayStatus = 'available' | 'unavailable' | 'booked' | 'past' | 'unknown';

export default function AvailabilityCalendar({
  availabilities,
  bookedDates,
  checkInDate,
  checkOutDate,
  onDateSelect,
  compact = false,
}: AvailabilityCalendarProps) {
  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selecting, setSelecting] = useState<'checkin' | 'checkout'>('checkin');

  // Build a map of day statuses from availability slots and booked dates
  const dayStatusMap = useMemo(() => {
    const map = new Map<string, DayStatus>();

    // First mark availability slots
    for (const slot of availabilities) {
      const start = startOfDay(new Date(slot.startDate));
      const end = startOfDay(new Date(slot.endDate));
      let current = new Date(start);
      while (current < end) {
        const key = formatISO(current);
        map.set(key, slot.isAvailable ? 'available' : 'unavailable');
        current = addDays(current, 1);
      }
    }

    // Then mark booked dates (override available → booked)
    for (const range of bookedDates) {
      const start = startOfDay(new Date(range.checkInDate));
      const end = startOfDay(new Date(range.checkOutDate));
      let current = new Date(start);
      while (current < end) {
        const key = formatISO(current);
        map.set(key, 'booked');
        current = addDays(current, 1);
      }
    }

    return map;
  }, [availabilities, bookedDates]);

  const getDayStatus = useCallback((date: Date): DayStatus => {
    if (date < today) return 'past';
    const key = formatISO(date);
    return dayStatusMap.get(key) || 'unknown';
  }, [dayStatusMap, today]);

  // Check if a date falls in the selected range
  const isInSelection = useCallback((date: Date): boolean => {
    if (!checkInDate || !checkOutDate) return false;
    const start = startOfDay(new Date(checkInDate));
    const end = startOfDay(new Date(checkOutDate));
    return date >= start && date < end;
  }, [checkInDate, checkOutDate]);

  const isCheckIn = useCallback((date: Date): boolean => {
    if (!checkInDate) return false;
    return isSameDay(date, startOfDay(new Date(checkInDate)));
  }, [checkInDate]);

  const isCheckOut = useCallback((date: Date): boolean => {
    if (!checkOutDate) return false;
    return isSameDay(date, startOfDay(new Date(checkOutDate)));
  }, [checkOutDate]);

  const handleDayClick = useCallback((date: Date) => {
    const status = getDayStatus(date);
    if (status === 'past' || status === 'booked' || status === 'unavailable') return;

    const dateStr = formatISO(date);

    if (selecting === 'checkin') {
      onDateSelect(dateStr, '');
      setSelecting('checkout');
    } else {
      // Check-out must be after check-in and at least 7 days
      if (checkInDate) {
        const cin = startOfDay(new Date(checkInDate));
        if (date <= cin) {
          // User clicked before check-in: reset and use as new check-in
          onDateSelect(dateStr, '');
          setSelecting('checkout');
          return;
        }
        const diffDays = Math.ceil((date.getTime() - cin.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
          // Too short — auto-set to 7 days after check-in
          const autoCheckout = addDays(cin, 7);
          onDateSelect(checkInDate, formatISO(autoCheckout));
        } else {
          onDateSelect(checkInDate, dateStr);
        }
      }
      setSelecting('checkin');
    }
  }, [selecting, checkInDate, getDayStatus, onDateSelect]);

  // Get days for a month grid
  function getMonthDays(year: number, month: number) {
    const firstDay = new Date(year, month, 1);
    // Monday = 0, Sunday = 6 (ISO)
    let dayOfWeek = firstDay.getDay() - 1;
    if (dayOfWeek < 0) dayOfWeek = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];

    // Empty slots before the 1st
    for (let i = 0; i < dayOfWeek; i++) {
      days.push(null);
    }
    // Days of the month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(year, month, d));
    }
    return days;
  }

  function navigateMonth(delta: number) {
    let m = currentMonth + delta;
    let y = currentYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    setCurrentMonth(m);
    setCurrentYear(y);
  }

  // Can't go to past months
  const canGoPrev = currentYear > today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth > today.getMonth());

  function renderMonth(year: number, month: number) {
    const days = getMonthDays(year, month);

    return (
      <div className={compact ? '' : 'flex-1'}>
        <div className="grid grid-cols-7 gap-0.5 mb-1">
          {DAYS_FR.map((d) => (
            <div key={d} className="text-center text-[10px] font-semibold text-gray-400 py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {days.map((date, i) => {
            if (!date) {
              return <div key={`empty-${i}`} className="aspect-square" />;
            }

            const status = getDayStatus(date);
            const inSelection = isInSelection(date);
            const isCI = isCheckIn(date);
            const isCO = isCheckOut(date);
            const isPast = status === 'past';
            const isBooked = status === 'booked';
            const isUnavailable = status === 'unavailable';
            const isAvail = status === 'available';
            const clickable = !isPast && !isBooked && !isUnavailable;

            let bgClass = '';
            let textClass = 'text-gray-400';
            let borderClass = '';

            if (isCI || isCO) {
              bgClass = 'bg-primary';
              textClass = 'text-white font-bold';
              borderClass = 'ring-2 ring-primary ring-offset-1';
            } else if (inSelection) {
              bgClass = 'bg-primary/15';
              textClass = 'text-primary font-semibold';
            } else if (isPast) {
              bgClass = 'bg-gray-50';
              textClass = 'text-gray-300';
            } else if (isBooked) {
              bgClass = 'bg-red-50';
              textClass = 'text-red-300 line-through';
            } else if (isUnavailable) {
              bgClass = 'bg-gray-100';
              textClass = 'text-gray-300';
            } else if (isAvail) {
              bgClass = 'bg-green-50 hover:bg-green-100';
              textClass = 'text-green-700 font-medium';
            } else {
              // unknown — treat as potentially available
              bgClass = 'bg-gray-50 hover:bg-gray-100';
              textClass = 'text-gray-500';
            }

            return (
              <button
                key={date.getTime()}
                type="button"
                disabled={!clickable}
                onClick={() => handleDayClick(date)}
                className={`
                  aspect-square flex items-center justify-center rounded-lg text-xs
                  transition-all duration-100
                  ${bgClass} ${textClass} ${borderClass}
                  ${clickable ? 'cursor-pointer' : 'cursor-not-allowed'}
                `}
                title={
                  isPast ? 'Passé' :
                  isBooked ? 'Déjà réservé' :
                  isUnavailable ? 'Indisponible' :
                  isAvail ? 'Disponible' : ''
                }
              >
                {date.getDate()}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // For 2-month view: next month
  let nextMonth = currentMonth + 1;
  let nextYear = currentYear;
  if (nextMonth > 11) { nextMonth = 0; nextYear++; }

  return (
    <div>
      {/* Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          disabled={!canGoPrev}
          className={`p-1.5 rounded-full transition-colors ${
            canGoPrev ? 'hover:bg-gray-100 text-gray-700' : 'text-gray-300 cursor-not-allowed'
          }`}
        >
          <ChevronLeft size={18} />
        </button>
        <div className={`font-heading font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
          {compact ? (
            `${MONTHS_FR[currentMonth]} ${currentYear}`
          ) : (
            `${MONTHS_FR[currentMonth]} — ${MONTHS_FR[nextMonth]} ${nextYear}`
          )}
        </div>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          className="p-1.5 rounded-full hover:bg-gray-100 text-gray-700 transition-colors"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Calendar grid */}
      {compact ? (
        renderMonth(currentYear, currentMonth)
      ) : (
        <div className="flex gap-4">
          {renderMonth(currentYear, currentMonth)}
          {renderMonth(nextYear, nextMonth)}
        </div>
      )}

      {/* Legend */}
      <div className={`flex flex-wrap gap-3 mt-3 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-50 border border-green-200" />
          <span className="text-gray-600">Disponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-50 border border-red-200" />
          <span className="text-gray-600">Réservé</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-gray-100 border border-gray-200" />
          <span className="text-gray-600">Indisponible</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary" />
          <span className="text-gray-600">Sélection</span>
        </div>
      </div>

      {/* Selection info */}
      {selecting === 'checkout' && checkInDate && !checkOutDate && (
        <p className="text-xs text-primary font-medium mt-2 animate-pulse">
          Sélectionnez la date de départ (min. 7 jours)
        </p>
      )}
    </div>
  );
}

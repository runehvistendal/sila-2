import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isSameMonth, isToday, isBefore, startOfDay } from 'date-fns';
import { da } from 'date-fns/locale';

export default function CabinAvailabilityCalendar({ cabinId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: bookings = [] } = useQuery({
    queryKey: ['cabin-bookings-calendar', cabinId],
    queryFn: () => base44.entities.Booking.filter({ listing_id: cabinId, type: 'cabin' }, 'check_in', 100),
    select: (data) => data.filter(b => b.status === 'confirmed' || b.status === 'pending'),
  });

  // Build a set of booked date strings "yyyy-MM-dd"
  const bookedDates = new Set();
  const pendingDates = new Set();

  for (const booking of bookings) {
    if (!booking.check_in || !booking.check_out) continue;
    const start = new Date(booking.check_in);
    const end = new Date(booking.check_out);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) continue;
    const days = eachDayOfInterval({ start, end });
    const set = booking.status === 'confirmed' ? bookedDates : pendingDates;
    days.forEach(d => set.add(format(d, 'yyyy-MM-dd')));
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start so week starts on Monday
  const startPad = (monthStart.getDay() + 6) % 7; // Mon=0
  const today = startOfDay(new Date());

  return (
    <div onPointerDown={e => e.stopPropagation()}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Tilgængelighed</h2>
        <div className="flex items-center gap-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            onKeyDown={e => e.key === 'Enter' && setCurrentMonth(m => subMonths(m, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground w-28 text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: da })}
          </span>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            onKeyDown={e => e.key === 'Enter' && setCurrentMonth(m => addMonths(m, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-0.5">
        {/* Empty pads */}
        {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}

        {days.map(day => {
          const key = format(day, 'yyyy-MM-dd');
          const isPast = isBefore(day, today);
          const isBooked = bookedDates.has(key);
          const isPending = pendingDates.has(key);
          const isCurrentDay = isToday(day);

          let cellClass = 'w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium transition-colors ';

          if (isBooked) {
            cellClass += 'bg-red-100 text-red-600 cursor-not-allowed';
          } else if (isPending) {
            cellClass += 'bg-amber-100 text-amber-600 cursor-not-allowed';
          } else if (isPast) {
            cellClass += 'text-muted-foreground/40 cursor-default';
          } else if (isCurrentDay) {
            cellClass += 'bg-primary text-white font-bold';
          } else {
            cellClass += 'bg-green-50 text-green-700 hover:bg-green-100';
          }

          return (
            <div key={key} className={cellClass}>
              {format(day, 'd')}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 inline-block"></span> Ledig</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 inline-block"></span> Afventer bekræftelse</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-red-100 inline-block"></span> Optaget</span>
      </div>
    </div>
  );
}
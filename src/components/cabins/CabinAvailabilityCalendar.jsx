import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isBefore, startOfDay } from 'date-fns';
import { da } from 'date-fns/locale';

function CalendarDay({ day, isBooked, isPending, isPast, isCurrentDay }) {
  let cls = 'w-full aspect-square rounded-lg flex items-center justify-center text-xs font-medium ';
  if (isBooked) cls += 'bg-red-100 text-red-600';
  else if (isPending) cls += 'bg-amber-100 text-amber-600';
  else if (isPast) cls += 'text-muted-foreground/40';
  else if (isCurrentDay) cls += 'bg-primary text-white font-bold';
  else cls += 'bg-green-50 text-green-700';
  return <div className={cls}>{day}</div>;
}

export default function CabinAvailabilityCalendar({ cabinId }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const { data: bookings = [] } = useQuery({
    queryKey: ['cabin-bookings-calendar', cabinId],
    queryFn: () => base44.entities.Booking.filter({ listing_id: cabinId, type: 'cabin' }, 'check_in', 100),
    select: (data) => data.filter(b => b.status === 'confirmed' || b.status === 'pending'),
  });

  const bookedDates = new Set();
  const pendingDates = new Set();

  for (const booking of bookings) {
    if (!booking.check_in || !booking.check_out) continue;
    const start = new Date(booking.check_in);
    const end = new Date(booking.check_out);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) continue;
    const days = eachDayOfInterval({ start, end });
    const target = booking.status === 'confirmed' ? bookedDates : pendingDates;
    days.forEach(d => target.add(format(d, 'yyyy-MM-dd')));
  }

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = (monthStart.getDay() + 6) % 7;
  const today = startOfDay(new Date());

  const cells = [];
  for (let i = 0; i < startPad; i++) {
    cells.push(<div key={`pad-${i}`} />);
  }
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const key = format(day, 'yyyy-MM-dd');
    cells.push(
      <CalendarDay
        key={key}
        day={format(day, 'd')}
        isBooked={bookedDates.has(key)}
        isPending={pendingDates.has(key)}
        isPast={isBefore(day, today)}
        isCurrentDay={isToday(day)}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-foreground">Tilgængelighed</h2>
        <div className="flex items-center gap-2">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
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
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-100 inline-block"></span> Ledig
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-amber-100 inline-block"></span> Afventer bekræftelse
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 inline-block"></span> Optaget
        </span>
      </div>
    </div>
  );
}
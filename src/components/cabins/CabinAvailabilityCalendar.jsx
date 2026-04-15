import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ChevronLeft, ChevronRight, Waves } from 'lucide-react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isBefore, startOfDay, isAfter } from 'date-fns';
import { da } from 'date-fns/locale';

function CalendarDay({ label, isBooked, isPending, isPast, isCurrentDay, isSelected, isInRange, isStart, isEnd, onClick }) {
  let cls = 'w-full aspect-square flex items-center justify-center text-xs font-medium transition-colors select-none ';

  if (isBooked || isPending) {
    cls += isBooked ? 'bg-red-100 text-red-500 cursor-not-allowed rounded-lg' : 'bg-amber-100 text-amber-600 cursor-not-allowed rounded-lg';
  } else if (isPast) {
    cls += 'text-muted-foreground/30 cursor-default rounded-lg';
  } else if (isStart || isEnd) {
    cls += 'bg-primary text-white font-bold rounded-lg cursor-pointer z-10';
  } else if (isInRange) {
    cls += 'bg-primary/15 text-primary cursor-pointer rounded-none';
  } else if (isCurrentDay) {
    cls += 'border border-primary text-primary font-bold rounded-lg cursor-pointer hover:bg-primary/10';
  } else {
    cls += 'bg-green-50 text-green-700 cursor-pointer rounded-lg hover:bg-green-100';
  }

  return (
    <div className={cls} onClick={(!isBooked && !isPending && !isPast) ? onClick : undefined}>
      {label}
    </div>
  );
}

export default function CabinAvailabilityCalendar({ cabinId, checkIn, checkOut, onCheckInChange, onCheckOutChange }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    return checkIn ? new Date(checkIn) : new Date();
  });
  const [selecting, setSelecting] = useState('checkin'); // 'checkin' | 'checkout'

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

  const checkInDate = checkIn ? new Date(checkIn) : null;
  const checkOutDate = checkOut ? new Date(checkOut) : null;

  const handleDayClick = (day) => {
    const key = format(day, 'yyyy-MM-dd');
    if (selecting === 'checkin') {
      onCheckInChange(key);
      onCheckOutChange('');
      setSelecting('checkout');
    } else {
      if (checkInDate && isBefore(day, checkInDate)) {
        onCheckInChange(key);
        onCheckOutChange('');
        setSelecting('checkout');
      } else {
        onCheckOutChange(key);
        setSelecting('checkin');
      }
    }
  };

  const cells = [];
  for (let i = 0; i < startPad; i++) {
    cells.push(<div key={`pad-${i}`} />);
  }
  for (let i = 0; i < days.length; i++) {
    const day = days[i];
    const key = format(day, 'yyyy-MM-dd');
    const isPast = isBefore(day, today);
    const isStart = checkIn === key;
    const isEnd = checkOut === key;
    const isInRange = checkInDate && checkOutDate && isAfter(day, checkInDate) && isBefore(day, checkOutDate);

    cells.push(
      <CalendarDay
        key={key}
        label={format(day, 'd')}
        isBooked={bookedDates.has(key)}
        isPending={pendingDates.has(key)}
        isPast={isPast}
        isCurrentDay={isToday(day)}
        isSelected={isStart || isEnd}
        isStart={isStart}
        isEnd={isEnd}
        isInRange={isInRange}
        onClick={() => handleDayClick(day)}
      />
    );
  }

  return (
    <div className="text-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="text-base font-bold text-foreground">Tilgængelighed</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selecting === 'checkin' ? 'Vælg check-in dato' : 'Vælg check-out dato'}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            role="button"
            tabIndex={0}
            onClick={() => setCurrentMonth(m => subMonths(m, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <span className="text-xs font-semibold text-foreground w-24 text-center capitalize">
            {format(currentMonth, 'MMMM yyyy', { locale: da })}
          </span>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setCurrentMonth(m => addMonths(m, 1))}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-muted transition-colors cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-0.5">
        {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map(d => (
          <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7">
        {cells}
      </div>

      {/* Selected range summary */}
      {(checkIn || checkOut) && (
        <div className="flex gap-3 mt-2 text-xs">
          <span className={`px-2 py-1 rounded-md font-medium ${checkIn ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
            Inn: {checkIn || '—'}
          </span>
          <span className={`px-2 py-1 rounded-md font-medium ${checkOut ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>
            Ud: {checkOut || '—'}
          </span>
          {checkIn && (
            <button
              className="text-muted-foreground hover:text-destructive ml-auto"
              onClick={() => { onCheckInChange(''); onCheckOutChange(''); setSelecting('checkin'); }}
            >
              Nulstil
            </button>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-primary/15 inline-block"></span> Valgt</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-100 inline-block"></span> Afventer</span>
        <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-red-100 inline-block"></span> Optaget</span>
      </div>
    </div>
  );
}
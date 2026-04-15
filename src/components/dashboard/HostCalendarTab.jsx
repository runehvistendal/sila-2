import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { ChevronLeft, ChevronRight, Home } from 'lucide-react';
import { addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, format, isToday, isSameDay, startOfDay } from 'date-fns';
import { da } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

const STATUS_COLORS = {
  confirmed: 'bg-green-100 text-green-700',
  pending: 'bg-amber-100 text-amber-700',
  declined: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-400',
};

export default function HostCalendarTab() {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const { data: hostBookings = [] } = useQuery({
    queryKey: ['host-bookings-calendar', user?.email],
    queryFn: () => base44.entities.Booking.filter({ host_email: user.email, type: 'cabin' }, 'check_in', 200),
    enabled: !!user,
    select: (data) => data.filter(b => b.status !== 'declined' && b.status !== 'cancelled'),
  });

  const { data: myCabins = [] } = useQuery({
    queryKey: ['my-cabins-cal', user?.email],
    queryFn: () => base44.entities.Cabin.filter({ host_email: user.email }, 'created_date', 20),
    enabled: !!user,
  });

  const cabinMap = Object.fromEntries(myCabins.map(c => [c.id, c]));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = (monthStart.getDay() + 6) % 7;

  // Map date string → bookings active on that day
  const dayBookings = {};
  for (const booking of hostBookings) {
    if (!booking.check_in || !booking.check_out) continue;
    const interval = eachDayOfInterval({ start: new Date(booking.check_in), end: new Date(booking.check_out) });
    interval.forEach(d => {
      const key = format(d, 'yyyy-MM-dd');
      if (!dayBookings[key]) dayBookings[key] = [];
      dayBookings[key].push(booking);
    });
  }

  const selectedKey = selectedDay ? format(selectedDay, 'yyyy-MM-dd') : null;
  const selectedBookings = selectedKey ? (dayBookings[selectedKey] || []) : [];

  return (
    <div className="space-y-6">
      {/* Calendar header */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-foreground">Bookingkalender</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentMonth(m => subMonths(m, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-muted-foreground" />
            </button>
            <span className="text-sm font-semibold text-foreground w-32 text-center capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: da })}
            </span>
            <button
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 mb-1">
          {['Ma', 'Ti', 'On', 'To', 'Fr', 'Lø', 'Sø'].map(d => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>
          ))}
        </div>

        {/* Days */}
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
          {days.map(day => {
            const key = format(day, 'yyyy-MM-dd');
            const bks = dayBookings[key] || [];
            const hasConfirmed = bks.some(b => b.status === 'confirmed');
            const hasPending = bks.some(b => b.status === 'pending');
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            const isCurrentDay = isToday(day);

            let bg = 'bg-transparent hover:bg-muted';
            if (isSelected) bg = 'bg-primary text-white';
            else if (hasConfirmed) bg = 'bg-green-100 hover:bg-green-200';
            else if (hasPending) bg = 'bg-amber-100 hover:bg-amber-200';
            else if (isCurrentDay) bg = 'bg-primary/10';

            return (
              <button
                key={key}
                onClick={() => setSelectedDay(isSameDay(day, selectedDay) ? null : day)}
                className={`relative w-full aspect-square rounded-xl flex flex-col items-center justify-center transition-colors ${bg}`}
              >
                <span className={`text-xs font-medium ${isSelected ? 'text-white' : isCurrentDay && !hasConfirmed && !hasPending ? 'text-primary font-bold' : 'text-foreground'}`}>
                  {format(day, 'd')}
                </span>
                {bks.length > 0 && !isSelected && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {bks.slice(0, 3).map((_, i) => (
                      <span key={i} className={`w-1 h-1 rounded-full ${hasConfirmed ? 'bg-green-500' : 'bg-amber-500'}`} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-green-100 inline-block" /> Bekræftet</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded bg-amber-100 inline-block" /> Afventer</span>
        </div>
      </div>

      {/* Selected day bookings */}
      {selectedDay && (
        <div>
          <h4 className="font-semibold text-foreground mb-3">
            {format(selectedDay, 'd. MMMM yyyy', { locale: da })}
            {selectedBookings.length === 0 && <span className="ml-2 text-sm font-normal text-muted-foreground">— ingen bookinger</span>}
          </h4>
          <div className="space-y-3">
            {selectedBookings.map(b => {
              const cabin = cabinMap[b.listing_id];
              return (
                <div key={b.id} className="bg-white rounded-xl border border-border p-4 flex items-center gap-4">
                  {cabin?.images?.[0] && (
                    <img src={cabin.images[0]} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" />
                  )}
                  {!cabin?.images?.[0] && (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <Home className="w-5 h-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-foreground truncate">{b.listing_title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {b.guest_name || b.guest_email} · {b.guests || 1} gæst{b.guests !== 1 ? 'er' : ''}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {b.check_in && format(new Date(b.check_in), 'd. MMM', { locale: da })} – {b.check_out && format(new Date(b.check_out), 'd. MMM yyyy', { locale: da })}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <Badge className={`${STATUS_COLORS[b.status]} border-0 text-xs`}>
                      {b.status === 'confirmed' ? 'Bekræftet' : b.status === 'pending' ? 'Afventer' : b.status}
                    </Badge>
                    {b.total_price > 0 && <span className="text-sm font-bold text-foreground">{b.total_price} DKK</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCard label="Bekræftede bookinger" value={hostBookings.filter(b => b.status === 'confirmed').length} color="text-green-600" />
        <StatCard label="Afventer svar" value={hostBookings.filter(b => b.status === 'pending').length} color="text-amber-600" />
        <StatCard label="Hytter i alt" value={myCabins.length} color="text-primary" />
      </div>
    </div>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div className="bg-white rounded-xl border border-border p-4 text-center">
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{label}</p>
    </div>
  );
}
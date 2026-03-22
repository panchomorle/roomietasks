import { useState, useEffect } from 'react';
import { computeCycleCutoff } from '@/lib/dateUtils';

interface CycleCountdown {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isEnded: boolean;
  isActive: boolean;
}

export function useCycleCountdown(room: any): CycleCountdown {
  const [timeLeft, setTimeLeft] = useState<CycleCountdown>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isEnded: false,
    isActive: false,
  });

  useEffect(() => {
    if (!room || !room.current_period_start_date) {
      return;
    }

    // If using count mode and cycles = 1, it implies no cycles are configured.
    // We don't show the cycle countdown in this case, only the overall period countdown
    // which is handled elsewhere.
    if (room.cycle_mode === 'count' && (room.cycles_per_period === null || room.cycles_per_period <= 1)) {
      setTimeLeft(prev => ({ ...prev, isActive: false }));
      return;
    }

    const calculateTimeLeft = () => {
      const cutoff = computeCycleCutoff(
        room.current_period_start_date,
        room.period_duration_days,
        room.cycle_mode,
        room.cycles_per_period,
        room.cycle_anchor_weekday,
        room.cycle_fixed_days
      );

      const now = new Date();
      const difference = cutoff.getTime() - now.getTime();

      if (difference <= 0) {
        setTimeLeft({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isEnded: true,
          isActive: true,
        });
      } else {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
          isEnded: false,
          isActive: true,
        });
      }
    };

    calculateTimeLeft(); // Initial calculation
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [
    room?.current_period_start_date,
    room?.period_duration_days,
    room?.cycle_mode,
    room?.cycles_per_period,
    room?.cycle_anchor_weekday,
    room?.cycle_fixed_days
  ]);

  return timeLeft;
}

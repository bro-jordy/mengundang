"use client";

import { useEffect, useState } from "react";

interface Props {
  targetDate: Date | string;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export function CountdownTimer({ targetDate }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null);

  useEffect(() => {
    function calculate(): TimeLeft | null {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) return null;

      return {
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    }

    setTimeLeft(calculate());
    const interval = setInterval(() => setTimeLeft(calculate()), 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!timeLeft) {
    return (
      <p className="text-stone-500 text-sm">Acara telah berlangsung</p>
    );
  }

  const units = [
    { label: "Hari", value: timeLeft.days },
    { label: "Jam", value: timeLeft.hours },
    { label: "Menit", value: timeLeft.minutes },
    { label: "Detik", value: timeLeft.seconds },
  ];

  return (
    <div className="flex justify-center gap-4">
      {units.map(({ label, value }) => (
        <div key={label} className="text-center">
          <div className="text-3xl font-bold text-stone-800 min-w-12">
            {String(value).padStart(2, "0")}
          </div>
          <div className="text-xs text-stone-400 mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

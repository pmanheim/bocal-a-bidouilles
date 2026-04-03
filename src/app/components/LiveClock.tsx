"use client";

import { useState, useEffect } from "react";

export default function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // setTimeout avoids synchronous setState in effect body
    const initial = setTimeout(() => setNow(new Date()), 0);
    const timer = setInterval(() => setNow(new Date()), 10_000);
    return () => {
      clearTimeout(initial);
      clearInterval(timer);
    };
  }, []);

  if (!now) {
    return (
      <div className="flex flex-col items-center gap-1 shrink-0">
        <svg className="w-[100px] h-[100px] md:w-[240px] md:h-[240px]" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="56" fill="white" stroke="#158068" strokeWidth="2.5" />
          <circle cx="60" cy="60" r="3" fill="#333" />
        </svg>
        <span className="text-base md:text-2xl font-bold text-text-secondary">&nbsp;</span>
      </div>
    );
  }

  const hours = now.getHours();
  const minutes = now.getMinutes();

  // Clock hand angles (degrees from 12 o'clock, clockwise)
  const hourAngle = (hours % 12) * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6;

  // Convert to SVG coordinates (center at 60,60)
  const hourRad = ((hourAngle - 90) * Math.PI) / 180;
  const minuteRad = ((minuteAngle - 90) * Math.PI) / 180;

  const hourX = 60 + 28 * Math.cos(hourRad);
  const hourY = 60 + 28 * Math.sin(hourRad);
  const minuteX = 60 + 40 * Math.cos(minuteRad);
  const minuteY = 60 + 40 * Math.sin(minuteRad);

  // Format digital time
  const displayHours = hours % 12 || 12;
  const amPm = hours >= 12 ? "PM" : "AM";
  const timeStr = `${displayHours}:${String(minutes).padStart(2, "0")} ${amPm}`;

  return (
    <div className="flex flex-col items-center gap-1 shrink-0">
      <svg className="w-[100px] h-[100px] md:w-[240px] md:h-[240px]" viewBox="0 0 120 120">
        {/* White background */}
        <circle cx="60" cy="60" r="56" fill="white" stroke="#158068" strokeWidth="2.5" />
        {/* All 12 hour numbers */}
        {Array.from({ length: 12 }).map((_, i) => {
          const num = i === 0 ? 12 : i;
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = 60 + 44 * Math.cos(angle);
          const y = 60 + 44 * Math.sin(angle);
          return (
            <text
              key={num}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="11"
              fontWeight="700"
              fill="#333"
            >
              {num}
            </text>
          );
        })}
        {/* Center dot */}
        <circle cx="60" cy="60" r="3" fill="#333" />
        {/* Hour hand — short & thick */}
        <line
          x1="60" y1="60" x2={hourX} y2={hourY}
          stroke="#333" strokeWidth="4.5" strokeLinecap="round"
        />
        {/* Minute hand — long & thin */}
        <line
          x1="60" y1="60" x2={minuteX} y2={minuteY}
          stroke="#333" strokeWidth="2" strokeLinecap="round"
        />
      </svg>
      <span className="text-base md:text-2xl font-bold text-text-secondary">{timeStr}</span>
    </div>
  );
}

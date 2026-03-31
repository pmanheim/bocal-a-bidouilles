"use client";

import { useState, useEffect } from "react";

export default function LiveClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const seconds = now.getSeconds();

  // Clock hand angles (degrees from 12 o'clock, clockwise)
  const hourAngle = (hours % 12) * 30 + minutes * 0.5; // 0.5° per minute
  const minuteAngle = minutes * 6 + seconds * 0.1; // 6° per minute

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
    <div className="flex flex-col items-center gap-1">
      <svg width="240" height="240" viewBox="0 0 120 120">
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
      <span className="text-2xl font-bold text-text-secondary">{timeStr}</span>
    </div>
  );
}

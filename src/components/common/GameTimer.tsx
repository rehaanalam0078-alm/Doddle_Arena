import React, { useEffect, useState } from 'react';
import { sound } from '@/services/sound';

interface GameTimerProps {
  timerStart: number;
  timerEnd: number;
  totalDurationSeconds: number;
  size?: number;
  strokeWidth?: number;
}

export const GameTimer: React.FC<GameTimerProps> = ({
  timerStart,
  timerEnd,
  totalDurationSeconds,
  size = 64,
  strokeWidth = 6,
}) => {
  const [remainingSeconds, setRemainingSeconds] = useState<number>(totalDurationSeconds);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const diffMs = Math.max(0, timerEnd - now);
      const secs = Math.ceil(diffMs / 1000);
      setRemainingSeconds(secs);

      if (secs > 0 && secs <= 10) {
        sound.playTick();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);
    return () => clearInterval(interval);
  }, [timerStart, timerEnd]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const fraction = Math.max(0, Math.min(1, remainingSeconds / (totalDurationSeconds || 80)));
  const strokeDashoffset = circumference * (1 - fraction);

  const isUrgent = remainingSeconds <= 15;
  const strokeColor = isUrgent ? '#FF6B6B' : '#7C3AED';

  return (
    <div
      className={`relative flex items-center justify-center select-none ${
        isUrgent && remainingSeconds > 0 ? 'animate-pulse' : ''
      }`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Track circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#EFEBFF"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Animated countdown progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          style={{ transition: 'stroke-dashoffset 0.4s ease, stroke 0.3s ease' }}
        />
      </svg>
      {/* Centered digits */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-black tracking-tight leading-none ${
            isUrgent ? 'text-secondary' : 'text-on-surface'
          }`}
          style={{ fontSize: size * 0.35 }}
        >
          {remainingSeconds}
        </span>
        <span className="text-[9px] font-bold text-outline uppercase tracking-wider">
          SEC
        </span>
      </div>
    </div>
  );
};

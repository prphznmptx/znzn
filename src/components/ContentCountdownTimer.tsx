import React, { useState, useEffect } from 'react';
import { AlertTriangle, Undo2 } from 'lucide-react';

interface ContentCountdownTimerProps {
  autoDeleteAt: string;
  onSave: () => void;
  isSaving?: boolean;
}

export default function ContentCountdownTimer({
  autoDeleteAt,
  onSave,
  isSaving = false,
}: ContentCountdownTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const deleteDate = new Date(autoDeleteAt);
      const diffTime = deleteDate.getTime() - now.getTime();

      if (diffTime <= 0) {
        setTimeRemaining({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
        });
        return;
      }

      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffTime / (1000 * 60 * 60)) % 24);
      const diffMinutes = Math.floor((diffTime / (1000 * 60)) % 60);
      const diffSeconds = Math.floor((diffTime / 1000) % 60);

      setTimeRemaining({
        days: diffDays,
        hours: diffHours,
        minutes: diffMinutes,
        seconds: diffSeconds,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [autoDeleteAt]);

  if (!timeRemaining) return null;

  return (
    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-red-400 mb-1">Content will be permanently deleted</h4>
          <p className="text-xs text-red-300 mb-2">
            Your content will be automatically deleted in:
          </p>
          <div className="text-sm font-mono text-red-400 mb-3">
            {timeRemaining.days}d {String(timeRemaining.hours).padStart(2, '0')}h{' '}
            {String(timeRemaining.minutes).padStart(2, '0')}m {String(timeRemaining.seconds).padStart(2, '0')}s
          </div>
          <p className="text-xs text-red-300 mb-3">
            Click "Save Content" below to keep it in your content library and prevent permanent deletion.
          </p>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-3 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Undo2 className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Content'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

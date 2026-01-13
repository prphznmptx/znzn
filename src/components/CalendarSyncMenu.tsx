import React, { useState } from 'react';
import { ChevronDown, Calendar, Download, Copy } from 'lucide-react';
import { getCalendarSyncOptions } from '../lib/calendarSyncService';
import type { Event } from '../types/events';

interface CalendarSyncMenuProps {
  event: Event;
  variant?: 'button' | 'dropdown';
  onSync?: (method: string) => void;
}

export default function CalendarSyncMenu({ event, variant = 'dropdown', onSync }: CalendarSyncMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const options = getCalendarSyncOptions(event);

  const handleSync = (option: (typeof options)[0]) => {
    try {
      option.action();
      onSync?.(option.id);
      setIsOpen(false);
    } catch (error) {
      console.error('Error syncing to calendar:', error);
    }
  };

  if (variant === 'button') {
    return (
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option.id}
            onClick={() => handleSync(option)}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
          >
            <span>{option.icon}</span>
            {option.label}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-lg transition-colors flex items-center gap-2"
      >
        <Calendar className="w-4 h-4" />
        Add to Calendar
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-white/10 rounded-lg shadow-lg z-50 overflow-hidden">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => handleSync(option)}
              className="w-full px-4 py-3 text-left text-white hover:bg-white/10 transition-colors flex items-center gap-3 border-b border-white/5 last:border-b-0"
            >
              <span className="text-lg">{option.icon}</span>
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';
import { X, Bell, Mail, Smartphone, Calendar } from 'lucide-react';
import CalendarSyncMenu from './CalendarSyncMenu';
import type { Event } from '../types/events';

type ReminderType = 'in_app' | 'email' | 'push' | 'all';
type ReminderBefore = '15m' | '1h' | '24h' | 'week';

interface ReminderModalProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reminderType: ReminderType, reminderBefore: ReminderBefore) => void;
  isLoading?: boolean;
}

export default function ReminderModal({
  event,
  isOpen,
  onClose,
  onConfirm,
  isLoading = false,
}: ReminderModalProps) {
  const [reminderType, setReminderType] = useState<ReminderType>('all');
  const [reminderBefore, setReminderBefore] = useState<ReminderBefore>('24h');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(reminderType, reminderBefore);
  };

  const reminderTypeOptions: { value: ReminderType; label: string; icon: React.ReactNode; description: string }[] = [
    {
      value: 'in_app',
      label: 'In-App Notification',
      icon: <Bell className="w-5 h-5" />,
      description: 'Get notified in the app',
    },
    {
      value: 'email',
      label: 'Email Reminder',
      icon: <Mail className="w-5 h-5" />,
      description: 'Receive email notification',
    },
    {
      value: 'push',
      label: 'Push Notification',
      icon: <Smartphone className="w-5 h-5" />,
      description: 'Browser push notification',
    },
    {
      value: 'all',
      label: 'All Methods',
      icon: <Bell className="w-5 h-5" />,
      description: 'Get all notifications',
    },
  ];

  const timingOptions: { value: ReminderBefore; label: string }[] = [
    { value: '15m', label: '15 minutes before' },
    { value: '1h', label: '1 hour before' },
    { value: '24h', label: '24 hours before' },
    { value: 'week', label: '1 week before' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-white/10 w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header - Fixed at top */}
        <div className="flex justify-between items-start p-6 border-b border-white/10 flex-shrink-0">
          <div className="flex-1">
            <h2 className="text-2xl font-semibold text-white">Customize Reminders</h2>
            <p className="text-gray-300 text-sm mt-2">
              Set up reminders for <span className="font-semibold text-rose-400 truncate">{event.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-4"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-3">Notification Method</label>
              <div className="space-y-2">
                {reminderTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setReminderType(option.value)}
                    disabled={isLoading}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-start gap-3 ${
                      reminderType === option.value
                        ? 'border-rose-500 bg-rose-500/10'
                        : 'border-white/10 bg-white/5 hover:border-white/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className={`mt-0.5 flex-shrink-0 ${reminderType === option.value ? 'text-rose-400' : 'text-gray-400'}`}>
                      {option.icon}
                    </div>
                    <div>
                      <div className="text-white font-medium">{option.label}</div>
                      <div className="text-xs text-gray-400">{option.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-200 mb-3">When to Remind</label>
              <select
                value={reminderBefore}
                onChange={(e) => setReminderBefore(e.target.value as ReminderBefore)}
                disabled={isLoading}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {timingOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-gray-800">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-white/10 pt-4">
              <label className="block text-sm font-medium text-gray-200 mb-3">Sync to Calendar</label>
              <CalendarSyncMenu event={event} variant="button" />
            </div>
          </div>
        </div>

        {/* Footer Buttons - Fixed at bottom */}
        <div className="flex gap-3 p-6 border-t border-white/10 flex-shrink-0">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-3 border border-white/20 rounded-lg text-white hover:bg-white/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Skip
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Setting up...
              </>
            ) : (
              'Enable Reminders'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

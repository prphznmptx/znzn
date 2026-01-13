import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface DeleteFromDestinationModalProps {
  isOpen: boolean;
  destination: 'media' | 'masterclass';
  contentTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function DeleteFromDestinationModal({
  isOpen,
  destination,
  contentTitle,
  onConfirm,
  onCancel,
  isLoading = false,
}: DeleteFromDestinationModalProps) {
  const destinationLabel = destination === 'media' ? 'Media' : 'Masterclass';
  
  const handleConfirm = () => {
    onConfirm();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl font-bold text-slate-800">Delete from {destinationLabel}</h3>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0 mt-1">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-slate-900">Remove from {destinationLabel}?</h4>
              <p className="text-sm text-slate-600 mt-2">
                "{contentTitle}" will be removed from {destinationLabel} and moved to your content library.
              </p>
              <p className="text-sm text-slate-600 mt-2">
                Your content will remain available for 3 days. After that, it will be permanently deleted unless you save it.
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium transition disabled:opacity-50"
            >
              Keep on {destinationLabel}
            </button>

            <button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white rounded-lg font-medium transition"
            >
              {isLoading ? 'Removing...' : 'Remove'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

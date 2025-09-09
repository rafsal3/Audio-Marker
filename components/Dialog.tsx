
import React from 'react';
import { InfoIcon, QuestionIcon, WarningIcon, XIcon } from './icons';

export type DialogType = 'alert' | 'confirm' | 'warning';

interface DialogProps {
  isOpen: boolean;
  type: DialogType;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
}

const DialogIcons: Record<DialogType, React.ReactNode> = {
  alert: <InfoIcon className="w-10 h-10 text-blue-500" />,
  confirm: <QuestionIcon className="w-10 h-10 text-yellow-500" />,
  warning: <WarningIcon className="w-10 h-10 text-red-500" />,
};

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  type,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'OK',
  cancelText = 'Cancel',
}) => {
  if (!isOpen) {
    return null;
  }

  const isConfirm = type === 'confirm' || type === 'warning';

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 transition-opacity duration-300 animate-fadeIn"
      aria-labelledby="dialog-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 transform transition-transform duration-300 animate-scaleIn">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close dialog"
        >
          <XIcon className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center">
            <div className="mb-4">
                {DialogIcons[type]}
            </div>

            <h2 id="dialog-title" className="text-2xl font-bold text-gray-900 mb-2">
                {title}
            </h2>

            <p className="text-gray-600 mb-8">
                {message}
            </p>

            <div className="flex justify-center items-center gap-4 w-full">
                {isConfirm && (
                    <button
                        onClick={onCancel}
                        className="w-full px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-all focus:outline-none"
                    >
                        {cancelText}
                    </button>
                )}
                <button
                    onClick={onConfirm}
                    className={`w-full px-6 py-3 text-sm font-semibold text-white rounded-lg transition-all focus:outline-none ${
                        type === 'warning'
                        ? 'bg-red-600 hover:bg-red-700'
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {confirmText}
                </button>
            </div>
        </div>
      </div>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  );
};

export default Dialog;

'use client';

import { AlertCircle, CheckCircle, Info } from 'lucide-react';

export type MessageVariant = 'error' | 'success' | 'info';

type MessageModalProps = {
  open: boolean;
  title: string;
  message: string;
  variant?: MessageVariant;
  onClose: () => void;
};

const variantStyles: Record<MessageVariant, { icon: typeof AlertCircle; bg: string; iconColor: string }> = {
  error: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    iconColor: 'text-red-600',
  },
  success: {
    icon: CheckCircle,
    bg: 'bg-emerald-50',
    iconColor: 'text-emerald-600',
  },
  info: {
    icon: Info,
    bg: 'bg-sky-50',
    iconColor: 'text-sky-600',
  },
};

export function MessageModal({ open, title, message, variant = 'info', onClose }: MessageModalProps) {
  if (!open) return null;

  const { icon: Icon, bg, iconColor } = variantStyles[variant];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bg}`}>
            <Icon className={`h-5 w-5 ${iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
            <p className="mt-2 text-sm text-slate-600">{message}</p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--primary-hover)]"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

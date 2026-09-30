/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { LogOut, X } from 'lucide-react';

interface LogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmLogout: () => Promise<void>;
  userEmail?: string | null;
  userName?: string | null;
  isLoggingOut?: boolean;
}

export function LogoutModal({
  isOpen,
  onClose,
  onConfirmLogout,
  userEmail,
  userName,
  isLoggingOut = false,
}: LogoutModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoggingOut) {
          onClose();
        }
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-dialog-title"
    >
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200/90 w-full max-w-[420px] p-5 sm:p-6 text-center transform animate-in zoom-in-95 duration-150 relative">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoggingOut}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50 cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 text-teal-700 flex items-center justify-center mx-auto mb-4 shadow-2xs">
          <LogOut className="w-5 h-5" />
        </div>

        {/* Title & Copy */}
        <h3 id="logout-dialog-title" className="text-lg font-bold text-slate-900 tracking-tight">
          Log out of Ishara?
        </h3>

        <p className="text-xs text-slate-500 mt-2 leading-relaxed max-w-sm mx-auto">
          Your symptoms, sleep logs, and health records remain securely saved to your personal cloud account. You can log back in anytime to continue where you left off.
        </p>

        {/* User Account Pill */}
        {(userEmail || userName) && (
          <div className="mt-4 py-2 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-xs text-slate-600 flex items-center justify-center gap-2 max-w-xs mx-auto truncate">
            <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
            <span className="truncate font-medium text-slate-700">
              {userEmail || userName}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoggingOut}
            className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirmLogout}
            disabled={isLoggingOut}
            className="flex-1 py-2.5 px-4 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-xs transition-all active:scale-[0.99] disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoggingOut ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Signing out...</span>
              </>
            ) : (
              <span>Log Out</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

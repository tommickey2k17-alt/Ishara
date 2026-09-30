/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, PhoneCall, X } from 'lucide-react';
import { SafetyAlert } from '../../types';

interface Props {
  alert: SafetyAlert;
  onDismiss: (id: string) => void;
}

export const SafetyBanner: React.FC<Props> = ({ alert, onDismiss }) => {
  const isEmergency = alert.level === 'emergency_care';

  return (
    <div
      role="alert"
      className={`border rounded-2xl p-4 transition-all mb-4 ${
        isEmergency
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-xl shrink-0 mt-0.5 ${
              isEmergency ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-current text-opacity-90">
                {isEmergency ? 'Immediate Care Recommended' : 'Doctor Check Recommended'}
              </span>
              <span className="text-xs text-slate-500">
                Logged {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <p className="text-sm font-semibold leading-snug">
              Some of the symptoms you recorded may need prompt attention from a doctor or emergency care.
            </p>

            <p className="text-xs text-slate-700 leading-relaxed">{alert.explanation}</p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <a
                href={`tel:${alert.emergencyNumber}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Call Emergency ({alert.emergencyNumber})
              </a>

              {alert.recommendedAction && (
                <span className="text-xs text-slate-700 font-medium">
                  {alert.recommendedAction}
                </span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => onDismiss(alert.id)}
          className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-black/5 transition-colors cursor-pointer shrink-0"
          title="Dismiss notice"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

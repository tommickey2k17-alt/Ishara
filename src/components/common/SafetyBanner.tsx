/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AlertTriangle, PhoneCall, X, ShieldAlert } from 'lucide-react';
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
      className={`border rounded-xl p-4 transition-all mb-4 ${
        isEmergency
          ? 'bg-rose-50 border-rose-200 text-rose-950'
          : 'bg-amber-50 border-amber-200 text-amber-950'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`p-2 rounded-lg shrink-0 mt-0.5 ${
              isEmergency ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white/80 border border-current text-opacity-90">
                {isEmergency ? 'Urgent Medical Attention Prompt' : 'Clinical Evaluation Prompt'}
              </span>
              <span className="text-xs text-slate-500">
                Logged {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <p className="text-sm font-semibold leading-snug">
              Some of the symptoms you have recorded can be associated with situations that require prompt medical evaluation.
            </p>

            <p className="text-xs text-slate-700 leading-relaxed">{alert.explanation}</p>

            <div className="pt-1 flex flex-wrap items-center gap-3">
              <a
                href={`tel:${alert.emergencyNumber}`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                Call Emergency ({alert.emergencyNumber})
              </a>

              <span className="text-xs text-slate-600">
                Action: <strong className="text-slate-800">{alert.recommendedAction}</strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5 pt-2 text-[11px] text-slate-500">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>
                <strong>Safety Disclaimer:</strong> This alert is a safety prompt, not a diagnosis. A qualified healthcare professional should evaluate your symptoms.
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => onDismiss(alert.id)}
          title="Acknowledge & Dismiss"
          className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

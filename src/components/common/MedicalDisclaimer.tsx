/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface Props {
  className?: string;
  compact?: boolean;
}

export const MedicalDisclaimer: React.FC<Props> = ({ className = '', compact = false }) => {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 text-xs text-slate-500 py-2 border-t border-slate-200/60 ${className}`}>
        <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
        <span>
          <strong>Safety note:</strong> Ishara is a health journal to help you track symptoms and share them with your doctor. It does not provide medical diagnoses or advice.
        </span>
      </div>
    );
  }

  return (
    <div className={`p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed ${className}`}>
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-800">Important Safety Reminder: </strong>
          Ishara helps you keep track of your health notes and share them easily with your healthcare team. It is <strong>not a diagnostic tool</strong> and cannot replace the care, diagnosis, or advice of a doctor. If you ever feel severely unwell, have intense chest pain, difficulty breathing, or other emergency symptoms, please contact emergency services right away.
        </div>
      </div>
    </div>
  );
};

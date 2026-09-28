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
          <strong>Safety Note:</strong> Ishara is an informational journal and clinician communication aid. It does not provide medical diagnoses, treatment advice, or prescriptions.
        </span>
      </div>
    );
  }

  return (
    <div className={`p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 leading-relaxed ${className}`}>
      <div className="flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <strong className="font-semibold text-slate-800">Medical Safety Principle: </strong>
          Ishara is a personal health documentation and doctor communication tool. It is <strong>not a medical diagnostic tool</strong> and does not replace the evaluation, diagnosis, or treatment by a qualified healthcare professional. If you experience severe, worsening, or urgent symptoms, contact local emergency services immediately.
        </div>
      </div>
    </div>
  );
};

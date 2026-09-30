/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { ClinicalTriState } from '../../types';

interface Props {
  value: ClinicalTriState | undefined;
  onChange: (val: ClinicalTriState) => void;
  label?: string;
  helperText?: string;
  className?: string;
  size?: 'sm' | 'md';
}

export const TriStateSelector: React.FC<Props> = ({
  value = 'not_recorded',
  onChange,
  label,
  helperText,
  className = '',
  size = 'md',
}) => {
  const pyClass = size === 'sm' ? 'py-1 text-[11px]' : 'py-1.5 text-xs';
  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-xs">
          <span className="font-semibold text-slate-700">{label}</span>
          {helperText && <span className="text-[10px] text-slate-400">{helperText}</span>}
        </div>
      )}
      <div className="grid grid-cols-3 gap-1.5 p-0.5 bg-slate-100/80 rounded-lg border border-slate-200">
        <button
          type="button"
          onClick={() => onChange('yes')}
          className={`${pyClass} px-2 font-semibold rounded-md transition-all cursor-pointer ${
            value === 'yes'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          Yes
        </button>
        <button
          type="button"
          onClick={() => onChange('no')}
          className={`${pyClass} px-2 font-semibold rounded-md transition-all cursor-pointer ${
            value === 'no'
              ? 'bg-slate-700 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          No
        </button>
        <button
          type="button"
          onClick={() => onChange('not_recorded')}
          className={`${pyClass} px-1.5 font-medium rounded-md transition-all cursor-pointer ${
            value === 'not_recorded'
              ? 'bg-amber-100 text-amber-900 font-semibold border border-amber-300 shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/60'
          }`}
        >
          Not sure
        </button>
      </div>
    </div>
  );
};

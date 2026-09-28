/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Check, X, HelpCircle } from 'lucide-react';
import { ClinicalTriState } from '../../types';

interface Props {
  state: ClinicalTriState | undefined;
  label?: string;
  size?: 'xs' | 'sm';
  className?: string;
}

export const TriStateBadge: React.FC<Props> = ({
  state = 'not_recorded',
  label,
  size = 'xs',
  className = '',
}) => {
  const getConfig = () => {
    switch (state) {
      case 'yes':
        return {
          text: 'YES',
          icon: Check,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold',
        };
      case 'no':
        return {
          text: 'NO',
          icon: X,
          classes: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
        };
      case 'not_recorded':
      default:
        return {
          text: 'NOT RECORDED',
          icon: HelpCircle,
          classes: 'bg-amber-50/70 text-amber-800 border-amber-300/80 font-medium italic',
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] tracking-wide select-none ${config.classes} ${className}`}
      title={
        state === 'not_recorded'
          ? 'Information was not asked or not recorded. Absence of recording is NOT a negative finding.'
          : undefined
      }
    >
      {label && <span className="font-normal not-italic text-slate-600 mr-0.5">{label}:</span>}
      <Icon className="w-2.5 h-2.5 shrink-0" />
      <span>{config.text}</span>
    </span>
  );
};

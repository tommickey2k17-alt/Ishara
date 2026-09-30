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
          text: 'Yes',
          icon: Check,
          classes: 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold',
          tooltip: 'Confirmed yes',
        };
      case 'no':
        return {
          text: 'No',
          icon: X,
          classes: 'bg-slate-100 text-slate-700 border-slate-300 font-medium',
          tooltip: 'Confirmed no',
        };
      case 'not_recorded':
      default:
        return {
          text: 'Not recorded',
          icon: HelpCircle,
          classes: 'bg-amber-50/70 text-amber-800 border-amber-300/80 font-normal',
          tooltip: "This was not asked or not recorded. We never assume it means 'no'.",
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] select-none ${config.classes} ${className}`}
      title={config.tooltip}
    >
      {label && <span className="font-normal text-slate-600 mr-0.5">{label}:</span>}
      <Icon className="w-2.5 h-2.5 shrink-0" />
      <span>{config.text}</span>
    </span>
  );
};

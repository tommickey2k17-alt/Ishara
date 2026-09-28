/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserCheck, Calculator, Sparkles, ShieldAlert, Info } from 'lucide-react';
import { DataProvenance } from '../../types';

interface Props {
  type: DataProvenance;
  size?: 'xs' | 'sm' | 'default';
  showDescriptionTooltip?: boolean;
  className?: string;
  customLabel?: string;
}

export const DataProvenanceBadge: React.FC<Props> = ({
  type,
  size = 'xs',
  className = '',
  customLabel,
}) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'user_fact':
        return {
          label: customLabel || 'USER-REPORTED FACT',
          shortLabel: 'USER FACT',
          icon: UserCheck,
          styles: 'bg-sky-50 text-sky-800 border-sky-200/80',
          tooltip: 'Directly logged by user. Unverified patient-reported observation.',
        };
      case 'calculated':
        return {
          label: customLabel || 'CALCULATED DATA',
          shortLabel: 'CALCULATED',
          icon: Calculator,
          styles: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
          tooltip: 'Mathematical computation or average from recorded timestamps and entries.',
        };
      case 'ai_observation':
        return {
          label: customLabel || 'AI OBSERVATION (NON-DIAGNOSTIC)',
          shortLabel: 'AI OBSERVATION',
          icon: Sparkles,
          styles: 'bg-amber-50 text-amber-800 border-amber-200/80',
          tooltip: 'Pattern synthesis by language model. Not a clinical diagnosis.',
        };
      default:
        return {
          label: 'RECORD',
          shortLabel: 'RECORD',
          icon: Info,
          styles: 'bg-slate-50 text-slate-700 border-slate-200',
          tooltip: 'Recorded data',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses =
    size === 'xs'
      ? 'text-[10px] px-1.5 py-0.5 gap-1 font-mono tracking-wider'
      : size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1.5 font-mono tracking-wider'
      : 'text-xs px-2.5 py-1 gap-2 font-mono tracking-wider';

  return (
    <span
      className={`inline-flex items-center font-bold uppercase rounded border select-none ${config.styles} ${sizeClasses} ${className}`}
      title={config.tooltip}
    >
      <Icon className={size === 'xs' ? 'w-2.5 h-2.5 shrink-0' : 'w-3 h-3 shrink-0'} />
      <span>{config.label}</span>
    </span>
  );
};

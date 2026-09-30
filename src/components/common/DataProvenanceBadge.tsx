/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { UserCheck, Calculator, Sparkles, Info } from 'lucide-react';
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
          label: customLabel || 'Logged by you',
          shortLabel: 'Your note',
          icon: UserCheck,
          styles: 'bg-sky-50 text-sky-800 border-sky-200/80',
          tooltip: 'Information you entered directly into your journal.',
        };
      case 'calculated':
        return {
          label: customLabel || 'Calculated',
          shortLabel: 'Calculated',
          icon: Calculator,
          styles: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
          tooltip: 'Numbers and averages worked out from your entries.',
        };
      case 'ai_observation':
        return {
          label: customLabel || 'Pattern spotted',
          shortLabel: 'Pattern spotted',
          icon: Sparkles,
          styles: 'bg-amber-50 text-amber-800 border-amber-200/80',
          tooltip: 'A pattern spotted in your health entries. This is not a medical diagnosis.',
        };
      default:
        return {
          label: 'Record',
          shortLabel: 'Record',
          icon: Info,
          styles: 'bg-slate-50 text-slate-700 border-slate-200',
          tooltip: 'Recorded health information.',
        };
    }
  };

  const config = getBadgeConfig();
  const Icon = config.icon;

  const sizeClasses =
    size === 'xs'
      ? 'text-[10px] px-1.5 py-0.5 gap-1'
      : size === 'sm'
      ? 'text-[11px] px-2 py-0.5 gap-1'
      : 'text-xs px-2.5 py-1 gap-1.5';

  return (
    <span
      className={`inline-flex items-center rounded-md font-medium border select-none transition-colors ${config.styles} ${sizeClasses} ${className}`}
      title={config.tooltip}
    >
      <Icon className="w-2.5 h-2.5 shrink-0 opacity-80" />
      <span>{config.shortLabel}</span>
    </span>
  );
};

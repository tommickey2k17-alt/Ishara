/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Activity, FileText, UserCheck, RefreshCw, CalendarCheck } from 'lucide-react';
import { UserProfile } from '../../types';
import { PWAInstallButton } from './PWAInstallButton';

interface Props {
  profile: UserProfile;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  onOpenDoctorReport: () => void;
  onOpenDailyCheckIn: () => void;
  onNavigateToTab: (tab: string) => void;
  checkInDoneToday: boolean;
}

export const Header: React.FC<Props> = ({
  profile,
  isDemoMode,
  onToggleDemoMode,
  onOpenDoctorReport,
  onOpenDailyCheckIn,
  onNavigateToTab,
  checkInDoneToday,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Demo Data Notice Bar if in demo mode */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-1.5 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-semibold tracking-wide uppercase text-[11px]">Demo Data</span>
            <span className="text-amber-800 hidden sm:inline">— Not Real Medical Information (Fictional Patient: Rohan Sharma)</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleDemoMode}
              className="text-amber-900 hover:text-amber-950 underline text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset Demo Data"
            >
              <RefreshCw className="w-3 h-3" />
              <span className="hidden xs:inline">Reset Demo</span>
            </button>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateToTab('home')}>
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">Ishara</h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 hidden sm:inline-block">
                Health Journal
              </span>
            </div>
            <p className="text-[11px] text-slate-700 hidden sm:block">Doctor Communication & Symptom Intake</p>
          </div>
        </div>

        {/* Center / Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* In-App PWA Install Button */}
          <PWAInstallButton />

          {/* Daily Check-in Button */}
          <button
            onClick={onOpenDailyCheckIn}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              checkInDoneToday
                ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-semibold'
            }`}
            title="30-Second Daily Check-in"
          >
            <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Daily Check-in</span>
            {checkInDoneToday ? (
              <span className="text-[10px] text-emerald-600 font-semibold">Done</span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Generate Doctor Report Button - Major Highlight */}
          <button
            onClick={onOpenDoctorReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-all hover:shadow cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Doctor Report</span>
          </button>

          {/* User Profile avatar / tab switch */}
          <button
            onClick={() => onNavigateToTab('profile')}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 cursor-pointer"
            title="View Profile & Settings"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold border border-slate-300">
              {profile.name.charAt(0) || 'U'}
            </div>
            <span className="text-xs font-medium text-slate-800 hidden md:inline truncate max-w-[100px]">
              {profile.name.split(' ')[0]}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

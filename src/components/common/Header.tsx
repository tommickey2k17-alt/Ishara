/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Activity,
  FileText,
  UserCheck,
  RefreshCw,
  CalendarCheck,
  LogOut,
  MoreVertical,
  CheckCircle2,
  X,
} from 'lucide-react';
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
  userEmail?: string | null;
  onSignOut?: () => void;
}

export const Header: React.FC<Props> = ({
  profile,
  isDemoMode,
  onToggleDemoMode,
  onOpenDoctorReport,
  onOpenDailyCheckIn,
  onNavigateToTab,
  checkInDoneToday,
  userEmail,
  onSignOut,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close mobile dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top Demo Data Notice Bar if in demo mode */}
      {isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-500/20 px-3 sm:px-4 py-1 text-xs text-amber-900 flex items-center justify-between">
          <div className="flex items-center gap-1.5 font-medium truncate">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
            <span className="font-semibold tracking-wide uppercase text-[10px] sm:text-[11px]">Sample Mode</span>
            <span className="text-amber-800 hidden sm:inline">— Testing with sample data (Profile: {profile?.name?.trim() || 'Not provided'})</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onToggleDemoMode}
              className="text-amber-900 hover:text-amber-950 underline text-[11px] sm:text-xs font-semibold flex items-center gap-1 cursor-pointer"
              title="Reset Sample Data"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. DEDICATED MOBILE HEADER (<768px): Clean, compact, no horizontal squeeze */}
      {/* ========================================================================= */}
      <div className="flex md:hidden items-center justify-between h-14 px-3 sm:px-4 w-full relative">
        {/* Brand & Identity */}
        <div
          className="flex items-center gap-2.5 cursor-pointer shrink-0"
          onClick={() => onNavigateToTab('home')}
        >
          <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Activity className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold tracking-tight text-slate-900">Ishara</h1>
          </div>
        </div>

        {/* Essential Mobile Actions: Check-in quick button + Compact Menu */}
        <div className="flex items-center gap-2" ref={mobileMenuRef}>
          {/* Quick Check-in pill (only if not done yet to conserve space) */}
          {!checkInDoneToday ? (
            <button
              onClick={onOpenDailyCheckIn}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-full text-xs font-semibold transition-colors cursor-pointer"
              title="Daily Health Check-in"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Check-in</span>
            </button>
          ) : (
            <button
              onClick={onOpenDailyCheckIn}
              className="flex items-center gap-1 px-2 py-1 text-slate-500 hover:text-teal-700 text-xs font-medium cursor-pointer"
              title="Update Today's Check-in"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
              <span className="text-[11px] text-teal-700 font-semibold">Done</span>
            </button>
          )}

          {/* Compact Menu / Overflow Trigger */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex items-center gap-1.5 pl-1.5 pr-2 py-1 rounded-xl border transition-colors cursor-pointer ${
              isMobileMenuOpen
                ? 'bg-teal-50 border-teal-300 text-teal-900'
                : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
            }`}
            aria-label="Open mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <div className="w-6 h-6 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[11px] font-bold">
              {profile?.name?.trim() ? profile.name.trim().charAt(0).toUpperCase() : 'U'}
            </div>
            <MoreVertical className="w-3.5 h-3.5 text-slate-500" />
          </button>

          {/* Mobile Overflow Menu Dropdown */}
          {isMobileMenuOpen && (
            <div className="absolute right-3 top-14 mt-1 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              {/* User info snippet */}
              <div className="px-4 py-2 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-900 block truncate">
                  {profile?.name?.trim() || 'Your Journal'}
                </span>
                {userEmail && (
                  <span className="text-[11px] text-slate-500 block truncate">{userEmail}</span>
                )}
              </div>

              {/* Action items */}
              <div className="py-1">
                {/* Doctor Report Modal button */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenDoctorReport();
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer font-medium"
                >
                  <FileText className="w-4 h-4 text-teal-600 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold block">Doctor Report</span>
                    <span className="text-[10px] text-slate-400">Generate doctor visit summary</span>
                  </div>
                </button>

                {/* Today's Check-in */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onOpenDailyCheckIn();
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors cursor-pointer font-medium"
                >
                  <CalendarCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div className="flex-1">
                    <span className="font-semibold block">Today's Health Check-in</span>
                    <span className="text-[10px] text-slate-400">
                      {checkInDoneToday ? 'Edit readings & wellness' : 'Record BP, weight, temp'}
                    </span>
                  </div>
                </button>

                {/* Profile & Settings */}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    onNavigateToTab('profile');
                  }}
                  className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors cursor-pointer font-medium"
                >
                  <UserCheck className="w-4 h-4 text-slate-500 shrink-0" />
                  <span>Profile & Settings</span>
                </button>

                {/* Demo Data Reset (if in demo mode) */}
                {isDemoMode && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onToggleDemoMode();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-xs text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer font-medium"
                  >
                    <RefreshCw className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Reset Sample Data</span>
                  </button>
                )}
              </div>

              {/* Log Out */}
              {onSignOut && (
                <div className="pt-1 border-t border-slate-100 mt-1">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSignOut();
                    }}
                    className="w-full px-4 py-2 text-left flex items-center gap-2.5 text-xs text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer font-semibold"
                  >
                    <LogOut className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Log Out of Ishara</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. DESKTOP / TABLET HEADER (>=768px): Kept 100% visually unchanged */}
      {/* ========================================================================= */}
      <div className="hidden md:flex max-w-6xl mx-auto px-4 sm:px-6 h-16 items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigateToTab('home')}>
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-xs">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold tracking-tight text-slate-900 leading-tight">Ishara</h1>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200/60 inline-block">
                Health Journal
              </span>
            </div>
            <p className="text-[11px] text-slate-700 block">Health journal & doctor visit prep</p>
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
            <span>Daily Check-in</span>
            {checkInDoneToday ? (
              <span className="text-[10px] text-emerald-600 font-semibold">Done</span>
            ) : (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            )}
          </button>

          {/* Generate Doctor Report Button - Major Highlight */}
          <button
            onClick={onOpenDoctorReport}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all hover:shadow cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Doctor Report</span>
          </button>

          {/* User Profile avatar / tab switch */}
          <button
            onClick={() => onNavigateToTab('profile')}
            className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition-colors text-slate-700 cursor-pointer"
            title={userEmail ? `Logged in as ${userEmail}` : 'View Profile & Settings'}
          >
            <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-xs font-bold border border-teal-200">
              {profile?.name?.trim() ? profile.name.trim().charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-medium text-slate-800 inline truncate max-w-[100px]">
              {profile?.name?.trim() ? profile.name.trim().split(' ')[0] : 'You'}
            </span>
          </button>

          {/* Secure Log Out Button */}
          {onSignOut && (
            <button
              onClick={onSignOut}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors text-xs font-medium cursor-pointer"
              title="Log out of Ishara"
            >
              <LogOut className="w-3.5 h-3.5 text-slate-500" />
              <span>Log Out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

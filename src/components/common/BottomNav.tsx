/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Home,
  Clock,
  BarChart3,
  FolderHeart,
  MoreHorizontal,
  Plus,
  Stethoscope,
  Moon,
  FileText,
  User,
  Download,
  X,
  FileSpreadsheet,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { ExportService } from '../../services/exportService';

interface Props {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onOpenQuickLog: () => void;
  onOpenDoctorReport?: () => void;
}

export const BottomNav: React.FC<Props> = ({
  activeTab,
  onTabChange,
  onOpenQuickLog,
  onOpenDoctorReport,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Tabs as explicitly requested: Home, Timeline, Trends, Records and More
  const mobileTabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'trends', label: 'Trends', icon: BarChart3 },
    { id: 'records', label: 'Records', icon: FolderHeart },
    { id: 'more', label: 'More', icon: MoreHorizontal },
  ];

  const handleTabClick = (tabId: string) => {
    if (tabId === 'more') {
      setIsMoreOpen(true);
    } else {
      onTabChange(tabId);
    }
  };

  return (
    <>
      {/* Prominent Floating Log Button for Mobile & Desktop */}
      <div className="fixed bottom-20 md:bottom-8 right-6 z-40">
        <button
          onClick={onOpenQuickLog}
          className="flex items-center gap-2 px-5 py-3.5 bg-teal-600 hover:bg-teal-700 active:scale-95 text-white font-bold rounded-full shadow-xl shadow-teal-700/30 transition-all cursor-pointer group"
          aria-label="Quick Log health event"
        >
          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 stroke-[2.5]" />
          <span className="text-sm tracking-wide">+ Log</span>
        </button>
      </div>

      {/* Bottom Navigation Bar for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 safe-area-pb shadow-lg">
        <div className="flex items-center justify-around">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === 'more' ? isMoreOpen : activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-3 min-w-[56px] text-xs transition-colors cursor-pointer ${
                  isActive ? 'text-teal-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'text-teal-600 stroke-[2.25]' : 'text-slate-400'}`} />
                <span className="text-[11px] leading-tight">{tab.label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-teal-600 mt-0.5" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* "MORE" Drawer Sheet Modal for Mobile */}
      {isMoreOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/60 backdrop-blur-sm md:hidden animate-in fade-in duration-150">
          <div className="w-full bg-white rounded-t-3xl p-6 space-y-4 max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900">More Tools & Navigation</h3>
                <p className="text-xs text-slate-500">Access full journal tools and medical reports</p>
              </div>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:text-slate-900"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation links grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => {
                  onTabChange('symptoms');
                  setIsMoreOpen(false);
                }}
                className="p-3.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-1 text-left cursor-pointer transition-colors"
              >
                <Stethoscope className="w-5 h-5 text-teal-600" />
                <span className="font-bold text-slate-900">Symptom Database</span>
                <span className="text-[11px] text-slate-500">History, triggers & detail</span>
              </button>

              <button
                onClick={() => {
                  onTabChange('sleep');
                  setIsMoreOpen(false);
                }}
                className="p-3.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-1 text-left cursor-pointer transition-colors"
              >
                <Moon className="w-5 h-5 text-indigo-600" />
                <span className="font-bold text-slate-900">Sleep Journal</span>
                <span className="text-[11px] text-slate-500">Duration & quality stats</span>
              </button>

              <button
                onClick={() => {
                  onTabChange('doctor_visit');
                  setIsMoreOpen(false);
                }}
                className="p-3.5 bg-teal-50/60 hover:bg-teal-100/60 border border-teal-200 rounded-2xl flex flex-col items-start gap-1 text-left cursor-pointer transition-colors"
              >
                <Sparkles className="w-5 h-5 text-teal-700" />
                <span className="font-bold text-teal-950">Doctor Visit Mode</span>
                <span className="text-[11px] text-teal-700">Appointment briefing & Qs</span>
              </button>

              <button
                onClick={() => {
                  if (onOpenDoctorReport) onOpenDoctorReport();
                  setIsMoreOpen(false);
                }}
                className="p-3.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-1 text-left cursor-pointer transition-colors"
              >
                <FileText className="w-5 h-5 text-emerald-600" />
                <span className="font-bold text-slate-900">Doctor Report</span>
                <span className="text-[11px] text-slate-500">One-page clinical summary</span>
              </button>

              <button
                onClick={() => {
                  onTabChange('profile');
                  setIsMoreOpen(false);
                }}
                className="p-3.5 bg-slate-50 hover:bg-teal-50 border border-slate-200 rounded-2xl flex flex-col items-start gap-1 text-left cursor-pointer transition-colors col-span-2"
              >
                <User className="w-5 h-5 text-slate-700" />
                <div className="flex justify-between w-full items-center">
                  <div>
                    <span className="font-bold text-slate-900 block">Profile & Settings</span>
                    <span className="text-[11px] text-slate-500">Conditions, allergies & emergency contacts</span>
                  </div>
                </div>
              </button>
            </div>

            {/* Quick Export Section */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Export Health Data:
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => {
                    ExportService.exportCSV();
                    setIsMoreOpen(false);
                  }}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Download CSV</span>
                </button>
                <button
                  onClick={() => {
                    ExportService.exportJSON();
                    setIsMoreOpen(false);
                  }}
                  className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>Download JSON</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

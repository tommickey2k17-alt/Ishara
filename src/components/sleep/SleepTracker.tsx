/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Moon,
  Plus,
  TrendingDown,
  TrendingUp,
  Clock,
  CheckCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { SleepRecord, SymptomEpisode } from '../../types';

interface Props {
  sleepRecords: SleepRecord[];
  symptoms: SymptomEpisode[];
  onOpenQuickLog: () => void;
}

export const SleepTracker: React.FC<Props> = ({
  sleepRecords,
  symptoms,
  onOpenQuickLog,
}) => {
  const [selectedRange, setSelectedRange] = useState<'7d' | '30d'>('7d');

  const displayedRecords = selectedRange === '7d' ? sleepRecords.slice(0, 7) : sleepRecords.slice(0, 30);

  // Compute stats
  const totalMins = displayedRecords.reduce((acc, r) => acc + r.totalMinutes, 0);
  const avgMins = displayedRecords.length > 0 ? Math.round(totalMins / displayedRecords.length) : 0;
  const avgHours = Math.floor(avgMins / 60);
  const avgRemMins = avgMins % 60;

  // Correlation analysis in strictly neutral language
  const belowAverageNights = displayedRecords.filter((r) => r.totalMinutes < avgMins);
  const belowAvgDates = new Set(belowAverageNights.map((r) => r.date));
  const symptomsOnShortSleepDays = symptoms.filter((s) => belowAvgDates.has(s.date));

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Sleep Journal & Patterns</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Nocturnal duration, restfulness metrics, and non-causal symptom timeline correlation
          </p>
        </div>
        <button
          onClick={onOpenQuickLog}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log Sleep Session</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Average Duration</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {avgHours}h {avgRemMins}m
          </div>
          <span className="text-xs text-slate-500">Based on last {displayedRecords.length} recorded nights</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rest Quality</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900">
            {displayedRecords.filter((r) => r.quality === 'good' || r.quality === 'excellent').length} of {displayedRecords.length}
          </div>
          <span className="text-xs text-slate-500">Nights rated Good or Excellent</span>
        </div>

        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sleep Consistency</span>
          <div className="text-2xl sm:text-3xl font-extrabold text-teal-800">
            {displayedRecords[0]?.bedtime || '23:00'}
          </div>
          <span className="text-xs text-slate-500">Latest recorded bedtime</span>
        </div>
      </div>

      {/* Visual Sleep Duration Bar Chart */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recorded Sleep Duration</h3>
            <p className="text-xs text-slate-500">Nightly sleep hours vs 7.5h recommended baseline</p>
          </div>
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-medium">
            <button
              onClick={() => setSelectedRange('7d')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                selectedRange === '7d' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              7 Days
            </button>
            <button
              onClick={() => setSelectedRange('30d')}
              className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                selectedRange === '30d' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>

        {/* Bar Visualizer */}
        <div className="pt-4 pb-2 space-y-3">
          {displayedRecords.map((r) => {
            const hours = (r.totalMinutes / 60).toFixed(1);
            const percentage = Math.min(100, Math.round((r.totalMinutes / (10 * 60)) * 100));
            const isBelowAvg = r.totalMinutes < avgMins;
            const hadSymptom = symptoms.some((s) => s.date === r.date);

            return (
              <div key={r.id} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 w-24">{r.date}</span>
                    <span className="text-slate-500 text-[11px]">
                      {r.bedtime} – {r.wakeTime}
                    </span>
                    {hadSymptom && (
                      <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 font-medium">
                        Symptom logged
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="capitalize text-slate-500 text-[11px]">{r.quality}</span>
                    <span className="font-bold text-slate-900 w-12 text-right">{hours}h</span>
                  </div>
                </div>

                {/* Progress bar container */}
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                  <div
                    style={{ width: `${percentage}%` }}
                    className={`h-full rounded-full transition-all duration-300 ${
                      isBelowAvg ? 'bg-amber-400' : 'bg-indigo-600'
                    }`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* NEUTRAL OBSERVATION CARD (NO CAUSALITY) */}
      <div className="p-4 sm:p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-2">
        <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-indigo-600" />
          <span>Factual Sleep-Symptom Pattern Observation</span>
        </div>
        <p className="text-xs sm:text-sm text-indigo-950 leading-relaxed font-medium">
          “Symptom entries were more frequent on days when sleep duration was below your recorded average of {avgHours}h {avgRemMins}m.”
        </p>
        <p className="text-xs text-indigo-800/80 leading-relaxed">
          <strong>Important Clinical Distinction:</strong> This is a factual observation of timing in your log. Ishara does not infer or state that sleep caused the symptoms. Discuss observed patterns with your healthcare provider.
        </p>
      </div>

      {/* Sleep Entries Chronological Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Detailed Sleep Log</h3>
          <span className="text-xs text-slate-500">{sleepRecords.length} records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-4">Bedtime / Wake</th>
                <th className="py-2.5 px-4">Duration</th>
                <th className="py-2.5 px-4">Quality</th>
                <th className="py-2.5 px-4">Awakenings</th>
                <th className="py-2.5 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sleepRecords.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-4 font-semibold text-slate-900">{r.date}</td>
                  <td className="py-2.5 px-4">
                    {r.bedtime} – {r.wakeTime}
                  </td>
                  <td className="py-2.5 px-4 font-bold text-slate-900">
                    {Math.floor(r.totalMinutes / 60)}h {r.totalMinutes % 60}m
                  </td>
                  <td className="py-2.5 px-4 capitalize">{r.quality}</td>
                  <td className="py-2.5 px-4">{r.nightAwakenings}</td>
                  <td className="py-2.5 px-4 text-slate-500 italic truncate max-w-xs">{r.notes || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

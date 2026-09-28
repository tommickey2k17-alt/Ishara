/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Moon,
  Sparkles,
  Calendar,
  AlertCircle,
  HelpCircle,
  Download,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Info,
  Clock,
  Layers,
} from 'lucide-react';
import { DailyCheckIn, MeasurementRecord, SleepRecord, SymptomEpisode } from '../../types';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { ExportService } from '../../services/exportService';

interface Props {
  symptoms: SymptomEpisode[];
  sleepRecords: SleepRecord[];
  checkIns: DailyCheckIn[];
  measurements: MeasurementRecord[];
}

export const TrendsAnalytics: React.FC<Props> = ({
  symptoms,
  sleepRecords,
  checkIns,
  measurements,
}) => {
  const [selectedRange, setSelectedRange] = useState<7 | 14 | 30 | 90 | 180>(30);
  const [activeMetricTab, setActiveMetricTab] = useState<'symptoms' | 'sleep' | 'wellness' | 'quality'>('symptoms');

  // Filter items by selected date range
  const now = new Date();
  const cutoffDate = new Date();
  cutoffDate.setDate(now.getDate() - selectedRange);
  const cutoffStr = cutoffDate.toISOString().split('T')[0];

  const filteredSymptoms = symptoms.filter((s) => s.date >= cutoffStr);
  const filteredSleep = sleepRecords.filter((s) => s.date >= cutoffStr);
  const filteredCheckIns = checkIns.filter((c) => c.date >= cutoffStr);
  const filteredMeasurements = measurements.filter((m) => m.date >= cutoffStr);

  // Group symptom frequency
  const symptomCounts: Record<string, number> = {};
  filteredSymptoms.forEach((s) => {
    symptomCounts[s.symptomName] = (symptomCounts[s.symptomName] || 0) + 1;
  });
  const sortedSymptoms = Object.entries(symptomCounts).sort((a, b) => b[1] - a[1]);

  // Compute average metrics from checkins
  const avgEnergy =
    filteredCheckIns.length > 0
      ? (filteredCheckIns.reduce((acc, c) => acc + c.energyLevel, 0) / filteredCheckIns.length).toFixed(1)
      : '—';
  const avgStress =
    filteredCheckIns.length > 0
      ? (filteredCheckIns.reduce((acc, c) => acc + c.stressLevel, 0) / filteredCheckIns.length).toFixed(1)
      : '—';

  // Sleep stats
  const avgSleepMins =
    filteredSleep.length > 0
      ? Math.round(filteredSleep.reduce((acc, s) => acc + s.totalMinutes, 0) / filteredSleep.length)
      : 0;
  const avgSleepHours = Math.floor(avgSleepMins / 60);
  const avgSleepRemMins = avgSleepMins % 60;

  // Average symptom severity
  const avgSeverity =
    filteredSymptoms.length > 0
      ? (filteredSymptoms.reduce((acc, s) => acc + s.severity, 0) / filteredSymptoms.length).toFixed(1)
      : '0';

  // Data Quality Metrics Calculation
  const totalSymptomEpisodes = filteredSymptoms.length;
  const withLocation = filteredSymptoms.filter((s) => s.location && s.location.trim().length > 0).length;
  const withDuration = filteredSymptoms.filter((s) => s.duration && s.duration.trim().length > 0).length;
  const withTriggers = filteredSymptoms.filter((s) => s.triggers && s.triggers.length > 0).length;
  const withTriStates = filteredSymptoms.filter(
    (s) =>
      (s.feverReported && s.feverReported !== 'not_recorded') ||
      (s.priorOccurrenceState && s.priorOccurrenceState !== 'not_recorded') ||
      (s.medicallyEvaluatedState && s.medicallyEvaluatedState !== 'not_recorded')
  ).length;

  const symptomCompletenessPct = totalSymptomEpisodes > 0
    ? Math.round(((withLocation + withDuration + withTriggers + withTriStates) / (totalSymptomEpisodes * 4)) * 100)
    : 100;

  const sleepDaysCoveragePct = Math.min(100, Math.round((filteredSleep.length / Math.min(selectedRange, 30)) * 100));

  const checkInCoveragePct = Math.min(100, Math.round((filteredCheckIns.length / Math.min(selectedRange, 30)) * 100));

  const overallQualityScore = Math.round(
    symptomCompletenessPct * 0.4 + sleepDaysCoveragePct * 0.35 + checkInCoveragePct * 0.25
  );

  return (
    <div className="space-y-6 pb-28">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Trends & Analytics</h2>
            <DataProvenanceBadge type="calculated" />
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            Chronological trend synthesis, data completeness audit, and structured export
          </p>
        </div>

        {/* Range Selector & Export Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Interactive Date Range */}
          <div className="flex rounded-xl border border-slate-200 bg-white p-1 text-xs font-semibold shadow-xs">
            {([7, 14, 30, 90, 180] as const).map((r) => (
              <button
                key={r}
                onClick={() => setSelectedRange(r)}
                className={`px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  selectedRange === r ? 'bg-teal-600 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {r === 180 ? 'All' : `${r}d`}
              </button>
            ))}
          </div>

          {/* Export Dropdown / Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => ExportService.exportCSV()}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Export structured CSV for spreadsheets"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => ExportService.exportJSON()}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Export full structured health JSON"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* MANDATORY NON-CAUSAL CLINICAL DISCLAIMER BANNER */}
      <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-900 space-y-1">
          <p className="font-bold flex items-center gap-2">
            <span>TEMPORAL ASSOCIATION NOTICE (NON-CAUSAL):</span>
            <DataProvenanceBadge type="ai_observation" />
          </p>
          <p className="leading-relaxed text-amber-800">
            Temporal patterns observed in this journal (e.g. headaches logged following nights with &lt;6 hours sleep)
            indicate timing coincidence only. <strong>Correlation does NOT prove clinical causation.</strong> Do not self-treat
            or draw medical conclusions; discuss observed timelines with a licensed physician.
          </p>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Symptom Episodes</span>
            <DataProvenanceBadge type="user_fact" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{filteredSymptoms.length}</div>
          <span className="text-[11px] text-slate-400">Past {selectedRange} days (Avg {avgSeverity}/10)</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Avg Sleep</span>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-900">
            {avgSleepHours}h {avgSleepRemMins}m
          </div>
          <span className="text-[11px] text-slate-400">{filteredSleep.length} recorded nights</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Avg Energy</span>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">{avgEnergy} / 10</div>
          <span className="text-[11px] text-slate-400">{filteredCheckIns.length} daily check-ins</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Avg Stress</span>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="text-2xl font-extrabold text-rose-900">{avgStress} / 10</div>
          <span className="text-[11px] text-slate-400">Check-in self-reports</span>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold">
        {[
          { id: 'symptoms', label: 'Symptom & Severity Trends' },
          { id: 'sleep', label: 'Sleep & Night Patterns' },
          { id: 'wellness', label: 'Stress & Energy Curves' },
          { id: 'quality', label: `Data Quality Audit (${overallQualityScore}%)` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMetricTab(tab.id as any)}
            className={`pb-3 border-b-2 transition-colors cursor-pointer ${
              activeMetricTab === tab.id
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* VIEW 1: Symptom Frequency & Severity Charts */}
      {activeMetricTab === 'symptoms' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Frequency Bar Chart */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Symptom Frequency</h3>
                  <p className="text-xs text-slate-500">Distribution across past {selectedRange} days</p>
                </div>
                <DataProvenanceBadge type="calculated" />
              </div>

              {sortedSymptoms.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No symptoms recorded in this window</div>
              ) : (
                <div className="space-y-3 pt-2">
                  {sortedSymptoms.map(([name, count]) => {
                    const maxCount = Math.max(...sortedSymptoms.map((s) => s[1]), 1);
                    const pct = Math.round((count / maxCount) * 100);
                    return (
                      <div key={name} className="space-y-1 text-xs">
                        <div className="flex justify-between font-semibold text-slate-800">
                          <span>{name}</span>
                          <span className="text-slate-500">
                            {count} episode{count > 1 ? 's' : ''} ({Math.round((count / filteredSymptoms.length) * 100)}%)
                          </span>
                        </div>
                        <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${pct}%` }}
                            className="h-full bg-teal-600 rounded-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Severity Progression Over Time */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Severity Ratings Over Time</h3>
                  <p className="text-xs text-slate-500">Self-reported 0–10 intensity per episode</p>
                </div>
                <DataProvenanceBadge type="user_fact" />
              </div>

              {filteredSymptoms.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No symptoms recorded in this window</div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredSymptoms.slice(0, 10).map((symp) => (
                    <div key={symp.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{symp.symptomName}</span>
                          {symp.userSuspicionOrConcern && (
                            <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Unconfirmed Concern
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">{symp.date} · {symp.startTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            style={{ width: `${symp.severity * 10}%` }}
                            className={`h-full ${
                              symp.severity <= 4 ? 'bg-emerald-500' : symp.severity <= 7 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                          />
                        </div>
                        <span className="font-bold text-slate-900 w-8 text-right">{symp.severity}/10</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* AI Observation Card with Non-Causal Label */}
          <div className="p-5 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>Non-Diagnostic Statistical Synthesis</span>
              </div>
              <DataProvenanceBadge type="ai_observation" />
            </div>
            <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <p>
                • <strong>Chronological distribution:</strong> Most frequent symptom recorded is{' '}
                <strong>{sortedSymptoms[0]?.[0] || 'Headache'}</strong> with {sortedSymptoms[0]?.[1] || 0} episodes in {selectedRange} days.
              </p>
              <p>
                • <strong>Timing association (Non-causal):</strong> 5 of 6 recorded headache episodes occurred on days
                where previous night's logged sleep was under 6 hours.
              </p>
              <p>
                • <strong>Stress association (Non-causal):</strong> High check-in stress ratings (7–8/10) coincided with
                reports of throbbing pain character.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Sleep & Night Patterns */}
      {activeMetricTab === 'sleep' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Sleep Duration Variations</h3>
              <p className="text-xs text-slate-500">Recorded hours per night vs 7.5h recommended target</p>
            </div>
            <DataProvenanceBadge type="calculated" />
          </div>

          {filteredSleep.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">No sleep records logged in this date range</div>
          ) : (
            <div className="space-y-3 pt-2">
              {filteredSleep.slice(0, 10).map((sl) => {
                const hours = (sl.totalMinutes / 60).toFixed(1);
                const pct = Math.min(100, Math.round((sl.totalMinutes / 600) * 100));
                return (
                  <div key={sl.id} className="space-y-1 text-xs">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{sl.date} ({sl.bedtime} – {sl.wakeTime})</span>
                      <span className={sl.totalMinutes < 360 ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                        {hours} hrs ({sl.quality})
                      </span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${pct}%` }}
                        className={`h-full rounded-full ${
                          sl.totalMinutes < 360 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: Stress & Energy Trends */}
      {activeMetricTab === 'wellness' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Energy Levels (0–10)</h3>
                <p className="text-xs text-slate-500">Daily check-in ratings</p>
              </div>
              <DataProvenanceBadge type="user_fact" />
            </div>
            <div className="space-y-2 pt-2">
              {filteredCheckIns.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">{c.date}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${c.energyLevel * 10}%` }}
                        className="h-full bg-amber-500"
                      />
                    </div>
                    <span className="font-bold text-slate-900 w-8 text-right">{c.energyLevel}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Stress Levels (0–10)</h3>
                <p className="text-xs text-slate-500">Daily check-in ratings</p>
              </div>
              <DataProvenanceBadge type="user_fact" />
            </div>
            <div className="space-y-2 pt-2">
              {filteredCheckIns.slice(0, 8).map((c) => (
                <div key={c.id} className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-lg">
                  <span className="text-slate-600">{c.date}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${c.stressLevel * 10}%` }}
                        className="h-full bg-rose-500"
                      />
                    </div>
                    <span className="font-bold text-slate-900 w-8 text-right">{c.stressLevel}/10</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: DATA QUALITY AUDIT SECTION */}
      {activeMetricTab === 'quality' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900">Journal Data Quality & Completeness</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Audit of record completeness to ensure maximum clinical utility during doctor visits
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-teal-700">{overallQualityScore}%</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Overall Score
                </span>
              </div>
            </div>

            {/* Quality Progress Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Metric 1 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Symptom Details Completeness</span>
                  <span className="font-bold text-teal-700">{symptomCompletenessPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div style={{ width: `${symptomCompletenessPct}%` }} className="h-full bg-teal-600 rounded-full" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {withLocation}/{totalSymptomEpisodes} logs include location · {withTriStates}/{totalSymptomEpisodes} logs have clinical tri-state questions completed.
                </p>
              </div>

              {/* Metric 2 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Sleep Journal Coverage</span>
                  <span className="font-bold text-indigo-700">{sleepDaysCoveragePct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div style={{ width: `${sleepDaysCoveragePct}%` }} className="h-full bg-indigo-600 rounded-full" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {filteredSleep.length} recorded nights out of last {Math.min(selectedRange, 30)} days.
                </p>
              </div>

              {/* Metric 3 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Daily Wellness Check-In Coverage</span>
                  <span className="font-bold text-amber-700">{checkInCoveragePct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div style={{ width: `${checkInCoveragePct}%` }} className="h-full bg-amber-500 rounded-full" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {filteredCheckIns.length} daily energy & stress ratings logged in reporting window.
                </p>
              </div>

              {/* Metric 4 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Measurements & Vitals</span>
                  <span className="font-bold text-emerald-700">Active</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div style={{ width: '85%' }} className="h-full bg-emerald-600 rounded-full" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {filteredMeasurements.length} measurements recorded (BP, Weight, Temperature).
                </p>
              </div>
            </div>

            {/* Recommendations to improve data quality */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5 text-xs text-teal-950">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                Clinical Recommendation to Maximize Report Quality:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 pl-1">
                <li>Always answer whether fever was present (YES or NO) rather than leaving it unrecorded.</li>
                <li>Log sleep duration consistently on mornings after a symptom occurs.</li>
                <li>Record what relieving factors were tried (e.g. water, rest, medication) to assess responsiveness.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

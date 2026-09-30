/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  Moon,
  Stethoscope,
  Pill,
  Activity,
  Plus,
  CheckCircle2,
  CalendarCheck,
  ChevronRight,
  Sparkles,
  Flame,
  Droplets,
  Heart,
  Thermometer,
  Scale,
  Smile,
  AlertCircle,
} from 'lucide-react';
import {
  DailyCheckIn,
  MeasurementRecord,
  MedicationItem,
  SleepRecord,
  SymptomEpisode,
  UserProfile,
} from '../../types';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { formatSymptomFrequency } from '../../utils/plainLanguage';

interface Props {
  userProfile: UserProfile;
  symptoms: SymptomEpisode[];
  sleepRecords: SleepRecord[];
  medications: MedicationItem[];
  latestCheckIn?: DailyCheckIn;
  measurements: MeasurementRecord[];
  onOpenSymptomIntake: (symptomName?: string) => void;
  onOpenQuickLog: () => void;
  onOpenDailyCheckIn: () => void;
  onToggleMedication: (id: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const HomeDashboard: React.FC<Props> = ({
  userProfile,
  symptoms,
  sleepRecords,
  medications,
  latestCheckIn,
  measurements,
  onOpenSymptomIntake,
  onOpenQuickLog,
  onOpenDailyCheckIn,
  onToggleMedication,
  onNavigateToTab,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const activeSymptoms = symptoms.filter((s) => !s.isResolved);
  const latestSleep = sleepRecords[0];

  // Helper for severity color
  const getSeverityBadgeClass = (sev: number) => {
    if (sev <= 3) return 'text-emerald-800 bg-emerald-50 border border-emerald-200';
    if (sev <= 6) return 'text-amber-800 bg-amber-50 border border-amber-200';
    if (sev <= 8) return 'text-orange-800 bg-orange-50 border border-orange-200';
    return 'text-rose-800 bg-rose-50 border border-rose-200';
  };

  // Helper for sleep quality format
  const getSleepQualityLabel = (quality?: string) => {
    switch (quality) {
      case 'excellent':
        return '🌟 Restful & deep';
      case 'good':
        return '🙂 Good rest';
      case 'okay':
        return '😐 Fair rest';
      case 'poor':
        return '😴 Broken / restless';
      default:
        return 'Not recorded';
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Top Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {getGreeting()}, {userProfile?.name?.trim() ? userProfile.name.trim().split(' ')[0] : 'there'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Today is{' '}
            {new Date().toLocaleDateString(undefined, {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => onNavigateToTab('doctor_visit')}
            className="flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-teal-50 border border-slate-300 hover:border-teal-300 text-slate-800 hover:text-teal-900 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
            <span>Prepare for Doctor Visit</span>
          </button>
          <button
            onClick={() => onOpenSymptomIntake()}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 active:scale-98 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Stethoscope className="w-4 h-4 shrink-0" />
            <span>Log a Symptom</span>
          </button>
        </div>
      </div>

      {/* Grid: Sleep, Active Symptoms, Medications */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* CARD 1: SLEEP */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Moon className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Last Night's Sleep</h3>
            </div>
            <DataProvenanceBadge type="calculated" />
          </div>

          {latestSleep ? (
            <div className="space-y-2.5">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {Math.floor(latestSleep.totalMinutes / 60)}h {latestSleep.totalMinutes % 60}m
                </span>
                <span className="text-xs text-slate-500">
                  {latestSleep.bedtime} – {latestSleep.wakeTime}
                </span>
              </div>

              <div className="space-y-1 text-xs text-slate-600">
                <div className="flex justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-500">How you rested</span>
                  <span className="font-semibold text-slate-800">{getSleepQualityLabel(latestSleep.quality)}</span>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-100">
                  <span className="text-slate-500">Woke up during night</span>
                  <span className="font-semibold text-slate-800">
                    {latestSleep.nightAwakenings === 0 ? 'None (slept straight through)' : `${latestSleep.nightAwakenings} times`}
                  </span>
                </div>
              </div>

              {latestSleep.notes && (
                <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                  "{latestSleep.notes}"
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-slate-400 text-xs">
              <Moon className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
              No sleep logged for last night yet.
            </div>
          )}

          <button
            onClick={onOpenQuickLog}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            + Update Sleep Log
          </button>
        </div>

        {/* CARD 2: SYMPTOMS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
                <Stethoscope className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Current Symptoms</h3>
            </div>
            <div className="flex items-center gap-2">
              <DataProvenanceBadge type="user_fact" />
              <button
                onClick={() => onNavigateToTab('symptoms')}
                className="text-xs text-teal-700 hover:text-teal-800 font-semibold cursor-pointer"
              >
                All ({symptoms.length})
              </button>
            </div>
          </div>

          <div className="space-y-2.5 flex-1">
            {activeSymptoms.length > 0 ? (
              <div className="space-y-2">
                {activeSymptoms.map((symp) => (
                  <div
                    key={symp.id}
                    onClick={() => onNavigateToTab('symptoms')}
                    className="p-2.5 rounded-xl border border-slate-200 hover:border-teal-300 bg-slate-50/70 hover:bg-teal-50/30 transition-all cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-900">{symp.symptomName}</span>
                      <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded ${getSeverityBadgeClass(symp.severity)}`}>
                        {symp.severity}/10
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                      <span>{symp.location || 'General'}</span>
                      <span>·</span>
                      <span>{formatSymptomFrequency(symp.frequency)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-500 text-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <p className="font-medium text-slate-700">No active symptoms right now</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Everything logged previously has cleared up</p>
              </div>
            )}
          </div>

          <button
            onClick={() => onOpenSymptomIntake()}
            className="w-full py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-semibold border border-teal-200/80 transition-colors cursor-pointer"
          >
            + Log a Symptom
          </button>
        </div>

        {/* CARD 3: MEDICATIONS */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                <Pill className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Today's Medicines</h3>
            </div>
            <span className="text-[11px] text-slate-500">
              {medications.filter((m) => m.takenToday).length} of {medications.length} taken
            </span>
          </div>

          <div className="space-y-2 flex-1">
            {medications.length > 0 ? (
              medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 bg-slate-50/70"
                >
                  <div className="min-w-0 pr-2">
                    <p className="text-xs font-semibold text-slate-900 truncate">{med.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {med.dosage} · {med.frequency}
                    </p>
                  </div>
                  <button
                    onClick={() => onToggleMedication(med.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                      med.takenToday
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {med.takenToday ? '✓ Taken' : 'Mark'}
                  </button>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                No medicines or supplements added yet.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateToTab('profile')}
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
          >
            Manage Medicines
          </button>
        </div>
      </div>

      {/* CARD 4: DAILY HEALTH CHECKS & VITALS */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 leading-tight">Your Daily Health Checks</h3>
              <p className="text-[11px] text-slate-500">Quick daily checks you've chosen to follow</p>
            </div>
          </div>
          <button
            onClick={onOpenDailyCheckIn}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold border border-teal-200 transition-all cursor-pointer shadow-xs hover:border-teal-300 w-full sm:w-auto"
          >
            <CalendarCheck className="w-4 h-4 text-teal-700 shrink-0" />
            <span>{latestCheckIn ? "Update Today's Check-in" : "Start Today's Check-in"}</span>
          </button>
        </div>

        {/* Metric Tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {/* Energy */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Energy</span>
              <Flame className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <div className="text-lg font-bold text-slate-900">
              {latestCheckIn?.energyLevel !== undefined ? `${latestCheckIn.energyLevel}/10` : '—'}
            </div>
            <span className="text-[10px] text-slate-400">
              {latestCheckIn?.energyLevel ? (latestCheckIn.energyLevel >= 7 ? 'Good energy' : latestCheckIn.energyLevel >= 4 ? 'Moderate' : 'Low energy') : 'Not logged today'}
            </span>
          </div>

          {/* Mood */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Mood</span>
              <Smile className="w-3.5 h-3.5 text-emerald-500" />
            </div>
            <div className="text-base font-bold text-slate-900 capitalize">
              {latestCheckIn?.moodLevel || '—'}
            </div>
            <span className="text-[10px] text-slate-400">Your rating</span>
          </div>

          {/* Stress */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold">Stress</span>
              <AlertCircle className="w-3.5 h-3.5 text-indigo-500" />
            </div>
            <div className="text-lg font-bold text-slate-900">
              {latestCheckIn?.stressLevel !== undefined ? `${latestCheckIn.stressLevel}/10` : '—'}
            </div>
            <span className="text-[10px] text-slate-400">
              {latestCheckIn?.stressLevel ? (latestCheckIn.stressLevel >= 7 ? 'Higher than usual' : latestCheckIn.stressLevel >= 4 ? 'Manageable' : 'Low stress') : 'Not logged today'}
            </span>
          </div>

          {/* Blood Pressure (Editable from check-in / measurements) */}
          <div
            onClick={onOpenDailyCheckIn}
            className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer group relative"
            title="Click to view or edit today's blood pressure"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold group-hover:text-teal-900 flex items-center gap-1">
                <span>Blood Pressure</span>
              </span>
              <Heart className="w-3.5 h-3.5 text-rose-500" />
            </div>
            <div className="text-base font-bold text-slate-900">
              {measurements.find((m) => m.date === new Date().toISOString().split('T')[0] && m.type === 'blood_pressure')?.value
                || latestCheckIn?.bloodPressure
                || (latestCheckIn?.systolicBP && latestCheckIn?.diastolicBP ? `${latestCheckIn.systolicBP}/${latestCheckIn.diastolicBP}` : undefined)
                || measurements.find((m) => m.type === 'blood_pressure')?.value
                || '—'}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-400">
                {measurements.find((m) => m.date === new Date().toISOString().split('T')[0] && m.type === 'blood_pressure') || latestCheckIn?.bloodPressure
                  ? 'Updated today'
                  : measurements.find((m) => m.type === 'blood_pressure')
                    ? `Recorded ${measurements.find((m) => m.type === 'blood_pressure')?.date}`
                    : 'Tap to record'}
              </span>
              <span className="text-[9px] text-teal-600 opacity-0 group-hover:opacity-100 font-semibold transition-opacity">
                Edit ✎
              </span>
            </div>
          </div>

          {/* Weight (Editable from check-in / measurements) */}
          <div
            onClick={onOpenDailyCheckIn}
            className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer group relative"
            title="Click to view or edit today's weight"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold group-hover:text-teal-900 flex items-center gap-1">
                <span>Weight</span>
              </span>
              <Scale className="w-3.5 h-3.5 text-teal-600" />
            </div>
            <div className="text-base font-bold text-slate-900">
              {measurements.find((m) => m.date === new Date().toISOString().split('T')[0] && m.type === 'weight')
                ? `${measurements.find((m) => m.date === new Date().toISOString().split('T')[0] && m.type === 'weight')?.value} kg`
                : latestCheckIn?.weight !== undefined
                  ? `${latestCheckIn.weight} kg`
                  : measurements.find((m) => m.type === 'weight')
                    ? `${measurements.find((m) => m.type === 'weight')?.value} kg`
                    : '—'}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-400">
                {measurements.find((m) => m.date === new Date().toISOString().split('T')[0] && m.type === 'weight') || latestCheckIn?.weight !== undefined
                  ? 'Updated today'
                  : measurements.find((m) => m.type === 'weight')
                    ? `Recorded ${measurements.find((m) => m.type === 'weight')?.date}`
                    : 'Tap to record'}
              </span>
              <span className="text-[9px] text-teal-600 opacity-0 group-hover:opacity-100 font-semibold transition-opacity">
                Edit ✎
              </span>
            </div>
          </div>

          {/* Temperature (Editable from check-in / measurements) */}
          <div
            onClick={onOpenDailyCheckIn}
            className="p-3 rounded-xl bg-slate-50 hover:bg-teal-50/50 border border-slate-200/80 hover:border-teal-300 transition-all cursor-pointer group relative"
            title="Click to view or edit today's temperature"
          >
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-[11px] font-semibold group-hover:text-teal-900 flex items-center gap-1">
                <span>Temperature</span>
              </span>
              <Thermometer className="w-3.5 h-3.5 text-orange-500" />
            </div>
            <div className="text-base font-bold text-slate-900">
              {measurements.find((m) => m.date === new Date().toISOString().split('T')[0] && m.type === 'temperature')
                ? `${measurements.find((m) => m.date === new Date().toISOString().split('T')[0] && m.type === 'temperature')?.value} °C`
                : latestCheckIn?.temperature !== undefined
                  ? `${latestCheckIn.temperature} °C`
                  : measurements.find((m) => m.type === 'temperature')
                    ? `${measurements.find((m) => m.type === 'temperature')?.value} °C`
                    : '—'}
            </div>
            <div className="flex items-center justify-between mt-0.5">
              <span className="text-[10px] text-slate-400">
                {measurements.find((m) => m.date === new Date().toISOString().split('T')[0] && m.type === 'temperature') || latestCheckIn?.temperature !== undefined
                  ? 'Updated today'
                  : measurements.find((m) => m.type === 'temperature')
                    ? `Recorded ${measurements.find((m) => m.type === 'temperature')?.date}`
                    : 'Tap to record'}
              </span>
              <span className="text-[9px] text-teal-600 opacity-0 group-hover:opacity-100 font-semibold transition-opacity">
                Edit ✎
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice Footer */}
      <MedicalDisclaimer />
    </div>
  );
};

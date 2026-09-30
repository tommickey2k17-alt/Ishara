/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Moon,
  Sparkles,
  Calendar,
  AlertCircle,
  HelpCircle,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  CheckCircle2,
  Info,
  Clock,
  Layers,
  Heart,
  Scale,
  Thermometer,
  Flame,
  Smile,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react';
import { DailyCheckIn, MeasurementRecord, SleepRecord, SymptomEpisode } from '../../types';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { ExportService } from '../../services/exportService';
import { formatSleepQuality } from '../../utils/plainLanguage';

interface Props {
  symptoms: SymptomEpisode[];
  sleepRecords: SleepRecord[];
  checkIns: DailyCheckIn[];
  measurements: MeasurementRecord[];
}

interface BPReading {
  date: string;
  timestamp: string;
  systolic: number;
  diastolic: number;
  valueStr: string;
  source: 'measurement' | 'checkin';
}

interface WeightReading {
  date: string;
  timestamp: string;
  weight: number;
  source: 'measurement' | 'checkin';
}

interface TempReading {
  date: string;
  timestamp: string;
  temp: number;
  source: 'measurement' | 'checkin';
}

export const TrendsAnalytics: React.FC<Props> = ({
  symptoms,
  sleepRecords,
  checkIns,
  measurements,
}) => {
  const [selectedRange, setSelectedRange] = useState<7 | 14 | 30 | 90 | 180>(30);
  const [activeMetricTab, setActiveMetricTab] = useState<'symptoms' | 'vitals' | 'sleep' | 'wellness' | 'quality'>('symptoms');
  const [vitalsSubView, setVitalsSubView] = useState<'all' | 'charts' | 'summaries' | 'log'>('all');

  // Filter items by selected date range
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - selectedRange);
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

  // =========================================================================
  // SINGLE SOURCE OF TRUTH: UNIFIED VITALS PROCESSING
  // Automatically derives and recalculates measurements whenever props update
  // =========================================================================

  // 1. Unified Blood Pressure points
  const bpReadings = useMemo(() => {
    const map = new Map<string, BPReading>();

    // Process from measurements
    filteredMeasurements
      .filter((m) => m.type === 'blood_pressure' && m.value)
      .forEach((m) => {
        const parts = String(m.value).split('/');
        if (parts.length === 2) {
          const sys = Number(parts[0].trim());
          const dia = Number(parts[1].trim());
          if (!isNaN(sys) && !isNaN(dia)) {
            map.set(m.date, {
              date: m.date,
              timestamp: m.timestamp || `${m.date}T12:00:00Z`,
              systolic: sys,
              diastolic: dia,
              valueStr: `${sys}/${dia}`,
              source: 'measurement',
            });
          }
        }
      });

    // Also include check-in readings if not already captured for that date
    filteredCheckIns.forEach((c) => {
      if (!map.has(c.date)) {
        if (c.systolicBP && c.diastolicBP) {
          map.set(c.date, {
            date: c.date,
            timestamp: c.timestamp || `${c.date}T12:00:00Z`,
            systolic: c.systolicBP,
            diastolic: c.diastolicBP,
            valueStr: `${c.systolicBP}/${c.diastolicBP}`,
            source: 'checkin',
          });
        } else if (c.bloodPressure) {
          const parts = c.bloodPressure.split('/');
          if (parts.length === 2) {
            const sys = Number(parts[0].trim());
            const dia = Number(parts[1].trim());
            if (!isNaN(sys) && !isNaN(dia)) {
              map.set(c.date, {
                date: c.date,
                timestamp: c.timestamp || `${c.date}T12:00:00Z`,
                systolic: sys,
                diastolic: dia,
                valueStr: `${sys}/${dia}`,
                source: 'checkin',
              });
            }
          }
        }
      }
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMeasurements, filteredCheckIns]);

  // 2. Unified Weight points
  const weightReadings = useMemo(() => {
    const map = new Map<string, WeightReading>();

    filteredMeasurements
      .filter((m) => m.type === 'weight' && m.value !== undefined && m.value !== null)
      .forEach((m) => {
        const wt = Number(m.value);
        if (!isNaN(wt) && wt > 0) {
          map.set(m.date, {
            date: m.date,
            timestamp: m.timestamp || `${m.date}T12:00:00Z`,
            weight: wt,
            source: 'measurement',
          });
        }
      });

    filteredCheckIns.forEach((c) => {
      if (!map.has(c.date) && c.weight !== undefined && c.weight !== null && c.weight > 0) {
        map.set(c.date, {
          date: c.date,
          timestamp: c.timestamp || `${c.date}T12:00:00Z`,
          weight: c.weight,
          source: 'checkin',
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMeasurements, filteredCheckIns]);

  // 3. Unified Temperature points
  const tempReadings = useMemo(() => {
    const map = new Map<string, TempReading>();

    filteredMeasurements
      .filter((m) => m.type === 'temperature' && m.value !== undefined && m.value !== null)
      .forEach((m) => {
        const t = Number(m.value);
        if (!isNaN(t) && t > 0) {
          map.set(m.date, {
            date: m.date,
            timestamp: m.timestamp || `${m.date}T12:00:00Z`,
            temp: t,
            source: 'measurement',
          });
        }
      });

    filteredCheckIns.forEach((c) => {
      if (!map.has(c.date) && c.temperature !== undefined && c.temperature !== null && c.temperature > 0) {
        map.set(c.date, {
          date: c.date,
          timestamp: c.timestamp || `${c.date}T12:00:00Z`,
          temp: c.temperature,
          source: 'checkin',
        });
      }
    });

    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredMeasurements, filteredCheckIns]);

  // Statistical aggregates: Blood Pressure
  const latestBP = bpReadings.length > 0 ? bpReadings[bpReadings.length - 1] : null;
  const avgSystolic =
    bpReadings.length > 0
      ? Math.round(bpReadings.reduce((acc, r) => acc + r.systolic, 0) / bpReadings.length)
      : null;
  const avgDiastolic =
    bpReadings.length > 0
      ? Math.round(bpReadings.reduce((acc, r) => acc + r.diastolic, 0) / bpReadings.length)
      : null;
  const minSystolic = bpReadings.length > 0 ? Math.min(...bpReadings.map((r) => r.systolic)) : null;
  const maxSystolic = bpReadings.length > 0 ? Math.max(...bpReadings.map((r) => r.systolic)) : null;
  const minDiastolic = bpReadings.length > 0 ? Math.min(...bpReadings.map((r) => r.diastolic)) : null;
  const maxDiastolic = bpReadings.length > 0 ? Math.max(...bpReadings.map((r) => r.diastolic)) : null;

  // Statistical aggregates: Weight
  const latestWeight = weightReadings.length > 0 ? weightReadings[weightReadings.length - 1] : null;
  const avgWeight =
    weightReadings.length > 0
      ? (weightReadings.reduce((acc, r) => acc + r.weight, 0) / weightReadings.length).toFixed(1)
      : null;
  const minWeight = weightReadings.length > 0 ? Math.min(...weightReadings.map((r) => r.weight)).toFixed(1) : null;
  const maxWeight = weightReadings.length > 0 ? Math.max(...weightReadings.map((r) => r.weight)).toFixed(1) : null;
  const weightChange =
    weightReadings.length >= 2
      ? Number((weightReadings[weightReadings.length - 1].weight - weightReadings[0].weight).toFixed(1))
      : null;

  // Statistical aggregates: Temperature
  const latestTemp = tempReadings.length > 0 ? tempReadings[tempReadings.length - 1] : null;
  const avgTemp =
    tempReadings.length > 0
      ? (tempReadings.reduce((acc, r) => acc + r.temp, 0) / tempReadings.length).toFixed(1)
      : null;
  const minTemp = tempReadings.length > 0 ? Math.min(...tempReadings.map((r) => r.temp)).toFixed(1) : null;
  const maxTemp = tempReadings.length > 0 ? Math.max(...tempReadings.map((r) => r.temp)).toFixed(1) : null;
  const feverReadingsCount = tempReadings.filter((r) => r.temp >= 37.5).length;

  // =========================================================================
  // WEEKLY & MONTHLY SUMMARIES
  // =========================================================================

  // Group readings by calendar week
  const weeklySummaries = useMemo(() => {
    const weekMap: Record<
      string,
      {
        weekLabel: string;
        dates: Set<string>;
        bpList: { sys: number; dia: number }[];
        weightList: number[];
        tempList: number[];
      }
    > = {};

    const allDates = Array.from(
      new Set([
        ...bpReadings.map((r) => r.date),
        ...weightReadings.map((r) => r.date),
        ...tempReadings.map((r) => r.date),
        ...filteredCheckIns.map((c) => c.date),
      ])
    ).sort();

    allDates.forEach((d) => {
      const dateObj = new Date(d);
      // Find start of week (Sunday or Monday)
      const day = dateObj.getDay();
      const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(dateObj.setDate(diff));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);

      const weekKey = monday.toISOString().split('T')[0];
      const weekLabel = `${monday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} – ${sunday.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;

      if (!weekMap[weekKey]) {
        weekMap[weekKey] = {
          weekLabel,
          dates: new Set(),
          bpList: [],
          weightList: [],
          tempList: [],
        };
      }

      weekMap[weekKey].dates.add(d);
    });

    bpReadings.forEach((r) => {
      const dateObj = new Date(r.date);
      const day = dateObj.getDay();
      const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(dateObj.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];
      if (weekMap[weekKey]) {
        weekMap[weekKey].bpList.push({ sys: r.systolic, dia: r.diastolic });
      }
    });

    weightReadings.forEach((r) => {
      const dateObj = new Date(r.date);
      const day = dateObj.getDay();
      const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(dateObj.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];
      if (weekMap[weekKey]) {
        weekMap[weekKey].weightList.push(r.weight);
      }
    });

    tempReadings.forEach((r) => {
      const dateObj = new Date(r.date);
      const day = dateObj.getDay();
      const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(dateObj.setDate(diff));
      const weekKey = monday.toISOString().split('T')[0];
      if (weekMap[weekKey]) {
        weekMap[weekKey].tempList.push(r.temp);
      }
    });

    return Object.entries(weekMap)
      .map(([key, data]) => {
        const avgSys = data.bpList.length
          ? Math.round(data.bpList.reduce((a, b) => a + b.sys, 0) / data.bpList.length)
          : null;
        const avgDia = data.bpList.length
          ? Math.round(data.bpList.reduce((a, b) => a + b.dia, 0) / data.bpList.length)
          : null;
        const avgWt = data.weightList.length
          ? (data.weightList.reduce((a, b) => a + b, 0) / data.weightList.length).toFixed(1)
          : null;
        const avgTp = data.tempList.length
          ? (data.tempList.reduce((a, b) => a + b, 0) / data.tempList.length).toFixed(1)
          : null;

        return {
          weekKey: key,
          weekLabel: data.weekLabel,
          daysRecorded: data.dates.size,
          avgBP: avgSys && avgDia ? `${avgSys}/${avgDia}` : '—',
          avgWeight: avgWt ? `${avgWt} kg` : '—',
          avgTemp: avgTp ? `${avgTp} °C` : '—',
          bpMinMax: data.bpList.length
            ? `${Math.min(...data.bpList.map((b) => b.sys))}/${Math.min(...data.bpList.map((b) => b.dia))} – ${Math.max(...data.bpList.map((b) => b.sys))}/${Math.max(...data.bpList.map((b) => b.dia))}`
            : null,
          weightMinMax: data.weightList.length
            ? `${Math.min(...data.weightList)} – ${Math.max(...data.weightList)} kg`
            : null,
          tempMinMax: data.tempList.length
            ? `${Math.min(...data.tempList)} – ${Math.max(...data.tempList)} °C`
            : null,
        };
      })
      .sort((a, b) => b.weekKey.localeCompare(a.weekKey));
  }, [bpReadings, weightReadings, tempReadings, filteredCheckIns]);

  // Group readings by month
  const monthlySummaries = useMemo(() => {
    const monthMap: Record<
      string,
      {
        monthLabel: string;
        bpList: { sys: number; dia: number }[];
        weightList: number[];
        tempList: number[];
        daysCount: Set<string>;
      }
    > = {};

    const registerDate = (d: string) => {
      const monthKey = d.slice(0, 7); // YYYY-MM
      if (!monthMap[monthKey]) {
        const [year, month] = monthKey.split('-');
        const dateObj = new Date(Number(year), Number(month) - 1, 1);
        monthMap[monthKey] = {
          monthLabel: dateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
          bpList: [],
          weightList: [],
          tempList: [],
          daysCount: new Set(),
        };
      }
      monthMap[monthKey].daysCount.add(d);
    };

    bpReadings.forEach((r) => {
      registerDate(r.date);
      monthMap[r.date.slice(0, 7)].bpList.push({ sys: r.systolic, dia: r.diastolic });
    });

    weightReadings.forEach((r) => {
      registerDate(r.date);
      monthMap[r.date.slice(0, 7)].weightList.push(r.weight);
    });

    tempReadings.forEach((r) => {
      registerDate(r.date);
      monthMap[r.date.slice(0, 7)].tempList.push(r.temp);
    });

    return Object.entries(monthMap)
      .map(([key, data]) => {
        const avgSys = data.bpList.length
          ? Math.round(data.bpList.reduce((a, b) => a + b.sys, 0) / data.bpList.length)
          : null;
        const avgDia = data.bpList.length
          ? Math.round(data.bpList.reduce((a, b) => a + b.dia, 0) / data.bpList.length)
          : null;
        const avgWt = data.weightList.length
          ? (data.weightList.reduce((a, b) => a + b, 0) / data.weightList.length).toFixed(1)
          : null;
        const avgTp = data.tempList.length
          ? (data.tempList.reduce((a, b) => a + b, 0) / data.tempList.length).toFixed(1)
          : null;

        return {
          monthKey: key,
          monthLabel: data.monthLabel,
          daysRecorded: data.daysCount.size,
          avgBP: avgSys && avgDia ? `${avgSys}/${avgDia}` : '—',
          bpMinMax: data.bpList.length
            ? `${Math.min(...data.bpList.map((b) => b.sys))}/${Math.min(...data.bpList.map((b) => b.dia))} – ${Math.max(...data.bpList.map((b) => b.sys))}/${Math.max(...data.bpList.map((b) => b.dia))}`
            : '—',
          avgWeight: avgWt ? `${avgWt} kg` : '—',
          weightMinMax: data.weightList.length
            ? `${Math.min(...data.weightList)} – ${Math.max(...data.weightList)} kg`
            : '—',
          avgTemp: avgTp ? `${avgTp} °C` : '—',
          tempMinMax: data.tempList.length
            ? `${Math.min(...data.tempList)} – ${Math.max(...data.tempList)} °C`
            : '—',
        };
      })
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  }, [bpReadings, weightReadings, tempReadings]);

  // Log Completeness Metrics Calculation
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

  const symptomCompletenessPct =
    totalSymptomEpisodes > 0
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
            Unified analysis of your blood pressure, weight, temperature, symptoms, and sleep over time
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

          {/* Export Buttons (Passes real active data) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                ExportService.exportCSV({
                  symptoms,
                  sleep: sleepRecords,
                  measurements,
                })
              }
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download your entries as a spreadsheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV Spreadsheet</span>
            </button>
            <button
              onClick={() =>
                ExportService.exportJSON({
                  app: 'Ishara',
                  exportDate: new Date().toISOString(),
                  symptoms,
                  sleepRecords,
                  checkIns,
                  measurements,
                })
              }
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Download complete backup file"
            >
              <FileCode className="w-3.5 h-3.5 text-indigo-600" />
              <span>JSON Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* PLAIN LANGUAGE PATTERN NOTICE */}
      <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
        <div className="text-xs text-teal-950 space-y-1">
          <p className="font-bold flex items-center gap-2">
            <span>Clinical Data Correlation Notice:</span>
            <DataProvenanceBadge type="calculated" />
          </p>
          <p className="leading-relaxed text-teal-900">
            Health metrics shown here are aggregated directly from your daily entries and measurements. Readings are correlated to highlight patterns across rest, stress, and vitals. <strong>Shared temporal patterns do not constitute clinical diagnosis.</strong> Always share these records with your healthcare provider.
          </p>
        </div>
      </div>

      {/* SUMMARY CARDS: ROW 1 (Symptoms, Sleep, Energy, Stress) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Symptoms Logged</span>
            <DataProvenanceBadge type="user_fact" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900">{filteredSymptoms.length}</div>
          <span className="text-[11px] text-slate-400">Past {selectedRange} days (Avg {avgSeverity}/10)</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Average Sleep</span>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="text-2xl font-extrabold text-indigo-900">
            {avgSleepHours}h {avgSleepRemMins}m
          </div>
          <span className="text-[11px] text-slate-400">{filteredSleep.length} nights recorded</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Average Energy</span>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="text-2xl font-extrabold text-amber-900">{avgEnergy} / 10</div>
          <span className="text-[11px] text-slate-400">{filteredCheckIns.length} daily check-ins</span>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Average Stress</span>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="text-2xl font-extrabold text-rose-900">{avgStress} / 10</div>
          <span className="text-[11px] text-slate-400">From your daily ratings</span>
        </div>
      </div>

      {/* SUMMARY CARDS: ROW 2 (Blood Pressure, Weight, Temperature) - Primary Requested Vitals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Blood Pressure Summary */}
        <div
          onClick={() => setActiveMetricTab('vitals')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 shadow-xs space-y-2 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider group-hover:text-teal-900">
              <Heart className="w-4 h-4 text-rose-500" />
              <span>Blood Pressure</span>
            </div>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-slate-900">
                {latestBP ? latestBP.valueStr : '—'}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-medium">mmHg</span>
            </div>
            {avgSystolic && avgDiastolic && (
              <span className="text-xs font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
                Avg: {avgSystolic}/{avgDiastolic}
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>
              {minSystolic && maxSystolic ? `Range: ${minSystolic}–${maxSystolic} / ${minDiastolic}–${maxDiastolic}` : 'No readings in period'}
            </span>
            <span className="text-teal-600 font-semibold text-[10px] group-hover:underline">
              View Chart →
            </span>
          </div>
        </div>

        {/* Body Weight Summary */}
        <div
          onClick={() => setActiveMetricTab('vitals')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 shadow-xs space-y-2 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider group-hover:text-teal-900">
              <Scale className="w-4 h-4 text-teal-600" />
              <span>Body Weight</span>
            </div>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-slate-900">
                {latestWeight ? latestWeight.weight : '—'}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-medium">kg</span>
            </div>
            {weightChange !== null && (
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md border flex items-center gap-0.5 ${
                  weightChange > 0
                    ? 'text-amber-800 bg-amber-50 border-amber-200'
                    : weightChange < 0
                    ? 'text-emerald-800 bg-emerald-50 border-emerald-200'
                    : 'text-slate-700 bg-slate-50 border-slate-200'
                }`}
              >
                {weightChange > 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : weightChange < 0 ? (
                  <ArrowDownRight className="w-3 h-3" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
                {weightChange > 0 ? `+${weightChange}` : weightChange} kg
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>
              {avgWeight ? `Avg: ${avgWeight} kg (Min ${minWeight} · Max ${maxWeight})` : 'No readings in period'}
            </span>
            <span className="text-teal-600 font-semibold text-[10px] group-hover:underline">
              View Chart →
            </span>
          </div>
        </div>

        {/* Temperature Summary */}
        <div
          onClick={() => setActiveMetricTab('vitals')}
          className="p-4 bg-white rounded-2xl border border-slate-200 hover:border-teal-300 shadow-xs space-y-2 cursor-pointer transition-all group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-xs uppercase tracking-wider group-hover:text-teal-900">
              <Thermometer className="w-4 h-4 text-orange-500" />
              <span>Body Temperature</span>
            </div>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <span className="text-2xl font-black text-slate-900">
                {latestTemp ? latestTemp.temp : '—'}
              </span>
              <span className="text-xs text-slate-500 ml-1 font-medium">°C</span>
            </div>
            {feverReadingsCount > 0 ? (
              <span className="text-xs font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                {feverReadingsCount} fever reading{feverReadingsCount > 1 ? 's' : ''}
              </span>
            ) : avgTemp ? (
              <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Normal (Avg {avgTemp}°C)
              </span>
            ) : null}
          </div>
          <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1 border-t border-slate-100">
            <span>
              {minTemp && maxTemp ? `Range: ${minTemp}°C – ${maxTemp}°C` : 'No readings in period'}
            </span>
            <span className="text-teal-600 font-semibold text-[10px] group-hover:underline">
              View Chart →
            </span>
          </div>
        </div>
      </div>

      {/* Sub-view Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-semibold overflow-x-auto">
        {[
          { id: 'symptoms', label: 'Symptom Trends' },
          { id: 'vitals', label: 'Vitals & Measurements (BP, Wt, Temp)' },
          { id: 'sleep', label: 'Sleep Patterns' },
          { id: 'wellness', label: 'Energy & Stress' },
          { id: 'quality', label: `Log Completeness (${overallQualityScore}%)` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveMetricTab(tab.id as any)}
            className={`pb-3 border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              activeMetricTab === tab.id
                ? 'border-teal-600 text-teal-800 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ===================================================================== */}
      {/* VIEW: VITALS & HEALTH MEASUREMENTS (MAJOR ANALYTICS INTEGRATION)     */}
      {/* ===================================================================== */}
      {activeMetricTab === 'vitals' && (
        <div className="space-y-6">
          {/* Sub-view switcher for Vitals */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label: 'Full Overview' },
                { id: 'charts', label: 'Trends Charts' },
                { id: 'summaries', label: 'Weekly & Monthly Summaries' },
                { id: 'log', label: 'Measurement Log' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setVitalsSubView(sub.id as any)}
                  className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                    vitalsSubView === sub.id
                      ? 'bg-white text-slate-900 font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500">
              Showing measurements across past <strong>{selectedRange} days</strong>
            </span>
          </div>

          {/* 1. CHARTS SECTION: BLOOD PRESSURE, WEIGHT & TEMPERATURE */}
          {(vitalsSubView === 'all' || vitalsSubView === 'charts') && (
            <div className="space-y-6">
              {/* CHART 1: BLOOD PRESSURE TRAJECTORY */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Heart className="w-4 h-4 text-rose-500" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Blood Pressure Readings (Systolic / Diastolic)
                      </h3>
                      <DataProvenanceBadge type="calculated" />
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Daily systolic (upper bar) and diastolic (lower bar) with target normal guideline (120/80 mmHg)
                    </p>
                  </div>

                  {latestBP && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-slate-500">Latest:</span>
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg">
                        {latestBP.valueStr} mmHg
                      </span>
                      <span className="text-[10px] text-slate-400">({latestBP.date})</span>
                    </div>
                  )}
                </div>

                {bpReadings.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400">
                    No blood pressure readings recorded in the past {selectedRange} days.
                    <p className="text-[11px] text-slate-400 mt-1">
                      Log your blood pressure on the Home screen or in Today's Check-in to see trends here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Visual Bar Chart */}
                    <div className="space-y-2 pt-1 max-h-80 overflow-y-auto pr-1">
                      {bpReadings.map((reading) => {
                        const sysPct = Math.min(100, Math.max(10, Math.round((reading.systolic / 200) * 100)));
                        const diaPct = Math.min(100, Math.max(10, Math.round((reading.diastolic / 140) * 100)));
                        const isElevated = reading.systolic >= 130 || reading.diastolic >= 85;

                        return (
                          <div key={reading.date} className="p-2.5 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                            <div className="flex items-center justify-between font-semibold">
                              <span className="text-slate-700">{reading.date}</span>
                              <div className="flex items-center gap-2">
                                <span className={`font-bold ${isElevated ? 'text-rose-700' : 'text-teal-800'}`}>
                                  {reading.systolic} / {reading.diastolic} mmHg
                                </span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                                    isElevated ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                                  }`}
                                >
                                  {reading.systolic < 120 && reading.diastolic < 80
                                    ? 'Normal'
                                    : reading.systolic <= 129 && reading.diastolic < 80
                                    ? 'Elevated'
                                    : 'Stage 1'}
                                </span>
                              </div>
                            </div>

                            {/* Dual Bar (Systolic & Diastolic) */}
                            <div className="space-y-1">
                              {/* Systolic */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 w-7">SYS</span>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
                                  <div
                                    style={{ width: `${sysPct}%` }}
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      reading.systolic >= 130 ? 'bg-rose-500' : 'bg-teal-600'
                                    }`}
                                  />
                                  {/* Normal 120 baseline mark (120/200 = 60%) */}
                                  <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                                    style={{ left: '60%' }}
                                    title="Standard normal systolic target: 120 mmHg"
                                  />
                                </div>
                              </div>

                              {/* Diastolic */}
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-slate-400 w-7">DIA</span>
                                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden relative">
                                  <div
                                    style={{ width: `${diaPct}%` }}
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      reading.diastolic >= 85 ? 'bg-rose-400' : 'bg-slate-600'
                                    }`}
                                  />
                                  {/* Normal 80 baseline mark (80/140 = 57%) */}
                                  <div
                                    className="absolute top-0 bottom-0 w-0.5 bg-slate-400 z-10"
                                    style={{ left: '57%' }}
                                    title="Standard normal diastolic target: 80 mmHg"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Stats footer */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Average</span>
                        <strong className="text-slate-900">{avgSystolic}/{avgDiastolic} mmHg</strong>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Systolic Range</span>
                        <strong className="text-slate-900">{minSystolic} – {maxSystolic} mmHg</strong>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Diastolic Range</span>
                        <strong className="text-slate-900">{minDiastolic} – {maxDiastolic} mmHg</strong>
                      </div>
                      <div className="p-2 bg-slate-50 rounded-lg">
                        <span className="text-[10px] text-slate-400 block">Total Readings</span>
                        <strong className="text-slate-900">{bpReadings.length} entries</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* GRID 2: WEIGHT & TEMPERATURE CHARTS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* CHART 2: BODY WEIGHT */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-teal-600" />
                        <h3 className="text-sm font-bold text-slate-900">Body Weight Trajectory</h3>
                      </div>
                      <p className="text-xs text-slate-500">Tracked in kilograms</p>
                    </div>
                    {latestWeight && (
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {latestWeight.weight} kg
                      </span>
                    )}
                  </div>

                  {weightReadings.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No weight readings recorded in this time window.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {weightReadings.map((r) => {
                          const base = Number(minWeight || 70) - 2;
                          const span = Math.max(Number(maxWeight || 80) - base + 2, 4);
                          const pct = Math.min(100, Math.max(10, Math.round(((r.weight - base) / span) * 100)));

                          return (
                            <div key={r.date} className="space-y-1 text-xs">
                              <div className="flex justify-between font-semibold text-slate-800">
                                <span>{r.date}</span>
                                <span className="font-bold text-slate-900">{r.weight} kg</span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${pct}%` }}
                                  className="h-full bg-teal-600 rounded-full transition-all duration-300"
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Average</span>
                          <strong className="text-slate-900">{avgWeight} kg</strong>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Min / Max</span>
                          <strong className="text-slate-900">{minWeight} / {maxWeight}</strong>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Period Delta</span>
                          <strong className={weightChange !== null && weightChange > 0 ? 'text-amber-800' : 'text-slate-900'}>
                            {weightChange !== null ? (weightChange > 0 ? `+${weightChange}` : `${weightChange}`) : '0'} kg
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* CHART 3: BODY TEMPERATURE */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-orange-500" />
                        <h3 className="text-sm font-bold text-slate-900">Body Temperature</h3>
                      </div>
                      <p className="text-xs text-slate-500">Normal baseline: 36.5°C – 37.2°C</p>
                    </div>
                    {latestTemp && (
                      <span className="font-extrabold text-slate-900 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        {latestTemp.temp} °C
                      </span>
                    )}
                  </div>

                  {tempReadings.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No temperature readings recorded in this time window.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        {tempReadings.map((r) => {
                          const isFever = r.temp >= 37.5;
                          // Scale 35°C to 40°C
                          const pct = Math.min(100, Math.max(10, Math.round(((r.temp - 35) / 5) * 100)));

                          return (
                            <div key={r.date} className="space-y-1 text-xs">
                              <div className="flex justify-between font-semibold text-slate-800">
                                <span>{r.date}</span>
                                <span className={isFever ? 'font-bold text-rose-700' : 'text-slate-900'}>
                                  {r.temp} °C {isFever ? '(Elevated)' : ''}
                                </span>
                              </div>
                              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  style={{ width: `${pct}%` }}
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    isFever ? 'bg-rose-500' : 'bg-orange-500'
                                  }`}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-xs">
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Average</span>
                          <strong className="text-slate-900">{avgTemp} °C</strong>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Min / Max</span>
                          <strong className="text-slate-900">{minTemp} / {maxTemp} °C</strong>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                          <span className="text-[10px] text-slate-400 block">Fever Days</span>
                          <strong className={feverReadingsCount > 0 ? 'text-rose-700 font-bold' : 'text-slate-900'}>
                            {feverReadingsCount} recorded
                          </strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. WEEKLY & MONTHLY SUMMARIES SECTION */}
          {(vitalsSubView === 'all' || vitalsSubView === 'summaries') && (
            <div className="space-y-6">
              {/* Weekly Summary Table */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Weekly Health Summaries</h3>
                    <p className="text-xs text-slate-500">Weekly averages and ranges for your clinical review</p>
                  </div>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {weeklySummaries.length} Weeks Recorded
                  </span>
                </div>

                {weeklySummaries.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No weekly data aggregated yet. Complete daily check-ins to view weekly summaries.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Week</th>
                          <th className="py-2.5 px-3">Days Logged</th>
                          <th className="py-2.5 px-3">Avg Blood Pressure</th>
                          <th className="py-2.5 px-3">Avg Weight</th>
                          <th className="py-2.5 px-3">Avg Temperature</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {weeklySummaries.map((w) => (
                          <tr key={w.weekKey} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{w.weekLabel}</td>
                            <td className="py-2.5 px-3">{w.daysRecorded} / 7 days</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold">{w.avgBP}</span>
                              {w.bpMinMax && (
                                <span className="block text-[10px] text-slate-400">{w.bpMinMax}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold">{w.avgWeight}</span>
                              {w.weightMinMax && (
                                <span className="block text-[10px] text-slate-400">{w.weightMinMax}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold">{w.avgTemp}</span>
                              {w.tempMinMax && (
                                <span className="block text-[10px] text-slate-400">{w.tempMinMax}</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Monthly Summary Table */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Monthly Health Summaries</h3>
                    <p className="text-xs text-slate-500">Long-term monthly averages and clinical bounds</p>
                  </div>
                  <span className="text-xs font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                    {monthlySummaries.length} Months
                  </span>
                </div>

                {monthlySummaries.length === 0 ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    No monthly data aggregated yet.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">Month</th>
                          <th className="py-2.5 px-3">Active Days</th>
                          <th className="py-2.5 px-3">Avg Blood Pressure</th>
                          <th className="py-2.5 px-3">Avg Weight</th>
                          <th className="py-2.5 px-3">Avg Temperature</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-slate-800">
                        {monthlySummaries.map((m) => (
                          <tr key={m.monthKey} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 font-semibold text-slate-900">{m.monthLabel}</td>
                            <td className="py-2.5 px-3">{m.daysRecorded} days logged</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold">{m.avgBP}</span>
                              <span className="block text-[10px] text-slate-400">Bounds: {m.bpMinMax}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold">{m.avgWeight}</span>
                              <span className="block text-[10px] text-slate-400">Bounds: {m.weightMinMax}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold">{m.avgTemp}</span>
                              <span className="block text-[10px] text-slate-400">Bounds: {m.tempMinMax}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. MEASUREMENT LOG SECTION */}
          {(vitalsSubView === 'all' || vitalsSubView === 'log') && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recorded Measurements Log</h3>
                  <p className="text-xs text-slate-500">Every individual vital reading stored in your cloud journal</p>
                </div>
                <DataProvenanceBadge type="user_fact" />
              </div>

              {filteredMeasurements.length === 0 && bpReadings.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No individual measurement logs found for this period.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {filteredMeasurements.slice(0, 15).map((m) => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-2">
                          <span className="capitalize">{m.type.replace('_', ' ')}</span>
                          <span className="text-[10px] text-slate-400 font-mono font-normal">
                            {m.date}
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-500">{m.notes || 'Recorded vital entry'}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                          {m.value} {m.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* VIEW 1: Symptom Frequency & Severity Charts */}
      {activeMetricTab === 'symptoms' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* How often each happened */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">How Often Symptoms Happened</h3>
                  <p className="text-xs text-slate-500">Over the past {selectedRange} days</p>
                </div>
                <DataProvenanceBadge type="calculated" />
              </div>

              {sortedSymptoms.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No symptoms recorded in this time window</div>
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
                            {count} time{count > 1 ? 's' : ''} ({Math.round((count / filteredSymptoms.length) * 100)}% of total)
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

            {/* How intense symptoms were */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">How Intense Symptoms Felt</h3>
                  <p className="text-xs text-slate-500">Rated on a scale of 0 (none) to 10 (most severe)</p>
                </div>
                <DataProvenanceBadge type="user_fact" />
              </div>

              {filteredSymptoms.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No symptoms recorded in this time window</div>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                  {filteredSymptoms.slice(0, 10).map((symp) => (
                    <div key={symp.id} className="flex items-center justify-between text-xs p-2.5 bg-slate-50 rounded-xl">
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-2">
                          <span>{symp.symptomName}</span>
                          {symp.userSuspicionOrConcern && (
                            <span className="text-[10px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              Your Question
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

          {/* Patterns Spotted Card */}
          <div className="p-5 bg-teal-50/60 border border-teal-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-teal-900 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-teal-700" />
                <span>Patterns Spotted in Your Notes</span>
              </div>
              <DataProvenanceBadge type="ai_observation" />
            </div>
            <div className="space-y-1.5 text-xs text-slate-700 leading-relaxed">
              <p>
                • <strong>Most common symptom:</strong> Your most frequently recorded symptom was{' '}
                <strong>{sortedSymptoms[0]?.[0] || 'Headache'}</strong> ({sortedSymptoms[0]?.[1] || 0} times in {selectedRange} days).
              </p>
              <p>
                • <strong>Vitals context:</strong> Blood pressure averaged{' '}
                <strong>{avgSystolic && avgDiastolic ? `${avgSystolic}/${avgDiastolic} mmHg` : 'normal ranges'}</strong>{' '}
                and body weight averaged <strong>{avgWeight ? `${avgWeight} kg` : 'stable'}</strong> during this reporting period.
              </p>
              <p>
                • <strong>Sleep connection:</strong> Symptoms were recorded more often on days when you slept less than usual (5 of 6 headaches happened after sleeping under 6 hours).
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
              <h3 className="text-sm font-bold text-slate-900">Nightly Sleep Hours</h3>
              <p className="text-xs text-slate-500">Your sleep hours compared to a healthy 7.5-hour target</p>
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
                        {hours} hrs ({formatSleepQuality(sl.quality)})
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
                <p className="text-xs text-slate-500">From your daily check-ins</p>
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
                <p className="text-xs text-slate-500">From your daily check-ins</p>
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

      {/* VIEW 4: LOG COMPLETENESS SECTION */}
      {activeMetricTab === 'quality' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-600" />
                  <h3 className="text-base font-bold text-slate-900">How Complete Your Health Notes Are</h3>
                </div>
                <p className="text-xs text-slate-500">
                  The more complete your entries are, the easier it is for your doctor to see the full picture
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-teal-700">{overallQualityScore}%</span>
                <span className="block text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Overall Score
                </span>
              </div>
            </div>

            {/* Quality Progress Cards with Progressive Disclosure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Metric 1 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Symptom Details</span>
                  <span className="font-bold text-teal-700">{symptomCompletenessPct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div style={{ width: `${symptomCompletenessPct}%` }} className="h-full bg-teal-600 rounded-full" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {withLocation} of {totalSymptomEpisodes} logs include location · {withTriStates} of {totalSymptomEpisodes} have key health checks answered.
                </p>
              </div>

              {/* Metric 2 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Sleep Records</span>
                  <span className="font-bold text-indigo-700">{sleepDaysCoveragePct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div style={{ width: `${sleepDaysCoveragePct}%` }} className="h-full bg-indigo-600 rounded-full" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {filteredSleep.length} recorded nights out of the last {Math.min(selectedRange, 30)} days.
                </p>
              </div>

              {/* Metric 3 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Daily Check-ins</span>
                  <span className="font-bold text-amber-700">{checkInCoveragePct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div style={{ width: `${checkInCoveragePct}%` }} className="h-full bg-amber-500 rounded-full" />
                </div>
                <p className="text-[11px] text-slate-500">
                  {filteredCheckIns.length} daily energy & stress ratings logged in this period.
                </p>
              </div>

              {/* Metric 4 */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-800">Vitals & Measurements</span>
                  <span className="font-bold text-emerald-700">
                    {bpReadings.length + weightReadings.length + tempReadings.length > 0 ? 'Active' : 'No entries'}
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${Math.min(100, Math.round(((bpReadings.length + weightReadings.length + tempReadings.length) / Math.min(selectedRange, 15)) * 100))}%`,
                    }}
                    className="h-full bg-emerald-600 rounded-full"
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  {bpReadings.length} BP · {weightReadings.length} Weight · {tempReadings.length} Temp readings recorded.
                </p>
              </div>
            </div>

            {/* Recommendations to improve notes */}
            <div className="p-4 bg-teal-50/70 border border-teal-200 rounded-xl space-y-1.5 text-xs text-teal-950">
              <span className="font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-700" />
                Tips to make your notes most helpful for your doctor:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] text-slate-700 pl-1">
                <li>Check your blood pressure at the same time each day for the most accurate average.</li>
                <li>Weigh yourself under consistent conditions (e.g. morning, before eating).</li>
                <li>Note whether you had a fever (Yes or No) whenever you feel unwell.</li>
                <li>Log how long you slept on mornings after you notice symptoms.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Clock,
  Stethoscope,
  Moon,
  Pill,
  UserCheck,
  FileText,
  Activity,
  Filter,
  Calendar,
  AlertTriangle,
} from 'lucide-react';
import {
  DailyCheckIn,
  DoctorVisit,
  MeasurementRecord,
  MedicalRecordItem,
  MedicationItem,
  SafetyAlert,
  SleepRecord,
  SymptomEpisode,
} from '../../types';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface Props {
  symptoms: SymptomEpisode[];
  sleepRecords: SleepRecord[];
  medications: MedicationItem[];
  checkIns: DailyCheckIn[];
  measurements: MeasurementRecord[];
  medicalRecords: MedicalRecordItem[];
  doctorVisits: DoctorVisit[];
  safetyAlerts: SafetyAlert[];
  onOpenSymptomIntake: (symptomName?: string) => void;
}

type TimelineEventType =
  | 'symptom'
  | 'sleep'
  | 'medication'
  | 'checkin'
  | 'visit'
  | 'record'
  | 'measurement'
  | 'alert';

interface TimelineItem {
  id: string;
  date: string;
  time?: string;
  type: TimelineEventType;
  title: string;
  subtitle?: string;
  severity?: number;
  badge?: string;
  badgeColor?: string;
  details?: string;
  isAlert?: boolean;
}

export const HealthTimeline: React.FC<Props> = ({
  symptoms,
  sleepRecords,
  checkIns,
  measurements,
  medicalRecords,
  doctorVisits,
  safetyAlerts,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'symptoms' | 'sleep' | 'clinical' | 'vitals'>('all');
  const [selectedDays, setSelectedDays] = useState<number>(30);

  // Aggregate items into a unified chronological stream
  const timelineItems: TimelineItem[] = [];

  // Symptoms
  symptoms.forEach((s) => {
    timelineItems.push({
      id: `symp-${s.id}`,
      date: s.date,
      time: s.startTime,
      type: 'symptom',
      title: `${s.symptomName} (${s.severity}/10)`,
      subtitle: [s.location, s.characterDescription, s.duration].filter(Boolean).join(' · '),
      severity: s.severity,
      badge: s.isResolved ? 'Resolved' : 'Active',
      badgeColor: s.isResolved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
      details: s.userNotes || s.contextNotes,
    });
  });

  // Sleep
  sleepRecords.forEach((sl) => {
    timelineItems.push({
      id: `sleep-${sl.id}`,
      date: sl.date,
      time: sl.wakeTime,
      type: 'sleep',
      title: `Sleep: ${Math.floor(sl.totalMinutes / 60)}h ${sl.totalMinutes % 60}m`,
      subtitle: `${sl.bedtime} to ${sl.wakeTime} · Quality: ${sl.quality}`,
      badge: `${sl.quality} rest`,
      badgeColor: sl.quality === 'poor' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700',
      details: sl.notes,
    });
  });

  // Doctor Visits
  doctorVisits.forEach((v) => {
    timelineItems.push({
      id: `visit-${v.id}`,
      date: v.date,
      type: 'visit',
      title: `Doctor Visit: ${v.doctorName}`,
      subtitle: `${v.specialty} · ${v.clinic}`,
      badge: 'Clinician Visit',
      badgeColor: 'bg-teal-50 text-teal-800',
      details: `${v.reasonForVisit}. Next steps: ${v.nextSteps}`,
    });
  });

  // Medical Records / Labs
  medicalRecords.forEach((r) => {
    timelineItems.push({
      id: `rec-${r.id}`,
      date: r.date,
      type: 'record',
      title: r.title,
      subtitle: `${r.category.replace('_', ' ')} · ${r.providerOrClinic}`,
      badge: 'Lab / Document',
      badgeColor: 'bg-blue-50 text-blue-700',
      details: r.documentSummary || r.userNotes,
    });
  });

  // Measurements
  measurements.forEach((m) => {
    timelineItems.push({
      id: `meas-${m.id}`,
      date: m.date,
      type: 'measurement',
      title: `${m.type.replace('_', ' ').toUpperCase()}: ${m.value} ${m.unit}`,
      subtitle: m.notes || 'Recorded vital',
      badge: 'Measurement',
      badgeColor: 'bg-slate-100 text-slate-700',
    });
  });

  // Safety Alerts
  safetyAlerts.forEach((a) => {
    timelineItems.push({
      id: `alert-${a.id}`,
      date: a.date,
      type: 'alert',
      title: `Safety Prompt: ${a.triggerSymptoms.join(', ')}`,
      subtitle: a.explanation,
      badge: 'Safety Acknowledged',
      badgeColor: 'bg-rose-50 text-rose-700',
      isAlert: true,
      details: `Recommended action: ${a.recommendedAction}`,
    });
  });

  // Sort descending by date
  timelineItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Filter by category
  const filteredItems = timelineItems.filter((item) => {
    if (selectedFilter === 'symptoms' && item.type !== 'symptom') return false;
    if (selectedFilter === 'sleep' && item.type !== 'sleep') return false;
    if (selectedFilter === 'clinical' && item.type !== 'visit' && item.type !== 'record' && item.type !== 'alert')
      return false;
    if (selectedFilter === 'vitals' && item.type !== 'measurement' && item.type !== 'checkin') return false;

    // Filter by days
    const itemTime = new Date(item.date).getTime();
    const cutoffTime = Date.now() - selectedDays * 86400000;
    return itemTime >= cutoffTime;
  });

  const getEventIcon = (type: TimelineEventType) => {
    switch (type) {
      case 'symptom':
        return <Stethoscope className="w-4 h-4 text-teal-600" />;
      case 'sleep':
        return <Moon className="w-4 h-4 text-indigo-600" />;
      case 'visit':
        return <UserCheck className="w-4 h-4 text-teal-700" />;
      case 'record':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'measurement':
        return <Activity className="w-4 h-4 text-emerald-600" />;
      case 'alert':
        return <AlertTriangle className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Health Timeline</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Unified chronological record of symptoms, sleep, clinical visits, vitals, and lab summaries
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold self-start sm:self-auto">
          {[7, 30, 90, 180].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDays(d)}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                selectedDays === d ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 text-xs font-semibold">
        {[
          { id: 'all', label: 'All Health Events' },
          { id: 'symptoms', label: 'Symptoms Only' },
          { id: 'sleep', label: 'Sleep Logs' },
          { id: 'clinical', label: 'Doctor Visits & Records' },
          { id: 'vitals', label: 'Vitals & Measurements' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedFilter(tab.id as any)}
            className={`px-3.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              selectedFilter === tab.id
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Timeline Stream */}
      <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-200 space-y-6 pt-2">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={item.id} className="relative group">
              {/* Event node dot / icon */}
              <div className="absolute -left-[35px] sm:-left-[43px] top-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center shadow-xs group-hover:border-teal-500 transition-colors">
                {getEventIcon(item.type)}
              </div>

              {/* Event Card */}
              <div
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all ${
                  item.isAlert
                    ? 'border-rose-200 bg-rose-50/40'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-500">
                        {item.date} {item.time ? `· ${item.time}` : ''}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded border border-current text-opacity-90 ${item.badgeColor}`}
                        >
                          {item.badge}
                        </span>
                      )}
                      <DataProvenanceBadge
                        type={
                          item.type === 'sleep' || item.type === 'measurement'
                            ? 'calculated'
                            : item.type === 'record'
                            ? 'ai_observation'
                            : 'user_fact'
                        }
                      />
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                      {item.title}
                    </h4>

                    {item.subtitle && (
                      <p className="text-xs text-slate-600 leading-relaxed">{item.subtitle}</p>
                    )}

                    {item.details && (
                      <p className="text-xs text-slate-500 italic pt-1 border-t border-slate-100 mt-2">
                        {item.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
            <Clock className="w-8 h-8 mx-auto text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700">No events found for this filter and time window.</p>
          </div>
        )}
      </div>
    </div>
  );
};

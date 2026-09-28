/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  Calendar,
  ChevronDown,
  ChevronUp,
  Tag,
  AlertTriangle,
} from 'lucide-react';
import { SymptomEpisode } from '../../types';
import { TriStateBadge } from '../common/TriStateBadge';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface Props {
  symptoms: SymptomEpisode[];
  onOpenSymptomIntake: (symptomName?: string) => void;
  onUpdateSymptom: (id: string, updates: Partial<SymptomEpisode>) => void;
}

export const SymptomDatabase: React.FC<Props> = ({
  symptoms,
  onOpenSymptomIntake,
  onUpdateSymptom,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'resolved' | 'recurring'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedSymptomGroup, setSelectedSymptomGroup] = useState<string | null>(null);

  // Group by symptom name to showcase chronological history per symptom
  const symptomGroups = Array.from(new Set(symptoms.map((s) => s.symptomName)));

  const filteredSymptoms = symptoms.filter((s) => {
    if (selectedFilter === 'active' && s.isResolved) return false;
    if (selectedFilter === 'resolved' && !s.isResolved) return false;
    if (selectedFilter === 'recurring' && !s.isRecurring) return false;
    if (selectedSymptomGroup && s.symptomName !== selectedSymptomGroup) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.symptomName.toLowerCase().includes(q) ||
        s.location.toLowerCase().includes(q) ||
        s.characterDescription.toLowerCase().includes(q) ||
        (s.associatedSymptoms && s.associatedSymptoms.some((a) => a.toLowerCase().includes(q)))
      );
    }
    return true;
  });

  const getSeverityBadgeClass = (sev: number) => {
    if (sev <= 3) return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    if (sev <= 6) return 'text-amber-800 bg-amber-50 border-amber-200';
    if (sev <= 8) return 'text-orange-800 bg-orange-50 border-orange-200';
    return 'text-rose-800 bg-rose-50 border-rose-200';
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Symptom Database & History</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Chronological records of all reported symptom episodes and clinical characteristics
          </p>
        </div>
        <button
          onClick={() => onOpenSymptomIntake()}
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Log New Symptom</span>
        </button>
      </div>

      {/* Symptom Name Quick-Select Filter Tabs */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
          Filter by Symptom History:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedSymptomGroup(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              selectedSymptomGroup === null
                ? 'bg-teal-600 text-white border-teal-600'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Symptoms ({symptoms.length})
          </button>
          {symptomGroups.map((name) => {
            const count = symptoms.filter((s) => s.symptomName === name).length;
            const isSelected = selectedSymptomGroup === name;
            return (
              <button
                key={name}
                onClick={() => setSelectedSymptomGroup(isSelected ? null : name)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-teal-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search symptoms, locations, triggers, notes..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          />
        </div>

        <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs font-semibold self-start sm:self-auto">
          {(['all', 'active', 'resolved', 'recurring'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-3 py-1.5 rounded-md capitalize transition-colors cursor-pointer ${
                selectedFilter === f ? 'bg-teal-50 text-teal-800' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Symptom Chronological Cards List */}
      <div className="space-y-3">
        {filteredSymptoms.length > 0 ? (
          filteredSymptoms.map((symp) => {
            const isExpanded = expandedId === symp.id;
            return (
              <div
                key={symp.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-slate-300 transition-all"
              >
                {/* Main Card Header */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : symp.id)}
                  className="p-4 sm:p-5 flex items-start justify-between gap-4 cursor-pointer select-none"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-slate-900 leading-tight">
                        {symp.symptomName}
                      </h3>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded border ${getSeverityBadgeClass(symp.severity)}`}>
                        {symp.severity}/10 Severity
                      </span>
                      {symp.isResolved ? (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          Resolved
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200/60">
                          Active Episode
                        </span>
                      )}
                      {symp.isRecurring && (
                        <span className="text-[11px] text-slate-500 font-medium">· Recurring</span>
                      )}
                    </div>

                    {/* Unboxed inline metadata */}
                    <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap pt-0.5">
                      <span>{symp.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{symp.startTime}</span>
                      {symp.duration && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Duration: {symp.duration}</span>
                        </>
                      )}
                      {symp.location && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>Location: {symp.location}</span>
                        </>
                      )}
                    </div>

                    <p className="text-xs text-slate-700 line-clamp-1 pt-1">
                      {symp.characterDescription || 'No character description recorded.'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      className="text-slate-400 hover:text-slate-600 p-1"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Drawer */}
                {isExpanded && (
                  <div className="px-4 sm:px-5 pb-5 pt-2 border-t border-slate-100 bg-slate-50/60 space-y-3.5 text-xs text-slate-700">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <strong className="block text-slate-500 font-semibold mb-0.5">Frequency & Pattern:</strong>
                        <span className="capitalize">{symp.frequency}</span>
                      </div>
                      <div>
                        <strong className="block text-slate-500 font-semibold mb-0.5">Character:</strong>
                        <span>{symp.characterDescription || '—'}</span>
                      </div>
                      <div>
                        <strong className="block text-slate-500 font-semibold mb-0.5">Associated Symptoms:</strong>
                        <span>{symp.associatedSymptoms?.length ? symp.associatedSymptoms.join(', ') : 'None recorded'}</span>
                      </div>
                      <div>
                        <strong className="block text-slate-500 font-semibold mb-0.5">Relieving Factors:</strong>
                        <span>{symp.relievingFactors?.length ? symp.relievingFactors.join(', ') : 'None recorded'}</span>
                      </div>
                      <div>
                        <strong className="block text-slate-500 font-semibold mb-0.5">Triggers / Context:</strong>
                        <span>{symp.triggers?.length ? symp.triggers.join(', ') : (symp.contextNotes || '—')}</span>
                      </div>
                      <div>
                        <strong className="block text-slate-500 font-semibold mb-0.5">Medical Evaluation:</strong>
                        <div className="pt-0.5">
                          <TriStateBadge
                            state={symp.medicallyEvaluatedState || (symp.medicallyEvaluated ? 'yes' : 'no')}
                            label="Doctor Evaluated"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Clinical Tri-State Row */}
                    <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[11px] text-slate-700 uppercase tracking-wider">
                          Clinical Question Statuses
                        </span>
                        <span className="text-[10px] text-slate-400">
                          (Not Recorded = Not Asked or Unknown)
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Fever:</span>
                          <TriStateBadge state={symp.feverReported} label="Fever" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Prior Occurrence:</span>
                          <TriStateBadge state={symp.priorOccurrenceState} label="Prior History" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500">Worsening:</span>
                          <TriStateBadge state={symp.worseningProgressionState} label="Worsening" />
                        </div>
                      </div>
                    </div>

                    {/* Unconfirmed user concern if present */}
                    {symp.userSuspicionOrConcern && (
                      <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="block text-amber-900 font-semibold">Unconfirmed User Concern:</strong>
                          <p className="mt-0.5">{symp.userSuspicionOrConcern}</p>
                          <span className="text-[10px] text-amber-800/80 block mt-1">
                            Stored as user-reported suspicion; not a medical diagnosis.
                          </span>
                        </div>
                      </div>
                    )}

                    {symp.userNotes && (
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <strong className="block text-slate-500 font-semibold mb-1">User Notes:</strong>
                        <p className="italic text-slate-800">{symp.userNotes}</p>
                      </div>
                    )}

                    {symp.safetyFlagged && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Safety Prompt Acknowledged: </strong>
                          {symp.safetyNotes || 'Prompted clinical review due to severity criteria.'}
                        </div>
                      </div>
                    )}

                    {/* Quick action: mark resolved / active or log episode of same symptom */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onUpdateSymptom(symp.id, { isResolved: !symp.isResolved })}
                          className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors cursor-pointer ${
                            symp.isResolved
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-emerald-600 text-white hover:bg-emerald-700'
                          }`}
                        >
                          {symp.isResolved ? 'Re-open Episode' : 'Mark as Resolved'}
                        </button>
                      </div>

                      <button
                        onClick={() => onOpenSymptomIntake(symp.symptomName)}
                        className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold rounded-lg text-xs border border-teal-200 cursor-pointer"
                      >
                        + Log New Episode of {symp.symptomName}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-3">
            <Stethoscope className="w-8 h-8 mx-auto text-slate-400" />
            <p className="font-semibold text-slate-700">No symptoms match the current filter.</p>
            <button
              onClick={() => onOpenSymptomIntake()}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
            >
              Log a Symptom
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

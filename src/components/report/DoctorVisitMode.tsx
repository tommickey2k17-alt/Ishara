/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Stethoscope,
  Clock,
  Pill,
  CheckCircle2,
  Calendar,
  AlertCircle,
  HelpCircle,
  FileText,
  Printer,
  ChevronRight,
  TrendingUp,
  Activity,
  Plus,
  ArrowRight,
  Shield,
  Sparkles,
} from 'lucide-react';
import {
  DoctorReport,
  DoctorVisit,
  MedicationItem,
  MeasurementRecord,
  SymptomEpisode,
  UserProfile,
} from '../../types';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';

interface Props {
  userProfile: UserProfile;
  symptoms: SymptomEpisode[];
  medications: MedicationItem[];
  measurements: MeasurementRecord[];
  latestReport?: DoctorReport;
  onOpenReportModal: () => void;
  onAddDoctorVisit?: (visit: DoctorVisit) => void;
}

export const DoctorVisitMode: React.FC<Props> = ({
  userProfile,
  symptoms,
  medications,
  measurements,
  latestReport,
  onOpenReportModal,
  onAddDoctorVisit,
}) => {
  const [customQuestions, setCustomQuestions] = useState<string[]>([
    'Are my current symptom frequency and severity within expected bounds for tension patterns?',
    'Should we adjust the timing or dosage of my PRN pain relief medication?',
    'Are there specific lifestyle or ergonomic changes you recommend before considering daily preventive medications?',
  ]);
  const [newQuestion, setNewQuestion] = useState('');
  const [isDoctorScreenMode, setIsDoctorScreenMode] = useState(false);

  // Visit Note Logger
  const [showLogVisitModal, setShowLogVisitModal] = useState(false);
  const [visitDoctor, setVisitDoctor] = useState('Dr. Ananya Sen');
  const [visitSpecialty, setVisitSpecialty] = useState('Internal Medicine');
  const [visitClinic, setVisitClinic] = useState('City Health Medical Center');
  const [visitReason, setVisitReason] = useState(latestReport?.reasonForVisit || 'Follow-up symptom review');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitNextSteps, setVisitNextSteps] = useState('');

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setCustomQuestions([...customQuestions, newQuestion.trim()]);
    setNewQuestion('');
  };

  const handleRemoveQuestion = (idx: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== idx));
  };

  const handleSaveVisit = () => {
    if (!visitDoctor.trim() || !onAddDoctorVisit) return;
    const visit: DoctorVisit = {
      id: `visit-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      doctorName: visitDoctor,
      specialty: visitSpecialty,
      clinic: visitClinic,
      reasonForVisit: visitReason,
      keyDiscussionNotes: visitNotes || 'Consultation completed.',
      nextSteps: visitNextSteps || 'Continue journal tracking.',
    };
    onAddDoctorVisit(visit);
    setShowLogVisitModal(false);
    setVisitNotes('');
    setVisitNextSteps('');
  };

  const recentSymptoms = symptoms.slice(0, 5);

  return (
    <div className={`space-y-6 pb-28 ${isDoctorScreenMode ? 'max-w-3xl mx-auto' : ''}`}>
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-teal-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="relative z-10 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
                <Stethoscope className="w-5 h-5 text-teal-300" />
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-widest text-teal-300 uppercase block font-semibold">
                  CLINICAL APPOINTMENT BRIEFING
                </span>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Doctor Visit Mode
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsDoctorScreenMode(!isDoctorScreenMode)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isDoctorScreenMode
                    ? 'bg-teal-400 text-teal-950 border-teal-300'
                    : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                }`}
              >
                {isDoctorScreenMode ? '✓ Exam Room View' : 'Exam Room High-Contrast'}
              </button>

              <button
                onClick={onOpenReportModal}
                className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Full Doctor Report</span>
              </button>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl leading-relaxed">
            Concise, appointment-ready briefing compiled from your journal logs. Designed to make your 15-minute consultation efficient, focused, and objective without automated diagnoses.
          </p>
        </div>
      </div>

      {/* BRIEFING CARD 1: Chief Concern & What Changed */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Chief Concern */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-teal-600" />
              1. Chief Concern / Reason for Visit
            </span>
            <DataProvenanceBadge type="user_fact" />
          </div>
          <p className="text-sm font-bold text-slate-900 leading-snug">
            {latestReport?.reasonForVisit || 'Consultation for recurrent headaches and sleep-stress correlation evaluation'}
          </p>
          <div className="text-xs text-slate-600 space-y-1 pt-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="font-semibold text-slate-700 block text-[11px] uppercase">Patient Profile Context:</span>
            <p>
              {userProfile.name}, {userProfile.age} yrs, {userProfile.sex}
            </p>
            <p>
              Documented Conditions: {userProfile.conditions.join(', ') || 'None noted'}
            </p>
            {userProfile.userReportedConcerns && userProfile.userReportedConcerns.length > 0 && (
              <div className="text-[11px] text-amber-800 bg-amber-50 p-1.5 rounded border border-amber-200">
                <strong>Unconfirmed user concern: </strong>
                {userProfile.userReportedConcerns[0].text}
              </div>
            )}
          </div>
        </div>

        {/* What Changed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              2. What Changed Since Last Visit
            </span>
            <DataProvenanceBadge type="calculated" />
          </div>
          <ul className="text-xs text-slate-700 space-y-2">
            {(latestReport?.whatChanged || [
              'Headache frequency decreased slightly from 7 episodes to 6 episodes in last 30 days',
              'Average severity score lowered from 6.8/10 to 5.8/10',
              'Average nocturnal sleep increased by 28 minutes following magnesium routine',
              'Single transient mild fever episode on Sep 21 resolved within 24 hours without recurrence',
            ]).map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                <span className="leading-snug">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* BRIEFING CARD 2: Current Symptoms & Trajectory */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">3. Recent Symptom Trajectory</h3>
            <p className="text-xs text-slate-500">Chronological episodes ready to show your physician</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${
                latestReport?.symptomTrajectory === 'improving'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {latestReport?.symptomTrajectory || 'Improving'}
            </span>
            <DataProvenanceBadge type="calculated" />
          </div>
        </div>

        <div className="space-y-2 text-xs">
          {recentSymptoms.map((symp) => (
            <div
              key={symp.id}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
            >
              <div>
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span>{symp.symptomName}</span>
                  <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {symp.date} · {symp.startTime}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Location: {symp.location || 'Bilateral temples'} · {symp.characterDescription || 'Aching pressure'}
                  {symp.triggers?.length ? ` · Triggers: ${symp.triggers.join(', ')}` : ''}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-500">
                  Fever: <strong>{symp.feverReported || 'no'}</strong>
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-teal-50 text-teal-800 font-bold border border-teal-200">
                  {symp.severity}/10
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BRIEFING CARD 3: Current Medications & Vitals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Medications */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Pill className="w-4 h-4 text-emerald-600" />
              4. Active Medications & Supplements
            </span>
            <DataProvenanceBadge type="user_fact" />
          </div>
          <ul className="text-xs space-y-2">
            {medications.map((m) => (
              <li key={m.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                  <span className="font-bold text-slate-900 block">{m.name}</span>
                  <span className="text-[11px] text-slate-500">{m.dosage} · {m.frequency}</span>
                </div>
                {m.purpose && (
                  <span className="text-[10px] text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {m.purpose}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Recent Vitals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-teal-600" />
              5. Recent Objective Vitals
            </span>
            <DataProvenanceBadge type="calculated" />
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            {measurements.slice(0, 4).map((m) => (
              <div key={m.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-500 font-semibold uppercase block">{m.type.replace('_', ' ')}</span>
                <span className="text-base font-extrabold text-slate-900">{m.value} {m.unit}</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">{m.date}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* BRIEFING CARD 4: Questions to Ask the Doctor */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">6. Questions to Ask Your Doctor</h3>
            <p className="text-xs text-slate-500">Customizable question checklist for your consultation</p>
          </div>
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
            {customQuestions.length} Questions Prepared
          </span>
        </div>

        <div className="space-y-2">
          {customQuestions.map((q, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  {idx + 1}
                </span>
                <span className="text-slate-800 font-medium leading-relaxed">{q}</span>
              </div>
              <button
                onClick={() => handleRemoveQuestion(idx)}
                className="text-slate-400 hover:text-rose-600 text-xs font-bold px-1.5 cursor-pointer"
                title="Remove question"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {/* Add question field */}
        <div className="flex gap-2 pt-1">
          <input
            type="text"
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
            placeholder="Add another question for your doctor..."
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
          />
          <button
            onClick={handleAddQuestion}
            disabled={!newQuestion.trim()}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* Post-Visit Log Trigger */}
      <div className="p-5 bg-slate-100 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div>
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
            Finished your appointment?
          </h4>
          <p className="text-xs text-slate-600">
            Log what the physician advised so your health timeline remains complete.
          </p>
        </div>
        <button
          onClick={() => setShowLogVisitModal(true)}
          className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shrink-0"
        >
          Record Doctor's Instructions
        </button>
      </div>

      <MedicalDisclaimer />

      {/* Log Visit Modal */}
      {showLogVisitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900">Record Doctor Visit</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Doctor Name</label>
                <input
                  type="text"
                  value={visitDoctor}
                  onChange={(e) => setVisitDoctor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Specialty</label>
                <input
                  type="text"
                  value={visitSpecialty}
                  onChange={(e) => setVisitSpecialty(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinic / Hospital</label>
                <input
                  type="text"
                  value={visitClinic}
                  onChange={(e) => setVisitClinic(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Discussion & Advice</label>
                <textarea
                  rows={3}
                  value={visitNotes}
                  onChange={(e) => setVisitNotes(e.target.value)}
                  placeholder="Doctor's findings, advice, and prescriptions..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Next Steps & Review Date</label>
                <input
                  type="text"
                  value={visitNextSteps}
                  onChange={(e) => setVisitNextSteps(e.target.value)}
                  placeholder="e.g. Follow up in 3 months with continued log"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowLogVisitModal(false)}
                className="px-4 py-2 text-xs text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveVisit}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Save Consultation Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

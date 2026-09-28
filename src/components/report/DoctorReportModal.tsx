/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  FileText,
  Calendar,
  Sparkles,
  AlertTriangle,
  ShieldAlert,
  Download,
  RefreshCw,
} from 'lucide-react';
import {
  DailyCheckIn,
  DoctorReport,
  MeasurementRecord,
  MedicationItem,
  SafetyAlert,
  SleepRecord,
  SymptomEpisode,
  UserProfile,
} from '../../types';
import { AIService } from '../../services/aiService';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  report: DoctorReport;
  userProfile: UserProfile;
  symptoms: SymptomEpisode[];
  sleepRecords: SleepRecord[];
  checkIns: DailyCheckIn[];
  medications: MedicationItem[];
  measurements: MeasurementRecord[];
  safetyAlerts: SafetyAlert[];
  onReportGenerated: (newReport: DoctorReport) => void;
}

export const DoctorReportModal: React.FC<Props> = ({
  isOpen,
  onClose,
  report: initialReport,
  userProfile,
  symptoms,
  sleepRecords,
  checkIns,
  medications,
  measurements,
  safetyAlerts,
  onReportGenerated,
}) => {
  const [report, setReport] = useState<DoctorReport>(initialReport);
  const [selectedPeriod, setSelectedPeriod] = useState<number>(initialReport.periodDays || 30);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleRegenerate = async (periodDays: number) => {
    setIsRegenerating(true);
    setSelectedPeriod(periodDays);
    try {
      const generated = await AIService.generateDoctorReport(
        userProfile,
        symptoms,
        sleepRecords,
        checkIns,
        medications,
        measurements,
        safetyAlerts,
        periodDays
      );
      setReport(generated);
      onReportGenerated(generated);
    } catch (err) {
      console.error('Failed to regenerate doctor report:', err);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const plainText = `
PATIENT HEALTH SUMMARY
Name: ${report.patientSummary.name}
Age: ${report.patientSummary.age} | Sex: ${report.patientSummary.sex}
Report Period: ${report.periodLabel}
Generated: ${new Date(report.generatedAt).toLocaleString()}

PRIMARY CONCERNS:
${report.primaryConcerns.map((c) => `- ${c}`).join('\n')}

SYMPTOM TIMELINE:
${report.symptomTimeline.map((t) => `${t.date} | ${t.symptom} | Severity: ${t.severity} | Duration: ${t.duration} | ${t.details}`).join('\n')}

PATTERNS OBSERVED IN LOG:
[USER-REPORTED FACTS]
${report.patternsObserved.userReportedFacts.map((f) => `- ${f}`).join('\n')}

[CALCULATED INFORMATION]
${report.patternsObserved.calculatedInformation.map((c) => `- ${c}`).join('\n')}

[AI-GENERATED OBSERVATIONS]
${report.patternsObserved.aiGeneratedObservations.map((o) => `- ${o}`).join('\n')}

CURRENT MEDICATIONS / SUPPLEMENTS:
${report.currentMedications.map((m) => `- ${m.name} (${m.dosage}, ${m.frequency})`).join('\n')}

RELEVANT MEDICAL HISTORY:
${report.relevantMedicalHistory.map((h) => `- ${h}`).join('\n')}

RECENT MEASUREMENTS:
${report.recentMeasurements.map((m) => `- ${m.metric}: ${m.value} (${m.date})`).join('\n')}

QUESTIONS / CONCERNS FOR CLINICIAN:
${report.clinicianQuestions.map((q) => `- ${q}`).join('\n')}

${report.safetyAlerts.length > 0 ? `SAFETY ALERTS:\n${report.safetyAlerts.map((a) => `- ${a.date}: ${a.note}`).join('\n')}` : ''}

DISCLAIMER:
This document is a structured summary of patient-reported log entries and calculations prepared by Ishara. It does not provide medical diagnoses or treatment recommendations.
    `.trim();

    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[96vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Controls Toolbar (Hidden when printing) */}
        <div className="print:hidden px-4 sm:px-6 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">One-Page Clinical Summary</h2>
              <p className="text-[11px] text-slate-500">Doctor-friendly structured health report</p>
            </div>
          </div>

          {/* Time range selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden sm:inline">Reporting Period:</span>
            <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-xs font-semibold">
              {[7, 14, 30, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => handleRegenerate(d)}
                  disabled={isRegenerating}
                  className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                    selectedPeriod === d ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>

            <button
              onClick={() => handleRegenerate(selectedPeriod)}
              disabled={isRegenerating}
              className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
              title="Refresh / Re-synthesize Report"
            >
              <RefreshCw className={`w-4 h-4 ${isRegenerating ? 'animate-spin text-teal-600' : ''}`} />
            </button>
          </div>

          {/* Print & Copy Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Download PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200 transition-colors ml-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* CLINICAL ONE-PAGE REPORT BODY */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-5 bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          {/* Top Clinical Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold tracking-widest uppercase text-teal-800 bg-teal-50 px-2 py-0.5 border border-teal-200">
                  CLINICAL HEALTH SUMMARY
                </span>
                <span className="text-[11px] text-slate-500 font-mono">CONFIDENTIAL PATIENT LOG</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 mt-1">
                {report.patientSummary.name}
              </h1>
              <div className="flex items-center gap-3 text-xs text-slate-600 pt-0.5">
                <span>Age: <strong>{report.patientSummary.age}</strong></span>
                <span>·</span>
                <span>Biological Sex: <strong>{report.patientSummary.sex}</strong></span>
                <span>·</span>
                <span>Location: <strong>{report.patientSummary.country}</strong></span>
              </div>
            </div>

            <div className="sm:text-right text-xs text-slate-600 space-y-0.5">
              <div>
                Report Period: <strong className="text-slate-900">{report.periodLabel}</strong>
              </div>
              <div>
                Generated on: <span className="font-mono">{new Date(report.generatedAt).toLocaleDateString()}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">App: Ishara Health Engine v1.0</div>
            </div>
          </div>

          {/* REASON FOR VISIT & WHAT CHANGED & SYMPTOM TRAJECTORY */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Reason for Visit */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 md:col-span-1">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-700">
                  Reason for Visit
                </span>
                <DataProvenanceBadge type="user_fact" />
              </div>
              <p className="text-xs font-semibold text-slate-900 leading-snug pt-0.5">
                {report.reasonForVisit || 'Review of recurrent symptom patterns and daily wellness tracking'}
              </p>
            </div>

            {/* What Changed */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1 md:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                <span className="text-[11px] font-bold font-mono uppercase tracking-wider text-slate-700">
                  What Changed Since Last Review
                </span>
                <DataProvenanceBadge type="calculated" />
              </div>
              <ul className="text-xs text-slate-800 space-y-1 pt-0.5">
                {(report.whatChanged && report.whatChanged.length > 0
                  ? report.whatChanged
                  : [
                      `${symptoms.length} symptoms logged in the past ${selectedPeriod} days`,
                      `Average nightly sleep duration: ${sleepRecords.length > 0 ? (sleepRecords.reduce((a, b) => a + b.totalMinutes, 0) / (sleepRecords.length * 60)).toFixed(1) : 7}h`,
                      `Active medications tracked: ${medications.length}`,
                    ]
                ).map((item, idx) => (
                  <li key={idx} className="flex items-start gap-1.5">
                    <span className="text-teal-600 font-bold">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* SYMPTOM TRAJECTORY BADGE */}
          <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wider">
                Overall Symptom Trajectory:
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-xs font-bold capitalize ${
                  report.symptomTrajectory === 'improving'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : report.symptomTrajectory === 'worsening'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300'
                    : report.symptomTrajectory === 'stable'
                    ? 'bg-blue-100 text-blue-800 border border-blue-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {report.symptomTrajectory || 'Fluctuating'}
              </span>
            </div>
            {report.trajectoryNotes && (
              <span className="text-xs text-slate-600 italic hidden sm:inline">
                {report.trajectoryNotes}
              </span>
            )}
          </div>

          {/* PRIMARY CONCERNS */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              PRIMARY CONCERNS DURING REPORTING PERIOD
            </h3>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {report.primaryConcerns.map((concern, idx) => (
                <li key={idx} className="flex items-start gap-2 bg-slate-50 p-2 rounded border border-slate-200/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-1.5 shrink-0" />
                  <span className="text-slate-800 font-medium">{concern}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SYMPTOM TIMELINE TABLE */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              CHRONOLOGICAL SYMPTOM TIMELINE
            </h3>
            <div className="overflow-x-auto border border-slate-200 rounded-lg">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100/80 text-slate-700 font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3 w-24">Date</th>
                    <th className="py-2 px-3 w-28">Symptom</th>
                    <th className="py-2 px-3 w-20">Severity</th>
                    <th className="py-2 px-3 w-24">Duration</th>
                    <th className="py-2 px-3">Associated Information / Characteristics</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {report.symptomTimeline.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-2 px-3 font-semibold text-slate-900 whitespace-nowrap">{item.date}</td>
                      <td className="py-2 px-3 font-semibold text-slate-900">{item.symptom}</td>
                      <td className="py-2 px-3 font-bold text-teal-800">{item.severity}</td>
                      <td className="py-2 px-3 text-slate-600">{item.duration}</td>
                      <td className="py-2 px-3 text-slate-700 leading-snug">{item.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* PATTERNS OBSERVED IN LOG (STRICT 3-CATEGORY SEPARATION) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-1">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                PATTERNS OBSERVED IN LOG
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Strict Non-Causal Categorization</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* CATEGORY 1: USER-REPORTED FACTS */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold font-mono text-[11px] uppercase text-slate-700 block tracking-wide border-b border-slate-200 pb-0.5">
                  1. User-Reported Facts
                </span>
                <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  {report.patternsObserved.userReportedFacts.map((fact, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-slate-400">•</span>
                      <span>{fact}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CATEGORY 2: CALCULATED INFORMATION */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1.5">
                <span className="font-bold font-mono text-[11px] uppercase text-indigo-900 block tracking-wide border-b border-slate-200 pb-0.5">
                  2. Calculated Information
                </span>
                <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  {report.patternsObserved.calculatedInformation.map((calc, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-indigo-400">•</span>
                      <span>{calc}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* CATEGORY 3: AI-GENERATED OBSERVATIONS */}
              <div className="p-3 bg-teal-50/50 rounded-lg border border-teal-200/80 space-y-1.5">
                <span className="font-bold font-mono text-[11px] uppercase text-teal-900 block tracking-wide border-b border-teal-200/60 pb-0.5 flex items-center justify-between">
                  <span>3. AI Observations</span>
                  <span className="text-[9px] text-teal-700 font-normal">Non-Diagnostic</span>
                </span>
                <ul className="space-y-1 text-slate-700 text-[11px] leading-relaxed">
                  {report.patternsObserved.aiGeneratedObservations.map((obs, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-teal-500">•</span>
                      <span>{obs}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* TWO-COLUMN GRID: MEDICATIONS & CLINICAL HISTORY */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Medications */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                CURRENT MEDICATIONS / SUPPLEMENTS (USER-ENTERED)
              </h3>
              <ul className="space-y-1">
                {report.currentMedications.map((m, idx) => (
                  <li key={idx} className="p-2 bg-slate-50 rounded border border-slate-200">
                    <span className="font-semibold text-slate-900">{m.name}</span>
                    <span className="text-slate-500"> — {m.dosage} ({m.frequency})</span>
                    {m.purpose && <span className="block text-[11px] text-slate-500 italic">{m.purpose}</span>}
                  </li>
                ))}
              </ul>
            </div>

            {/* Medical History */}
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
                RELEVANT MEDICAL HISTORY & ALLERGIES
              </h3>
              <ul className="space-y-1">
                {report.relevantMedicalHistory.map((item, idx) => (
                  <li key={idx} className="p-2 bg-slate-50 rounded border border-slate-200 text-slate-700">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* RECENT MEASUREMENTS */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1">
              RECENT MEASUREMENTS & VITALS
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {report.recentMeasurements.map((m, idx) => (
                <div key={idx} className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 font-semibold block">{m.metric}</span>
                  <span className="font-bold text-slate-900">{m.value}</span>
                  <span className="text-[10px] text-slate-400 block">{m.date}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QUESTIONS / CONCERNS FOR CLINICIAN */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-teal-800 border-b border-teal-200 pb-1">
              POINTS / QUESTIONS FOR CLINICAL DISCUSSION
            </h3>
            <div className="bg-teal-50/40 p-3 rounded-lg border border-teal-200/80 space-y-1 text-xs">
              {report.clinicianQuestions.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2">
                  <span className="font-bold text-teal-700">•</span>
                  <span className="text-slate-800 leading-relaxed font-medium">{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* SAFETY ALERTS (IF ANY) */}
          {report.safetyAlerts.length > 0 && (
            <div className="space-y-1.5">
              <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-800 border-b border-rose-200 pb-1">
                SAFETY PROMPTS LOGGED DURING PERIOD
              </h3>
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-lg text-xs space-y-1 text-rose-950">
                {report.safetyAlerts.map((a, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>{a.date}: </strong> {a.note}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clinician Signature & Formal Disclaimer Footer */}
          <div className="border-t border-slate-200 pt-4 space-y-3 text-[11px] text-slate-500">
            <div className="flex justify-between items-end gap-4">
              <div className="space-y-1 max-w-md">
                <strong>CLINICAL REPORTING DISCLAIMER:</strong>
                <p className="leading-snug">
                  This summary is synthesized exclusively from patient-reported entries, device-recorded inputs, and statistical calculations. It does NOT contain machine-generated diagnoses or treatment recommendations. The attending physician remains solely responsible for clinical evaluation, diagnostic judgment, and treatment orders.
                </p>
              </div>
              <div className="w-48 border-t border-slate-400 pt-1 text-center">
                <span>Physician Review / Notes</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FolderHeart,
  Plus,
  FileText,
  UserCheck,
  Sparkles,
  Calendar,
  Building,
  Upload,
  X,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';
import { DoctorVisit, MedicalRecordItem } from '../../types';
import { AIService } from '../../services/aiService';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';

interface Props {
  medicalRecords: MedicalRecordItem[];
  doctorVisits: DoctorVisit[];
  onAddRecord: (record: MedicalRecordItem) => void;
  onAddDoctorVisit: (visit: DoctorVisit) => void;
}

export const MedicalRecordsView: React.FC<Props> = ({
  medicalRecords,
  doctorVisits,
  onAddRecord,
  onAddDoctorVisit,
}) => {
  const [activeTab, setActiveTab] = useState<'records' | 'visits'>('records');
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [isAddVisitOpen, setIsAddVisitOpen] = useState(false);

  // New Record state
  const [recTitle, setRecTitle] = useState('');
  const [recProvider, setRecProvider] = useState('');
  const [recCategory, setRecCategory] = useState<'lab_report' | 'prescription' | 'doctor_notes' | 'imaging' | 'treatment'>('lab_report');
  const [recNotes, setRecNotes] = useState('');
  const [recSummary, setRecSummary] = useState('');
  const [isGeneratingAiSummary, setIsGeneratingAiSummary] = useState(false);

  // New Visit state
  const [docName, setDocName] = useState('');
  const [docSpecialty, setDocSpecialty] = useState('');
  const [docClinic, setDocClinic] = useState('');
  const [docReason, setDocReason] = useState('');
  const [docDiscussion, setDocDiscussion] = useState('');
  const [docNextSteps, setDocNextSteps] = useState('');

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitle.trim()) return;

    let aiSummary = recSummary;
    if (!aiSummary && recNotes.trim()) {
      setIsGeneratingAiSummary(true);
      try {
        aiSummary = await AIService.summarizeRecord(recTitle, recCategory, recProvider, recNotes);
      } catch (err) {
        console.error('Error generating summary:', err);
      } finally {
        setIsGeneratingAiSummary(false);
      }
    }

    const newRecord: MedicalRecordItem = {
      id: `rec-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      providerOrClinic: recProvider || 'Healthcare Provider',
      category: recCategory,
      title: recTitle,
      userNotes: recNotes,
      documentSummary: aiSummary || undefined,
      isAiSummary: !!aiSummary,
      fileName: `${recTitle.replace(/\s+/g, '_')}.pdf`,
    };

    onAddRecord(newRecord);
    setIsAddRecordOpen(false);
    setRecTitle('');
    setRecProvider('');
    setRecNotes('');
    setRecSummary('');
  };

  const handleCreateVisit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docName.trim()) return;

    const newVisit: DoctorVisit = {
      id: `visit-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      doctorName: docName,
      specialty: docSpecialty || 'General Practitioner',
      clinic: docClinic || 'Clinical Center',
      reasonForVisit: docReason,
      keyDiscussionNotes: docDiscussion,
      nextSteps: docNextSteps,
    };

    onAddDoctorVisit(newVisit);
    setIsAddVisitOpen(false);
    setDocName('');
    setDocSpecialty('');
    setDocClinic('');
    setDocReason('');
    setDocDiscussion('');
    setDocNextSteps('');
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Medical Records & Consultations</h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Secure personal archive of lab reports, physician consultation notes, and clinical visits
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'records' ? (
            <button
              onClick={() => setIsAddRecordOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Document / Lab</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAddVisitOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Log Doctor Visit</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('records')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'records'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Medical Documents & Labs ({medicalRecords.length})
        </button>
        <button
          onClick={() => setActiveTab('visits')}
          className={`pb-3 px-4 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
            activeTab === 'visits'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Doctor Visits & Consultations ({doctorVisits.length})
        </button>
      </div>

      {/* TAB 1: Medical Records */}
      {activeTab === 'records' && (
        <div className="space-y-4">
          {medicalRecords.length > 0 ? (
            medicalRecords.map((rec) => (
              <div
                key={rec.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-500">{rec.date}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                        {rec.category.replace('_', ' ')}
                      </span>
                      {rec.fileName && (
                        <span className="text-[11px] text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-400" />
                          {rec.fileName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{rec.title}</h3>
                    <p className="text-xs text-slate-600 font-medium">{rec.providerOrClinic}</p>
                  </div>
                </div>

                {rec.userNotes && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="text-slate-500 block mb-0.5">Patient Notes:</strong>
                    {rec.userNotes}
                  </p>
                )}

                {rec.documentSummary && (
                  <div className="p-3.5 bg-blue-50/60 border border-blue-200/80 rounded-xl space-y-1.5 text-xs">
                    <div className="flex items-center justify-between text-blue-900 font-bold">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>Document Key Content Summary</span>
                      </div>
                      <DataProvenanceBadge type="ai_observation" />
                    </div>
                    <p className="text-slate-800 leading-relaxed">{rec.documentSummary}</p>
                    <p className="text-[10px] text-blue-800/80 pt-1 border-t border-blue-200/50">
                      <strong>Clinical Neutrality Notice:</strong> Summary transcribes recorded document content and stated laboratory reference ranges. It does not independently evaluate normal vs abnormal status.
                    </p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <FolderHeart className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700">No medical records stored yet.</p>
              <p className="text-xs text-slate-400 mt-1">
                Store lab reports, blood panels, or doctor notes for quick reference.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Doctor Visits */}
      {activeTab === 'visits' && (
        <div className="space-y-4">
          {doctorVisits.length > 0 ? (
            doctorVisits.map((visit) => (
              <div
                key={visit.id}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-500">{visit.date}</span>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200/60">
                        Consultation
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{visit.doctorName}</h3>
                    <p className="text-xs text-slate-600 font-medium">
                      {visit.specialty} · {visit.clinic}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="block text-slate-500 font-semibold mb-1">Reason for Visit:</strong>
                    <p className="text-slate-800">{visit.reasonForVisit}</p>
                  </div>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <strong className="block text-slate-500 font-semibold mb-1">Next Steps / Plan:</strong>
                    <p className="text-slate-800">{visit.nextSteps}</p>
                  </div>
                </div>

                {visit.keyDiscussionNotes && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    <strong className="block text-slate-500 font-semibold mb-1">Discussion Notes:</strong>
                    <p className="text-slate-700 leading-relaxed">{visit.keyDiscussionNotes}</p>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500">
              <UserCheck className="w-8 h-8 mx-auto text-slate-400 mb-2" />
              <p className="font-semibold text-slate-700">No doctor visits logged yet.</p>
              <p className="text-xs text-slate-400 mt-1">Record doctor consultations and agreed next steps.</p>
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Medical Record */}
      {isAddRecordOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Add Medical Document / Lab</h3>
              <button onClick={() => setIsAddRecordOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRecord} className="p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  value={recTitle}
                  onChange={(e) => setRecTitle(e.target.value)}
                  placeholder="e.g. Complete Blood Count & Ferritin Panel"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={recCategory}
                    onChange={(e) => setRecCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="lab_report">Lab Report</option>
                    <option value="doctor_notes">Doctor Note</option>
                    <option value="prescription">Prescription</option>
                    <option value="imaging">Imaging (X-Ray, MRI)</option>
                    <option value="treatment">Treatment Summary</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Provider / Clinic</label>
                  <input
                    type="text"
                    value={recProvider}
                    onChange={(e) => setRecProvider(e.target.value)}
                    placeholder="e.g. Apex Diagnostics"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Key Results / Clinical Notes</label>
                <textarea
                  rows={3}
                  value={recNotes}
                  onChange={(e) => setRecNotes(e.target.value)}
                  placeholder="e.g. Hemoglobin 14.8, HbA1c 5.4%, normal liver enzymes."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                disabled={isGeneratingAiSummary}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm cursor-pointer transition-colors"
              >
                {isGeneratingAiSummary ? 'Generating summary...' : 'Save Document Record'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Doctor Visit */}
      {isAddVisitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-base font-bold text-slate-900">Log Doctor Visit</h3>
              <button onClick={() => setIsAddVisitOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVisit} className="p-5 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Doctor Name</label>
                  <input
                    type="text"
                    required
                    value={docName}
                    onChange={(e) => setDocName(e.target.value)}
                    placeholder="e.g. Dr. Ananya Sen"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Specialty</label>
                  <input
                    type="text"
                    value={docSpecialty}
                    onChange={(e) => setDocSpecialty(e.target.value)}
                    placeholder="e.g. Internal Medicine"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Clinic / Hospital</label>
                <input
                  type="text"
                  value={docClinic}
                  onChange={(e) => setDocClinic(e.target.value)}
                  placeholder="e.g. City Health Medical Center"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reason for Visit</label>
                <input
                  type="text"
                  value={docReason}
                  onChange={(e) => setDocReason(e.target.value)}
                  placeholder="e.g. Recurring temple headaches and fatigue review"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Discussion & Next Steps</label>
                <textarea
                  rows={3}
                  value={docDiscussion}
                  onChange={(e) => setDocDiscussion(e.target.value)}
                  placeholder="e.g. Advised keeping symptom log, check blood pressure, review in 3 months."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold shadow-sm cursor-pointer transition-colors"
              >
                Save Doctor Visit
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

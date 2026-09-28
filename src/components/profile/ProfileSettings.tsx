/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  User,
  Shield,
  Download,
  Upload,
  Trash2,
  RefreshCw,
  Plus,
  X,
  Check,
  Heart,
  Moon,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { MetricKey, UserProfile, UserReportedConcern } from '../../types';
import { StorageService } from '../../services/storageService';
import { ExportService } from '../../services/exportService';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface Props {
  profile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onResetDemoData: () => void;
  onClearAllData: () => void;
}

export const ProfileSettings: React.FC<Props> = ({
  profile,
  onSaveProfile,
  onResetDemoData,
  onClearAllData,
}) => {
  const [formData, setFormData] = useState<UserProfile>(profile);
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);

  const ALL_METRICS: Array<{ key: MetricKey; label: string }> = [
    { key: 'energy', label: 'Daily Energy Level (0-10)' },
    { key: 'mood', label: 'Mood (Calm, Good, Neutral, Low)' },
    { key: 'stress', label: 'Daily Stress (0-10)' },
    { key: 'hydration', label: 'Water / Hydration (Glasses)' },
    { key: 'temperature', label: 'Body Temperature (°C / °F)' },
    { key: 'weight', label: 'Body Weight (kg / lbs)' },
    { key: 'blood_pressure', label: 'Blood Pressure (mmHg)' },
    { key: 'heart_rate', label: 'Resting Heart Rate (bpm)' },
  ];

  const handleToggleMetric = (metricKey: MetricKey) => {
    const current = formData.trackedMetrics || [];
    let updated: MetricKey[];
    if (current.includes(metricKey)) {
      updated = current.filter((m) => m !== metricKey);
    } else {
      updated = [...current, metricKey];
    }
    const updatedProfile = { ...formData, trackedMetrics: updated };
    setFormData(updatedProfile);
    onSaveProfile(updatedProfile);
  };

  const handleAddCondition = () => {
    if (!newCondition.trim()) return;
    const updated = { ...formData, conditions: [...formData.conditions, newCondition.trim()] };
    setFormData(updated);
    onSaveProfile(updated);
    setNewCondition('');
  };

  const handleRemoveCondition = (index: number) => {
    const updated = { ...formData, conditions: formData.conditions.filter((_, i) => i !== index) };
    setFormData(updated);
    onSaveProfile(updated);
  };

  const handleAddAllergy = () => {
    if (!newAllergy.trim()) return;
    const updated = { ...formData, allergies: [...formData.allergies, newAllergy.trim()] };
    setFormData(updated);
    onSaveProfile(updated);
    setNewAllergy('');
  };

  const handleRemoveAllergy = (index: number) => {
    const updated = { ...formData, allergies: formData.allergies.filter((_, i) => i !== index) };
    setFormData(updated);
    onSaveProfile(updated);
  };

  const handleSaveBasic = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleAddConcern = (text: string) => {
    if (!text.trim()) return;
    const newConcern: UserReportedConcern = {
      id: `concern-${Date.now()}`,
      text: text.trim(),
      dateAdded: new Date().toISOString().split('T')[0],
      status: 'unconfirmed_user_concern',
      notes: 'User-reported suspicion; unconfirmed by formal diagnostic testing.',
    };
    const updated = {
      ...formData,
      userReportedConcerns: [...(formData.userReportedConcerns || []), newConcern],
    };
    setFormData(updated);
    onSaveProfile(updated);
  };

  const handleRemoveConcern = (id: string) => {
    const updated = {
      ...formData,
      userReportedConcerns: (formData.userReportedConcerns || []).filter((c) => c.id !== id),
    };
    setFormData(updated);
    onSaveProfile(updated);
  };

  const [newConcernText, setNewConcernText] = useState('');

  const handleExportJSON = () => {
    ExportService.exportJSON();
  };

  const handleExportCSV = () => {
    ExportService.exportCSV();
  };

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const ok = StorageService.importDataJSON(content);
        if (ok) {
          window.location.reload();
        } else {
          alert('Could not parse JSON health record file. Please ensure it is a valid Ishara backup.');
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-24 max-w-4xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Health Profile & Settings</h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Personal demographics, medical background, tracked metrics customization, and privacy controls
        </p>
      </div>

      {/* 1. Basic Info Form */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-teal-600" />
            <h3 className="text-sm font-bold text-slate-900">Personal Information</h3>
          </div>
          {saveSuccess && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
        </div>

        <form onSubmit={handleSaveBasic} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Biological Sex</label>
              <select
                value={formData.sex}
                onChange={(e) => setFormData({ ...formData, sex: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="intersex">Intersex</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Country (For Emergency Triage)</label>
              <select
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              >
                <option value="IN">India (Emergency: 112)</option>
                <option value="US">United States (Emergency: 911)</option>
                <option value="UK">United Kingdom (Emergency: 999)</option>
                <option value="CA">Canada (Emergency: 911)</option>
                <option value="AU">Australia (Emergency: 000)</option>
                <option value="EU">European Union (Emergency: 112)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Emergency Contact Phone</label>
              <input
                type="text"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                placeholder="+1 555 123 4567"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer"
          >
            Save Information
          </button>
        </form>
      </div>

      {/* 2. Medical Conditions & Allergies */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Conditions */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900">Known Medical Conditions</h3>
          <p className="text-[11px] text-slate-500">Helps contextualize doctor report outputs</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newCondition}
              onChange={(e) => setNewCondition(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCondition())}
              placeholder="e.g. Hypertension, Migraine"
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
            <button
              onClick={handleAddCondition}
              className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 cursor-pointer"
            >
              Add
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            {formData.conditions.map((cond, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span className="font-medium text-slate-800">{cond}</span>
                <button
                  onClick={() => handleRemoveCondition(idx)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Allergies */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-slate-900">Known Allergies</h3>
          <p className="text-[11px] text-slate-500">Medication or environmental allergies</p>

          <div className="flex gap-2">
            <input
              type="text"
              value={newAllergy}
              onChange={(e) => setNewAllergy(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAllergy())}
              placeholder="e.g. Penicillin, Peanuts"
              className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
            <button
              onClick={handleAddAllergy}
              className="px-3 py-1.5 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-900 cursor-pointer"
            >
              Add
            </button>
          </div>

          <div className="space-y-1.5 pt-1">
            {formData.allergies.map((allergy, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2 bg-slate-50 rounded-lg border border-slate-200"
              >
                <span className="font-medium text-slate-800">{allergy}</span>
                <button
                  onClick={() => handleRemoveAllergy(idx)}
                  className="text-slate-400 hover:text-rose-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2.5 Unconfirmed User Concerns (Explicitly NOT Medical Diagnoses) */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">Unconfirmed User-Reported Concerns</h3>
              <DataProvenanceBadge type="user_fact" />
            </div>
            <p className="text-[11px] text-slate-500">
              Personal suspicions or triggers to discuss with your doctor. Strictly labeled as unconfirmed.
            </p>
          </div>
        </div>

        <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-start gap-2 text-amber-900 text-xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Medical Principle:</strong> Suspicions (e.g. "I think it might be tension headaches" or "suspected allergy") are stored as personal questions for your clinician, never converted into a medical diagnosis.
          </p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={newConcernText}
            onChange={(e) => setNewConcernText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddConcern(newConcernText);
                setNewConcernText('');
              }
            }}
            placeholder="e.g. Wonder if headaches relate to screen glare or hydration"
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
          />
          <button
            type="button"
            onClick={() => {
              handleAddConcern(newConcernText);
              setNewConcernText('');
            }}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-semibold cursor-pointer"
          >
            Add Concern
          </button>
        </div>

        <div className="space-y-2 pt-1">
          {(formData.userReportedConcerns || []).length === 0 ? (
            <p className="text-slate-400 text-xs italic">No personal unconfirmed concerns currently recorded.</p>
          ) : (
            (formData.userReportedConcerns || []).map((concern) => (
              <div
                key={concern.id}
                className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3"
              >
                <div>
                  <span className="font-semibold text-slate-900 block">{concern.text}</span>
                  <span className="text-[10px] text-amber-800 bg-amber-100/70 px-1.5 py-0.5 rounded font-mono font-medium mt-1 inline-block">
                    UNCONFIRMED CONCERN · {concern.dateAdded}
                  </span>
                  {concern.notes && (
                    <p className="text-[11px] text-slate-500 mt-1">{concern.notes}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveConcern(concern.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Customizable Tracked Metrics */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-3 text-xs">
        <div>
          <h3 className="text-sm font-bold text-slate-900">Customizable Health Metrics</h3>
          <p className="text-[11px] text-slate-500">
            Choose which metrics you want displayed on your dashboard and check-ins
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {ALL_METRICS.map((metric) => {
            const isChecked = (formData.trackedMetrics || []).includes(metric.key);
            return (
              <label
                key={metric.key}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isChecked ? 'bg-teal-50/50 border-teal-300 text-teal-950' : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <span className="font-semibold">{metric.label}</span>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleToggleMetric(metric.key)}
                  className="rounded text-teal-600 focus:ring-teal-500 w-4 h-4 cursor-pointer"
                />
              </label>
            );
          })}
        </div>
      </div>

      {/* PWA App Installation Option */}
      <PWAInstallButton variant="card" />

      {/* 4. Privacy & Data Ownership */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 text-slate-900">
          <Lock className="w-4 h-4 text-teal-600" />
          <h3 className="text-sm font-bold">Privacy & Data Management</h3>
        </div>

        <p className="text-slate-600 leading-relaxed">
          Ishara adheres to strict privacy-first architecture. All health logs, sleep records, and clinical entries remain stored locally in your browser storage. No health information is ever exposed in URLs or sold to third parties.
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100">
          <button
            onClick={handleExportJSON}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export All Data (JSON)</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Symptoms (CSV)</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportFile}
            accept=".json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-teal-900 border border-teal-200 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-teal-700" />
            <span>Import Backup (JSON)</span>
          </button>

          <button
            onClick={onResetDemoData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-lg font-semibold transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Demo Data</span>
          </button>

          <button
            onClick={onClearAllData}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg font-semibold transition-colors cursor-pointer ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete All Health Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};

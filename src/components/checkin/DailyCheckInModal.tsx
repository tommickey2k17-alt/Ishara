/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, CalendarCheck, Check, Sparkles } from 'lucide-react';
import { DailyCheckIn, SleepQuality } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveCheckIn: (checkIn: DailyCheckIn) => void;
  existingCheckIn?: DailyCheckIn;
}

export const DailyCheckInModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveCheckIn,
  existingCheckIn,
}) => {
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>(existingCheckIn?.sleepQuality || 'good');
  const [sleepHours, setSleepHours] = useState<number>(existingCheckIn?.sleepHours || 7.5);
  const [energyLevel, setEnergyLevel] = useState<number>(existingCheckIn?.energyLevel || 7);
  const [moodLevel, setMoodLevel] = useState<'low' | 'neutral' | 'calm' | 'good' | 'elevated'>(
    existingCheckIn?.moodLevel || 'calm'
  );
  const [stressLevel, setStressLevel] = useState<number>(existingCheckIn?.stressLevel || 4);
  const [newSymptoms, setNewSymptoms] = useState<boolean>(existingCheckIn?.newSymptoms || false);
  const [newSymptomsNotes, setNewSymptomsNotes] = useState<string>(existingCheckIn?.newSymptomsNotes || '');
  const [symptomsWorse, setSymptomsWorse] = useState<boolean>(existingCheckIn?.symptomsWorse || false);
  const [symptomsWorseNotes, setSymptomsWorseNotes] = useState<string>(existingCheckIn?.symptomsWorseNotes || '');
  const [takenMedications, setTakenMedications] = useState<boolean>(
    existingCheckIn?.takenRegularMedications ?? true
  );
  const [unusualNotes, setUnusualNotes] = useState<string>(existingCheckIn?.unusualEventsNotes || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const checkIn: DailyCheckIn = {
      id: existingCheckIn?.id || `checkin-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      sleepQuality,
      sleepHours,
      energyLevel,
      moodLevel,
      stressLevel,
      newSymptoms,
      newSymptomsNotes: newSymptoms ? newSymptomsNotes : undefined,
      symptomsWorse,
      symptomsWorseNotes: symptomsWorse ? symptomsWorseNotes : undefined,
      takenRegularMedications: takenMedications,
      unusualEventsNotes: unusualNotes || undefined,
    };
    onSaveCheckIn(checkIn);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">30-Second Daily Check-in</h2>
              <p className="text-xs text-slate-500">Fast snapshot of your health status today</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* 1. Sleep Quality */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">1. How did you sleep last night?</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { val: 'poor', label: '😴 Poor' },
                { val: 'okay', label: '😐 Okay' },
                { val: 'good', label: '🙂 Good' },
                { val: 'excellent', label: '🌟 Excellent' },
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.val}
                  onClick={() => setSleepQuality(opt.val as SleepQuality)}
                  className={`py-2 px-2 text-center rounded-lg border font-medium transition-all cursor-pointer ${
                    sleepQuality === opt.val
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Energy Level Slider */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">2. Energy Level Today:</label>
              <span className="font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                {energyLevel} / 10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value, 10))}
              className="w-full accent-teal-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 (Exhausted)</span>
              <span>5 (Moderate)</span>
              <span>10 (Energetic)</span>
            </div>
          </div>

          {/* 3. Mood Level */}
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-700 block">3. Mood Today:</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[
                { val: 'low', label: 'Low' },
                { val: 'neutral', label: 'Neutral' },
                { val: 'calm', label: 'Calm' },
                { val: 'good', label: 'Good' },
                { val: 'elevated', label: 'Elevated' },
              ].map((m) => (
                <button
                  type="button"
                  key={m.val}
                  onClick={() => setMoodLevel(m.val as any)}
                  className={`py-1.5 px-1 text-center rounded-lg border capitalize font-medium transition-all cursor-pointer ${
                    moodLevel === m.val
                      ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Stress Level Slider */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex justify-between items-center">
              <label className="font-semibold text-slate-700">4. Stress Level:</label>
              <span className="font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                {stressLevel} / 10
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="10"
              value={stressLevel}
              onChange={(e) => setStressLevel(parseInt(e.target.value, 10))}
              className="w-full accent-amber-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0 (Peaceful)</span>
              <span>5 (Manageable)</span>
              <span>10 (Overwhelming)</span>
            </div>
          </div>

          {/* 5. Any New Symptoms? */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">5. Any new symptoms since yesterday?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setNewSymptoms(false)}
                  className={`px-3 py-1 rounded-lg border text-xs cursor-pointer ${
                    !newSymptoms ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setNewSymptoms(true)}
                  className={`px-3 py-1 rounded-lg border text-xs cursor-pointer ${
                    newSymptoms ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
            {newSymptoms && (
              <input
                type="text"
                value={newSymptomsNotes}
                onChange={(e) => setNewSymptomsNotes(e.target.value)}
                placeholder="What new symptom did you notice?"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            )}
          </div>

          {/* 6. Any Symptoms Worse? */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-700">6. Any existing symptoms worse than yesterday?</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSymptomsWorse(false)}
                  className={`px-3 py-1 rounded-lg border text-xs cursor-pointer ${
                    !symptomsWorse ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setSymptomsWorse(true)}
                  className={`px-3 py-1 rounded-lg border text-xs cursor-pointer ${
                    symptomsWorse ? 'bg-amber-600 text-white font-semibold' : 'bg-slate-50 text-slate-700'
                  }`}
                >
                  Yes
                </button>
              </div>
            </div>
            {symptomsWorse && (
              <input
                type="text"
                value={symptomsWorseNotes}
                onChange={(e) => setSymptomsWorseNotes(e.target.value)}
                placeholder="Which symptom got worse and how?"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
              />
            )}
          </div>

          {/* 7. Medications Taken */}
          <div className="flex items-center justify-between pt-1">
            <label className="font-semibold text-slate-700">7. Did you take your scheduled medications?</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTakenMedications(true)}
                className={`px-3 py-1 rounded-lg border text-xs cursor-pointer ${
                  takenMedications ? 'bg-teal-600 text-white font-semibold' : 'bg-slate-50 text-slate-700'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setTakenMedications(false)}
                className={`px-3 py-1 rounded-lg border text-xs cursor-pointer ${
                  !takenMedications ? 'bg-rose-600 text-white font-semibold' : 'bg-slate-50 text-slate-700'
                }`}
              >
                Missed / Partial
              </button>
            </div>
          </div>

          {/* 8. Anything Unusual */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">8. Anything unusual today? (Optional)</label>
            <input
              type="text"
              value={unusualNotes}
              onChange={(e) => setUnusualNotes(e.target.value)}
              placeholder="e.g. Skipped lunch, heavy workout, flight travel"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Today's Check-in</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

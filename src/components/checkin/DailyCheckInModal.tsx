/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { X, CalendarCheck, Check, Heart, Scale, Thermometer, AlertCircle } from 'lucide-react';
import { DailyCheckIn, MeasurementRecord, SleepQuality } from '../../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveCheckIn: (
    checkIn: DailyCheckIn,
    vitals?: {
      systolic?: number;
      diastolic?: number;
      weight?: number;
      temperature?: number;
    }
  ) => void;
  existingCheckIn?: DailyCheckIn;
  todayMeasurements?: {
    bloodPressure?: MeasurementRecord;
    weight?: MeasurementRecord;
    temperature?: MeasurementRecord;
  };
}

export const DailyCheckInModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveCheckIn,
  existingCheckIn,
  todayMeasurements,
}) => {
  // Existing subjective check-in states
  const [sleepQuality, setSleepQuality] = useState<SleepQuality>('good');
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [energyLevel, setEnergyLevel] = useState<number>(7);
  const [moodLevel, setMoodLevel] = useState<'low' | 'neutral' | 'calm' | 'good' | 'elevated'>('calm');
  const [stressLevel, setStressLevel] = useState<number>(4);
  const [newSymptoms, setNewSymptoms] = useState<boolean>(false);
  const [newSymptomsNotes, setNewSymptomsNotes] = useState<string>('');
  const [symptomsWorse, setSymptomsWorse] = useState<boolean>(false);
  const [symptomsWorseNotes, setSymptomsWorseNotes] = useState<string>('');
  const [takenMedications, setTakenMedications] = useState<boolean>(true);
  const [unusualNotes, setUnusualNotes] = useState<string>('');

  // Editable Vitals / Measurements states
  const [systolicBP, setSystolicBP] = useState<string>('');
  const [diastolicBP, setDiastolicBP] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [temperature, setTemperature] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<{
    bp?: string;
    weight?: string;
    temperature?: string;
  }>({});

  // Synchronize and pre-fill saved values whenever modal opens or existing data updates
  useEffect(() => {
    if (isOpen) {
      setSleepQuality(existingCheckIn?.sleepQuality || 'good');
      setSleepHours(existingCheckIn?.sleepHours !== undefined ? existingCheckIn.sleepHours : 7.5);
      setEnergyLevel(existingCheckIn?.energyLevel !== undefined ? existingCheckIn.energyLevel : 7);
      setMoodLevel(existingCheckIn?.moodLevel || 'calm');
      setStressLevel(existingCheckIn?.stressLevel !== undefined ? existingCheckIn.stressLevel : 4);
      setNewSymptoms(existingCheckIn?.newSymptoms || false);
      setNewSymptomsNotes(existingCheckIn?.newSymptomsNotes || '');
      setSymptomsWorse(existingCheckIn?.symptomsWorse || false);
      setSymptomsWorseNotes(existingCheckIn?.symptomsWorseNotes || '');
      setTakenMedications(existingCheckIn?.takenRegularMedications ?? true);
      setUnusualNotes(existingCheckIn?.unusualEventsNotes || '');

      // Parse and pre-fill Blood Pressure
      let prefilledSys = '';
      let prefilledDia = '';
      if (todayMeasurements?.bloodPressure?.value) {
        const parts = String(todayMeasurements.bloodPressure.value).split('/');
        if (parts.length === 2) {
          prefilledSys = parts[0].trim();
          prefilledDia = parts[1].trim();
        }
      } else if (existingCheckIn?.bloodPressure) {
        const parts = existingCheckIn.bloodPressure.split('/');
        if (parts.length === 2) {
          prefilledSys = parts[0].trim();
          prefilledDia = parts[1].trim();
        }
      } else if (existingCheckIn?.systolicBP && existingCheckIn?.diastolicBP) {
        prefilledSys = String(existingCheckIn.systolicBP);
        prefilledDia = String(existingCheckIn.diastolicBP);
      }
      setSystolicBP(prefilledSys);
      setDiastolicBP(prefilledDia);

      // Parse and pre-fill Weight
      let prefilledWeight = '';
      if (todayMeasurements?.weight?.value !== undefined) {
        prefilledWeight = String(todayMeasurements.weight.value);
      } else if (existingCheckIn?.weight !== undefined) {
        prefilledWeight = String(existingCheckIn.weight);
      }
      setWeight(prefilledWeight);

      // Parse and pre-fill Temperature
      let prefilledTemp = '';
      if (todayMeasurements?.temperature?.value !== undefined) {
        prefilledTemp = String(todayMeasurements.temperature.value);
      } else if (existingCheckIn?.temperature !== undefined) {
        prefilledTemp = String(existingCheckIn.temperature);
      }
      setTemperature(prefilledTemp);

      setValidationErrors({});
    }
  }, [isOpen, existingCheckIn, todayMeasurements]);

  if (!isOpen) return null;

  const validateInputs = (): boolean => {
    const errors: { bp?: string; weight?: string; temperature?: string } = {};

    // 1. Blood Pressure Validation
    const hasSys = systolicBP.trim().length > 0;
    const hasDia = diastolicBP.trim().length > 0;

    if (hasSys || hasDia) {
      if (!hasSys || !hasDia) {
        errors.bp = 'Please enter both systolic and diastolic values (e.g. 120 and 80).';
      } else {
        const sysNum = Number(systolicBP.trim());
        const diaNum = Number(diastolicBP.trim());

        if (isNaN(sysNum) || sysNum < 60 || sysNum > 260) {
          errors.bp = 'Systolic pressure should be a valid number between 60 and 260 mmHg.';
        } else if (isNaN(diaNum) || diaNum < 40 || diaNum > 160) {
          errors.bp = 'Diastolic pressure should be a valid number between 40 and 160 mmHg.';
        } else if (sysNum <= diaNum) {
          errors.bp = 'Systolic pressure must be greater than diastolic pressure.';
        }
      }
    }

    // 2. Weight Validation
    if (weight.trim().length > 0) {
      const wtNum = Number(weight.trim());
      if (isNaN(wtNum) || wtNum < 20 || wtNum > 350) {
        errors.weight = 'Please enter a valid weight between 20 kg and 350 kg.';
      }
    }

    // 3. Temperature Validation
    if (temperature.trim().length > 0) {
      const tempNum = Number(temperature.trim());
      if (isNaN(tempNum) || tempNum < 32 || tempNum > 44) {
        errors.temperature = 'Please enter a realistic body temperature between 32°C and 44°C.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateInputs()) {
      return;
    }

    const sysNum = systolicBP.trim() ? Number(systolicBP.trim()) : undefined;
    const diaNum = diastolicBP.trim() ? Number(diastolicBP.trim()) : undefined;
    const wtNum = weight.trim() ? Number(weight.trim()) : undefined;
    const tempNum = temperature.trim() ? Number(temperature.trim()) : undefined;

    const bpString = sysNum && diaNum ? `${sysNum}/${diaNum}` : undefined;
    const todayDate = new Date().toISOString().split('T')[0];

    const checkIn: DailyCheckIn = {
      id: existingCheckIn?.id || `checkin-${todayDate}`,
      date: todayDate,
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
      bloodPressure: bpString,
      systolicBP: sysNum,
      diastolicBP: diaNum,
      weight: wtNum,
      temperature: tempNum,
    };

    onSaveCheckIn(checkIn, {
      systolic: sysNum,
      diastolic: diaNum,
      weight: wtNum,
      temperature: tempNum,
    });

    onClose();
  };

  const isUpdating =
    !!existingCheckIn ||
    !!todayMeasurements?.bloodPressure ||
    !!todayMeasurements?.weight ||
    !!todayMeasurements?.temperature;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                {isUpdating ? "Update Today's Check-in" : "Today's Health Check-in"}
              </h2>
              <p className="text-xs text-slate-500">
                {isUpdating
                  ? 'Edit your readings or daily wellness ratings for today'
                  : "A quick 30-second check on your vitals and how you're feeling today"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {/* SECTION: Vitals & Body Measurements (Prominent & Editable) */}
          <div className="bg-teal-50/50 border border-teal-200/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
              <div className="flex items-center gap-1.5 text-teal-900 font-bold">
                <Heart className="w-4 h-4 text-teal-700" />
                <span>Today's Vitals & Measurements</span>
              </div>
              <span className="text-[10px] font-semibold text-teal-800 bg-teal-100/80 px-2 py-0.5 rounded-md">
                Syncs to Trends & Timeline
              </span>
            </div>

            {/* 1. Blood Pressure: Separate Systolic & Diastolic */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-700 flex items-center justify-between">
                <span>Blood Pressure</span>
                <span className="text-[10px] text-slate-400 font-normal">Standard format: Systolic / Diastolic</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="60"
                      max="260"
                      placeholder="120"
                      value={systolicBP}
                      onChange={(e) => {
                        setSystolicBP(e.target.value);
                        if (validationErrors.bp) setValidationErrors((prev) => ({ ...prev, bp: undefined }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">SYS</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Systolic (mmHg)</span>
                </div>

                <div>
                  <div className="relative">
                    <input
                      type="number"
                      step="1"
                      min="40"
                      max="160"
                      placeholder="80"
                      value={diastolicBP}
                      onChange={(e) => {
                        setDiastolicBP(e.target.value);
                        if (validationErrors.bp) setValidationErrors((prev) => ({ ...prev, bp: undefined }));
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                    />
                    <span className="absolute right-2.5 top-2 text-[10px] text-slate-400 font-mono">DIA</span>
                  </div>
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Diastolic (mmHg)</span>
                </div>
              </div>

              {validationErrors.bp && (
                <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationErrors.bp}</span>
                </div>
              )}
            </div>

            {/* 2. Weight & Temperature in a 2-column grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Weight */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Scale className="w-3.5 h-3.5 text-teal-700" />
                  <span>Weight</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="20"
                    max="350"
                    placeholder="74.5"
                    value={weight}
                    onChange={(e) => {
                      setWeight(e.target.value);
                      if (validationErrors.weight) setValidationErrors((prev) => ({ ...prev, weight: undefined }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-500 font-medium">kg</span>
                </div>
                {validationErrors.weight && (
                  <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationErrors.weight}</span>
                  </div>
                )}
              </div>

              {/* Temperature */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Thermometer className="w-3.5 h-3.5 text-orange-600" />
                  <span>Temperature</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="32"
                    max="44"
                    placeholder="36.8"
                    value={temperature}
                    onChange={(e) => {
                      setTemperature(e.target.value);
                      if (validationErrors.temperature) setValidationErrors((prev) => ({ ...prev, temperature: undefined }));
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-2 text-[11px] text-slate-500 font-medium">°C</span>
                </div>
                {validationErrors.temperature && (
                  <div className="flex items-center gap-1 text-[11px] text-rose-600 mt-0.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{validationErrors.temperature}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* SECTION: Subjective Daily Health Questions */}

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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
            <label className="font-semibold text-slate-700">7. Did you take your regular medicines today?</label>
            <div className="flex gap-2 shrink-0">
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
                Missed or some
              </button>
            </div>
          </div>

          {/* 8. Anything Unusual */}
          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              8. Did anything unusual happen today? (Optional)
            </label>
            <input
              type="text"
              value={unusualNotes}
              onChange={(e) => setUnusualNotes(e.target.value)}
              placeholder="e.g. Skipped lunch, heavy workout, flight travel"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
            />
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{isUpdating ? "Update Today's Check-in" : "Save Today's Check-in"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sparkles,
  Stethoscope,
  Moon,
  Activity,
  Mic,
  MicOff,
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Zap,
} from 'lucide-react';
import {
  DailyCheckIn,
  MeasurementRecord,
  MedicationItem,
  SleepRecord,
  SymptomEpisode,
  UserProfile,
  ClinicalTriState,
} from '../../types';
import { AIService, NaturalLanguageParseResult } from '../../services/aiService';
import { DataProvenanceBadge } from '../common/DataProvenanceBadge';
import { TriStateSelector } from '../common/TriStateSelector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveSymptom?: (symptom: SymptomEpisode) => void;
  onStartSymptomIntake: (initialName?: string, draft?: Partial<SymptomEpisode>) => void;
  onSaveSleep: (sleep: SleepRecord) => void;
  onSaveMedication: (med: MedicationItem) => void;
  onSaveMeasurement: (meas: MeasurementRecord) => void;
  onSaveCheckIn: (checkIn: DailyCheckIn) => void;
  userProfile: UserProfile;
}

const COMMON_SYMPTOMS = [
  'Headache',
  'Fatigue',
  'Cough',
  'Stomach Ache',
  'Back Pain',
  'Nausea',
  'Sore Throat',
  'Dizziness',
  'Acid Reflux',
  'Muscle Ache',
  'Fever / Chills',
  'Shortness of Breath',
];

export const QuickLogModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveSymptom,
  onStartSymptomIntake,
  onSaveSleep,
  onSaveMedication,
  onSaveMeasurement,
  userProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'fast_symptom' | 'natural_voice' | 'sleep' | 'vitals' | 'medication'>('fast_symptom');

  // Fast 10-Second Symptom state
  const [selectedSymptom, setSelectedSymptom] = useState<string>('Headache');
  const [customSymptom, setCustomSymptom] = useState<string>('');
  const [fastSeverity, setFastSeverity] = useState<number>(5);
  const [fastOnset, setFastOnset] = useState<string>('Today morning');
  const [fastFever, setFastFever] = useState<ClinicalTriState>('not_recorded');
  const [isSubmittingFast, setIsSubmittingFast] = useState(false);

  // Natural Language & Voice state
  const [nlText, setNlText] = useState('');
  const [isParsingNl, setIsParsingNl] = useState(false);
  const [parsedResult, setParsedResult] = useState<NaturalLanguageParseResult | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Confirmation form fields (editable before explicit confirm)
  const [confirmName, setConfirmName] = useState('');
  const [confirmSeverity, setConfirmSeverity] = useState(5);
  const [confirmTiming, setConfirmTiming] = useState('Today');
  const [confirmLocation, setConfirmLocation] = useState('');
  const [confirmTriggers, setConfirmTriggers] = useState<string[]>([]);
  const [confirmRelief, setConfirmRelief] = useState<string[]>([]);
  const [confirmAssoc, setConfirmAssoc] = useState<string[]>([]);
  const [confirmFever, setConfirmFever] = useState<ClinicalTriState>('not_recorded');
  const [confirmPrior, setConfirmPrior] = useState<ClinicalTriState>('not_recorded');
  const [confirmEvaluated, setConfirmEvaluated] = useState<ClinicalTriState>('not_recorded');
  const [confirmSuspicion, setConfirmSuspicion] = useState<string>('');

  // Sleep state
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [sleepQuality, setSleepQuality] = useState<'poor' | 'okay' | 'good' | 'excellent'>('good');
  const [sleepNotes, setSleepNotes] = useState('');

  // Vitals state
  const [vitalType, setVitalType] = useState<'blood_pressure' | 'weight' | 'temperature' | 'heart_rate' | 'hydration'>('blood_pressure');
  const [vitalValue, setVitalValue] = useState('120/80');
  const [vitalNotes, setVitalNotes] = useState('');

  // Medication state
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medFrequency, setMedFrequency] = useState('Once daily');

  // Initialize Speech Recognition if supported
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        setNlText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setSpeechError('Microphone input interrupted. You can still type your symptoms directly.');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }
    };
  }, []);

  if (!isOpen) return null;

  const toggleVoiceRecording = () => {
    setSpeechError(null);
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser. Please type directly.');
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Failed to start speech recognition', err);
        setSpeechError('Could not access microphone. Please check permissions.');
        setIsListening(false);
      }
    }
  };

  // Ultra-Fast 10-Second Symptom Save
  const handleFastSymptomSave = () => {
    const symptomName = customSymptom.trim() || selectedSymptom;
    if (!symptomName) return;

    setIsSubmittingFast(true);
    const newEpisode: SymptomEpisode = {
      id: `symp-${Date.now()}`,
      symptomName,
      category: 'general',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      startTime: fastOnset,
      severity: fastSeverity,
      frequency: 'intermittent',
      duration: 'Ongoing',
      location: 'Reported during quick entry',
      characterDescription: 'Quick logged symptom episode',
      triggers: [],
      relievingFactors: [],
      associatedSymptoms: [],
      contextNotes: '',
      feverReported: fastFever,
      priorOccurrenceState: 'not_recorded',
      medicallyEvaluatedState: 'not_recorded',
      hasAssociatedSymptomsState: 'not_recorded',
      worseningProgressionState: 'not_recorded',
      isResolved: false,
      isRecurring: false,
      medicallyEvaluated: false,
      userNotes: 'Quick 10-second log entry',
    };

    if (onSaveSymptom) {
      onSaveSymptom(newEpisode);
    } else {
      onStartSymptomIntake(symptomName, newEpisode);
    }

    setTimeout(() => {
      setIsSubmittingFast(false);
      onClose();
    }, 150);
  };

  // Natural Language & Voice Parse
  const handleParseNaturalLanguage = async () => {
    if (!nlText.trim() || isParsingNl) return;
    setIsParsingNl(true);
    setSpeechError(null);
    try {
      const result = await AIService.parseNaturalLanguage(nlText, userProfile);
      setParsedResult(result);
      setConfirmName(result.symptomName || 'Symptom');
      setConfirmSeverity(result.severity ?? 5);
      setConfirmTiming(result.startTime || 'Today');
      setConfirmLocation(result.location || '');
      setConfirmTriggers(result.triggers || []);
      setConfirmRelief(result.relievingFactors || []);
      setConfirmAssoc(result.associatedSymptoms || []);
      setConfirmFever(result.feverReported || 'not_recorded');
      setConfirmPrior(result.priorOccurrenceState || 'not_recorded');
      setConfirmEvaluated(result.medicallyEvaluatedState || 'not_recorded');
      setConfirmSuspicion(result.userSuspicionOrConcern || '');
    } catch (err) {
      console.error('Error parsing text:', err);
    } finally {
      setIsParsingNl(false);
    }
  };

  // Explicit User Confirmation of Extracted Symptom
  const handleExplicitConfirmSave = () => {
    if (!confirmName) return;

    const newEpisode: SymptomEpisode = {
      id: `symp-${Date.now()}`,
      symptomName: confirmName,
      category: 'general',
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      startTime: confirmTiming,
      severity: confirmSeverity,
      frequency: 'intermittent',
      duration: 'Ongoing',
      location: confirmLocation || 'Unspecified location',
      characterDescription: parsedResult?.characterDescription || 'Logged via natural language extraction',
      triggers: confirmTriggers,
      relievingFactors: confirmRelief,
      associatedSymptoms: confirmAssoc,
      contextNotes: parsedResult?.contextNotes || '',
      feverReported: confirmFever,
      priorOccurrenceState: confirmPrior,
      medicallyEvaluatedState: confirmEvaluated,
      hasAssociatedSymptomsState: confirmAssoc.length > 0 ? 'yes' : 'not_recorded',
      worseningProgressionState: 'not_recorded',
      userSuspicionOrConcern: confirmSuspicion || undefined,
      isResolved: false,
      isRecurring: confirmPrior === 'yes',
      medicallyEvaluated: confirmEvaluated === 'yes',
      userNotes: `Natural language entry: "${nlText}"`,
    };

    if (onSaveSymptom) {
      onSaveSymptom(newEpisode);
    } else {
      onStartSymptomIntake(confirmName, newEpisode);
    }
    onClose();
  };

  const handleSaveSleepForm = () => {
    const [bH, bM] = bedtime.split(':').map(Number);
    const [wH, wM] = wakeTime.split(':').map(Number);
    let totalMins = (wH * 60 + wM) - (bH * 60 + bM);
    if (totalMins < 0) totalMins += 24 * 60;

    const sleepRecord: SleepRecord = {
      id: `sleep-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      bedtime,
      wakeTime,
      totalMinutes: totalMins,
      quality: sleepQuality,
      nightAwakenings: 0,
      isShiftOrNightWork: false,
      restfulnessRating: sleepQuality === 'excellent' ? 5 : sleepQuality === 'good' ? 4 : sleepQuality === 'okay' ? 3 : 2,
      notes: sleepNotes,
    };
    onSaveSleep(sleepRecord);
    onClose();
  };

  const handleSaveVital = () => {
    let unit = 'mmHg';
    if (vitalType === 'weight') unit = 'kg';
    if (vitalType === 'temperature') unit = '°C';
    if (vitalType === 'heart_rate') unit = 'bpm';
    if (vitalType === 'hydration') unit = 'glasses';

    const meas: MeasurementRecord = {
      id: `meas-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      type: vitalType as any,
      value: vitalValue,
      unit,
      notes: vitalNotes,
    };
    onSaveMeasurement(meas);
    onClose();
  };

  const handleSaveMed = () => {
    if (!medName.trim()) return;
    const med: MedicationItem = {
      id: `med-${Date.now()}`,
      name: medName,
      dosage: medDosage || 'Standard dose',
      frequency: medFrequency,
      startDate: new Date().toISOString().split('T')[0],
      isActive: true,
      takenToday: true,
      timeToday: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    onSaveMedication(med);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center text-white">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Quick Log</h2>
              <p className="text-xs text-slate-500">Log symptoms in &lt;10s or use natural voice entry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
            aria-label="Close Quick Log"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1 text-xs font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('fast_symptom')}
            className={`flex-1 min-w-[90px] py-2 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === 'fast_symptom' ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚡ Fast &lt;10s
          </button>
          <button
            onClick={() => setActiveTab('natural_voice')}
            className={`flex-1 min-w-[90px] py-2 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === 'natural_voice' ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🎙️ Voice / Text
          </button>
          <button
            onClick={() => setActiveTab('sleep')}
            className={`flex-1 min-w-[70px] py-2 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === 'sleep' ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            🌙 Sleep
          </button>
          <button
            onClick={() => setActiveTab('vitals')}
            className={`flex-1 min-w-[70px] py-2 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === 'vitals' ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📊 Vitals
          </button>
          <button
            onClick={() => setActiveTab('medication')}
            className={`flex-1 min-w-[70px] py-2 text-center rounded-lg transition-all cursor-pointer ${
              activeTab === 'medication' ? 'bg-white text-teal-800 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            💊 Med
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-4">
          {/* TAB 1: 10-Second Ultra-Fast Log */}
          {activeTab === 'fast_symptom' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  1. Select Symptom:
                </span>
                <span className="text-[11px] text-teal-700 bg-teal-50 px-2 py-0.5 rounded font-medium">
                  One-tap speed
                </span>
              </div>

              {/* Quick Chips */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                {COMMON_SYMPTOMS.map((symp) => {
                  const isSelected = selectedSymptom === symp && !customSymptom;
                  return (
                    <button
                      key={symp}
                      type="button"
                      onClick={() => {
                        setSelectedSymptom(symp);
                        setCustomSymptom('');
                      }}
                      className={`px-2 py-2 text-xs rounded-xl font-medium border text-center transition-all cursor-pointer truncate ${
                        isSelected
                          ? 'bg-teal-600 text-white border-teal-600 shadow-sm'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {symp}
                    </button>
                  );
                })}
              </div>

              {/* Or custom symptom name */}
              <div>
                <input
                  type="text"
                  placeholder="Or enter custom symptom..."
                  value={customSymptom}
                  onChange={(e) => {
                    setCustomSymptom(e.target.value);
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                />
              </div>

              {/* 2. Severity Slider & Presets */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700 uppercase tracking-wider">
                    2. Severity:
                  </span>
                  <span className="font-bold text-teal-700 text-sm">{fastSeverity}/10</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={fastSeverity}
                  onChange={(e) => setFastSeverity(parseInt(e.target.value, 10))}
                  className="w-full accent-teal-600 cursor-pointer"
                />
                <div className="flex justify-between gap-1 text-[11px]">
                  {[
                    { label: 'Mild (3)', val: 3 },
                    { label: 'Moderate (5)', val: 5 },
                    { label: 'Severe (7)', val: 7 },
                    { label: 'Very Severe (9)', val: 9 },
                  ].map((p) => (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setFastSeverity(p.val)}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                        fastSeverity === p.val ? 'bg-teal-100 text-teal-800' : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Onset & Fever Tri-state */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">When started?</label>
                  <select
                    value={fastOnset}
                    onChange={(e) => setFastOnset(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="Just now (< 1h)">Just now (&lt; 1h)</option>
                    <option value="Today morning">Today morning</option>
                    <option value="Yesterday">Yesterday</option>
                    <option value="2-3 days ago">2-3 days ago</option>
                    <option value="Over 1 week">Over 1 week</option>
                  </select>
                </div>
                <div>
                  <TriStateSelector
                    label="Fever reported?"
                    value={fastFever}
                    onChange={setFastFever}
                    size="sm"
                  />
                </div>
              </div>

              {/* Save or Detailed Intake Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleFastSymptomSave}
                  disabled={isSubmittingFast || (!customSymptom.trim() && !selectedSymptom)}
                  className="w-full py-3 bg-teal-600 hover:bg-teal-700 active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-teal-600/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save {customSymptom.trim() || selectedSymptom} to Journal (&lt; 10s)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const sympName = customSymptom.trim() || selectedSymptom;
                    onClose();
                    onStartSymptomIntake(sympName, {
                      symptomName: sympName,
                      severity: fastSeverity,
                      startTime: fastOnset,
                      feverReported: fastFever,
                    });
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Need more clinical depth? Open Progressive Intake</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: Natural Language & Voice Entry with Structured Extraction & Explicit Confirmation */}
          {activeTab === 'natural_voice' && (
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                    Speak or Type in Your Own Words:
                  </label>
                  <span className="text-[11px] text-slate-500">AI structuring</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={3}
                    value={nlText}
                    onChange={(e) => setNlText(e.target.value)}
                    placeholder="e.g., 'Throbbing headache 7/10 since 8 AM, eyes hurt, no fever, slept only 5 hours.'"
                    className="w-full px-3.5 py-2.5 pr-12 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white resize-none"
                  />
                  <button
                    type="button"
                    onClick={toggleVoiceRecording}
                    className={`absolute right-2.5 top-2.5 p-2 rounded-lg transition-all cursor-pointer ${
                      isListening
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-slate-200 hover:bg-teal-100 text-slate-700 hover:text-teal-700'
                    }`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                    aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </button>
                </div>

                {isListening && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1.5 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-600" />
                    Listening... Speak naturally. Tap microphone again to finish.
                  </p>
                )}

                {speechError && (
                  <p className="mt-1 text-xs text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-200">
                    {speechError}
                  </p>
                )}
              </div>

              {/* Quick sample chips */}
              <div className="flex flex-wrap gap-1.5 text-xs text-slate-500">
                <span className="text-[11px] self-center">Samples:</span>
                <button
                  type="button"
                  onClick={() => setNlText('Bad temple headache 6/10 since morning, light sensitivity, no fever, slept 5h')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] text-slate-700 cursor-pointer"
                >
                  "Headache 6/10, no fever"
                </button>
                <button
                  type="button"
                  onClick={() => setNlText('Severe fatigue 5/10 after lunch, dry eyes, felt better after 20m nap')}
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-[11px] text-slate-700 cursor-pointer"
                >
                  "Fatigue 5/10 after lunch"
                </button>
              </div>

              <button
                type="button"
                onClick={handleParseNaturalLanguage}
                disabled={!nlText.trim() || isParsingNl}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {isParsingNl ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    <span>Extracting Structured Health Information...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Extract & Review Structured Fields</span>
                  </>
                )}
              </button>

              {/* Explicit Confirmation View */}
              {parsedResult && (
                <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-teal-600" />
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                        Explicit Verification Before Saving
                      </span>
                    </div>
                    <DataProvenanceBadge type="user_fact" />
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Verify the extracted fields below. You can adjust any values before confirming.
                  </p>

                  {/* Unconfirmed user concern flag if detected */}
                  {confirmSuspicion && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-900">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold">Unconfirmed User Concern: </span>
                        <span>{confirmSuspicion}</span>
                        <p className="text-[10px] text-amber-700 mt-0.5">
                          Stored for physician review. Ishara never converts suspicion into a diagnosis.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Editable verification fields */}
                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Symptom</label>
                      <input
                        type="text"
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg font-bold text-slate-900 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                        Severity (0-10): <span className="text-teal-700 font-bold">{confirmSeverity}</span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={confirmSeverity}
                        onChange={(e) => setConfirmSeverity(parseInt(e.target.value, 10))}
                        className="w-full accent-teal-600 mt-1 cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Onset / Timing</label>
                      <input
                        type="text"
                        value={confirmTiming}
                        onChange={(e) => setConfirmTiming(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Location</label>
                      <input
                        type="text"
                        value={confirmLocation}
                        onChange={(e) => setConfirmLocation(e.target.value)}
                        placeholder="e.g. Temples, forehead"
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  {/* Clinical Tri-states */}
                  <div className="border-t border-slate-200 pt-2 space-y-2">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide block">
                      Clinical Tri-State Questions (Yes / No / Not Recorded):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <TriStateSelector
                        label="Fever reported?"
                        value={confirmFever}
                        onChange={setConfirmFever}
                        size="sm"
                      />
                      <TriStateSelector
                        label="Happened before?"
                        value={confirmPrior}
                        onChange={setConfirmPrior}
                        size="sm"
                      />
                    </div>
                  </div>

                  {/* Explicit Confirmation Action */}
                  <div className="pt-2 flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={handleExplicitConfirmSave}
                      className="flex-1 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Save Symptom</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onStartSymptomIntake(confirmName, {
                          symptomName: confirmName,
                          severity: confirmSeverity,
                          startTime: confirmTiming,
                          location: confirmLocation,
                          feverReported: confirmFever,
                          priorOccurrenceState: confirmPrior,
                          userSuspicionOrConcern: confirmSuspicion,
                        });
                      }}
                      className="py-2.5 px-3 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-semibold cursor-pointer"
                    >
                      Open Intake Assistant
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Sleep Quick Log */}
          {activeTab === 'sleep' && (
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Bedtime</label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Wake Time</label>
                  <input
                    type="time"
                    value={wakeTime}
                    onChange={(e) => setWakeTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Sleep Quality</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['poor', 'okay', 'good', 'excellent'] as const).map((q) => (
                    <button
                      key={q}
                      type="button"
                      onClick={() => setSleepQuality(q)}
                      className={`py-2 px-1 text-center rounded-lg border text-xs capitalize transition-colors cursor-pointer ${
                        sleepQuality === q
                          ? 'bg-teal-600 text-white border-teal-600 font-semibold'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notes (Optional)</label>
                <input
                  type="text"
                  value={sleepNotes}
                  onChange={(e) => setSleepNotes(e.target.value)}
                  placeholder="e.g. Woke up once, rested"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveSleepForm}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Save Sleep Record
              </button>
            </div>
          )}

          {/* TAB 4: Vitals Quick Log */}
          {activeTab === 'vitals' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Measurement Type</label>
                <select
                  value={vitalType}
                  onChange={(e) => {
                    const t = e.target.value as any;
                    setVitalType(t);
                    if (t === 'blood_pressure') setVitalValue('120/80');
                    if (t === 'weight') setVitalValue('74.0');
                    if (t === 'temperature') setVitalValue('37.0');
                    if (t === 'heart_rate') setVitalValue('72');
                    if (t === 'hydration') setVitalValue('6');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                >
                  <option value="blood_pressure">Blood Pressure (mmHg)</option>
                  <option value="heart_rate">Heart Rate (bpm)</option>
                  <option value="weight">Body Weight (kg)</option>
                  <option value="temperature">Body Temperature (°C)</option>
                  <option value="hydration">Hydration (Glasses)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Value</label>
                <input
                  type="text"
                  value={vitalValue}
                  onChange={(e) => setVitalValue(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Context Notes</label>
                <input
                  type="text"
                  value={vitalNotes}
                  onChange={(e) => setVitalNotes(e.target.value)}
                  placeholder="e.g. Resting morning measurement"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <button
                type="button"
                onClick={handleSaveVital}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Save Measurement
              </button>
            </div>
          )}

          {/* TAB 5: Medication Log */}
          {activeTab === 'medication' && (
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Medication Name</label>
                <input
                  type="text"
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  placeholder="e.g. Paracetamol or Vitamin D3"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dosage</label>
                  <input
                    type="text"
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    placeholder="e.g. 500 mg"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    value={medFrequency}
                    onChange={(e) => setMedFrequency(e.target.value)}
                    placeholder="e.g. PRN as needed"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveMed}
                disabled={!medName.trim()}
                className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Save Medication Record
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

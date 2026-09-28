/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Stethoscope,
  Send,
  Sparkles,
  HelpCircle,
  AlertTriangle,
  CheckCircle2,
  Edit2,
  Clock,
  ArrowRight,
  Shield,
} from 'lucide-react';
import { SymptomEpisode, UserProfile, SafetyAlert } from '../../types';
import { AIService } from '../../services/aiService';
import { evaluateRedFlags } from '../../utils/safetyRules';
import { MedicalDisclaimer } from '../common/MedicalDisclaimer';
import { TriStateSelector } from '../common/TriStateSelector';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaveSymptom: (symptom: SymptomEpisode, safetyAlert?: SafetyAlert) => void;
  userProfile: UserProfile;
  initialSymptomName?: string;
  initialDraft?: Partial<SymptomEpisode>;
}

interface ChatStep {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  whyWeAsk?: string;
  inputType?: 'text' | 'severity_slider' | 'options' | 'duration' | 'timing';
  quickSuggestions?: string[];
}

export const SymptomIntakeModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSaveSymptom,
  userProfile,
  initialSymptomName = '',
  initialDraft,
}) => {
  // Common quick symptoms
  const COMMON_SYMPTOMS = [
    'Headache',
    'Fatigue',
    'Fever / Chills',
    'Nausea / Stomach ache',
    'Back Pain',
    'Joint Pain',
    'Cough / Sore Throat',
    'Dizziness',
    'Shortness of Breath',
  ];

  // Stage: 'initial_input' | 'conversational_qa' | 'summary_review'
  const [stage, setStage] = useState<'initial_input' | 'conversational_qa' | 'summary_review'>('initial_input');
  const [symptomName, setSymptomName] = useState(initialSymptomName);
  const [currentInput, setCurrentInput] = useState('');
  const [sliderSeverity, setSliderSeverity] = useState(5);
  const [chatSteps, setChatSteps] = useState<ChatStep[]>([]);
  const [qaHistory, setQaHistory] = useState<Array<{ question: string; answer: string }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeSafetyAlert, setActiveSafetyAlert] = useState<SafetyAlert | null>(null);

  // Extracted summary object (editable)
  const [summary, setSummary] = useState<Partial<SymptomEpisode>>({
    symptomName: '',
    date: new Date().toISOString().split('T')[0],
    startTime: 'Today',
    severity: 5,
    frequency: 'intermittent',
    duration: 'Ongoing',
    location: '',
    characterDescription: '',
    triggers: [],
    relievingFactors: [],
    associatedSymptoms: [],
    contextNotes: '',
    userNotes: '',
    isResolved: false,
    isRecurring: false,
    medicallyEvaluated: false,
  });

  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      if (initialDraft && initialDraft.symptomName) {
        setSymptomName(initialDraft.symptomName);
        setSummary({ ...summary, ...initialDraft });
        setStage('summary_review');
      } else if (initialSymptomName) {
        setSymptomName(initialSymptomName);
        startIntakeFlow(initialSymptomName);
      } else {
        setStage('initial_input');
        setSymptomName('');
        setChatSteps([]);
        setQaHistory([]);
        setActiveSafetyAlert(null);
      }
    }
  }, [isOpen, initialSymptomName, initialDraft]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatSteps, isLoading]);

  if (!isOpen) return null;

  const startIntakeFlow = async (name: string) => {
    if (!name.trim()) return;
    setSymptomName(name);
    setStage('conversational_qa');
    setIsLoading(true);

    const initialDraftObj: Partial<SymptomEpisode> = {
      symptomName: name,
      date: new Date().toISOString().split('T')[0],
      startTime: 'Today',
      severity: 5,
      frequency: 'intermittent',
      location: '',
      characterDescription: '',
      triggers: [],
      relievingFactors: [],
      associatedSymptoms: [],
      contextNotes: '',
      userNotes: '',
    };
    setSummary(initialDraftObj);

    // Initial check for red flag right away
    const redFlag = evaluateRedFlags(initialDraftObj, name, userProfile.country);
    if (redFlag) {
      setActiveSafetyAlert(redFlag);
    }

    try {
      const step = await AIService.getNextIntakeStep(name, [], userProfile, '', initialDraftObj);
      setChatSteps([
        {
          id: `step-0`,
          sender: 'ai',
          text: step.nextQuestion || `When did your ${name.toLowerCase()} start?`,
          whyWeAsk: step.whyWeAsk,
          inputType: step.inputType || 'options',
          quickSuggestions: step.quickSuggestions || ['Just now', 'This morning', 'Yesterday', 'Few days ago'],
        },
      ]);
    } catch (err) {
      console.error('Error starting intake flow:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAnswer = async (answerText: string) => {
    if (!answerText.trim() || isLoading) return;

    const lastAiStep = chatSteps.filter((s) => s.sender === 'ai').slice(-1)[0];
    const currentQuestion = lastAiStep ? lastAiStep.text : 'Question';

    const newChatSteps: ChatStep[] = [
      ...chatSteps,
      {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: answerText,
      },
    ];
    setChatSteps(newChatSteps);
    setCurrentInput('');

    const newQaHistory = [...qaHistory, { question: currentQuestion, answer: answerText }];
    setQaHistory(newQaHistory);
    setIsLoading(true);

    try {
      const nextStep = await AIService.getNextIntakeStep(
        symptomName,
        newQaHistory,
        userProfile,
        answerText,
        summary
      );

      // Check red flags with latest answers
      const updatedSummary = { ...summary, ...nextStep.extractedSummary };
      setSummary(updatedSummary);

      const flag = evaluateRedFlags(updatedSummary, answerText, userProfile.country);
      if (flag) {
        setActiveSafetyAlert(flag);
      }

      if (nextStep.isComplete || newQaHistory.length >= 4) {
        // Move to editable summary review
        setStage('summary_review');
      } else {
        setChatSteps([
          ...newChatSteps,
          {
            id: `ai-${Date.now()}`,
            sender: 'ai',
            text: nextStep.nextQuestion || 'How is this affecting you currently?',
            whyWeAsk: nextStep.whyWeAsk,
            inputType: nextStep.inputType || 'text',
            quickSuggestions: nextStep.quickSuggestions || [],
          },
        ]);
      }
    } catch (err) {
      console.error('Error getting next intake step:', err);
      setStage('summary_review');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishAndSave = () => {
    const finalEpisode: SymptomEpisode = {
      id: summary.id || `symp-${Date.now()}`,
      symptomName: summary.symptomName || symptomName || 'Logged Symptom',
      category: summary.category || 'neurological',
      timestamp: new Date().toISOString(),
      date: summary.date || new Date().toISOString().split('T')[0],
      startTime: summary.startTime || 'Today',
      endTime: summary.isResolved ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : undefined,
      isResolved: summary.isResolved ?? false,
      severity: summary.severity ?? 5,
      frequency: summary.frequency || 'intermittent',
      duration: summary.duration || 'Ongoing',
      location: summary.location || 'General',
      characterDescription: summary.characterDescription || 'Reported discomfort',
      triggers: summary.triggers || [],
      relievingFactors: summary.relievingFactors || [],
      associatedSymptoms: summary.associatedSymptoms || [],
      contextNotes: summary.contextNotes || '',
      userNotes: summary.userNotes || '',
      isRecurring: summary.isRecurring ?? false,
      medicallyEvaluated: summary.medicallyEvaluated ?? false,
      evaluatedNotes: summary.evaluatedNotes || '',
      medicallyEvaluatedState: summary.medicallyEvaluatedState || (summary.medicallyEvaluated ? 'yes' : 'not_recorded'),
      priorOccurrenceState: summary.priorOccurrenceState || (summary.isRecurring ? 'yes' : 'not_recorded'),
      feverReported: summary.feverReported || 'not_recorded',
      hasAssociatedSymptomsState: summary.hasAssociatedSymptomsState || (summary.associatedSymptoms && summary.associatedSymptoms.length > 0 ? 'yes' : 'not_recorded'),
      worseningProgressionState: summary.worseningProgressionState || 'not_recorded',
      userSuspicionOrConcern: summary.userSuspicionOrConcern || undefined,
      safetyFlagged: !!activeSafetyAlert,
      safetyNotes: activeSafetyAlert ? activeSafetyAlert.explanation : undefined,
    };

    onSaveSymptom(finalEpisode, activeSafetyAlert || undefined);
    onClose();
  };

  const getSeverityColor = (sev: number) => {
    if (sev <= 3) return 'text-emerald-800 bg-emerald-50 border-emerald-200';
    if (sev <= 6) return 'text-amber-800 bg-amber-50 border-amber-200';
    if (sev <= 8) return 'text-orange-800 bg-orange-50 border-orange-200';
    return 'text-rose-800 bg-rose-50 border-rose-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
              <Stethoscope className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 leading-tight">Log a Symptom</h2>
              <p className="text-xs text-slate-500">Progressive clinical journal intake</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-200/50 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Alert Notification inside intake if flagged */}
        {activeSafetyAlert && (
          <div className="mx-4 mt-3 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold">Safety Prompt: </strong>
              {activeSafetyAlert.explanation}
              <div className="mt-1 text-slate-600">
                Seek professional clinical evaluation if symptoms are severe or worsening. (Emergency: {activeSafetyAlert.emergencyNumber})
              </div>
            </div>
          </div>
        )}

        {/* Body content based on stage */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* STAGE 1: Initial Symptom Name */}
          {stage === 'initial_input' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  What symptom are you experiencing?
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={symptomName}
                    onChange={(e) => setSymptomName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && startIntakeFlow(symptomName)}
                    placeholder="e.g. Headache, Fatigue, Lower back pain"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white transition-all"
                    autoFocus
                  />
                  <button
                    onClick={() => startIntakeFlow(symptomName)}
                    disabled={!symptomName.trim()}
                    className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-500 font-medium block mb-2">Or select common symptoms:</span>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SYMPTOMS.map((item) => (
                    <button
                      key={item}
                      onClick={() => startIntakeFlow(item)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <MedicalDisclaimer compact />
            </div>
          )}

          {/* STAGE 2: Progressive AI Conversational QA */}
          {stage === 'conversational_qa' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 text-xs text-slate-500">
                <span className="font-semibold text-slate-800">Logging: {symptomName}</span>
                <span>Question {qaHistory.length + 1} of ~4</span>
              </div>

              {/* Chat Thread */}
              <div className="space-y-3">
                {chatSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex flex-col ${step.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                        step.sender === 'user'
                          ? 'bg-teal-600 text-white rounded-br-sm'
                          : 'bg-slate-100 text-slate-800 rounded-bl-sm border border-slate-200'
                      }`}
                    >
                      <p className="leading-relaxed">{step.text}</p>
                    </div>

                    {step.whyWeAsk && (
                      <div className="flex items-center gap-1 text-[11px] text-slate-700 mt-1 pl-1">
                        <HelpCircle className="w-3 h-3 text-slate-500" />
                        <span>Why we ask: {step.whyWeAsk}</span>
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 italic p-2 bg-slate-50 rounded-xl max-w-[200px]">
                    <Sparkles className="w-3.5 h-3.5 text-teal-600 animate-spin" />
                    <span>Structuring questions...</span>
                  </div>
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Active Question Input Controls */}
              {!isLoading && chatSteps.length > 0 && chatSteps[chatSteps.length - 1].sender === 'ai' && (
                <div className="pt-2 border-t border-slate-100 space-y-3">
                  {/* Severity slider if requested */}
                  {chatSteps[chatSteps.length - 1].inputType === 'severity_slider' && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700">Severity Rating (0-10):</span>
                        <span className={`px-2 py-0.5 rounded font-bold border ${getSeverityColor(sliderSeverity)}`}>
                          {sliderSeverity} / 10
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="10"
                        value={sliderSeverity}
                        onChange={(e) => setSliderSeverity(parseInt(e.target.value, 10))}
                        className="w-full accent-teal-600 h-2 bg-slate-200 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>0 (None)</span>
                        <span>3 (Mild)</span>
                        <span>5 (Moderate)</span>
                        <span>7 (Severe)</span>
                        <span>10 (Worst possible)</span>
                      </div>
                      <button
                        onClick={() => handleSendAnswer(`${sliderSeverity}/10`)}
                        className="w-full py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                      >
                        Confirm Severity: {sliderSeverity}/10
                      </button>
                    </div>
                  )}

                  {/* Quick Suggestions Chips */}
                  {chatSteps[chatSteps.length - 1].quickSuggestions &&
                    chatSteps[chatSteps.length - 1].quickSuggestions!.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {chatSteps[chatSteps.length - 1].quickSuggestions!.map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handleSendAnswer(opt)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 hover:border-teal-200 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}

                  {/* Free text input */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={currentInput}
                      onChange={(e) => setCurrentInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAnswer(currentInput)}
                      placeholder="Type your answer..."
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white"
                    />
                    <button
                      onClick={() => handleSendAnswer(currentInput)}
                      disabled={!currentInput.trim()}
                      className="px-3.5 py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl transition-colors cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <button
                      onClick={() => setStage('summary_review')}
                      className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                    >
                      Skip to summary review
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STAGE 3: Editable Extracted Summary Review */}
          {stage === 'summary_review' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs text-teal-800 font-semibold bg-teal-50 px-2 py-1 rounded border border-teal-200/60">
                  <CheckCircle2 className="w-4 h-4 text-teal-600" />
                  <span>Symptom Information Captured</span>
                </div>
                <span className="text-xs text-slate-500">Edit any details before saving</span>
              </div>

              {/* Form fields for summary */}
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3.5 text-xs">
                {/* Symptom Name & Severity */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Symptom Name</label>
                    <input
                      type="text"
                      value={summary.symptomName || ''}
                      onChange={(e) => setSummary({ ...summary, symptomName: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Severity: <span className="text-teal-700 font-bold">{summary.severity ?? 5}/10</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={summary.severity ?? 5}
                      onChange={(e) => setSummary({ ...summary, severity: parseInt(e.target.value, 10) })}
                      className="w-full accent-teal-600"
                    />
                  </div>
                </div>

                {/* Start time & Pattern */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Started</label>
                    <input
                      type="text"
                      value={summary.startTime || ''}
                      onChange={(e) => setSummary({ ...summary, startTime: e.target.value })}
                      placeholder="e.g. This morning, 2 days ago"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Pattern</label>
                    <select
                      value={summary.frequency || 'intermittent'}
                      onChange={(e) => setSummary({ ...summary, frequency: e.target.value as any })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    >
                      <option value="intermittent">Intermittent (comes and goes)</option>
                      <option value="constant">Constant (continuous)</option>
                      <option value="single_episode">Single episode</option>
                      <option value="fluctuating">Fluctuating in intensity</option>
                    </select>
                  </div>
                </div>

                {/* Location & Character */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Location</label>
                    <input
                      type="text"
                      value={summary.location || ''}
                      onChange={(e) => setSummary({ ...summary, location: e.target.value })}
                      placeholder="e.g. Forehead, Lower back"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Character / Description</label>
                    <input
                      type="text"
                      value={summary.characterDescription || ''}
                      onChange={(e) => setSummary({ ...summary, characterDescription: e.target.value })}
                      placeholder="e.g. Throbbing, dull ache, tight band"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Associated Symptoms */}
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Associated Symptoms</label>
                  <input
                    type="text"
                    value={(summary.associatedSymptoms || []).join(', ')}
                    onChange={(e) =>
                      setSummary({
                        ...summary,
                        associatedSymptoms: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                      })
                    }
                    placeholder="e.g. Light sensitivity, mild nausea"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                </div>

                {/* Relieving / Triggers */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">What makes it better?</label>
                    <input
                      type="text"
                      value={(summary.relievingFactors || []).join(', ')}
                      onChange={(e) =>
                        setSummary({
                          ...summary,
                          relievingFactors: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. Hydration, rest, dark room"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Possible Triggers / Context</label>
                    <input
                      type="text"
                      value={summary.contextNotes || ''}
                      onChange={(e) => setSummary({ ...summary, contextNotes: e.target.value })}
                      placeholder="e.g. Slept poorly, high work stress"
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                {/* Clinical Tri-State Questions (Yes / No / Not Recorded) */}
                <div className="pt-2 border-t border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 uppercase tracking-wide">
                      Clinical Status Assessment
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Missing info is kept as 'Not Recorded' (never assumed negative)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <TriStateSelector
                      label="Fever reported?"
                      value={summary.feverReported}
                      onChange={(val) => setSummary({ ...summary, feverReported: val })}
                      size="sm"
                    />
                    <TriStateSelector
                      label="Prior occurrence before?"
                      value={summary.priorOccurrenceState}
                      onChange={(val) =>
                        setSummary({
                          ...summary,
                          priorOccurrenceState: val,
                          isRecurring: val === 'yes',
                        })
                      }
                      size="sm"
                    />
                    <TriStateSelector
                      label="Medically evaluated previously?"
                      value={summary.medicallyEvaluatedState}
                      onChange={(val) =>
                        setSummary({
                          ...summary,
                          medicallyEvaluatedState: val,
                          medicallyEvaluated: val === 'yes',
                        })
                      }
                      size="sm"
                    />
                    <TriStateSelector
                      label="Worsening progression?"
                      value={summary.worseningProgressionState}
                      onChange={(val) => setSummary({ ...summary, worseningProgressionState: val })}
                      size="sm"
                    />
                  </div>
                </div>

                {/* User Suspicion / Unconfirmed Concern */}
                <div className="pt-2 border-t border-slate-200">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unconfirmed User Concern or Suspected Cause (Optional)
                  </label>
                  <input
                    type="text"
                    value={summary.userSuspicionOrConcern || ''}
                    onChange={(e) => setSummary({ ...summary, userSuspicionOrConcern: e.target.value })}
                    placeholder="e.g. Wonder if related to screen glare or sinus"
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Marked strictly as an unconfirmed user suspicion. Never recorded as a medical diagnosis.
                  </p>
                </div>
              </div>

              <MedicalDisclaimer compact />
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {stage === 'summary_review' ? (
            <>
              <button
                onClick={() => setStage('conversational_qa')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
              >
                Back to questions
              </button>
              <button
                onClick={handleFinishAndSave}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                Save Symptom Entry
              </button>
            </>
          ) : (
            <div className="w-full flex justify-between items-center">
              <button
                onClick={onClose}
                className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              {stage === 'conversational_qa' && (
                <button
                  onClick={() => setStage('summary_review')}
                  className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Review Summary
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

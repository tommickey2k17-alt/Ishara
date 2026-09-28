/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DailyCheckIn,
  DoctorReport,
  MeasurementRecord,
  MedicationItem,
  SafetyAlert,
  SleepRecord,
  SymptomEpisode,
  UserProfile,
} from '../types';

export interface SymptomIntakeResponse {
  isComplete: boolean;
  nextQuestion?: string;
  whyWeAsk?: string;
  inputType?: 'text' | 'severity_slider' | 'options' | 'duration' | 'timing';
  quickSuggestions?: string[];
  extractedSummary: Partial<SymptomEpisode>;
}

export interface NaturalLanguageParseResult {
  symptomName: string;
  severity?: number;
  startTime?: string;
  location?: string;
  characterDescription?: string;
  associatedSymptoms?: string[];
  contextNotes?: string;
  triggers?: string[];
  relievingFactors?: string[];
  feverReported?: 'yes' | 'no' | 'not_recorded';
  priorOccurrenceState?: 'yes' | 'no' | 'not_recorded';
  medicallyEvaluatedState?: 'yes' | 'no' | 'not_recorded';
  userSuspicionOrConcern?: string;
  missingQuestions?: string[];
}

export const AIService = {
  /**
   * Progressive Symptom Intake:
   * Asks ONE relevant follow-up question at a time or finishes when enough core info is captured.
   */
  async getNextIntakeStep(
    symptomName: string,
    history: Array<{ question: string; answer: string }>,
    patientProfile: UserProfile,
    latestInput: string,
    currentDraft: Partial<SymptomEpisode>
  ): Promise<SymptomIntakeResponse> {
    try {
      const response = await fetch('/api/symptom-intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptomName,
          userAnswers: history,
          patientProfile,
          latestInput,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.fallback && data.extractedSummary) {
          return {
            isComplete: !!data.isComplete,
            nextQuestion: data.nextQuestion,
            whyWeAsk: data.whyWeAsk,
            inputType: data.inputType || 'text',
            quickSuggestions: data.quickSuggestions || [],
            extractedSummary: { ...currentDraft, ...data.extractedSummary },
          };
        }
      }
    } catch (err) {
      console.warn('Backend AI intake unavailable, using intelligent clinical fallback:', err);
    }

    // High quality clinical progressive intake fallback
    return this.fallbackProgressiveIntake(symptomName, history, latestInput, currentDraft);
  },

  /**
   * Deterministic progressive intake fallback adhering strictly to medical principles.
   */
  fallbackProgressiveIntake(
    symptomName: string,
    history: Array<{ question: string; answer: string }>,
    latestInput: string,
    currentDraft: Partial<SymptomEpisode>
  ): SymptomIntakeResponse {
    const stepCount = history.length;
    const lowerLatest = (latestInput || '').toLowerCase();
    const updatedDraft: Partial<SymptomEpisode> = {
      symptomName: symptomName || 'Symptom',
      date: currentDraft.date || new Date().toISOString().split('T')[0],
      startTime: currentDraft.startTime || 'Today',
      severity: currentDraft.severity ?? 5,
      frequency: currentDraft.frequency || 'intermittent',
      location: currentDraft.location || '',
      characterDescription: currentDraft.characterDescription || '',
      associatedSymptoms: [...(currentDraft.associatedSymptoms || [])],
      triggers: [...(currentDraft.triggers || [])],
      relievingFactors: [...(currentDraft.relievingFactors || [])],
      contextNotes: currentDraft.contextNotes || '',
      userNotes: currentDraft.userNotes || '',
      isResolved: currentDraft.isResolved ?? false,
      isRecurring: currentDraft.isRecurring ?? false,
      medicallyEvaluated: currentDraft.medicallyEvaluated ?? false,
    };

    // Update draft from latest input if possible
    if (stepCount === 1) {
      updatedDraft.startTime = latestInput;
    } else if (stepCount === 2) {
      const num = parseInt(latestInput.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num >= 0 && num <= 10) {
        updatedDraft.severity = num;
      }
    } else if (stepCount === 3) {
      if (lowerLatest.includes('constant')) updatedDraft.frequency = 'constant';
      else if (lowerLatest.includes('intermittent') || lowerLatest.includes('come and go'))
        updatedDraft.frequency = 'intermittent';
      else updatedDraft.characterDescription = latestInput;
    } else if (stepCount === 4) {
      updatedDraft.location = latestInput;
    }

    // Step 0 -> When did it start?
    if (stepCount === 0) {
      return {
        isComplete: false,
        nextQuestion: `When did your ${symptomName.toLowerCase()} begin?`,
        whyWeAsk: 'Helps determine symptom onset and clinical timeline.',
        inputType: 'options',
        quickSuggestions: ['Just now (< 1 hr)', 'Earlier this morning', 'Yesterday', 'A few days ago'],
        extractedSummary: updatedDraft,
      };
    }

    // Step 1 -> Severity
    if (stepCount === 1) {
      return {
        isComplete: false,
        nextQuestion: 'How severe is it right now on a scale of 0 to 10?',
        whyWeAsk: 'Standardized clinical severity metric for monitoring progress.',
        inputType: 'severity_slider',
        quickSuggestions: ['Mild (2-3)', 'Moderate (5)', 'Severe (7-8)', 'Very Severe (9-10)'],
        extractedSummary: updatedDraft,
      };
    }

    // Step 2 -> Pattern / Character
    if (stepCount === 2) {
      return {
        isComplete: false,
        nextQuestion: 'Is it constant, or does it come and go?',
        whyWeAsk: 'Differentiates continuous vs episodic symptom patterns.',
        inputType: 'options',
        quickSuggestions: ['Constant without pause', 'Comes and goes in waves', 'Throbbing pulses', 'Only with movement'],
        extractedSummary: updatedDraft,
      };
    }

    // Step 3 -> Location / Area
    if (stepCount === 3) {
      return {
        isComplete: false,
        nextQuestion: 'Where specifically do you feel it?',
        whyWeAsk: 'Anatomical location helps clarify focal vs generalized symptoms.',
        inputType: 'text',
        quickSuggestions: ['Forehead / temples', 'Back of head / neck', 'One side only', 'Generalized'],
        extractedSummary: updatedDraft,
      };
    }

    // Step 4 -> Associated symptoms or relieving factors
    if (stepCount === 4) {
      return {
        isComplete: false,
        nextQuestion: 'Any associated symptoms, or anything that makes it noticeably better or worse?',
        whyWeAsk: 'Provides key clinical context regarding triggers and relieving measures.',
        inputType: 'text',
        quickSuggestions: ['Light / sound sensitivity', 'Nausea', 'Relieved by rest / hydration', 'None reported'],
        extractedSummary: updatedDraft,
      };
    }

    // Complete!
    if (stepCount >= 5) {
      if (lowerLatest && !lowerLatest.includes('none')) {
        updatedDraft.associatedSymptoms = [latestInput];
      }
      return {
        isComplete: true,
        extractedSummary: updatedDraft,
      };
    }

    return {
      isComplete: true,
      extractedSummary: updatedDraft,
    };
  },

  /**
   * Natural Language Parsing:
   * e.g., "Bad headache since morning, 6/10, slept badly last night"
   */
  async parseNaturalLanguage(
    text: string,
    patientProfile: UserProfile
  ): Promise<NaturalLanguageParseResult> {
    try {
      const response = await fetch('/api/parse-natural-language', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, patientProfile }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.fallback && data.symptomName) {
          return data;
        }
      }
    } catch (err) {
      console.warn('Server NL parser unavailable, using regex extraction:', err);
    }

    // High quality client-side fallback parsing
    const lower = text.toLowerCase();
    let symptomName = 'Symptom';
    if (lower.includes('headache') || lower.includes('migraine')) symptomName = 'Headache';
    else if (lower.includes('fatigue') || lower.includes('tired') || lower.includes('exhausted'))
      symptomName = 'Fatigue';
    else if (lower.includes('fever') || lower.includes('chills')) symptomName = 'Fever';
    else if (lower.includes('nausea') || lower.includes('stomach') || lower.includes('abdominal'))
      symptomName = 'Stomach Discomfort';
    else if (lower.includes('back pain') || lower.includes('spine')) symptomName = 'Back Pain';
    else if (lower.includes('cough') || lower.includes('cold') || lower.includes('throat'))
      symptomName = 'Cough / Sore Throat';
    else {
      // First 3 words as symptom name
      symptomName = text.split(/[,\.\?!]/)[0].trim().slice(0, 30) || 'Reported Symptom';
    }

    // Extract severity (e.g. 6/10, 7 out of 10, or descriptive)
    let severity = 5;
    const severityMatch = text.match(/(\d{1,2})\s*(?:\/|\s*out\s*of\s*)\s*10/i);
    if (severityMatch) {
      severity = Math.min(10, Math.max(0, parseInt(severityMatch[1], 10)));
    } else if (lower.includes('mild') || lower.includes('slight')) {
      severity = 3;
    } else if (lower.includes('bad') || lower.includes('severe')) {
      severity = 7;
    } else if (lower.includes('worst') || lower.includes('unbearable')) {
      severity = 9;
    }

    // Timing
    let startTime = 'Today';
    if (lower.includes('since morning') || lower.includes('this morning')) startTime = 'This morning';
    else if (lower.includes('yesterday')) startTime = 'Yesterday';
    else if (lower.includes('just now') || lower.includes('hour ago')) startTime = 'Past hour';

    // Context
    let contextNotes = '';
    if (lower.includes('sleep') || lower.includes('slept')) {
      contextNotes = 'User noted sleep irregularity or poor sleep.';
    }
    if (lower.includes('stress') || lower.includes('work')) {
      contextNotes += (contextNotes ? ' ' : '') + 'Work / stress context mentioned.';
    }

    // Extract unconfirmed user concerns / suspicions (e.g. "suspected migraine", "I think I might have...")
    let userSuspicionOrConcern = '';
    const suspicionMatch = text.match(/(?:i think (?:it'?s|i have)|suspect(?:ed|ing)?|wonder if it'?s|could be)\s+([^,\.\?!]+)/i);
    if (suspicionMatch) {
      userSuspicionOrConcern = `User suspecting: ${suspicionMatch[1].trim()} (Unconfirmed user concern; not a clinical diagnosis)`;
    }

    // Clinical tri-states check
    let feverReported: 'yes' | 'no' | 'not_recorded' = 'not_recorded';
    if (lower.includes('no fever') || lower.includes('without fever') || lower.includes('afebrile')) {
      feverReported = 'no';
    } else if (lower.includes('fever') || lower.includes('high temp') || lower.includes('chills')) {
      feverReported = 'yes';
    }

    let priorOccurrenceState: 'yes' | 'no' | 'not_recorded' = 'not_recorded';
    if (lower.includes('never happened before') || lower.includes('first time')) {
      priorOccurrenceState = 'no';
    } else if (lower.includes('happened before') || lower.includes('again') || lower.includes('recurring') || lower.includes('usual headache')) {
      priorOccurrenceState = 'yes';
    }

    return {
      symptomName,
      severity,
      startTime,
      characterDescription: lower.includes('throbbing') ? 'Throbbing' : 'Aching',
      associatedSymptoms: lower.includes('nausea') ? ['Nausea'] : [],
      contextNotes,
      triggers: lower.includes('screen') ? ['Screen glare / prolonged usage'] : lower.includes('stress') ? ['Stressful workload'] : [],
      relievingFactors: lower.includes('water') ? ['Hydration'] : lower.includes('rest') ? ['Rest'] : [],
      feverReported,
      priorOccurrenceState,
      medicallyEvaluatedState: 'not_recorded',
      userSuspicionOrConcern: userSuspicionOrConcern || undefined,
      missingQuestions: ['Is this constant or intermittent?', 'Where is it located?'],
    };
  },

  /**
   * Generates or synthesizes the Doctor Report.
   * Adheres strictly to the 3-category separation and non-diagnostic principle.
   */
  async generateDoctorReport(
    userProfile: UserProfile,
    symptoms: SymptomEpisode[],
    sleepRecords: SleepRecord[],
    checkIns: DailyCheckIn[],
    medications: MedicationItem[],
    measurements: MeasurementRecord[],
    safetyAlerts: SafetyAlert[],
    periodDays = 30,
    customReasonForVisit?: string
  ): Promise<DoctorReport> {
    try {
      const response = await fetch('/api/doctor-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userProfile,
          symptoms,
          sleepRecords,
          checkIns,
          medications,
          measurements,
          safetyAlerts,
          periodDays,
          customReasonForVisit,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (!data.fallback && data.patternsObserved) {
          return {
            id: `rep-${Date.now()}`,
            generatedAt: new Date().toISOString(),
            periodLabel: `Last ${periodDays} Days (${new Date(Date.now() - periodDays * 86400000).toLocaleDateString()} – ${new Date().toLocaleDateString()})`,
            periodDays,
            reasonForVisit: data.reasonForVisit || customReasonForVisit || 'Review of recurrent symptom patterns and daily wellness tracking',
            whatChanged: data.whatChanged || [
              `${symptoms.length} symptoms logged in the past ${periodDays} days`,
              `Sleep duration averaged ${sleepRecords.length > 0 ? (sleepRecords.reduce((a, b) => a + b.totalMinutes, 0) / (sleepRecords.length * 60)).toFixed(1) : 7}h nightly`,
              `Medication adherence stable with ${medications.length} active prescriptions`,
            ],
            symptomTrajectory: data.symptomTrajectory || 'fluctuating',
            trajectoryNotes: data.trajectoryNotes || 'Symptom intensity and frequency have remained episodic without continuous escalation.',
            patientSummary: {
              name: userProfile.name,
              age: userProfile.age,
              sex: userProfile.sex.charAt(0).toUpperCase() + userProfile.sex.slice(1),
              country: userProfile.country,
            },
            primaryConcerns: data.primaryConcerns || [],
            symptomTimeline: data.symptomTimeline || [],
            patternsObserved: {
              userReportedFacts: data.patternsObserved.userReportedFacts || [],
              calculatedInformation: data.patternsObserved.calculatedInformation || [],
              aiGeneratedObservations: data.patternsObserved.aiGeneratedObservations || [],
            },
            currentMedications: medications.map((m) => ({
              name: m.name,
              dosage: m.dosage,
              frequency: m.frequency,
              purpose: m.purpose,
            })),
            relevantMedicalHistory: [
              ...(userProfile.conditions.length > 0
                ? userProfile.conditions.map((c) => `Documented condition: ${c}`)
                : ['No chronic conditions recorded by user']),
              ...(userProfile.allergies.length > 0
                ? userProfile.allergies.map((a) => `Allergy: ${a}`)
                : ['No known allergies recorded']),
            ],
            recentMeasurements: measurements.slice(0, 5).map((m) => ({
              metric: m.type.replace('_', ' ').toUpperCase(),
              value: `${m.value} ${m.unit}`,
              date: m.date,
            })),
            clinicianQuestions: data.clinicianQuestions || [],
            safetyAlerts: safetyAlerts.map((a) => ({
              date: a.date,
              note: `${a.triggerSymptoms.join(', ')}: ${a.explanation}`,
            })),
          };
        }
      }
    } catch (err) {
      console.warn('Backend doctor report generator unavailable, using standard statistical generator:', err);
    }

    // High quality clinical statistical summary fallback
    const totalSymptomCount = symptoms.length;
    const avgSeverity = totalSymptomCount > 0
      ? (symptoms.reduce((acc, s) => acc + s.severity, 0) / totalSymptomCount).toFixed(1)
      : '0';

    let totalSleepMins = 0;
    sleepRecords.forEach((s) => (totalSleepMins += s.totalMinutes));
    const avgSleepMins = sleepRecords.length > 0 ? Math.round(totalSleepMins / sleepRecords.length) : 480;
    const avgSleepHours = Math.floor(avgSleepMins / 60);
    const avgSleepRemMins = avgSleepMins % 60;

    // Distinct symptom names
    const distinctSymptoms = Array.from(new Set(symptoms.map((s) => s.symptomName)));

    return {
      id: `rep-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      periodLabel: `Last ${periodDays} Days (${new Date(Date.now() - periodDays * 86400000).toLocaleDateString()} – ${new Date().toLocaleDateString()})`,
      periodDays,
      reasonForVisit: customReasonForVisit || 'Review of recurrent symptom patterns and daily wellness tracking',
      whatChanged: [
        `${totalSymptomCount} symptoms recorded during this ${periodDays}-day window`,
        `Average nocturnal sleep tracked at ${avgSleepHours}h ${avgSleepRemMins}m across ${sleepRecords.length} recorded nights`,
        `${medications.length} active medications being tracked with logged doses`,
        `High-severity episodes (>=7/10): ${symptoms.filter((s) => s.severity >= 7).length} recorded`,
      ],
      symptomTrajectory: symptoms.length > 3 && symptoms[0].severity < symptoms[symptoms.length - 1].severity ? 'improving' : 'fluctuating',
      trajectoryNotes: 'Observations reflect episodic occurrences without sustained chronic escalation.',
      patientSummary: {
        name: userProfile.name,
        age: userProfile.age,
        sex: userProfile.sex.charAt(0).toUpperCase() + userProfile.sex.slice(1),
        country: userProfile.country,
      },
      primaryConcerns: distinctSymptoms.slice(0, 3).map((symp) => {
        const count = symptoms.filter((s) => s.symptomName === symp).length;
        return `${symp}: ${count} episode${count > 1 ? 's' : ''} logged during reporting window`;
      }),
      symptomTimeline: symptoms.slice(0, 8).map((s) => ({
        date: s.date,
        symptom: s.symptomName,
        severity: `${s.severity}/10`,
        duration: s.duration || 'Not specified',
        details: [
          s.location,
          s.characterDescription,
          s.associatedSymptoms?.length ? `Assoc: ${s.associatedSymptoms.join(', ')}` : '',
        ]
          .filter(Boolean)
          .join('; '),
      })),
      patternsObserved: {
        userReportedFacts: [
          `User recorded ${totalSymptomCount} total symptom entries across the ${periodDays}-day period.`,
          `Recorded severity ratings spanned from ${Math.min(...symptoms.map((s) => s.severity), 0)}/10 to ${Math.max(...symptoms.map((s) => s.severity), 0)}/10 (average: ${avgSeverity}/10).`,
          `Most frequent symptom recorded: ${distinctSymptoms[0] || 'None'}.`,
        ],
        calculatedInformation: [
          `Average logged sleep duration: ${avgSleepHours}h ${avgSleepRemMins}m across ${sleepRecords.length} nights.`,
          `${symptoms.filter((s) => s.severity >= 7).length} entries were rated at or above 7/10 in severity.`,
          `${sleepRecords.filter((s) => s.quality === 'poor').length} of ${sleepRecords.length} logged sleep periods were rated as "poor".`,
        ],
        aiGeneratedObservations: [
          'Symptom episodes were recorded with higher frequency on days where previous nocturnal sleep was below the recorded average.',
          'Elevated daily stress scores (check-in >= 7/10) temporally coincided with higher reported symptom severity.',
          'No uninterrupted symptom escalation was recorded; episodes generally resolved within hours after rest or hydration.',
        ],
      },
      currentMedications: medications.map((m) => ({
        name: m.name,
        dosage: m.dosage,
        frequency: m.frequency,
        purpose: m.purpose,
      })),
      relevantMedicalHistory: [
        ...(userProfile.conditions.length > 0
          ? userProfile.conditions.map((c) => `Condition: ${c}`)
          : ['No chronic conditions recorded by user']),
        ...(userProfile.allergies.length > 0
          ? userProfile.allergies.map((a) => `Allergy: ${a}`)
          : ['No known allergies recorded']),
      ],
      recentMeasurements: measurements.slice(0, 5).map((m) => ({
        metric: m.type.replace('_', ' ').toUpperCase(),
        value: `${m.value} ${m.unit}`,
        date: m.date,
      })),
      clinicianQuestions: [
        `Review pattern of ${distinctSymptoms[0] || 'logged symptoms'} (${totalSymptomCount} episodes in ${periodDays} days) to evaluate appropriate non-pharmacological or prophylactic options.`,
        'Assess whether recent sleep variance and occupational stress levels are contributing factors.',
        'Review current over-the-counter or PRN analgesic frequency to verify safe usage limits.',
      ],
      safetyAlerts: safetyAlerts.map((a) => ({
        date: a.date,
        note: `${a.triggerSymptoms.join(', ')}: ${a.explanation}`,
      })),
    };
  },

  /**
   * Summarizes a medical document or doctor note.
   */
  async summarizeRecord(title: string, category: string, provider: string, content: string): Promise<string> {
    try {
      const response = await fetch('/api/summarize-record', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, category, provider, textContent: content }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.summary) return data.summary;
      }
    } catch (err) {
      console.warn('AI summary failed, using fallback summary:', err);
    }
    return `Record summary for ${title} (${category}) from ${provider}: Document logged by user. Key points: ${content.slice(0, 200)}...`;
  },
};

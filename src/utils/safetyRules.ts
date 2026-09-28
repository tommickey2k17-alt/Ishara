/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertSeverity, SafetyAlert, SymptomEpisode } from '../types';

export interface RedFlagRule {
  id: string;
  name: string;
  keywords: string[];
  secondaryKeywords?: string[];
  severityThreshold?: number; // e.g. >= 8
  level: AlertSeverity;
  explanation: string;
  recommendedAction: string;
}

export const EMERGENCY_NUMBERS: Record<string, { number: string; name: string }> = {
  US: { number: '911', name: 'United States (911)' },
  IN: { number: '112', name: 'India (112)' },
  UK: { number: '999', name: 'United Kingdom (999)' },
  CA: { number: '911', name: 'Canada (911)' },
  AU: { number: '000', name: 'Australia (000)' },
  EU: { number: '112', name: 'European Union (112)' },
  DEFAULT: { number: '112', name: 'Emergency Medical Services (112 / 911)' },
};

// Deterministic Red-Flag Rules based on established clinical triage criteria
export const RED_FLAG_RULES: RedFlagRule[] = [
  {
    id: 'chest_pain_urgent',
    name: 'Chest Pain or Pressure',
    keywords: ['chest pain', 'chest pressure', 'tightness in chest', 'crushing chest'],
    secondaryKeywords: ['breath', 'arm', 'jaw', 'sweat', 'nausea', 'dizzy', 'radiating'],
    level: 'emergency_care',
    explanation: 'Chest discomfort, especially when accompanied by difficulty breathing, radiation to the arm/jaw, or sweating, requires immediate clinical assessment.',
    recommendedAction: 'Seek emergency medical evaluation immediately. Do not drive yourself to the emergency department.',
  },
  {
    id: 'thunderclap_headache',
    name: 'Sudden Severe Headache',
    keywords: ['worst headache of life', 'thunderclap', 'explosive headache', 'sudden severe headache'],
    severityThreshold: 8,
    level: 'emergency_care',
    explanation: 'An abrupt, exceptionally severe headache that peaks within seconds or minutes warrants prompt emergency medical evaluation.',
    recommendedAction: 'Seek emergency medical attention immediately for acute clinical evaluation.',
  },
  {
    id: 'neurological_focal_deficits',
    name: 'Sudden Neurological Changes',
    keywords: ['facial droop', 'face drooping', 'slurred speech', 'arm weakness', 'numbness on one side', 'vision loss sudden', 'cannot speak'],
    level: 'emergency_care',
    explanation: 'Sudden unilateral weakness, facial asymmetry, or speech disturbances are urgent symptoms requiring immediate emergency triage (FAST criteria).',
    recommendedAction: 'Contact emergency medical services right away. Note the exact time symptoms started.',
  },
  {
    id: 'severe_respiratory_distress',
    name: 'Severe Shortness of Breath',
    keywords: ['cannot breathe', 'gasping for air', 'severe shortness of breath', 'blue lips', 'stridor'],
    level: 'emergency_care',
    explanation: 'Severe breathlessness or inability to speak full sentences is a critical respiratory sign that requires emergency intervention.',
    recommendedAction: 'Call your local emergency number or proceed directly to an emergency department.',
  },
  {
    id: 'fever_with_meningism',
    name: 'High Fever with Stiff Neck or Altered State',
    keywords: ['fever', 'high temperature'],
    secondaryKeywords: ['stiff neck', 'confusion', 'disoriented', 'photophobia', 'rash dark', 'petechiae'],
    level: 'emergency_care',
    explanation: 'Fever presenting alongside severe neck rigidity, light intolerance, or mental confusion warrants urgent medical assessment.',
    recommendedAction: 'Seek immediate emergency clinical care.',
  },
  {
    id: 'severe_bleeding_or_hemoptysis',
    name: 'Active Bleeding / Hemoptysis / Hematemesis',
    keywords: ['coughing blood', 'vomiting blood', 'black tarry stool', 'rectal bleeding heavy'],
    level: 'emergency_care',
    explanation: 'Coughing up blood or vomiting blood represents internal blood loss that necessitates prompt clinical investigation.',
    recommendedAction: 'Seek urgent or emergency medical evaluation without delay.',
  },
  {
    id: 'persistent_severe_pain',
    name: 'Extreme Intractable Pain',
    keywords: ['pain', 'ache', 'cramp'],
    severityThreshold: 9,
    level: 'urgent_medical_evaluation',
    explanation: 'Pain rated at 9/10 or 10/10 that is relentless or worsening indicates significant distress requiring direct clinical review.',
    recommendedAction: 'Contact a healthcare provider, visit an urgent care center, or seek medical advice promptly.',
  },
  {
    id: 'high_fever_persistent',
    name: 'Marked Hyperthermia',
    keywords: ['fever', 'high temp', 'chills'],
    severityThreshold: 7,
    level: 'urgent_medical_evaluation',
    explanation: 'High fever that is sustained or unresponsive to typical self-care measures warrants professional evaluation.',
    recommendedAction: 'Consult a physician or visit an urgent care clinic for diagnostic evaluation.',
  },
];

/**
 * Deterministically checks a symptom episode or raw text against red flag criteria.
 * Strictly avoids diagnosing any condition.
 */
export function evaluateRedFlags(
  symptom: Partial<SymptomEpisode>,
  rawText?: string,
  userCountry = 'DEFAULT'
): SafetyAlert | null {
  const combinedText = [
    symptom.symptomName || '',
    symptom.characterDescription || '',
    symptom.location || '',
    ...(symptom.associatedSymptoms || []),
    symptom.userNotes || '',
    symptom.contextNotes || '',
    rawText || '',
  ]
    .join(' ')
    .toLowerCase();

  const severity = symptom.severity ?? 0;

  for (const rule of RED_FLAG_RULES) {
    const primaryMatch = rule.keywords.some((kw) => combinedText.includes(kw.toLowerCase()));
    if (!primaryMatch) continue;

    // Check secondary keywords if specified
    if (rule.secondaryKeywords && rule.secondaryKeywords.length > 0) {
      const secondaryMatch = rule.secondaryKeywords.some((kw) => combinedText.includes(kw.toLowerCase()));
      if (!secondaryMatch && (!rule.severityThreshold || severity < rule.severityThreshold)) {
        continue;
      }
    }

    // Check severity threshold if specified
    if (rule.severityThreshold && severity < rule.severityThreshold) {
      continue;
    }

    const emergency = EMERGENCY_NUMBERS[userCountry] || EMERGENCY_NUMBERS.DEFAULT;

    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      level: rule.level,
      triggerSymptoms: [symptom.symptomName || rule.name],
      explanation: rule.explanation,
      recommendedAction: rule.recommendedAction,
      emergencyNumber: emergency.number,
      countryCode: userCountry,
      dismissed: false,
    };
  }

  // General high severity flag (> 8) for any unexplained symptom
  if (severity >= 9) {
    const emergency = EMERGENCY_NUMBERS[userCountry] || EMERGENCY_NUMBERS.DEFAULT;
    return {
      id: `alert-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      date: new Date().toISOString().split('T')[0],
      level: 'urgent_medical_evaluation',
      triggerSymptoms: [symptom.symptomName || 'Severe symptom'],
      explanation: 'You recorded a severity score of 9 or 10. Very severe symptoms warrant prompt clinical evaluation by a medical professional.',
      recommendedAction: 'Contact a healthcare provider or visit an urgent care facility for prompt assessment.',
      emergencyNumber: emergency.number,
      countryCode: userCountry,
      dismissed: false,
    };
  }

  return null;
}

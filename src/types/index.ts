/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type SeverityScore = number; // 0 to 10

export type ClinicalTriState = 'yes' | 'no' | 'not_recorded';

export type DataProvenance = 'user_fact' | 'calculated' | 'ai_observation';

export type SymptomCategory =
  | 'neurological'
  | 'respiratory'
  | 'gastrointestinal'
  | 'musculoskeletal'
  | 'cardiovascular'
  | 'dermatological'
  | 'general'
  | 'mental_health'
  | 'other';

export type SymptomFrequency =
  | 'constant'
  | 'intermittent'
  | 'single_episode'
  | 'fluctuating';

export interface SymptomEpisode {
  id: string;
  symptomName: string;
  category: SymptomCategory;
  timestamp: string; // ISO string
  date: string; // YYYY-MM-DD
  startTime: string; // e.g. "08:30" or "Morning"
  endTime?: string;
  isResolved: boolean;
  severity: SeverityScore; // 0 - 10
  frequency: SymptomFrequency;
  duration: string; // e.g. "3 hours", "Ongoing"
  location: string; // e.g. "Frontal forehead", "Lower back"
  characterDescription: string; // e.g. "Throbbing", "Sharp", "Dull ache"
  triggers: string[]; // e.g. "Screen time", "Dehydration", "Stress"
  relievingFactors: string[]; // e.g. "Rest in dark room", "Hydration"
  associatedSymptoms: string[]; // e.g. "Mild nausea", "Light sensitivity"
  contextNotes?: string; // e.g. "Slept poorly night before"
  userNotes: string;
  isRecurring: boolean;
  medicallyEvaluated: boolean;
  evaluatedNotes?: string;
  // Clinical Tri-State flags so missing is never assumed negative
  medicallyEvaluatedState?: ClinicalTriState;
  priorOccurrenceState?: ClinicalTriState;
  feverReported?: ClinicalTriState;
  hasAssociatedSymptomsState?: ClinicalTriState;
  worseningProgressionState?: ClinicalTriState;
  // User suspicion / hypothesis stored strictly as unconfirmed concern
  userSuspicionOrConcern?: string;
  safetyFlagged?: boolean;
  safetyNotes?: string;
}

export type SleepQuality = 'poor' | 'okay' | 'good' | 'excellent';

export interface SleepRecord {
  id: string;
  date: string; // YYYY-MM-DD
  bedtime: string; // "23:00"
  wakeTime: string; // "07:00"
  totalMinutes: number; // e.g. 480 (8h)
  quality: SleepQuality;
  nightAwakenings: number;
  daytimeSleepMinutes?: number;
  isShiftOrNightWork: boolean;
  restfulnessRating: number; // 1 - 5
  notes?: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string; // e.g. "500mg", "2000 IU"
  frequency: string; // e.g. "Once daily morning", "As needed"
  purpose?: string; // e.g. "Headache relief", "Daily supplement"
  startDate: string;
  isActive: boolean;
  takenToday?: boolean;
  timeToday?: string;
}

export type MetricKey =
  | 'energy'
  | 'mood'
  | 'stress'
  | 'appetite'
  | 'hydration'
  | 'exercise'
  | 'temperature'
  | 'weight'
  | 'blood_pressure'
  | 'heart_rate';

export interface DailyCheckIn {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string;
  sleepQuality: SleepQuality;
  sleepHours: number;
  energyLevel: number; // 0 - 10
  moodLevel: 'low' | 'neutral' | 'calm' | 'good' | 'elevated';
  stressLevel: number; // 0 - 10
  appetiteLevel?: 'poor' | 'normal' | 'high';
  hydrationGlasses?: number; // e.g. 8 glasses
  exerciseMinutes?: number;
  temperature?: number; // in Celsius or Fahrenheit
  weight?: number; // in kg
  bloodPressure?: string; // e.g. "120/80"
  systolicBP?: number;
  diastolicBP?: number;
  newSymptoms: boolean;
  newSymptomsNotes?: string;
  symptomsWorse: boolean;
  symptomsWorseNotes?: string;
  takenRegularMedications: boolean;
  missedMedicationNotes?: string;
  unusualEventsNotes?: string;
}

export interface MeasurementRecord {
  id: string;
  date: string;
  timestamp: string;
  type: MetricKey;
  value: number | string; // e.g. 74.5 or "120/80"
  unit: string;
  notes?: string;
}

export interface MedicalRecordItem {
  id: string;
  date: string;
  providerOrClinic: string;
  category: 'lab_report' | 'prescription' | 'doctor_notes' | 'imaging' | 'treatment' | 'other';
  title: string;
  userNotes: string;
  documentSummary?: string;
  isAiSummary?: boolean;
  fileName?: string;
}

export interface DoctorVisit {
  id: string;
  date: string;
  doctorName: string;
  specialty: string;
  clinic: string;
  reasonForVisit: string;
  keyDiscussionNotes: string;
  nextSteps: string;
}

export type AlertSeverity = 'urgent_medical_evaluation' | 'emergency_care' | 'monitor_closely';

export interface SafetyAlert {
  id: string;
  timestamp: string;
  date: string;
  level: AlertSeverity;
  triggerSymptoms: string[];
  explanation: string;
  recommendedAction: string;
  emergencyNumber: string;
  countryCode: string;
  dismissed: boolean;
  dismissedAt?: string;
}

export interface DoctorReport {
  id: string;
  generatedAt: string;
  periodLabel: string;
  periodDays: number;
  reasonForVisit?: string;
  whatChanged?: string[];
  symptomTrajectory?: 'improving' | 'stable' | 'fluctuating' | 'worsening';
  trajectorySummary?: string;
  trajectoryNotes?: string;
  patientSummary: {
    name: string;
    age: number;
    sex: string;
    bloodGroup?: string;
    country: string;
  };
  primaryConcerns: string[];
  symptomTimeline: Array<{
    date: string;
    symptom: string;
    severity: string;
    duration: string;
    details: string;
  }>;
  patternsObserved: {
    userReportedFacts: string[];
    calculatedInformation: string[];
    aiGeneratedObservations: string[];
  };
  currentMedications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    purpose?: string;
  }>;
  relevantMedicalHistory: string[];
  recentMeasurements: Array<{
    metric: string;
    value: string;
    date: string;
  }>;
  clinicianQuestions: string[];
  safetyAlerts: Array<{
    date: string;
    note: string;
  }>;
}

export interface UserReportedConcern {
  id: string;
  text: string;
  dateAdded: string;
  status: 'unconfirmed_user_concern';
  notes?: string;
}

export interface UserProfile {
  id: string;
  name: string;
  age: number;
  birthDate?: string;
  sex: 'female' | 'male' | 'intersex' | 'prefer_not_to_say';
  country: string;
  timezone: string;
  emergencyPhone: string;
  conditions: string[];
  userReportedConcerns?: UserReportedConcern[];
  allergies: string[];
  trackedMetrics: MetricKey[];
  usualSleepSchedule: {
    bedtime: string;
    wakeTime: string;
    targetHours: number;
  };
  isDemoData: boolean;
}

export interface IntakeChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
  whyWeAsk?: string;
  options?: string[];
  inputType?: 'text' | 'severity_slider' | 'options' | 'duration' | 'timing';
}

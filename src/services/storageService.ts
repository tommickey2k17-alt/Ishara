/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  DailyCheckIn,
  DoctorReport,
  DoctorVisit,
  MeasurementRecord,
  MedicalRecordItem,
  MedicationItem,
  SafetyAlert,
  SleepRecord,
  SymptomEpisode,
  UserProfile,
} from '../types';
import {
  DEMO_DAILY_CHECKINS,
  DEMO_DOCTOR_REPORT,
  DEMO_DOCTOR_VISITS,
  DEMO_MEASUREMENTS,
  DEMO_MEDICATIONS,
  DEMO_MEDICAL_RECORDS,
  DEMO_SAFETY_ALERTS,
  DEMO_SLEEP_RECORDS,
  DEMO_SYMPTOMS,
  DEMO_USER_PROFILE,
} from '../data/demoData';

const STORAGE_KEYS = {
  USER_PROFILE: 'swasthya_user_profile_v1',
  SYMPTOMS: 'swasthya_symptoms_v1',
  SLEEP_RECORDS: 'swasthya_sleep_records_v1',
  MEDICATIONS: 'swasthya_medications_v1',
  CHECKINS: 'swasthya_daily_checkins_v1',
  MEASUREMENTS: 'swasthya_measurements_v1',
  MEDICAL_RECORDS: 'swasthya_medical_records_v1',
  DOCTOR_VISITS: 'swasthya_doctor_visits_v1',
  SAFETY_ALERTS: 'swasthya_safety_alerts_v1',
  REPORTS: 'swasthya_reports_v1',
  IS_DEMO: 'swasthya_is_demo_v1',
};

function getItem<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultValue;
    return JSON.parse(item) as T;
  } catch (err) {
    console.error(`Failed to read ${key} from storage:`, err);
    return defaultValue;
  }
}

function setItem<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Failed to save ${key} to storage:`, err);
  }
}

export const StorageService = {
  // Check if initial storage has been seeded
  isInitialized(): boolean {
    return localStorage.getItem(STORAGE_KEYS.USER_PROFILE) !== null;
  },

  // Initialize with demo data if fresh
  seedInitialData(forceDemo = false): void {
    if (!this.isInitialized() || forceDemo) {
      setItem(STORAGE_KEYS.USER_PROFILE, DEMO_USER_PROFILE);
      setItem(STORAGE_KEYS.SYMPTOMS, DEMO_SYMPTOMS);
      setItem(STORAGE_KEYS.SLEEP_RECORDS, DEMO_SLEEP_RECORDS);
      setItem(STORAGE_KEYS.MEDICATIONS, DEMO_MEDICATIONS);
      setItem(STORAGE_KEYS.CHECKINS, DEMO_DAILY_CHECKINS);
      setItem(STORAGE_KEYS.MEASUREMENTS, DEMO_MEASUREMENTS);
      setItem(STORAGE_KEYS.MEDICAL_RECORDS, DEMO_MEDICAL_RECORDS);
      setItem(STORAGE_KEYS.DOCTOR_VISITS, DEMO_DOCTOR_VISITS);
      setItem(STORAGE_KEYS.SAFETY_ALERTS, DEMO_SAFETY_ALERTS);
      setItem(STORAGE_KEYS.REPORTS, [DEMO_DOCTOR_REPORT]);
      setItem(STORAGE_KEYS.IS_DEMO, true);
    }
  },

  // User Profile
  getUserProfile(): UserProfile {
    return getItem(STORAGE_KEYS.USER_PROFILE, DEMO_USER_PROFILE);
  },
  saveUserProfile(profile: UserProfile): void {
    setItem(STORAGE_KEYS.USER_PROFILE, profile);
    // Keep all stored doctor reports synchronized with current profile identity
    const currentReports = getItem<DoctorReport[]>(STORAGE_KEYS.REPORTS, []);
    if (currentReports.length > 0) {
      const patientName = profile.name?.trim() || 'Not provided';
      const patientSex = profile.sex && profile.sex !== 'prefer_not_to_say'
        ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)
        : 'Not provided';
      const patientCountry = profile.country?.trim() || 'Not provided';
      const patientAge = profile.age && profile.age > 0 ? profile.age : 0;

      const updatedReports = currentReports.map((rep) => ({
        ...rep,
        patientSummary: {
          ...rep.patientSummary,
          name: patientName,
          age: patientAge,
          sex: patientSex,
          country: patientCountry,
        },
        relevantMedicalHistory: [
          ...(profile.conditions && profile.conditions.length > 0
            ? profile.conditions.map((c) => `Documented condition: ${c}`)
            : ['Conditions: Not provided']),
          ...(profile.allergies && profile.allergies.length > 0
            ? profile.allergies.map((a) => `Allergy: ${a}`)
            : ['Allergies: Not provided']),
        ],
      }));
      setItem(STORAGE_KEYS.REPORTS, updatedReports);
    }
  },

  // Symptoms
  getSymptoms(): SymptomEpisode[] {
    return getItem(STORAGE_KEYS.SYMPTOMS, DEMO_SYMPTOMS);
  },
  saveSymptoms(symptoms: SymptomEpisode[]): void {
    setItem(STORAGE_KEYS.SYMPTOMS, symptoms);
  },
  addSymptom(symptom: SymptomEpisode): void {
    const list = this.getSymptoms();
    const updated = [symptom, ...list];
    this.saveSymptoms(updated);
  },
  updateSymptom(id: string, updates: Partial<SymptomEpisode>): void {
    const list = this.getSymptoms();
    const index = list.findIndex((s) => s.id === id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updates };
      this.saveSymptoms(list);
    }
  },
  deleteSymptom(id: string): void {
    const list = this.getSymptoms().filter((s) => s.id !== id);
    this.saveSymptoms(list);
  },

  // Sleep
  getSleepRecords(): SleepRecord[] {
    return getItem(STORAGE_KEYS.SLEEP_RECORDS, DEMO_SLEEP_RECORDS);
  },
  saveSleepRecords(records: SleepRecord[]): void {
    setItem(STORAGE_KEYS.SLEEP_RECORDS, records);
  },
  addSleepRecord(record: SleepRecord): void {
    const list = this.getSleepRecords();
    const existingIndex = list.findIndex((r) => r.date === record.date);
    if (existingIndex >= 0) {
      list[existingIndex] = record;
      this.saveSleepRecords(list);
    } else {
      this.saveSleepRecords([record, ...list]);
    }
  },

  // Medications
  getMedications(): MedicationItem[] {
    return getItem(STORAGE_KEYS.MEDICATIONS, DEMO_MEDICATIONS);
  },
  saveMedications(meds: MedicationItem[]): void {
    setItem(STORAGE_KEYS.MEDICATIONS, meds);
  },
  toggleMedicationTaken(id: string): void {
    const meds = this.getMedications();
    const index = meds.findIndex((m) => m.id === id);
    if (index >= 0) {
      const current = meds[index].takenToday;
      meds[index].takenToday = !current;
      meds[index].timeToday = !current
        ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : undefined;
      this.saveMedications(meds);
    }
  },
  addMedication(med: MedicationItem): void {
    const list = this.getMedications();
    this.saveMedications([...list, med]);
  },

  // Daily CheckIns
  getCheckIns(): DailyCheckIn[] {
    return getItem(STORAGE_KEYS.CHECKINS, DEMO_DAILY_CHECKINS);
  },
  saveCheckIns(checkIns: DailyCheckIn[]): void {
    setItem(STORAGE_KEYS.CHECKINS, checkIns);
  },
  addCheckIn(checkIn: DailyCheckIn): void {
    const list = this.getCheckIns();
    const filtered = list.filter((c) => c.date !== checkIn.date);
    this.saveCheckIns([checkIn, ...filtered]);
  },

  // Measurements
  getMeasurements(): MeasurementRecord[] {
    return getItem(STORAGE_KEYS.MEASUREMENTS, DEMO_MEASUREMENTS);
  },
  addMeasurement(meas: MeasurementRecord): void {
    const list = this.getMeasurements();
    setItem(STORAGE_KEYS.MEASUREMENTS, [meas, ...list]);
  },

  // Medical Records
  getMedicalRecords(): MedicalRecordItem[] {
    return getItem(STORAGE_KEYS.MEDICAL_RECORDS, DEMO_MEDICAL_RECORDS);
  },
  addMedicalRecord(rec: MedicalRecordItem): void {
    const list = this.getMedicalRecords();
    setItem(STORAGE_KEYS.MEDICAL_RECORDS, [rec, ...list]);
  },

  // Doctor Visits
  getDoctorVisits(): DoctorVisit[] {
    return getItem(STORAGE_KEYS.DOCTOR_VISITS, DEMO_DOCTOR_VISITS);
  },
  addDoctorVisit(visit: DoctorVisit): void {
    const list = this.getDoctorVisits();
    setItem(STORAGE_KEYS.DOCTOR_VISITS, [visit, ...list]);
  },

  // Safety Alerts
  getSafetyAlerts(): SafetyAlert[] {
    return getItem(STORAGE_KEYS.SAFETY_ALERTS, DEMO_SAFETY_ALERTS);
  },
  addSafetyAlert(alert: SafetyAlert): void {
    const list = this.getSafetyAlerts();
    setItem(STORAGE_KEYS.SAFETY_ALERTS, [alert, ...list]);
  },
  dismissSafetyAlert(id: string): void {
    const list = this.getSafetyAlerts();
    const index = list.findIndex((a) => a.id === id);
    if (index >= 0) {
      list[index].dismissed = true;
      list[index].dismissedAt = new Date().toISOString();
      setItem(STORAGE_KEYS.SAFETY_ALERTS, list);
    }
  },

  // Reports
  getReports(): DoctorReport[] {
    const reports = getItem<DoctorReport[]>(STORAGE_KEYS.REPORTS, []);
    const profile = this.getUserProfile();
    const patientName = profile.name?.trim() || 'Not provided';
    const patientSex = profile.sex && profile.sex !== 'prefer_not_to_say'
      ? profile.sex.charAt(0).toUpperCase() + profile.sex.slice(1)
      : 'Not provided';
    const patientCountry = profile.country?.trim() || 'Not provided';
    const patientAge = profile.age && profile.age > 0 ? profile.age : 0;

    const mapReportProfile = (rep: DoctorReport): DoctorReport => ({
      ...rep,
      patientSummary: {
        ...rep.patientSummary,
        name: patientName,
        age: patientAge,
        sex: patientSex,
        country: patientCountry,
      },
      relevantMedicalHistory: [
        ...(profile.conditions && profile.conditions.length > 0
          ? profile.conditions.map((c) => `Documented condition: ${c}`)
          : ['Conditions: Not provided']),
        ...(profile.allergies && profile.allergies.length > 0
          ? profile.allergies.map((a) => `Allergy: ${a}`)
          : ['Allergies: Not provided']),
      ],
    });

    if (reports.length > 0) {
      return reports.map(mapReportProfile);
    }

    return [mapReportProfile(DEMO_DOCTOR_REPORT)];
  },
  addReport(report: DoctorReport): void {
    const list = this.getReports();
    setItem(STORAGE_KEYS.REPORTS, [report, ...list]);
  },

  // Demo status
  isDemoMode(): boolean {
    return getItem(STORAGE_KEYS.IS_DEMO, true);
  },
  setDemoMode(val: boolean): void {
    setItem(STORAGE_KEYS.IS_DEMO, val);
  },

  // Clear all data
  clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach((k) => localStorage.removeItem(k));
    // Reset with blank uninitialized profile
    const blankProfile: UserProfile = {
      id: `user-${Date.now()}`,
      name: '',
      age: 0,
      sex: 'prefer_not_to_say',
      country: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      emergencyPhone: '',
      conditions: [],
      allergies: [],
      trackedMetrics: ['energy', 'mood', 'stress', 'hydration', 'temperature', 'weight', 'blood_pressure'],
      usualSleepSchedule: {
        bedtime: '23:00',
        wakeTime: '07:00',
        targetHours: 8,
      },
      isDemoData: false,
    };
    setItem(STORAGE_KEYS.USER_PROFILE, blankProfile);
    setItem(STORAGE_KEYS.SYMPTOMS, []);
    setItem(STORAGE_KEYS.SLEEP_RECORDS, []);
    setItem(STORAGE_KEYS.MEDICATIONS, []);
    setItem(STORAGE_KEYS.CHECKINS, []);
    setItem(STORAGE_KEYS.MEASUREMENTS, []);
    setItem(STORAGE_KEYS.MEDICAL_RECORDS, []);
    setItem(STORAGE_KEYS.DOCTOR_VISITS, []);
    setItem(STORAGE_KEYS.SAFETY_ALERTS, []);
    setItem(STORAGE_KEYS.REPORTS, []);
    setItem(STORAGE_KEYS.IS_DEMO, false);
  },

  // Import full health data from JSON backup
  importDataJSON(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.userProfile || data.profile) {
        setItem(STORAGE_KEYS.USER_PROFILE, data.userProfile || data.profile);
      }
      if (Array.isArray(data.symptoms)) {
        setItem(STORAGE_KEYS.SYMPTOMS, data.symptoms);
      }
      if (Array.isArray(data.sleepRecords)) {
        setItem(STORAGE_KEYS.SLEEP_RECORDS, data.sleepRecords);
      }
      if (Array.isArray(data.medications)) {
        setItem(STORAGE_KEYS.MEDICATIONS, data.medications);
      }
      if (Array.isArray(data.dailyCheckIns || data.checkIns)) {
        setItem(STORAGE_KEYS.CHECKINS, data.dailyCheckIns || data.checkIns);
      }
      if (Array.isArray(data.measurements)) {
        setItem(STORAGE_KEYS.MEASUREMENTS, data.measurements);
      }
      if (Array.isArray(data.medicalRecords)) {
        setItem(STORAGE_KEYS.MEDICAL_RECORDS, data.medicalRecords);
      }
      if (Array.isArray(data.doctorVisits)) {
        setItem(STORAGE_KEYS.DOCTOR_VISITS, data.doctorVisits);
      }
      if (Array.isArray(data.safetyAlerts)) {
        setItem(STORAGE_KEYS.SAFETY_ALERTS, data.safetyAlerts);
      }
      if (Array.isArray(data.reports || data.doctorReports)) {
        setItem(STORAGE_KEYS.REPORTS, data.reports || data.doctorReports);
      }
      setItem(STORAGE_KEYS.IS_DEMO, false);
      return true;
    } catch (err) {
      console.error('Failed to import JSON data:', err);
      return false;
    }
  },

  // Export full health data as JSON
  exportDataJSON(): string {
    const fullPayload = {
      app: 'Ishara',
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      disclaimer: 'This data is an export of user-recorded personal health observations. It does not constitute a medical diagnosis or medical record certified by a health authority.',
      userProfile: this.getUserProfile(),
      symptoms: this.getSymptoms(),
      sleepRecords: this.getSleepRecords(),
      medications: this.getMedications(),
      dailyCheckIns: this.getCheckIns(),
      measurements: this.getMeasurements(),
      medicalRecords: this.getMedicalRecords(),
      doctorVisits: this.getDoctorVisits(),
      safetyAlerts: this.getSafetyAlerts(),
      reports: this.getReports(),
    };
    return JSON.stringify(fullPayload, null, 2);
  },

  // Export symptoms as CSV
  exportSymptomsCSV(): string {
    const symptoms = this.getSymptoms();
    const headers = [
      'ID',
      'Date',
      'Time',
      'Symptom Name',
      'Severity (0-10)',
      'Frequency',
      'Duration',
      'Location',
      'Description',
      'Triggers',
      'Relieving Factors',
      'Associated Symptoms',
      'Is Resolved',
      'Is Recurring',
      'Medically Evaluated',
      'User Notes',
    ];

    const rows = symptoms.map((s) => [
      `"${s.id}"`,
      `"${s.date}"`,
      `"${s.startTime}"`,
      `"${s.symptomName.replace(/"/g, '""')}"`,
      s.severity,
      `"${s.frequency}"`,
      `"${s.duration || ''}"`,
      `"${(s.location || '').replace(/"/g, '""')}"`,
      `"${(s.characterDescription || '').replace(/"/g, '""')}"`,
      `"${(s.triggers || []).join('; ').replace(/"/g, '""')}"`,
      `"${(s.relievingFactors || []).join('; ').replace(/"/g, '""')}"`,
      `"${(s.associatedSymptoms || []).join('; ').replace(/"/g, '""')}"`,
      s.isResolved ? 'Yes' : 'No',
      s.isRecurring ? 'Yes' : 'No',
      s.medicallyEvaluated ? 'Yes' : 'No',
      `"${(s.userNotes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  },
};

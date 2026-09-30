/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
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

// Helper to remove undefined fields because Firestore throws on undefined
function cleanPayload<T extends Record<string, any>>(obj: T): Record<string, any> {
  const result: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val !== undefined) {
      if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
        result[key] = cleanPayload(val);
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

export const FirestoreService = {
  // ===================== USER PROFILE =====================
  async getUserProfile(uid: string): Promise<UserProfile | null> {
    const path = `users/${uid}/profile/main`;
    try {
      const docRef = doc(db, 'users', uid, 'profile', 'main');
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        return null;
      }
      return snap.data() as UserProfile;
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    }
  },

  async saveUserProfile(uid: string, profile: UserProfile): Promise<void> {
    const path = `users/${uid}/profile/main`;
    try {
      const docRef = doc(db, 'users', uid, 'profile', 'main');
      const cleaned = cleanPayload({
        ...profile,
        id: uid,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(docRef, cleaned, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // ===================== SYMPTOMS =====================
  async getSymptoms(uid: string): Promise<SymptomEpisode[]> {
    const path = `users/${uid}/symptoms`;
    try {
      const colRef = collection(db, 'users', uid, 'symptoms');
      const q = query(colRef, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const items: SymptomEpisode[] = [];
      snap.forEach((d) => {
        items.push(d.data() as SymptomEpisode);
      });
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async addSymptom(uid: string, symptom: SymptomEpisode): Promise<void> {
    const path = `users/${uid}/symptoms/${symptom.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'symptoms', symptom.id);
      const cleaned = cleanPayload({
        ...symptom,
        userId: uid,
      });
      await setDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateSymptom(uid: string, id: string, updates: Partial<SymptomEpisode>): Promise<void> {
    const path = `users/${uid}/symptoms/${id}`;
    try {
      const docRef = doc(db, 'users', uid, 'symptoms', id);
      const cleaned = cleanPayload(updates);
      await updateDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteSymptom(uid: string, id: string): Promise<void> {
    const path = `users/${uid}/symptoms/${id}`;
    try {
      const docRef = doc(db, 'users', uid, 'symptoms', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // ===================== SLEEP RECORDS =====================
  async getSleepRecords(uid: string): Promise<SleepRecord[]> {
    const path = `users/${uid}/sleep`;
    try {
      const colRef = collection(db, 'users', uid, 'sleep');
      const q = query(colRef, orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const items: SleepRecord[] = [];
      snap.forEach((d) => {
        items.push(d.data() as SleepRecord);
      });
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async addSleepRecord(uid: string, record: SleepRecord): Promise<void> {
    const path = `users/${uid}/sleep/${record.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'sleep', record.id);
      const cleaned = cleanPayload({
        ...record,
        userId: uid,
      });
      await setDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // ===================== MEDICATIONS =====================
  async getMedications(uid: string): Promise<MedicationItem[]> {
    const path = `users/${uid}/medications`;
    try {
      const colRef = collection(db, 'users', uid, 'medications');
      const snap = await getDocs(colRef);
      const items: MedicationItem[] = [];
      snap.forEach((d) => {
        items.push(d.data() as MedicationItem);
      });
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async addMedication(uid: string, med: MedicationItem): Promise<void> {
    const path = `users/${uid}/medications/${med.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'medications', med.id);
      const cleaned = cleanPayload({
        ...med,
        userId: uid,
      });
      await setDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async updateMedication(uid: string, id: string, updates: Partial<MedicationItem>): Promise<void> {
    const path = `users/${uid}/medications/${id}`;
    try {
      const docRef = doc(db, 'users', uid, 'medications', id);
      const cleaned = cleanPayload(updates);
      await updateDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },

  async deleteMedication(uid: string, id: string): Promise<void> {
    const path = `users/${uid}/medications/${id}`;
    try {
      const docRef = doc(db, 'users', uid, 'medications', id);
      await deleteDoc(docRef);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, path);
    }
  },

  // ===================== MEASUREMENTS =====================
  async getMeasurements(uid: string): Promise<MeasurementRecord[]> {
    const path = `users/${uid}/measurements`;
    try {
      const colRef = collection(db, 'users', uid, 'measurements');
      const q = query(colRef, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const items: MeasurementRecord[] = [];
      snap.forEach((d) => {
        items.push(d.data() as MeasurementRecord);
      });
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async addMeasurement(uid: string, record: MeasurementRecord): Promise<void> {
    const path = `users/${uid}/measurements/${record.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'measurements', record.id);
      const cleaned = cleanPayload({
        ...record,
        userId: uid,
      });
      await setDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // ===================== MEDICAL RECORDS =====================
  async getMedicalRecords(uid: string): Promise<MedicalRecordItem[]> {
    const path = `users/${uid}/medicalRecords`;
    try {
      const colRef = collection(db, 'users', uid, 'medicalRecords');
      const q = query(colRef, orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const items: MedicalRecordItem[] = [];
      snap.forEach((d) => {
        items.push(d.data() as MedicalRecordItem);
      });
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async addMedicalRecord(uid: string, record: MedicalRecordItem): Promise<void> {
    const path = `users/${uid}/medicalRecords/${record.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'medicalRecords', record.id);
      const cleaned = cleanPayload({
        ...record,
        userId: uid,
      });
      await setDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // ===================== DOCTOR REPORTS =====================
  async getReports(uid: string): Promise<DoctorReport[]> {
    const path = `users/${uid}/reports`;
    try {
      const colRef = collection(db, 'users', uid, 'reports');
      const q = query(colRef, orderBy('generatedAt', 'desc'));
      const snap = await getDocs(q);
      const items: DoctorReport[] = [];
      snap.forEach((d) => {
        items.push(d.data() as DoctorReport);
      });
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async saveReport(uid: string, report: DoctorReport): Promise<void> {
    const path = `users/${uid}/reports/${report.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'reports', report.id);
      const cleaned = cleanPayload({
        ...report,
        userId: uid,
      });
      await setDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // ===================== DAILY CHECK-INS =====================
  async getCheckIns(uid: string): Promise<DailyCheckIn[]> {
    const path = `users/${uid}/checkins`;
    try {
      const colRef = collection(db, 'users', uid, 'checkins');
      const q = query(colRef, orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const items: DailyCheckIn[] = [];
      snap.forEach((d) => {
        items.push(d.data() as DailyCheckIn);
      });
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async addCheckIn(uid: string, checkIn: DailyCheckIn): Promise<void> {
    const path = `users/${uid}/checkins/${checkIn.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'checkins', checkIn.id);
      const cleaned = cleanPayload({
        ...checkIn,
        userId: uid,
      });
      await setDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // ===================== DOCTOR VISITS =====================
  async getDoctorVisits(uid: string): Promise<DoctorVisit[]> {
    const path = `users/${uid}/doctorVisits`;
    try {
      const colRef = collection(db, 'users', uid, 'doctorVisits');
      const q = query(colRef, orderBy('date', 'desc'));
      const snap = await getDocs(q);
      const items: DoctorVisit[] = [];
      snap.forEach((d) => {
        items.push(d.data() as DoctorVisit);
      });
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async addDoctorVisit(uid: string, visit: DoctorVisit): Promise<void> {
    const path = `users/${uid}/doctorVisits/${visit.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'doctorVisits', visit.id);
      const cleaned = cleanPayload({
        ...visit,
        userId: uid,
      });
      await setDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  // ===================== SAFETY ALERTS =====================
  async getSafetyAlerts(uid: string): Promise<SafetyAlert[]> {
    const path = `users/${uid}/safetyAlerts`;
    try {
      const colRef = collection(db, 'users', uid, 'safetyAlerts');
      const q = query(colRef, orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const items: SafetyAlert[] = [];
      snap.forEach((d) => {
        items.push(d.data() as SafetyAlert);
      });
      return items;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, path);
    }
  },

  async addSafetyAlert(uid: string, alert: SafetyAlert): Promise<void> {
    const path = `users/${uid}/safetyAlerts/${alert.id}`;
    try {
      const docRef = doc(db, 'users', uid, 'safetyAlerts', alert.id);
      const cleaned = cleanPayload({
        ...alert,
        userId: uid,
      });
      await setDoc(docRef, cleaned);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
    }
  },

  async dismissSafetyAlert(uid: string, alertId: string): Promise<void> {
    const path = `users/${uid}/safetyAlerts/${alertId}`;
    try {
      const docRef = doc(db, 'users', uid, 'safetyAlerts', alertId);
      await updateDoc(docRef, {
        dismissed: true,
        dismissedAt: new Date().toISOString(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
    }
  },
};

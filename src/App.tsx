/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
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
} from './types';
import { onAuthStateChanged, type User, auth, logoutUser, testConnection } from './services/firebase';
import { FirestoreService } from './services/firestoreService';
import { LoginScreen } from './components/auth/LoginScreen';
import { Header } from './components/common/Header';
import { BottomNav } from './components/common/BottomNav';
import { SafetyBanner } from './components/common/SafetyBanner';
import { HomeDashboard } from './components/home/HomeDashboard';
import { SymptomDatabase } from './components/symptoms/SymptomDatabase';
import { SleepTracker } from './components/sleep/SleepTracker';
import { HealthTimeline } from './components/timeline/HealthTimeline';
import { TrendsAnalytics } from './components/trends/TrendsAnalytics';
import { MedicalRecordsView } from './components/records/MedicalRecordsView';
import { ProfileSettings } from './components/profile/ProfileSettings';
import { SymptomIntakeModal } from './components/intake/SymptomIntakeModal';
import { QuickLogModal } from './components/intake/QuickLogModal';
import { DailyCheckInModal } from './components/checkin/DailyCheckInModal';
import { DoctorReportModal } from './components/report/DoctorReportModal';
import { DoctorVisitMode } from './components/report/DoctorVisitMode';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { LogoutModal } from './components/common/LogoutModal';
import { DEMO_USER_PROFILE, DEMO_SYMPTOMS, DEMO_SLEEP_RECORDS, DEMO_MEDICATIONS, DEMO_DAILY_CHECKINS, DEMO_MEASUREMENTS, DEMO_MEDICAL_RECORDS, DEMO_DOCTOR_VISITS, DEMO_SAFETY_ALERTS, DEMO_DOCTOR_REPORT } from './data/demoData';

const BLANK_PROFILE: UserProfile = {
  id: '',
  name: '',
  age: 0,
  birthDate: '',
  sex: 'prefer_not_to_say',
  country: 'US',
  timezone: 'UTC',
  emergencyPhone: '',
  conditions: [],
  userReportedConcerns: [],
  allergies: [],
  trackedMetrics: ['energy', 'mood', 'stress'],
  usualSleepSchedule: {
    bedtime: '23:00',
    wakeTime: '07:00',
    targetHours: 8,
  },
  isDemoData: false,
};

export default function App() {
  // Authentication state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<string>('home');

  // Core domain state tied to authenticated Firestore UID
  const [userProfile, setUserProfile] = useState<UserProfile>(BLANK_PROFILE);
  const [symptoms, setSymptoms] = useState<SymptomEpisode[]>([]);
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>([]);
  const [medications, setMedications] = useState<MedicationItem[]>([]);
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>([]);
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordItem[]>([]);
  const [doctorVisits, setDoctorVisits] = useState<DoctorVisit[]>([]);
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>([]);
  const [reports, setReports] = useState<DoctorReport[]>([]);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);

  // Modal open/close state
  const [isSymptomIntakeOpen, setIsSymptomIntakeOpen] = useState(false);
  const [intakeInitialName, setIntakeInitialName] = useState<string>('');
  const [intakeInitialDraft, setIntakeInitialDraft] = useState<Partial<SymptomEpisode> | undefined>(undefined);

  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isDailyCheckInOpen, setIsDailyCheckInOpen] = useState(false);
  const [isDoctorReportOpen, setIsDoctorReportOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Clear in-memory sensitive data upon logout
  const clearLocalAppState = () => {
    setUserProfile(BLANK_PROFILE);
    setSymptoms([]);
    setSleepRecords([]);
    setMedications([]);
    setCheckIns([]);
    setMeasurements([]);
    setMedicalRecords([]);
    setDoctorVisits([]);
    setSafetyAlerts([]);
    setReports([]);
    setIsDemoMode(false);
    setActiveTab('home');
  };

  // Auth observer & initial per-user cloud hydration
  useEffect(() => {
    testConnection();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsDataLoading(true);
        try {
          // 1. Fetch user profile from Firestore: users/{uid}/profile/main
          let profile = await FirestoreService.getUserProfile(user.uid);
          if (!profile) {
            // First time login for this Google account: create initial profile
            profile = {
              id: user.uid,
              name: user.displayName || 'You',
              age: 0,
              birthDate: '',
              sex: 'prefer_not_to_say',
              country: 'US',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
              emergencyPhone: '',
              conditions: [],
              userReportedConcerns: [],
              allergies: [],
              trackedMetrics: ['energy', 'mood', 'stress', 'temperature', 'blood_pressure', 'heart_rate'],
              usualSleepSchedule: {
                bedtime: '23:00',
                wakeTime: '07:00',
                targetHours: 8,
              },
              isDemoData: false,
            };
            await FirestoreService.saveUserProfile(user.uid, profile);
          }
          setUserProfile(profile);

          // 2. Fetch all personal cloud collections for this user in parallel
          const [
            userSymptoms,
            userSleep,
            userMeds,
            userCheckIns,
            userMeasurements,
            userRecords,
            userVisits,
            userAlerts,
            userReports,
          ] = await Promise.all([
            FirestoreService.getSymptoms(user.uid),
            FirestoreService.getSleepRecords(user.uid),
            FirestoreService.getMedications(user.uid),
            FirestoreService.getCheckIns(user.uid),
            FirestoreService.getMeasurements(user.uid),
            FirestoreService.getMedicalRecords(user.uid),
            FirestoreService.getDoctorVisits(user.uid),
            FirestoreService.getSafetyAlerts(user.uid),
            FirestoreService.getReports(user.uid),
          ]);

          setSymptoms(userSymptoms || []);
          setSleepRecords(userSleep || []);
          setMedications(userMeds || []);
          setCheckIns(userCheckIns || []);
          setMeasurements(userMeasurements || []);
          setMedicalRecords(userRecords || []);
          setDoctorVisits(userVisits || []);
          setSafetyAlerts(userAlerts || []);
          setReports(userReports || []);
          setIsDemoMode(profile.isDemoData || false);
        } catch (err) {
          console.error('Failed to load user records from Firestore:', err);
        } finally {
          setIsDataLoading(false);
        }
      } else {
        clearLocalAppState();
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Prompt user with confirmation dialog before logging out
  const handlePromptSignOut = () => {
    setIsLogoutModalOpen(true);
  };

  // Confirmed logout: signs out of Firebase/Google and flushes active session memory
  // IMPORTANT: Does NOT delete or alter any user records in Firestore!
  const handleConfirmSignOut = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
      clearLocalAppState();
      setIsLogoutModalOpen(false);
    } catch (err) {
      console.error('Error signing out:', err);
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Check if daily checkin done today & today's measurements
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkIns.find((c) => c.date === todayStr);
  const todayBPMeasurement = measurements.find(
    (m) => m.date === todayStr && m.type === 'blood_pressure'
  );
  const todayWeightMeasurement = measurements.find(
    (m) => m.date === todayStr && m.type === 'weight'
  );
  const todayTempMeasurement = measurements.find(
    (m) => m.date === todayStr && m.type === 'temperature'
  );

  // Active (undismissed) safety alerts
  const activeAlert = safetyAlerts.find((a) => !a.dismissed);

  // Handlers for Firestore updates
  const handleSaveSymptom = async (symptom: SymptomEpisode, newAlert?: SafetyAlert) => {
    if (!currentUser) return;
    try {
      await FirestoreService.addSymptom(currentUser.uid, symptom);
      setSymptoms((prev) => [symptom, ...prev.filter((s) => s.id !== symptom.id)]);

      if (newAlert) {
        await FirestoreService.addSafetyAlert(currentUser.uid, newAlert);
        setSafetyAlerts((prev) => [newAlert, ...prev.filter((a) => a.id !== newAlert.id)]);
      }
    } catch (err) {
      console.error('Failed to save symptom:', err);
    }
  };

  const handleUpdateSymptom = async (id: string, updates: Partial<SymptomEpisode>) => {
    if (!currentUser) return;
    try {
      await FirestoreService.updateSymptom(currentUser.uid, id, updates);
      setSymptoms((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    } catch (err) {
      console.error('Failed to update symptom:', err);
    }
  };

  const handleDeleteSymptom = async (id: string) => {
    if (!currentUser) return;
    try {
      await FirestoreService.deleteSymptom(currentUser.uid, id);
      setSymptoms((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Failed to delete symptom:', err);
    }
  };

  const handleSaveSleep = async (sleep: SleepRecord) => {
    if (!currentUser) return;
    try {
      await FirestoreService.addSleepRecord(currentUser.uid, sleep);
      setSleepRecords((prev) => [sleep, ...prev.filter((s) => s.id !== sleep.id)]);
    } catch (err) {
      console.error('Failed to save sleep record:', err);
    }
  };

  const handleSaveMedication = async (med: MedicationItem) => {
    if (!currentUser) return;
    try {
      await FirestoreService.addMedication(currentUser.uid, med);
      setMedications((prev) => [med, ...prev.filter((m) => m.id !== med.id)]);
    } catch (err) {
      console.error('Failed to save medication:', err);
    }
  };

  const handleToggleMedication = async (id: string) => {
    if (!currentUser) return;
    const target = medications.find((m) => m.id === id);
    if (!target) return;
    const updatedStatus = !target.takenToday;
    const timeToday = updatedStatus
      ? new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : undefined;
    try {
      await FirestoreService.updateMedication(currentUser.uid, id, {
        takenToday: updatedStatus,
        timeToday,
      });
      setMedications((prev) =>
        prev.map((m) => (m.id === id ? { ...m, takenToday: updatedStatus, timeToday } : m))
      );
    } catch (err) {
      console.error('Failed to toggle medication:', err);
    }
  };

  const handleSaveCheckIn = async (
    checkIn: DailyCheckIn,
    vitals?: {
      systolic?: number;
      diastolic?: number;
      weight?: number;
      temperature?: number;
    }
  ) => {
    if (!currentUser) return;
    try {
      // 1. Save daily check-in to Firestore & React state
      await FirestoreService.addCheckIn(currentUser.uid, checkIn);
      setCheckIns((prev) => [checkIn, ...prev.filter((c) => c.id !== checkIn.id)]);

      // 2. Persist Vitals to the measurements collection (Single source of truth for Analytics/Trends/Timeline)
      const newMeasurements: MeasurementRecord[] = [];

      // Blood Pressure
      if (vitals?.systolic !== undefined && vitals?.diastolic !== undefined) {
        const existingBP = measurements.find(
          (m) => m.date === checkIn.date && m.type === 'blood_pressure'
        );
        const bpRecord: MeasurementRecord = {
          id: existingBP?.id || `meas-bp-${checkIn.date}`,
          date: checkIn.date,
          timestamp: new Date().toISOString(),
          type: 'blood_pressure',
          value: `${vitals.systolic}/${vitals.diastolic}`,
          unit: 'mmHg',
          notes: 'Daily check-in blood pressure reading',
        };
        await FirestoreService.addMeasurement(currentUser.uid, bpRecord);
        newMeasurements.push(bpRecord);
      }

      // Weight
      if (vitals?.weight !== undefined) {
        const existingWeight = measurements.find(
          (m) => m.date === checkIn.date && m.type === 'weight'
        );
        const weightRecord: MeasurementRecord = {
          id: existingWeight?.id || `meas-wt-${checkIn.date}`,
          date: checkIn.date,
          timestamp: new Date().toISOString(),
          type: 'weight',
          value: vitals.weight,
          unit: 'kg',
          notes: 'Daily check-in body weight reading',
        };
        await FirestoreService.addMeasurement(currentUser.uid, weightRecord);
        newMeasurements.push(weightRecord);
      }

      // Temperature
      if (vitals?.temperature !== undefined) {
        const existingTemp = measurements.find(
          (m) => m.date === checkIn.date && m.type === 'temperature'
        );
        const tempRecord: MeasurementRecord = {
          id: existingTemp?.id || `meas-temp-${checkIn.date}`,
          date: checkIn.date,
          timestamp: new Date().toISOString(),
          type: 'temperature',
          value: vitals.temperature,
          unit: '°C',
          notes: 'Daily check-in body temperature reading',
        };
        await FirestoreService.addMeasurement(currentUser.uid, tempRecord);
        newMeasurements.push(tempRecord);
      }

      // 3. Update React measurements state atomically without creating duplicates for today
      // and without touching prior days' measurements
      if (newMeasurements.length > 0) {
        setMeasurements((prev) => {
          const updatedKeys = new Set(newMeasurements.map((m) => `${m.date}_${m.type}`));
          const remaining = prev.filter((m) => !updatedKeys.has(`${m.date}_${m.type}`));
          return [...newMeasurements, ...remaining];
        });
      }
    } catch (err) {
      console.error('Failed to save checkin and measurements:', err);
    }
  };

  const handleSaveMeasurement = async (meas: MeasurementRecord) => {
    if (!currentUser) return;
    try {
      await FirestoreService.addMeasurement(currentUser.uid, meas);
      setMeasurements((prev) => [meas, ...prev.filter((m) => m.id !== meas.id)]);
    } catch (err) {
      console.error('Failed to save measurement:', err);
    }
  };

  const handleAddMedicalRecord = async (rec: MedicalRecordItem) => {
    if (!currentUser) return;
    try {
      await FirestoreService.addMedicalRecord(currentUser.uid, rec);
      setMedicalRecords((prev) => [rec, ...prev.filter((r) => r.id !== rec.id)]);
    } catch (err) {
      console.error('Failed to save medical record:', err);
    }
  };

  const handleAddDoctorVisit = async (visit: DoctorVisit) => {
    if (!currentUser) return;
    try {
      await FirestoreService.addDoctorVisit(currentUser.uid, visit);
      setDoctorVisits((prev) => [visit, ...prev.filter((v) => v.id !== visit.id)]);
    } catch (err) {
      console.error('Failed to save doctor visit:', err);
    }
  };

  const handleDismissSafetyAlert = async (id: string) => {
    if (!currentUser) return;
    try {
      await FirestoreService.dismissSafetyAlert(currentUser.uid, id);
      setSafetyAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, dismissed: true } : a)));
    } catch (err) {
      console.error('Failed to dismiss safety alert:', err);
    }
  };

  const handleSaveProfile = async (updated: UserProfile) => {
    if (!currentUser) return;
    try {
      await FirestoreService.saveUserProfile(currentUser.uid, updated);
      setUserProfile(updated);
    } catch (err) {
      console.error('Failed to save profile:', err);
    }
  };

  const handleSaveReport = async (newReport: DoctorReport) => {
    if (!currentUser) return;
    try {
      await FirestoreService.saveReport(currentUser.uid, newReport);
      setReports((prev) => [newReport, ...prev.filter((r) => r.id !== newReport.id)]);
    } catch (err) {
      console.error('Failed to save doctor report:', err);
    }
  };

  const handleResetDemoData = async () => {
    if (!currentUser) return;
    try {
      // Seed sample demonstration data into the user's personal cloud partition
      const demoProfile = { ...DEMO_USER_PROFILE, id: currentUser.uid, isDemoData: true };
      await FirestoreService.saveUserProfile(currentUser.uid, demoProfile);
      setUserProfile(demoProfile);

      // Seed sample symptoms
      for (const s of DEMO_SYMPTOMS) {
        await FirestoreService.addSymptom(currentUser.uid, s);
      }
      setSymptoms(DEMO_SYMPTOMS);

      // Seed sample sleep
      for (const sl of DEMO_SLEEP_RECORDS) {
        await FirestoreService.addSleepRecord(currentUser.uid, sl);
      }
      setSleepRecords(DEMO_SLEEP_RECORDS);

      // Seed sample medications
      for (const m of DEMO_MEDICATIONS) {
        await FirestoreService.addMedication(currentUser.uid, m);
      }
      setMedications(DEMO_MEDICATIONS);

      // Seed checkins, measurements, visits, records
      for (const c of DEMO_DAILY_CHECKINS) {
        await FirestoreService.addCheckIn(currentUser.uid, c);
      }
      setCheckIns(DEMO_DAILY_CHECKINS);

      for (const ms of DEMO_MEASUREMENTS) {
        await FirestoreService.addMeasurement(currentUser.uid, ms);
      }
      setMeasurements(DEMO_MEASUREMENTS);

      for (const rec of DEMO_MEDICAL_RECORDS) {
        await FirestoreService.addMedicalRecord(currentUser.uid, rec);
      }
      setMedicalRecords(DEMO_MEDICAL_RECORDS);

      for (const v of DEMO_DOCTOR_VISITS) {
        await FirestoreService.addDoctorVisit(currentUser.uid, v);
      }
      setDoctorVisits(DEMO_DOCTOR_VISITS);

      for (const a of DEMO_SAFETY_ALERTS) {
        await FirestoreService.addSafetyAlert(currentUser.uid, a);
      }
      setSafetyAlerts(DEMO_SAFETY_ALERTS);

      await FirestoreService.saveReport(currentUser.uid, DEMO_DOCTOR_REPORT);
      setReports([DEMO_DOCTOR_REPORT]);

      setIsDemoMode(true);
    } catch (err) {
      console.error('Failed to seed sample data to cloud:', err);
    }
  };

  const handleClearAllData = async () => {
    if (!currentUser) return;
    if (window.confirm('Are you sure you want to delete all stored health records from your cloud account? This cannot be undone.')) {
      try {
        for (const s of symptoms) {
          await FirestoreService.deleteSymptom(currentUser.uid, s.id);
        }
        for (const m of medications) {
          await FirestoreService.deleteMedication(currentUser.uid, m.id);
        }
        const freshProfile = {
          ...BLANK_PROFILE,
          id: currentUser.uid,
          name: currentUser.displayName || 'You',
        };
        await FirestoreService.saveUserProfile(currentUser.uid, freshProfile);
        setUserProfile(freshProfile);
        setSymptoms([]);
        setSleepRecords([]);
        setMedications([]);
        setCheckIns([]);
        setMeasurements([]);
        setMedicalRecords([]);
        setDoctorVisits([]);
        setSafetyAlerts([]);
        setReports([]);
        setIsDemoMode(false);
      } catch (err) {
        console.error('Failed to clear data:', err);
      }
    }
  };

  const openSymptomIntake = (symptomName?: string, draft?: Partial<SymptomEpisode>) => {
    setIntakeInitialName(symptomName || '');
    setIntakeInitialDraft(draft);
    setIsSymptomIntakeOpen(true);
  };

  // 1. Loading Authentication State
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800 p-4 font-sans">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600 mb-3" />
        <h2 className="text-sm font-semibold text-slate-900">Ishara</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to your journal...</p>
      </div>
    );
  }

  // 2. Unauthenticated: Show Continue with Google Sign-in Screen
  if (!currentUser) {
    return <LoginScreen />;
  }

  // 3. Authenticated but fetching cloud records
  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-800 p-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4" />
        <h2 className="text-base font-semibold text-slate-900">Loading Your Health Records</h2>
        <p className="text-xs text-slate-500 mt-1">
          Retrieving encrypted cloud records for {currentUser.email}...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Top Application Header with User Info and Secure Sign Out */}
      <Header
        profile={userProfile}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleResetDemoData}
        onOpenDoctorReport={() => setIsDoctorReportOpen(true)}
        onOpenDailyCheckIn={() => setIsDailyCheckInOpen(true)}
        onNavigateToTab={setActiveTab}
        checkInDoneToday={!!todayCheckIn}
        userEmail={currentUser.email}
        onSignOut={handlePromptSignOut}
      />

      {/* Desktop Sub-navigation Tab Bar */}
      <div className="hidden md:block bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-6">
            {[
              { id: 'home', label: 'Home' },
              { id: 'symptoms', label: `Symptoms (${symptoms.length})` },
              { id: 'sleep', label: 'Sleep Journal' },
              { id: 'timeline', label: 'Health Timeline' },
              { id: 'trends', label: 'Trends & Patterns' },
              { id: 'doctor_visit', label: 'Doctor Visit Mode' },
              { id: 'records', label: 'Medical Records' },
              { id: 'profile', label: 'Profile & Settings' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 text-xs sm:text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-teal-600 text-teal-700'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5">
        {/* Active Safety Banner if flagged */}
        {activeAlert && (
          <SafetyBanner alert={activeAlert} onDismiss={handleDismissSafetyAlert} />
        )}

        {/* Tab Routing */}
        {activeTab === 'home' && (
          <HomeDashboard
            userProfile={userProfile}
            symptoms={symptoms}
            sleepRecords={sleepRecords}
            medications={medications}
            latestCheckIn={todayCheckIn || checkIns[0]}
            measurements={measurements}
            onOpenSymptomIntake={openSymptomIntake}
            onOpenQuickLog={() => setIsQuickLogOpen(true)}
            onOpenDailyCheckIn={() => setIsDailyCheckInOpen(true)}
            onToggleMedication={handleToggleMedication}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'symptoms' && (
          <SymptomDatabase
            symptoms={symptoms}
            onOpenSymptomIntake={openSymptomIntake}
            onUpdateSymptom={handleUpdateSymptom}
          />
        )}

        {activeTab === 'sleep' && (
          <SleepTracker
            sleepRecords={sleepRecords}
            symptoms={symptoms}
            onOpenQuickLog={() => setIsQuickLogOpen(true)}
          />
        )}

        {activeTab === 'timeline' && (
          <HealthTimeline
            symptoms={symptoms}
            sleepRecords={sleepRecords}
            medications={medications}
            checkIns={checkIns}
            measurements={measurements}
            medicalRecords={medicalRecords}
            doctorVisits={doctorVisits}
            safetyAlerts={safetyAlerts}
            onOpenSymptomIntake={openSymptomIntake}
          />
        )}

        {activeTab === 'trends' && (
          <TrendsAnalytics
            symptoms={symptoms}
            sleepRecords={sleepRecords}
            checkIns={checkIns}
            measurements={measurements}
          />
        )}

        {activeTab === 'doctor_visit' && (
          <DoctorVisitMode
            userProfile={userProfile}
            symptoms={symptoms}
            medications={medications}
            measurements={measurements}
            latestReport={reports[0]}
            onOpenReportModal={() => setIsDoctorReportOpen(true)}
            onAddDoctorVisit={handleAddDoctorVisit}
          />
        )}

        {activeTab === 'records' && (
          <MedicalRecordsView
            medicalRecords={medicalRecords}
            doctorVisits={doctorVisits}
            onAddRecord={handleAddMedicalRecord}
            onAddDoctorVisit={handleAddDoctorVisit}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileSettings
            profile={userProfile}
            onSaveProfile={handleSaveProfile}
            onResetDemoData={handleResetDemoData}
            onClearAllData={handleClearAllData}
            userEmail={currentUser.email}
            onSignOut={handlePromptSignOut}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation & Floating "+ Log" */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onOpenQuickLog={() => setIsQuickLogOpen(true)}
        onOpenDoctorReport={() => setIsDoctorReportOpen(true)}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* MODAL 1: Progressive Symptom Intake */}
      <SymptomIntakeModal
        isOpen={isSymptomIntakeOpen}
        onClose={() => setIsSymptomIntakeOpen(false)}
        onSaveSymptom={handleSaveSymptom}
        userProfile={userProfile}
        initialSymptomName={intakeInitialName}
        initialDraft={intakeInitialDraft}
      />

      {/* MODAL 2: Quick Log in < 10 seconds */}
      <QuickLogModal
        isOpen={isQuickLogOpen}
        onClose={() => setIsQuickLogOpen(false)}
        onSaveSymptom={handleSaveSymptom}
        onStartSymptomIntake={openSymptomIntake}
        onSaveSleep={handleSaveSleep}
        onSaveMedication={handleSaveMedication}
        onSaveMeasurement={handleSaveMeasurement}
        onSaveCheckIn={handleSaveCheckIn}
        userProfile={userProfile}
      />

      {/* MODAL 3: 30-Second Daily Check-in */}
      <DailyCheckInModal
        isOpen={isDailyCheckInOpen}
        onClose={() => setIsDailyCheckInOpen(false)}
        onSaveCheckIn={handleSaveCheckIn}
        existingCheckIn={todayCheckIn}
        todayMeasurements={{
          bloodPressure: todayBPMeasurement,
          weight: todayWeightMeasurement,
          temperature: todayTempMeasurement,
        }}
      />

      {/* MODAL 4: Doctor Report (Major Feature) */}
      <DoctorReportModal
        isOpen={isDoctorReportOpen}
        onClose={() => setIsDoctorReportOpen(false)}
        report={reports[0]}
        userProfile={userProfile}
        symptoms={symptoms}
        sleepRecords={sleepRecords}
        checkIns={checkIns}
        medications={medications}
        measurements={measurements}
        safetyAlerts={safetyAlerts}
        onReportGenerated={handleSaveReport}
      />

      {/* MODAL 5: Clean Logout Confirmation */}
      <LogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirmLogout={handleConfirmSignOut}
        userEmail={currentUser.email}
        userName={userProfile?.name || currentUser.displayName}
        isLoggingOut={isLoggingOut}
      />
    </div>
  );
}

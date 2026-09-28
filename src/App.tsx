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
import { StorageService } from './services/storageService';
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

export default function App() {
  // Ensure initial data seeded on first load
  useEffect(() => {
    StorageService.seedInitialData();
  }, []);

  const [activeTab, setActiveTab] = useState<string>('home');

  // Core domain state loaded from StorageService
  const [userProfile, setUserProfile] = useState<UserProfile>(() => StorageService.getUserProfile());
  const [symptoms, setSymptoms] = useState<SymptomEpisode[]>(() => StorageService.getSymptoms());
  const [sleepRecords, setSleepRecords] = useState<SleepRecord[]>(() => StorageService.getSleepRecords());
  const [medications, setMedications] = useState<MedicationItem[]>(() => StorageService.getMedications());
  const [checkIns, setCheckIns] = useState<DailyCheckIn[]>(() => StorageService.getCheckIns());
  const [measurements, setMeasurements] = useState<MeasurementRecord[]>(() => StorageService.getMeasurements());
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecordItem[]>(() => StorageService.getMedicalRecords());
  const [doctorVisits, setDoctorVisits] = useState<DoctorVisit[]>(() => StorageService.getDoctorVisits());
  const [safetyAlerts, setSafetyAlerts] = useState<SafetyAlert[]>(() => StorageService.getSafetyAlerts());
  const [reports, setReports] = useState<DoctorReport[]>(() => StorageService.getReports());
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => StorageService.isDemoMode());

  // Modal open/close state
  const [isSymptomIntakeOpen, setIsSymptomIntakeOpen] = useState(false);
  const [intakeInitialName, setIntakeInitialName] = useState<string>('');
  const [intakeInitialDraft, setIntakeInitialDraft] = useState<Partial<SymptomEpisode> | undefined>(undefined);

  const [isQuickLogOpen, setIsQuickLogOpen] = useState(false);
  const [isDailyCheckInOpen, setIsDailyCheckInOpen] = useState(false);
  const [isDoctorReportOpen, setIsDoctorReportOpen] = useState(false);

  // Check if daily checkin done today
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCheckIn = checkIns.find((c) => c.date === todayStr);

  // Active (undismissed) safety alerts
  const activeAlert = safetyAlerts.find((a) => !a.dismissed);

  // Handlers for storage updates
  const handleSaveSymptom = (symptom: SymptomEpisode, newAlert?: SafetyAlert) => {
    StorageService.addSymptom(symptom);
    setSymptoms(StorageService.getSymptoms());

    if (newAlert) {
      StorageService.addSafetyAlert(newAlert);
      setSafetyAlerts(StorageService.getSafetyAlerts());
    }
  };

  const handleUpdateSymptom = (id: string, updates: Partial<SymptomEpisode>) => {
    StorageService.updateSymptom(id, updates);
    setSymptoms(StorageService.getSymptoms());
  };

  const handleSaveSleep = (sleep: SleepRecord) => {
    StorageService.addSleepRecord(sleep);
    setSleepRecords(StorageService.getSleepRecords());
  };

  const handleSaveMedication = (med: MedicationItem) => {
    StorageService.addMedication(med);
    setMedications(StorageService.getMedications());
  };

  const handleToggleMedication = (id: string) => {
    StorageService.toggleMedicationTaken(id);
    setMedications(StorageService.getMedications());
  };

  const handleSaveCheckIn = (checkIn: DailyCheckIn) => {
    StorageService.addCheckIn(checkIn);
    setCheckIns(StorageService.getCheckIns());
  };

  const handleSaveMeasurement = (meas: MeasurementRecord) => {
    StorageService.addMeasurement(meas);
    setMeasurements(StorageService.getMeasurements());
  };

  const handleAddMedicalRecord = (rec: MedicalRecordItem) => {
    StorageService.addMedicalRecord(rec);
    setMedicalRecords(StorageService.getMedicalRecords());
  };

  const handleAddDoctorVisit = (visit: DoctorVisit) => {
    StorageService.addDoctorVisit(visit);
    setDoctorVisits(StorageService.getDoctorVisits());
  };

  const handleDismissSafetyAlert = (id: string) => {
    StorageService.dismissSafetyAlert(id);
    setSafetyAlerts(StorageService.getSafetyAlerts());
  };

  const handleSaveProfile = (updated: UserProfile) => {
    StorageService.saveUserProfile(updated);
    setUserProfile(updated);
  };

  const handleResetDemoData = () => {
    StorageService.seedInitialData(true);
    setUserProfile(StorageService.getUserProfile());
    setSymptoms(StorageService.getSymptoms());
    setSleepRecords(StorageService.getSleepRecords());
    setMedications(StorageService.getMedications());
    setCheckIns(StorageService.getCheckIns());
    setMeasurements(StorageService.getMeasurements());
    setMedicalRecords(StorageService.getMedicalRecords());
    setDoctorVisits(StorageService.getDoctorVisits());
    setSafetyAlerts(StorageService.getSafetyAlerts());
    setReports(StorageService.getReports());
    setIsDemoMode(true);
  };

  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to delete all stored health data? This cannot be undone.')) {
      StorageService.clearAllData();
      setUserProfile(StorageService.getUserProfile());
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
    }
  };

  const openSymptomIntake = (symptomName?: string, draft?: Partial<SymptomEpisode>) => {
    setIntakeInitialName(symptomName || '');
    setIntakeInitialDraft(draft);
    setIsSymptomIntakeOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col font-sans">
      {/* Top Application Header */}
      <Header
        profile={userProfile}
        isDemoMode={isDemoMode}
        onToggleDemoMode={handleResetDemoData}
        onOpenDoctorReport={() => setIsDoctorReportOpen(true)}
        onOpenDailyCheckIn={() => setIsDailyCheckInOpen(true)}
        onNavigateToTab={setActiveTab}
        checkInDoneToday={!!todayCheckIn}
      />

      {/* Desktop Sub-navigation Tab Bar */}
      <div className="hidden md:block bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <nav className="flex space-x-6">
            {[
              { id: 'home', label: 'Home Dashboard' },
              { id: 'symptoms', label: `Symptoms (${symptoms.length})` },
              { id: 'sleep', label: 'Sleep Journal' },
              { id: 'timeline', label: 'Health Timeline' },
              { id: 'trends', label: 'Trends & Analytics' },
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
        onReportGenerated={(newRep) => {
          StorageService.addReport(newRep);
          setReports(StorageService.getReports());
        }}
      />
    </div>
  );
}

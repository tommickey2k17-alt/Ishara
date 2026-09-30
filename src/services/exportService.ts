/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StorageService } from './storageService';

export const ExportService = {
  /**
   * Export all user health data as structured JSON file
   */
  exportJSON(customData?: any): void {
    const data = customData || {
      app: 'Ishara',
      exportDate: new Date().toISOString(),
      disclaimer: 'Personal health record export for patient and clinical reference. Ishara is an informational journal and does not provide medical diagnoses or prescriptions.',
      profile: StorageService.getUserProfile(),
      symptoms: StorageService.getSymptoms(),
      sleepRecords: StorageService.getSleepRecords(),
      medications: StorageService.getMedications(),
      checkIns: StorageService.getCheckIns(),
      measurements: StorageService.getMeasurements(),
      medicalRecords: StorageService.getMedicalRecords(),
      doctorVisits: StorageService.getDoctorVisits(),
      safetyAlerts: StorageService.getSafetyAlerts(),
      doctorReports: StorageService.getReports(),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `ishara_export_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Export structured health data as CSV files (Symptoms & Vitals)
   */
  exportCSV(customData?: {
    symptoms?: any[];
    sleep?: any[];
    measurements?: any[];
    profile?: any;
  }): void {
    const symptoms = customData?.symptoms || StorageService.getSymptoms();
    const sleep = customData?.sleep || StorageService.getSleepRecords();
    const measurements = customData?.measurements || StorageService.getMeasurements();
    const profile = customData?.profile || StorageService.getUserProfile();

    const escapeCSV = (val: any): string => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines: string[] = [
      '# SWASTHYA LOG - STRUCTURED CLINICAL HEALTH RECORD EXPORT',
      `# Patient: ${profile.name} | Age: ${profile.age} | Sex: ${profile.sex} | Exported: ${new Date().toISOString()}`,
      '# DISCLAIMER: This document is an informational journal compiled from patient self-reports and does not constitute a diagnostic evaluation.',
      '',
      '=== SYMPTOMS LOG ===',
      [
        'ID',
        'Date',
        'Start Time',
        'Symptom Name',
        'Category',
        'Severity (0-10)',
        'Frequency',
        'Duration',
        'Location',
        'Character',
        'Triggers',
        'Relieving Factors',
        'Associated Symptoms',
        'Fever Reported',
        'Prior Occurrence',
        'Medically Evaluated',
        'Unconfirmed User Suspicion',
        'Resolved Status',
        'User Notes',
      ].join(','),
    ];

    symptoms.forEach((s) => {
      csvLines.push(
        [
          escapeCSV(s.id),
          escapeCSV(s.date),
          escapeCSV(s.startTime || ''),
          escapeCSV(s.symptomName),
          escapeCSV(s.category),
          escapeCSV(s.severity),
          escapeCSV(s.frequency),
          escapeCSV(s.duration || ''),
          escapeCSV(s.location || ''),
          escapeCSV(s.characterDescription || ''),
          escapeCSV((s.triggers || []).join('; ')),
          escapeCSV((s.relievingFactors || []).join('; ')),
          escapeCSV((s.associatedSymptoms || []).join('; ')),
          escapeCSV(s.feverReported || 'not_recorded'),
          escapeCSV(s.priorOccurrenceState || 'not_recorded'),
          escapeCSV(s.medicallyEvaluatedState || 'not_recorded'),
          escapeCSV(s.userSuspicionOrConcern || ''),
          escapeCSV(s.isResolved ? 'Yes' : 'No'),
          escapeCSV(s.userNotes || ''),
        ].join(',')
      );
    });

    csvLines.push('');
    csvLines.push('=== SLEEP LOG ===');
    csvLines.push(['Date', 'Bedtime', 'Wake Time', 'Total Minutes', 'Quality', 'Awakenings', 'Restfulness (1-5)', 'Notes'].join(','));

    sleep.forEach((sl) => {
      csvLines.push(
        [
          escapeCSV(sl.date),
          escapeCSV(sl.bedtime),
          escapeCSV(sl.wakeTime),
          escapeCSV(sl.totalMinutes),
          escapeCSV(sl.quality),
          escapeCSV(sl.nightAwakenings),
          escapeCSV(sl.restfulnessRating || ''),
          escapeCSV(sl.notes || ''),
        ].join(',')
      );
    });

    csvLines.push('');
    csvLines.push('=== MEASUREMENTS / VITALS ===');
    csvLines.push(['Date', 'Time', 'Type', 'Value', 'Unit', 'Notes'].join(','));

    measurements.forEach((m) => {
      csvLines.push(
        [
          escapeCSV(m.date),
          escapeCSV(m.timestamp ? m.timestamp.split('T')[1]?.slice(0, 5) : ''),
          escapeCSV(m.type),
          escapeCSV(m.value),
          escapeCSV(m.unit),
          escapeCSV(m.notes || ''),
        ].join(',')
      );
    });

    const csvString = csvLines.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().split('T')[0];
    link.href = url;
    link.download = `ishara_health_records_${dateStr}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

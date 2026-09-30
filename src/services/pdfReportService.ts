/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { jsPDF } from 'jspdf';
import { DoctorReport, MedicationItem, UserProfile } from '../types';

export const PDFReportService = {
  /**
   * Builds a structured, multi-page vector PDF for the Doctor Report.
   * ALWAYS reads patient identity and clinical profile from the current UserProfile single source of truth.
   */
  generateDoctorReportPDF(
    report: DoctorReport,
    userProfile: UserProfile,
    medications: MedicationItem[]
  ): jsPDF {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    // Patient Identity Data (Single Source of Truth)
    const patientName = userProfile?.name?.trim() || 'Not provided';
    const patientAge = userProfile?.age && userProfile.age > 0
      ? `${userProfile.age} yrs`
      : (userProfile?.birthDate ? `DOB: ${userProfile.birthDate}` : 'Not provided');
    const patientSex = userProfile?.sex && userProfile.sex !== 'prefer_not_to_say'
      ? userProfile.sex.charAt(0).toUpperCase() + userProfile.sex.slice(1)
      : 'Not provided';
    const patientCountry = userProfile?.country?.trim() || 'Not provided';

    const checkPageBreak = (neededHeight: number) => {
      if (y + neededHeight > pageHeight - margin - 10) {
        doc.addPage();
        y = margin;
        // Mini page header on subsequent pages
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('Ishara Health Journal — Clinical Summary (Continued)', margin, y);
        doc.text(`Patient: ${patientName}`, pageWidth - margin, y, { align: 'right' });
        y += 6;
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      }
    };

    // 1. TOP HEADER BANNER
    doc.setFillColor(15, 118, 110); // Teal 700
    doc.roundedRect(margin, y, contentWidth, 22, 2, 2, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text('CLINICAL HEALTH SUMMARY', margin + 6, y + 9);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(204, 251, 241); // Teal 100
    doc.text('CONFIDENTIAL PATIENT LOG · OBJECTIVE CLINICAL BRIEFING', margin + 6, y + 16);

    const generatedDateStr = new Date(report.generatedAt || Date.now()).toLocaleDateString();
    doc.text(`Generated: ${generatedDateStr}`, pageWidth - margin - 6, y + 9, { align: 'right' });
    doc.text(`Period: ${report.periodLabel || 'Last 30 Days'}`, pageWidth - margin - 6, y + 16, { align: 'right' });

    y += 26;

    // 2. PATIENT PROFILE BOX
    doc.setFillColor(248, 250, 252); // slate-50
    doc.setDrawColor(203, 213, 225); // slate-300
    doc.setLineWidth(0.3);
    doc.roundedRect(margin, y, contentWidth, 18, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text(patientName, margin + 4, y + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105); // slate-600
    const profileLine = `Age: ${patientAge}   |   Biological Sex: ${patientSex}   |   Location: ${patientCountry}`;
    doc.text(profileLine, margin + 4, y + 13.5);

    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Engine: Ishara v1.0', pageWidth - margin - 4, y + 13.5, { align: 'right' });

    y += 22;

    // Helper: Section title
    const printSectionHeader = (title: string, tag?: string) => {
      checkPageBreak(12);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 118, 110); // Teal 700
      doc.text(title.toUpperCase(), margin, y);

      if (tag) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`[${tag}]`, pageWidth - margin, y, { align: 'right' });
      }

      y += 2;
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.3);
      doc.line(margin, y, pageWidth - margin, y);
      y += 5;
    };

    // Helper: Bullet item
    const printBullet = (text: string, indent = 4) => {
      const bulletX = margin + indent;
      const textX = bulletX + 3;
      const maxWidth = contentWidth - indent - 3;
      const lines = doc.splitTextToSize(text, maxWidth);
      checkPageBreak(lines.length * 4.2 + 2);

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 118, 110);
      doc.text('•', bulletX, y);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text(lines, textX, y);
      y += lines.length * 4.2 + 1;
    };

    // 3. REASON FOR VISIT & SYMPTOM TRAJECTORY
    printSectionHeader('Reason for Visit & Trajectory', 'Patient & Calculated Facts');
    const reasonText = report.reasonForVisit || 'Review of recurrent symptom patterns and daily wellness tracking';
    const trajectoryText = report.symptomTrajectory ? report.symptomTrajectory.toUpperCase() : 'FLUCTUATING';
    const trajectoryNotes = report.trajectoryNotes || 'Symptom entries reflect episodic tracking.';

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`Reason: ${reasonText}`, margin + 2, y);
    y += 5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    doc.text(`Overall Trajectory: `, margin + 2, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 118, 110);
    doc.text(trajectoryText, margin + 30, y);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(` (${trajectoryNotes})`, margin + 55, y);
    y += 7;

    // 4. WHAT CHANGED SINCE LAST REVIEW
    if (report.whatChanged && report.whatChanged.length > 0) {
      printSectionHeader('What Changed Since Last Review', 'Calculated Metrics');
      report.whatChanged.forEach((item) => printBullet(item));
      y += 2;
    }

    // 5. PRIMARY CONCERNS
    if (report.primaryConcerns && report.primaryConcerns.length > 0) {
      printSectionHeader('Primary Concerns During Reporting Period', 'Dominant Logged Symptoms');
      report.primaryConcerns.forEach((concern) => printBullet(concern));
      y += 2;
    }

    // 6. CHRONOLOGICAL SYMPTOM TIMELINE TABLE
    if (report.symptomTimeline && report.symptomTimeline.length > 0) {
      printSectionHeader('Chronological Symptom Timeline', 'User-Entered Logs');

      // Table Header
      checkPageBreak(15);
      doc.setFillColor(241, 245, 249); // slate-100
      doc.rect(margin, y - 3.5, contentWidth, 6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      doc.text('Date', margin + 2, y);
      doc.text('Symptom', margin + 24, y);
      doc.text('Severity', margin + 54, y);
      doc.text('Duration', margin + 74, y);
      doc.text('Associated Information / Characteristics', margin + 100, y);
      y += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(30, 41, 59);

      report.symptomTimeline.forEach((item) => {
        const detailsLines = doc.splitTextToSize(item.details || '—', contentWidth - 102);
        const rowHeight = Math.max(detailsLines.length * 3.5, 4.5);
        checkPageBreak(rowHeight + 2);

        doc.setFont('helvetica', 'bold');
        doc.text(item.date || '', margin + 2, y);
        doc.text(item.symptom || '', margin + 24, y);
        doc.setTextColor(15, 118, 110);
        doc.text(item.severity || '', margin + 54, y);
        doc.setTextColor(71, 85, 105);
        doc.setFont('helvetica', 'normal');
        doc.text(item.duration || '', margin + 74, y);
        doc.setTextColor(30, 41, 59);
        doc.text(detailsLines, margin + 100, y);

        y += rowHeight + 1.5;
        doc.setDrawColor(241, 245, 249);
        doc.setLineWidth(0.2);
        doc.line(margin, y - 0.5, pageWidth - margin, y - 0.5);
      });
      y += 3;
    }

    // 7. PATTERNS OBSERVED (3-CATEGORY SEPARATION)
    if (report.patternsObserved) {
      printSectionHeader('Patterns Observed in Log', 'Strict 3-Category Separation');

      // Category 1: User-Reported Facts
      if (report.patternsObserved.userReportedFacts?.length) {
        checkPageBreak(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text('1. User-Reported Facts:', margin + 2, y);
        y += 4;
        report.patternsObserved.userReportedFacts.forEach((f) => printBullet(f, 6));
      }

      // Category 2: Calculated Information
      if (report.patternsObserved.calculatedInformation?.length) {
        checkPageBreak(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(49, 46, 129); // indigo-900
        doc.text('2. Calculated Numerical Information:', margin + 2, y);
        y += 4;
        report.patternsObserved.calculatedInformation.forEach((c) => printBullet(c, 6));
      }

      // Category 3: AI Observations
      if (report.patternsObserved.aiGeneratedObservations?.length) {
        checkPageBreak(10);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(15, 118, 110); // Teal 700
        doc.text('3. AI Observations (Non-Diagnostic, Non-Causal):', margin + 2, y);
        y += 4;
        report.patternsObserved.aiGeneratedObservations.forEach((o) => printBullet(o, 6));
      }
      y += 2;
    }

    // 8. MEDICATIONS & CLINICAL HISTORY (FROM SINGLE SOURCE OF TRUTH)
    printSectionHeader('Medications, Medical History & Allergies', 'Patient Profile State');

    // Medications
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Current Medications / Supplements:', margin + 2, y);
    y += 4;

    const activeMeds = medications || [];
    if (activeMeds.length > 0) {
      activeMeds.forEach((m) => {
        printBullet(`${m.name} — ${m.dosage || 'Not specified'} (${m.frequency || 'Not specified'})${m.purpose ? ` [Purpose: ${m.purpose}]` : ''}`, 6);
      });
    } else {
      printBullet('No active medications recorded by user', 6);
    }
    y += 2;

    // Conditions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Documented Medical Conditions:', margin + 2, y);
    y += 4;

    const conditions = userProfile?.conditions || [];
    if (conditions.length > 0) {
      conditions.forEach((c) => printBullet(c, 6));
    } else {
      printBullet('Not provided', 6);
    }
    y += 2;

    // Allergies
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text('Known Allergies:', margin + 2, y);
    y += 4;

    const allergies = userProfile?.allergies || [];
    if (allergies.length > 0) {
      allergies.forEach((a) => printBullet(a, 6));
    } else {
      printBullet('Not provided', 6);
    }
    y += 4;

    // 9. RECENT MEASUREMENTS & VITALS
    if (report.recentMeasurements && report.recentMeasurements.length > 0) {
      printSectionHeader('Recent Measurements & Vitals', 'Recorded Values');
      const measText = report.recentMeasurements.map((m) => `${m.metric}: ${m.value} (${m.date})`).join('   |   ');
      const lines = doc.splitTextToSize(measText, contentWidth - 4);
      checkPageBreak(lines.length * 4.2 + 2);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(30, 41, 59);
      doc.text(lines, margin + 2, y);
      y += lines.length * 4.2 + 3;
    }

    // 10. QUESTIONS FOR CLINICIAN
    if (report.clinicianQuestions && report.clinicianQuestions.length > 0) {
      printSectionHeader('Points / Questions for Clinical Discussion', 'Appointment Talking Points');
      report.clinicianQuestions.forEach((q) => printBullet(q));
      y += 2;
    }

    // 11. SAFETY ALERTS
    if (report.safetyAlerts && report.safetyAlerts.length > 0) {
      printSectionHeader('Safety Prompts Logged', 'Clinical Red-Flag Alerts');
      report.safetyAlerts.forEach((a) => {
        checkPageBreak(8);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(190, 18, 60); // rose-700
        doc.text(`[ALERT ${a.date}]`, margin + 4, y);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(30, 41, 59);
        const lines = doc.splitTextToSize(a.note, contentWidth - 32);
        doc.text(lines, margin + 30, y);
        y += lines.length * 4.2 + 2;
      });
      y += 2;
    }

    // 12. CLINICAL FOOTER & DISCLAIMER
    checkPageBreak(25);
    y = Math.max(y + 4, pageHeight - margin - 22);

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(margin, y, pageWidth - margin, y);
    y += 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('CLINICAL REPORTING DISCLAIMER:', margin, y);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    const disclaimerLines = doc.splitTextToSize(
      'This summary is compiled exclusively from patient-reported entries, device-recorded inputs, and statistical calculations. It does NOT contain machine-generated diagnoses or treatment recommendations. The attending physician remains solely responsible for clinical evaluation, diagnostic judgment, and treatment orders.',
      contentWidth - 45
    );
    doc.text(disclaimerLines, margin, y + 3.5);

    // Physician Signature Line
    doc.setDrawColor(148, 163, 184);
    doc.line(pageWidth - margin - 40, y + 10, pageWidth - margin, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Physician Review / Notes', pageWidth - margin - 20, y + 13, { align: 'center' });

    return doc;
  },

  /**
   * Generates the Doctor Report as a real binary PDF Blob.
   */
  generateDoctorReportBlob(
    report: DoctorReport,
    userProfile: UserProfile,
    medications: MedicationItem[]
  ): Blob {
    const doc = this.generateDoctorReportPDF(report, userProfile, medications);
    const arrayBuffer = doc.output('arraybuffer');
    return new Blob([arrayBuffer], { type: 'application/pdf' });
  },

  /**
   * Generates the standard standardized filename for the Doctor Report:
   * "Swasthya-Log-Doctor-Report-[YYYY-MM-DD].pdf"
   */
  getReportFilename(date = new Date()): string {
    const dateStr = date.toISOString().split('T')[0];
    return `Swasthya-Log-Doctor-Report-${dateStr}.pdf`;
  },

  /**
   * Triggers a genuine browser download using an <a> element with Object URL,
   * with automatic URL revocation to prevent memory leaks.
   */
  triggerDownloadBlob(blob: Blob, filename: string): void {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke the Object URL to avoid memory leaks
    const timer = setTimeout(() => {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (e) {
        // ignore
      }
    }, 10000);
    if (typeof timer === 'object' && typeof (timer as any).unref === 'function') {
      (timer as any).unref();
    }
  },

  /**
   * Generates and triggers browser download of the Doctor Report as a genuine PDF file.
   */
  downloadDoctorReportPDF(
    report: DoctorReport,
    userProfile: UserProfile,
    medications: MedicationItem[]
  ): void {
    const blob = this.generateDoctorReportBlob(report, userProfile, medications);
    const filename = this.getReportFilename();
    this.triggerDownloadBlob(blob, filename);
  },

  /**
   * Checks if the Web Share API with file sharing is supported in the current environment.
   */
  canSharePDF(): boolean {
    return (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function'
    );
  },

  /**
   * Shares the PDF file via the Web Share API when supported,
   * gracefully falling back to file download if unsupported or on error.
   */
  async shareDoctorReportPDF(
    report: DoctorReport,
    userProfile: UserProfile,
    medications: MedicationItem[]
  ): Promise<boolean> {
    const blob = this.generateDoctorReportBlob(report, userProfile, medications);
    const filename = this.getReportFilename();
    const patientName = userProfile?.name?.trim() || 'Patient';
    const dateStr = new Date().toISOString().split('T')[0];

    if (
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function' &&
      typeof File !== 'undefined'
    ) {
      try {
        const file = new File([blob], filename, { type: 'application/pdf' });
        if (typeof navigator.canShare === 'function' && !navigator.canShare({ files: [file] })) {
          this.triggerDownloadBlob(blob, filename);
          return true;
        }

        await navigator.share({
          files: [file],
          title: 'Doctor Report - Clinical Summary',
          text: `Ishara Doctor Health Report for ${patientName} (${dateStr})`,
        });
        return true;
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          // User closed share dialog, non-fatal
          return true;
        }
        console.warn('Web Share failed, falling back to direct download:', err);
        this.triggerDownloadBlob(blob, filename);
        return true;
      }
    } else {
      this.triggerDownloadBlob(blob, filename);
      return true;
    }
  },
};

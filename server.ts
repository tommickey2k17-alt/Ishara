/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.API_KEY;
  let ai: GoogleGenAI | null = null;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
    });
  }

  // Medical AI System Instructions: STRICT SAFETY GUARDRAIL
  const MEDICAL_SYSTEM_INSTRUCTION = `
You are the intake and clinical documentation engine of "Ishara", a personal health journal and doctor communication application.
CRITICAL MEDICAL SAFETY DIRECTIVES:
1. You must NEVER diagnose diseases, infer medical conditions with certainty, prescribe medications, or recommend drug dosages.
2. You must NEVER give false reassurance (do NOT say "you are fine", "it's nothing serious", "don't worry").
3. Your purpose is strictly:
   a. Capture information accurately from the user.
   b. Ask 1 short, progressive, highly relevant follow-up question at a time.
   c. Organize reported symptoms chronologically and objectively.
   d. Note observed patterns in neutral, non-causal language (e.g., "Symptoms coincided with days when recorded sleep was below 6 hours", NEVER "Lack of sleep caused the symptoms").
   e. Prepare concise, doctor-friendly summaries that help a qualified clinician review the patient's history.
   f. Flag symptoms requiring urgent medical evaluation.
4. Output structured JSON when requested.
`;

  // Health check endpoint
  app.get('/api/health-check', (_req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: !!apiKey,
      timestamp: new Date().toISOString(),
    });
  });

  // 1. Progressive Symptom Intake Endpoint
  app.post('/api/symptom-intake', async (req, res) => {
    try {
      const { symptomName, userAnswers, patientProfile, latestInput } = req.body;

      if (!ai) {
        return res.status(200).json({
          fallback: true,
          message: 'Server AI key not configured; client fallback active',
        });
      }

      const prompt = `
Symptom currently being logged: "${symptomName || 'Unknown symptom'}"
Patient Profile context: Age ${patientProfile?.age || 'Adult'}, Known conditions: ${(patientProfile?.conditions || []).join(', ') || 'None provided'}
Previous Q&A in this session:
${(userAnswers || [])
  .map((qa: { question: string; answer: string }, idx: number) => `Q${idx + 1}: ${qa.question}\nA${idx + 1}: ${qa.answer}`)
  .join('\n')}
Latest user reply: "${latestInput || ''}"

Goal: Determine if we have collected the core clinical parameters needed by a physician:
- When it started (onset)
- Severity (0-10)
- Character / pattern (constant vs intermittent vs throbbing etc.)
- Location
- Relieving / worsening factors
- Associated symptoms

Rules:
- If we have gathered enough key info (usually after 3-5 concise exchanges) OR if the latest answer completes the essential picture, set "isComplete": true.
- If more info is needed, set "isComplete": false, provide ONE short, direct, conversational question in "nextQuestion", and optionally a brief rationale in "whyWeAsk" (e.g. "Helps your physician evaluate the pain pattern"). Also provide 2 to 4 quick tap suggestions in "quickSuggestions" if helpful.
- Fill "extractedSummary" with the structured fields known so far (symptomName, startTime, severity [number 0-10], frequency, duration, location, characterDescription, triggers, relievingFactors, associatedSymptoms, contextNotes).
- Do NOT diagnose! Do NOT say "You have migraine" or similar.

Respond ONLY with valid JSON matching this schema:
{
  "isComplete": boolean,
  "nextQuestion": string (or empty if complete),
  "whyWeAsk": string,
  "inputType": "text" | "severity_slider" | "options" | "duration",
  "quickSuggestions": string[],
  "extractedSummary": {
    "symptomName": string,
    "severity": number,
    "frequency": "constant" | "intermittent" | "single_episode" | "fluctuating",
    "duration": string,
    "location": string,
    "characterDescription": string,
    "startTime": string,
    "associatedSymptoms": string[],
    "relievingFactors": string[],
    "triggers": string[],
    "contextNotes": string
  }
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: MEDICAL_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const responseText = response.text?.trim() || '{}';
      const parsed = JSON.parse(responseText);
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/symptom-intake:', err);
      res.status(500).json({ error: 'AI processing failed', details: err?.message });
    }
  });

  // 2. Natural Language Parse Endpoint (e.g., "Bad headache since morning, 6/10, slept badly")
  app.post('/api/parse-natural-language', async (req, res) => {
    try {
      const { text, patientProfile } = req.body;

      if (!ai) {
        return res.status(200).json({ fallback: true });
      }

      const prompt = `
Extract structured health information from this user log:
"${text}"
Patient Profile context: Age ${patientProfile?.age || 'Adult'}

Extract:
1. Primary symptom name (e.g., "Headache", "Fatigue", "Back Pain")
2. Severity (number 0 to 10 if mentioned or implied by descriptors like mild=3, moderate=5, bad=7, severe=8, excruciating=9)
3. Timing / Start (e.g., "Since morning", "Yesterday", "2 hours ago")
4. Location (e.g., "Temples", "Lower back", "Chest")
5. Character / Description (e.g., "Throbbing", "Sharp", "Dull ache")
6. Associated symptoms (e.g., ["nausea", "light sensitivity"])
7. Context notes (e.g., "Slept poorly", "High stress day")
8. Triggers (e.g., ["Screen glare", "Dehydration"])
9. Relieving factors (e.g., ["Rest in dark room", "Water"])
10. Fever reported state ("yes", "no", or "not_recorded" - only "yes" or "no" if explicitly indicated)
11. Prior occurrence state ("yes", "no", or "not_recorded")
12. Medically evaluated state ("yes", "no", or "not_recorded")
13. User suspicion or unconfirmed concern: Any phrase where user suspects or guesses a condition (e.g., "I think it's migraine"). Label neutrally as unconfirmed user concern; never validate as medical diagnosis.

Respond ONLY with valid JSON:
{
  "symptomName": string,
  "severity": number,
  "startTime": string,
  "location": string,
  "characterDescription": string,
  "associatedSymptoms": string[],
  "contextNotes": string,
  "triggers": string[],
  "relievingFactors": string[],
  "feverReported": "yes" | "no" | "not_recorded",
  "priorOccurrenceState": "yes" | "no" | "not_recorded",
  "medicallyEvaluatedState": "yes" | "no" | "not_recorded",
  "userSuspicionOrConcern": string,
  "missingQuestions": string[]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: MEDICAL_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/parse-natural-language:', err);
      res.status(500).json({ error: 'Natural language parsing failed', details: err?.message });
    }
  });

  // 3. Doctor Report Synthesis Endpoint
  app.post('/api/doctor-report', async (req, res) => {
    try {
      const { userProfile, symptoms, sleepRecords, checkIns, medications, measurements, safetyAlerts, periodDays, customReasonForVisit } = req.body;

      if (!ai) {
        return res.status(200).json({ fallback: true });
      }

      const prompt = `
Generate a structured, professional, one-page clinical briefing ("Doctor Report") for patient "${userProfile?.name}".
Reporting period: Last ${periodDays || 30} days.
Stated reason for visit or review: "${customReasonForVisit || 'Health status and symptom review'}"

PATIENT CONTEXT:
Age: ${userProfile?.age}, Sex: ${userProfile?.sex}
Documented medical history: ${(userProfile?.conditions || []).join(', ') || 'None noted'}
Unconfirmed user concerns (NOT diagnoses): ${JSON.stringify(userProfile?.userReportedConcerns || [])}
Allergies: ${(userProfile?.allergies || []).join(', ') || 'NKDA'}

LOGGED SYMPTOMS (${symptoms?.length || 0} episodes):
${JSON.stringify(symptoms?.slice(0, 15) || [], null, 2)}

SLEEP DATA (${sleepRecords?.length || 0} entries):
${JSON.stringify(sleepRecords?.slice(0, 10) || [], null, 2)}

CURRENT MEDICATIONS:
${JSON.stringify(medications || [], null, 2)}

RECENT MEASUREMENTS:
${JSON.stringify(measurements?.slice(0, 8) || [], null, 2)}

SAFETY ALERTS TRIGGERED:
${JSON.stringify(safetyAlerts || [], null, 2)}

STRICT CLINICAL REPORTING GUIDELINES:
1. Separate observations into 3 distinct non-overlapping categories:
   - "userReportedFacts": Factual statements of what the patient logged (e.g., "Patient logged 6 headache episodes between Aug 30 and Sep 28.")
   - "calculatedInformation": Exact numerical calculations (e.g., "Average sleep duration: 6h 14m", "Average severity: 6.2/10")
   - "aiGeneratedObservations": Neutral factual correlation observations (e.g., "Headache entries occurred on 5 of 6 days following sleep under 6 hours"). NEVER CLAIM CAUSALITY (do NOT say "poor sleep caused headaches"). Label temporal associations as non-causal.
2. "reasonForVisit": Clear, concise primary clinical reason for scheduling this visit.
3. "whatChanged": 3-4 bullet points summarizing what evolved recently (e.g., frequency changes, medication adherence, new or resolved symptoms, sleep delta).
4. "symptomTrajectory": "improving" | "stable" | "fluctuating" | "worsening".
5. "trajectoryNotes": 1-2 factual sentences explaining why this trajectory was assigned based on logged metrics.
6. "primaryConcerns": 2 to 4 bullet points highlighting the dominant logged issues.
7. "clinicianQuestions": 2 to 4 high-yield, concise clinical discussion questions for the physician.
8. "symptomTimeline": Clean table rows: date, symptom, severity, duration, details.
9. NO DIAGNOSES. Do NOT state or confirm suspected medical conditions as facts.

Respond ONLY with valid JSON:
{
  "reasonForVisit": string,
  "whatChanged": string[],
  "symptomTrajectory": "improving" | "stable" | "fluctuating" | "worsening",
  "trajectoryNotes": string,
  "primaryConcerns": string[],
  "symptomTimeline": [
    {
      "date": string,
      "symptom": string,
      "severity": string,
      "duration": string,
      "details": string
    }
  ],
  "patternsObserved": {
    "userReportedFacts": string[],
    "calculatedInformation": string[],
    "aiGeneratedObservations": string[]
  },
  "clinicianQuestions": string[]
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: MEDICAL_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/doctor-report:', err);
      res.status(500).json({ error: 'Report generation failed', details: err?.message });
    }
  });

  // 4. Medical Record Summarization Endpoint
  app.post('/api/summarize-record', async (req, res) => {
    try {
      const { title, category, provider, textContent } = req.body;

      if (!ai) {
        return res.status(200).json({ fallback: true });
      }

      const prompt = `
Summarize this medical record for patient personal reference:
Title: ${title}
Category: ${category}
Provider: ${provider}
Content / Notes: "${textContent}"

CRITICAL NON-DIAGNOSTIC GUIDELINES:
- Provide 2 to 3 concise, factual summaries of key metrics, findings, or doctor instructions.
- Do NOT provide independent diagnostic interpretations or evaluations.
- Do NOT independently determine whether laboratory results are normal or abnormal unless explicitly reproducing the laboratory's printed reference range or stated impression.
- Plainly transcribe or quote explicit test values alongside their printed reference ranges where provided.
- Maintain clinical neutrality.
- Return plain text summary.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          systemInstruction: MEDICAL_SYSTEM_INSTRUCTION,
          temperature: 0.1,
        },
      });

      res.json({
        summary: response.text?.trim() || 'Summary unavailable.',
        isAiSummary: true,
      });
    } catch (err: any) {
      console.error('Error in /api/summarize-record:', err);
      res.status(500).json({ error: 'Summary generation failed' });
    }
  });

  // Mount Vite middleware in development
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Ishara] Server running on http://0.0.0.0:${PORT} (Node ${process.version}, mode: ${process.env.NODE_ENV || 'development'})`);
  });

  const shutdown = () => {
    console.log('[Ishara] Shutting down gracefully...');
    server.close(() => {
      console.log('[Ishara] Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

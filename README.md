# Swasthya Log — Personal Health Journal & Doctor Communication PWA

A privacy-first, clinical-grade personal health journal and physician communication application. Built with React 19, TypeScript, Tailwind CSS, Express, and Vite as an installable Progressive Web App (PWA).

Swasthya Log helps users objectively capture symptoms in under 10 seconds or via voice/natural-language, track sleep architecture and vitals, identify non-causal chronological patterns, and generate structured, one-page clinical briefing reports for physician consultations.

---

## Key Features

- **⚡ Sub-10-Second Quick Log**: Rapid single-tap logging with symptom chips, 0–10 intensity slider with presets, and clinical tri-state recording.
- **🎙️ Voice & Natural-Language Intake**: Dictate or type symptoms freely; structured parsing extracts timing, location, triggers, and relieving factors with an **explicit verification step** before storing.
- **🛡️ 3-Tier Data Provenance**: Strict visual separation across all views:
  - 👤 **User-Reported Facts**: Explicit patient statements and ratings.
  - 🔢 **Calculated Information**: Mathematical averages and ratios.
  - 🤖 **Non-Diagnostic AI Observations**: Chronological associations strictly labeled as non-causal.
- **🩺 Clinical Tri-State Protocol**: Records key medical flags as `YES`, `NO`, or `NOT RECORDED` (never presuming an unanswered question is negative).
- **📋 One-Page Doctor Report & Exam Room Mode**: Generates a high-yield clinical briefing including *Reason for Visit*, *What Changed*, *Symptom Trajectory* (Improving/Stable/Fluctuating/Worsening), and high-contrast consultation view.
- **📱 Progressive Web App (PWA)**:
  - Installable on desktop, Android, and iOS.
  - Offline-first caching with Service Worker.
  - Custom brand icons, splash screen, and standalone display.
  - Offline status detector with auto-sync indicator.
- **🔒 Privacy-First & Persistent**:
  - All logs and health data are stored locally in the browser (`localStorage`).
  - Full JSON backup and restore (Import/Export).
  - One-click CSV export for spreadsheet analysis.
  - Zero third-party tracker scripts or telemetry.

---

## Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Vite
- **PWA**: `vite-plugin-pwa`, Workbox offline caching, Web App Manifest
- **Backend / Proxy**: Node.js, Express, `tsx`
- **AI Integration**: `@google/genai` (server-side proxy routes; secret keys are never exposed to the client)

---

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or later (v20+ or v22 LTS recommended)
- **npm**: v9.0.0 or later

### 1. Installation

Clone or extract the repository, then install project dependencies:

```bash
npm install
```

### 2. Environment Configuration

Copy the example environment configuration:

```bash
cp .env.example .env
```

Open `.env` in your text editor and configure the variables:

```ini
# Server Port (default: 3000)
PORT=3000

# Node Environment
NODE_ENV=development

# Gemini AI API Key (Optional but recommended)
# Get your free key at https://aistudio.google.com/app/apikey
GEMINI_API_KEY="your_actual_gemini_api_key_here"

# Public App URL (Optional)
APP_URL="http://localhost:3000"
```

> **Note on AI Features**: The application includes full heuristic and client-side fallbacks. If `GEMINI_API_KEY` is not provided, the entire journaling workflow, symptom tracking, vitals, trend calculation, data quality audits, and manual doctor reports continue to function without interruption.

### 3. Local Development

Start the development server with Hot Module Replacement (HMR) and Vite middleware:

```bash
npm run dev
```

Open your browser at:
```
http://localhost:3000
```

---

## Building for Production

### 1. Build Frontend & PWA Assets

Generate the production bundle and service worker:

```bash
npm run build
```

This compiles your application into the `dist/` directory, precaching HTML, JS, CSS, and web fonts.

### 2. Run the Production Server

Start the production Node/Express server:

```bash
npm start
```

The application will serve the optimized production build from `dist/` on `http://localhost:3000`.

---

## Deployment Options

### Option A: Docker Deployment (Recommended for Cloud / VPS)

A multi-stage `Dockerfile` is included in the root directory.

1. **Build the Docker Image**:
   ```bash
   docker build -t swasthya-log .
   ```

2. **Run the Container**:
   ```bash
   docker run -d \
     -p 3000:3000 \
     -e GEMINI_API_KEY="your_api_key" \
     --name swasthya-log \
     swasthya-log
   ```

3. Access the application at `http://localhost:3000`.

### Option B: Cloud Run / Google Cloud

1. Submit the build to Cloud Build or Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/swasthya-log
   ```

2. Deploy the container:
   ```bash
   gcloud run deploy swasthya-log \
     --image gcr.io/PROJECT_ID/swasthya-log \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars GEMINI_API_KEY="your_api_key"
   ```

### Option C: Render / Railway / Fly.io

1. Connect your Git repository.
2. Set build command:
   ```bash
   npm ci && npm run build
   ```
3. Set start command:
   ```bash
   npm start
   ```
4. Add environment variable `GEMINI_API_KEY` under the service's Environment settings.

---

## Progressive Web App (PWA) Installation

Swasthya Log fulfills all modern PWA criteria:
- **Chromium / Android / Desktop (Chrome/Edge)**: Tap the **Install App** button in the header or profile settings, or use the browser address bar icon.
- **iOS (Safari)**: Tap the **Share** button in the bottom Safari toolbar, scroll down, and select **Add to Home Screen**. A guided prompt is accessible via the "Install on iOS" button in the app.
- **Offline Capability**: Workbox service workers cache assets and app shell for offline resilience. The in-app offline banner alerts users when connection drops, confirming all logs are safely retained locally.

---

## Project Structure

```
swasthya-log/
├── public/                     # Static assets & PWA icons
│   ├── icon.svg                # Brand SVG icon
│   ├── apple-touch-icon.png    # iOS home screen icon (180x180)
│   ├── favicon.ico             # Browser tab icon
│   ├── pwa-192x192.png         # PWA Android/Desktop icon
│   ├── pwa-512x512.png         # PWA high-res icon
│   └── pwa-maskable-512x512.png# Maskable icon with safe zone padding
├── scripts/
│   └── generate-icons.js       # Node icon generation script
├── src/
│   ├── components/
│   │   ├── checkin/            # 30-second daily check-in modal
│   │   ├── common/             # Header, BottomNav, PWAInstallButton, Badges
│   │   ├── home/               # Home dashboard view
│   │   ├── intake/             # QuickLogModal & Progressive Symptom Intake
│   │   ├── profile/            # Profile, Settings, JSON/CSV import/export
│   │   ├── records/            # Medical records & document summaries
│   │   ├── report/             # One-page Doctor Report & Exam Room Mode
│   │   ├── sleep/              # Sleep journal and nocturnal analysis
│   │   ├── symptoms/           # Symptom database & history
│   │   ├── timeline/           # Chronological multi-stream health timeline
│   │   └── trends/             # Trends, data quality audit, non-causal graphs
│   ├── data/                   # Initial demonstration dataset
│   ├── hooks/                  # usePWAInstall, useOnlineStatus
│   ├── services/               # StorageService, AIService, ExportService
│   ├── types/                  # Domain TypeScript interfaces
│   ├── utils/                  # Safety rules, red flag clinical detectors
│   ├── App.tsx                 # Root application component
│   └── main.tsx                # Client entrypoint
├── Dockerfile                  # Production container definition
├── index.html                  # HTML entrypoint with PWA meta tags
├── package.json                # Project dependencies and scripts
├── server.ts                   # Express server & Gemini proxy routes
├── tsconfig.json               # TypeScript configuration
└── vite.config.ts              # Vite configuration with VitePWA
```

---

## Clinical Safety & Non-Diagnostic Principles

Swasthya Log is an informational journal designed to facilitate doctor-patient communication:
- **No Diagnostic Claims**: The app never provides definitive medical diagnoses, prescriptions, or drug dosages.
- **Red Flag Safety Alerts**: Automatically evaluates severity indicators (e.g., sudden severe "thunderclap" headache, stiff neck with high fever, chest pain radiating to arm/jaw) and presents prominent urgent care advisories.
- **Non-Causal Association Notice**: Chronological correlations (e.g., headaches logged following nights under 6 hours of sleep) are strictly labeled as timing coincidences rather than proven causation.
- **Clinical Tri-State Protocol**: Incomplete records are preserved as `NOT RECORDED` rather than assumed to be negative.

---

## License

Apache-2.0

# Smart Health PWA

A Progressive Web App (PWA) for personal health tracking — vitals monitoring, medication reminders, step/pedometer tracking, voice assistant, and health reports.

## Features
- 🔐 Login / Signup
- ❤️ Vitals tracking (heart rate, etc.)
- 💊 Medication scheduling & reminders
- 👣 Step counter / pedometer
- 🎙️ Voice assistant module
- 📊 Health report generation
- 📱 Installable PWA (offline support via service worker)

## Tech Stack
- HTML, CSS, JavaScript (frontend + PWA)
- Python (report generation / data processing)
- Service Worker + Web App Manifest (PWA capabilities)

## My Contribution
This project was built collaboratively. My focus areas were:
- **Python — processes health data (vitals, medications, steps) from JSON and generates a summary report, with added error handling for missing/empty data.
- **Styling / CSS (`styles.css`, `vitals.css`, `meds.css`, `steps.css`, `reports.css`, `voice.css`)** — overall visual design and layout across modules.
  **HTML- 
This was a team project — core app logic, structure, and JavaScript modules (vitals, medications, steps, voice, authentication) were developed collaboratively as part of the team's overall effort.

## Setup
1. Clone the repo
2. Open `index.html` in a browser, or serve via a local server (e.g. `python -m http.server`)
3. To generate a report: `python reports.py` (reads from `data.json`, outputs `output_report.txt`)

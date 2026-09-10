# 🔥 HeatWatch WB: West Bengal Heat Risk & Biometeorological Command Center

> **Enterprise Geospatial Early Warning & Clinical Biometeorology Platform for Extreme Heatwaves in West Bengal**  
> Built with **React 18**, **TypeScript**, **Leaflet GIS**, **Tailwind CSS**, **FastAPI**, and **Twilio WhatsApp Gateway**.

[![Live App](https://img.shields.io/badge/Live_Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://heatwaveindex.vercel.app/)
[![API Status](https://img.shields.io/badge/API-FastAPI_Python_3.10+-009688?style=for-the-badge&logo=fastapi)](https://heatwaveindex.vercel.app/api/health)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

---

## 📖 What is HeatWatch WB? (Purpose Explained Simply)

During summers in West Bengal (Kolkata, Purulia, Asansol, Howrah, Siliguri, and the Sundarbans), temperatures regularly climb past **40°C–45°C** accompanied by heavy tropical humidity. 

When humidity is high, human sweat cannot evaporate, preventing the body from cooling down. As a result, the "felt" thermal stress—measured by the **Universal Thermal Climate Index (UTCI)** and **Heat Index**—can reach **55°C–65°C**, leading to rapid heatstroke, organ failure, and massive surges in emergency room admissions.

**HeatWatch WB** is a real-time command center designed for **disaster management teams, municipal ward officers, health emergency responders, and everyday citizens**:

1. 🗺️ **Visualizes Heat Danger in Real Time**: Displays interactive GIS choropleth maps across all 23 official districts and municipal sectors in West Bengal, color-coded from *Normal (Green)* to *Severe Hazard (Red)*.
2. 🚨 **Automated WhatsApp Alerts (Twilio)**: Detects the **district facing the highest temperature in the state** and broadcasts emergency bulletins, hospital surge warnings, and labor directives directly to field officers' and responders' WhatsApp numbers with one click.
3. ⏳ **120-Hour Predictive Time-Slider**: Allows civil defense teams to scrub through a 5-day hourly heatwave simulation to anticipate when temperatures and hospital trauma admissions will peak.
4. 🏥 **Emergency Cooling Infrastructure**: Locates air-conditioned cooling shelters, hydration relief stations, and hospital heat trauma cryo-units closest to affected zones.
5. 🧮 **Biometeorological Stress Calculator**: Evaluates custom environmental inputs (temperature, humidity, wind speed, solar radiation/MRT) to compute medical-grade UTCI and physiological stress categories.

---

## 🌟 Key Platform Features

| Feature | Description |
| :--- | :--- |
| **Interactive Leaflet GIS Map** | Vector choropleths for all 23 West Bengal districts and major municipal wards (Kolkata, Howrah, Asansol, Siliguri, Purulia, Malda, Darjeeling, Sundarbans). |
| **Statewide Hotspot Scanner** | Evaluates real-time microclimate vectors to automatically flag the district with the highest air temperature and heat index. |
| **Twilio WhatsApp Emergency Gateway** | Sends rich, dynamic emergency bulletins via WhatsApp with multi-tier fallback (custom body &rarr; approved template &rarr; standard directive). |
| **120-Hour Granular Time-Slider** | Simulates diurnal temperature oscillations, synoptic heatwave envelopes, solar radiation curves, and projected hospitalization spikes (+250%). |
| **Clinical Stress Evaluation** | Pure-Python standard UTCI 6th-order polynomial and NOAA Rothfusz Heat Index equations with zero heavy C-dependencies. |
| **Emergency Asset Mapping** | Geospatial locator for cooling shelters, ORS distribution kiosks, and critical care units with cryo-cooling baths. |
| **Situation Report (SIT-REP) Generator** | Generates printable clinical and administrative situational reports for municipal disaster response commissioners. |

---

## ⚡ Quick Start: Running Locally

Follow these steps to run the complete platform (frontend + backend) on your local machine:

### 📋 Prerequisites
- **Node.js** (v18 or newer) & `npm` — [Download Node.js](https://nodejs.org/)
- **Python** (v3.10 or newer) & `pip` — [Download Python](https://www.python.org/)
- **Git** — [Download Git](https://git-scm.com/)

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/Nova-2705/heatwaveindex.git
cd heatwaveindex
```

---

### 2️⃣ Start the Python FastAPI Backend

Open a terminal in the project root:

```bash
# Optional: Create and activate virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

# Install dependencies (fastapi, uvicorn, pydantic, httpx)
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

- 🌐 **Backend API**: [`http://127.0.0.1:8000`](http://127.0.0.1:8000)
- 📖 **Interactive Swagger Docs**: [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)
- 🧪 **Run Backend Test Suite**:
  ```bash
  python test_backend.py
  ```

---

### 3️⃣ Start the React Frontend Application

Open a **second terminal window** in the project root:

```bash
# Install frontend dependencies
npm install

# Launch Vite development server with API proxy
npm run dev
```

- 💻 **Web Application**: [`http://localhost:5173`](http://localhost:5173)

---

## 📲 WhatsApp Emergency Alert System (Twilio Setup)

The platform dispatches WhatsApp emergency bulletins using the Twilio Messages API:

```
POST /api/broadcast-alert
```

### Environment Variables (`.env` locally, or Vercel Environment Variables in production):

| Variable | Description | Example |
| :--- | :--- | :--- |
| `TWILIO_ACCOUNT_SID` | Your Twilio Account SID | `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `TWILIO_AUTH_TOKEN` | Your Twilio Auth Token | `your_twilio_auth_token_here` |
| `TWILIO_PHONE_NUMBER` | Sender Twilio WhatsApp Number | `whatsapp:+14155238886` |
| `TWILIO_CONTENT_SID` | WhatsApp Template Content SID | `HXxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` |
| `CALLMEBOT_PHONE` | Recipient WhatsApp Number | `+919876543210` |

### Sample Dynamic WhatsApp Bulletin:

```text
🚨 [WEST BENGAL HEATWATCH EMERGENCY BROADCAST]
📍 Monitored Zone: Kolkata Ward 45 (Kolkata) - 38.5°C
🔥 STATE MAXIMUM HOTSPOT: PASCHIM BARDHAMAN DISTRICT (52.6°C)
Status: HIGH HEAT HAZARD ALERT

🌡️ CRITICAL METRICS (PASCHIM BARDHAMAN PEAK):
• Peak Air Temp: 52.6°C | Heat Index: 75.7°C
• UTCI Thermal Stress: 60.2°C (Extreme Hazard)
• Projected Hospital Surge: +250% admissions

⚠️ MANDATORY CIVIL DIRECTIVES:
1. Pause outdoor physical labor between 11:00 AM – 4:00 PM.
2. Distribute emergency ORS hydration across municipal wards.
3. Keep elderly and vulnerable citizens in well-ventilated, shaded spaces.

📞 Emergency Hotline: 1077 (Disaster Response) | 102 (Ambulance)
```

---

## 🚀 Deployment (Vercel Serverless Full-Stack)

The repository is pre-configured for full-stack deployment on Vercel:

- **Frontend**: Built with Vite and served statically via Vercel Edge Network.
- **Backend**: Deployed as a Python Serverless Function (`api/index.py`), handling all `/api/*` requests.
- **Rewrites & Routing**: Configured in [`vercel.json`](vercel.json) to transparently route `/api/(.*)` to the Python function and all client SPA routes to `/index.html`.

To deploy:
```bash
npx vercel --prod
```

---

## 🏗️ Project Architecture

```
heatwaveindex/
├── api/
│   ├── index.py                       # Vercel Serverless Function entrypoint
│   └── requirements.txt               # Serverless Python dependencies
│
├── src/                               # React 18 + TypeScript Frontend
│   ├── components/
│   │   ├── Header/                    # Top navbar, sync badge & dispatch trigger
│   │   ├── Map/                       # Leaflet GIS canvas & choropleth layer
│   │   ├── Modals/                    # Thermal calculator & SIT-REP modals
│   │   ├── Notifications/             # Emergency toast banner system
│   │   ├── Sidebar/                   # Ward telemetry inspector & surge chart
│   │   └── Timeline/                  # 120-hour forecast playback slider
│   ├── data/                          # West Bengal GeoJSON and asset coordinates
│   ├── services/heatApi.ts            # Client connecting frontend to /api
│   ├── store/useCommandCenterStore.ts # Central Zustand state management
│   └── types/                         # Shared TypeScript interfaces
│
├── main.py                            # FastAPI application & alert endpoints
├── thermal_service.py                 # Pure-Python UTCI & Rothfusz calculation engine
├── forecast_service.py                # 120-hour rolling meteorology simulation store
├── ward_data.py                       # 23-district polygons, microclimates & assets
├── test_backend.py                    # 7-part comprehensive backend test suite
├── requirements.txt                   # Local backend dependencies
├── vercel.json                        # Vercel fullstack rewrite configuration
├── .vercelignore                      # Excludes local caches & virtualenvs
├── package.json                       # Frontend dependencies & npm scripts
└── vite.config.ts                     # Vite build & reverse-proxy configuration
```

---

## 🧪 Testing & Verification

Run the comprehensive 7-point backend test suite:
```bash
python -u test_backend.py
```

Build and test frontend TypeScript bundle:
```bash
npm run build
```

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

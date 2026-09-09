# 🔥 HeatWatch WB: West Bengal Heat Risk & Biometeorological Command Center

> **Enterprise Geospatial Early Warning & Clinical Biometeorology Platform for Heatwaves in West Bengal**  
> Built with **React 18**, **TypeScript**, **Leaflet GIS**, **FastAPI**, and **pythermalcomfort**.

---

## ⚡ Quick Start Setup Guide for Team Members

Follow these simple steps to get the complete platform (frontend + backend) running on your local machine.

### 📋 Prerequisites
Ensure you have the following installed on your machine:
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

### 2️⃣ Run the Python Backend API

Open your first terminal window in the project root:

```bash
# Optional: Create and activate a virtual environment
# Windows:
python -m venv venv
venv\Scripts\activate
# macOS/Linux:
# python3 -m venv venv
# source venv/bin/activate

# Install backend dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
```

- 🌐 **Backend API**: [`http://127.0.0.1:8000`](http://127.0.0.1:8000)
- 📖 **Interactive Swagger API Docs**: [`http://127.0.0.1:8000/docs`](http://127.0.0.1:8000/docs)
- 🧪 **Run Backend Test Suite**:
  ```bash
  python test_backend.py
  ```

---

### 3️⃣ Run the React Frontend Application

Open a **second terminal window** in the project root:

```bash
# Install frontend dependencies
npm install

# Launch Vite development server
npm run dev
```

- 💻 **Web Application**: [`http://localhost:5173`](http://localhost:5173)

---

## 🌟 Key Features

1. **Full-Bleed Leaflet GIS Heat Risk Map**:
   - High-contrast GIS choropleth displaying municipal heat risk across Kolkata, Howrah, and Asansol.
   - Interactive ward boundary selection with localized biometeorological alerts and microclimate metrics.

2. **120-Hour Granular Time-Slider**:
   - Scrub through 5-day hourly forecast simulations (`hourIndex` 0–119).
   - Dynamic diurnal temperature curves, peak heatwave envelopes, solar radiation models, and hospitalization risk spikes.

3. **Physiological Thermal Stress Calculator (`pythermalcomfort`)**:
   - Calculates **Universal Thermal Climate Index (UTCI)** and **NOAA Heat Index** based on air temperature, relative humidity, 10m wind speed, and solar radiation / Mean Radiant Temperature (MRT).
   - Automated 4-tier risk classification: *Low*, *Moderate*, *High*, and *Severe*.

4. **Emergency Infrastructure Asset Locator**:
   - Real-time mapping of cooling shelters (e.g. AC Metro concourses), hydration stations, and hospital heat trauma units (cryo-cooling baths).

5. **Civil Defense Sit-Rep & Early Warning Directives**:
   - Generate printable Situation Reports (SIT-REPs) and dispatch mock SMS / broadcast alerts for vulnerable populations.

---

## 🏗️ Project Architecture

```
heatwaveindex/
├── src/                               # React + TypeScript Frontend
│   ├── components/
│   │   ├── Header/                    # Top navigation & live telemetry badges
│   │   ├── Map/                       # Leaflet GIS canvas & choropleth layer
│   │   ├── Modals/                    # Thermal calculator, SitRep, & broadcast modals
│   │   ├── Sidebar/                   # Ward telemetry inspector & checklists
│   │   └── Timeline/                  # 120-hour forecast playback slider
│   ├── data/                          # GeoJSON shapes & asset directories
│   ├── services/heatApi.ts            # Typed client connecting frontend to FastAPI
│   ├── store/useCommandCenterStore.ts # Central Zustand state management
│   └── types/                         # TypeScript interfaces
│
├── main.py                            # FastAPI application entrypoint & routes
├── thermal_service.py                 # pythermalcomfort UTCI calculation engine
├── forecast_service.py                # 120-hour dynamic rolling simulation store
├── ward_data.py                       # West Bengal ward polygons & metadata
├── test_backend.py                    # Comprehensive backend verification suite
├── requirements.txt                   # Python dependencies
├── package.json                       # Frontend dependencies & scripts
└── vite.config.ts                     # Vite build configuration
```

---

## 🛠️ Verification & Building for Production

### Verify Frontend TypeScript & Production Bundle:
```bash
npm run build
```

### Verify Backend Endpoints:
```bash
python test_backend.py
```

---

## 👥 Contributing & Team Collaboration

1. Always pull latest changes before starting work:
   ```bash
   git pull origin main
   ```
2. Create a new branch for your feature:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. Commit and push:
   ```bash
   git add .
   git commit -m "feat: description of your change"
   git push origin feature/your-feature-name
   ```

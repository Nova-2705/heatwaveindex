import React from 'react';
import { CommandCenterHeader } from './components/Header/CommandCenterHeader';
import { GISMapCanvas } from './components/Map/GISMapCanvas';
import { CommandCenterSidebar } from './components/Sidebar/CommandCenterSidebar';
import { ForecastSlider } from './components/Timeline/ForecastSlider';
import { BroadcastModal } from './components/Modals/BroadcastModal';
import { SitRepModal } from './components/Modals/SitRepModal';
import { StressCalculatorModal } from './components/Modals/StressCalculatorModal';

export const App: React.FC = () => {
  return (
    <div className="flex flex-col w-screen h-screen overflow-hidden bg-[#0b0f19] text-slate-100 antialiased select-none font-sans-gis">
      {/* 1. Fixed Enterprise Meteorological GIS Header */}
      <CommandCenterHeader />

      {/* 2. Main Full-Bleed Map Viewport + Collapsible Attribute Inspector */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Full-Bleed Interactive Map Canvas */}
        <div className="flex-1 relative overflow-hidden bg-[#0b0f19]">
          <GISMapCanvas />
        </div>

        {/* Attribute Inspector / Meteorological Telemetry Sidebar */}
        <CommandCenterSidebar />
      </div>

      {/* 3. Docked Flat Meteorological Time-Series Instrument Deck */}
      <ForecastSlider />

      {/* Operational Civil Defense & Biometeorology Modals */}
      <BroadcastModal />
      <SitRepModal />
      <StressCalculatorModal />
    </div>
  );
};

export default App;

import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Info, X } from 'lucide-react';
import { useCommandCenterStore } from '../../store/useCommandCenterStore';
import { westBengalHeatGeoJSON, westBengalAssets } from '../../data/westBengalHeatData.js';
import type { InfrastructureAsset } from '../../types';

// Helper to extract the day key (day1 to day5) from the 120-hour timeline
const getDayKey = (hour: number): 'day1' | 'day2' | 'day3' | 'day4' | 'day5' => {
  const dayIndex = Math.min(5, Math.floor(hour / 24) + 1);
  return `day${dayIndex}` as 'day1' | 'day2' | 'day3' | 'day4' | 'day5';
};

// Dynamic styling palette mapper as specified:
// severe -> #ef4444, high -> #f97316, moderate -> #eab308, low -> #22c55e
const getGeoJsonRiskStyle = (level: string) => {
  switch (level) {
    case 'severe':
      return {
        fillColor: '#ef4444',
        color: '#ef4444',
        badgeBg: 'rgba(239, 68, 68, 0.2)',
        badgeText: '#fca5a5',
        badgeBorder: '#ef4444'
      };
    case 'high':
      return {
        fillColor: '#f97316',
        color: '#f97316',
        badgeBg: 'rgba(249, 115, 22, 0.2)',
        badgeText: '#fdba74',
        badgeBorder: '#f97316'
      };
    case 'moderate':
      return {
        fillColor: '#eab308',
        color: '#eab308',
        badgeBg: 'rgba(234, 179, 8, 0.2)',
        badgeText: '#fde047',
        badgeBorder: '#eab308'
      };
    case 'low':
    default:
      return {
        fillColor: '#22c55e',
        color: '#22c55e',
        badgeBg: 'rgba(34, 197, 94, 0.2)',
        badgeText: '#86efac',
        badgeBorder: '#22c55e'
      };
  }
};

export const GISMapCanvas: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const geoJsonLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const assetLayerGroupRef = useRef<L.LayerGroup | null>(null);

  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const {
    activeHour,
    selectedRegionId,
    selectedWardId,
    layers,
    selectWard,
    liveWardsGeoJSON
  } = useCommandCenterStore();

  const activeGeoJSON = liveWardsGeoJSON || westBengalHeatGeoJSON;

  // 1. Initialize Leaflet Map centered on West Bengal (Kolkata & Asansol)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Prevent default icon 404s
    delete (L.Icon.Default.prototype as any)._getIconUrl;

    const map = L.map(mapContainerRef.current, {
      center: [22.95, 87.95],
      zoom: 8,
      minZoom: 7,
      maxZoom: 18,
      zoomControl: false,
    });

    // Base tile layer: Watermark-free, key-free Esri Dark Gray Canvas by default.
    const cartoKey = (import.meta as any).env?.VITE_CARTO_API_KEY;
    const maptilerKey = (import.meta as any).env?.VITE_MAPTILER_API_KEY;
    const mapboxToken = (import.meta as any).env?.VITE_MAPBOX_API_KEY;

    let tileUrl = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}';
    let tileAttribution = '&copy; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community';
    let maxNativeZoom = 16;

    if (cartoKey) {
      tileUrl = `https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png?key=${cartoKey}`;
      tileAttribution = '&copy; OpenStreetMap contributors &copy; CARTO';
      maxNativeZoom = 19;
    } else if (maptilerKey) {
      tileUrl = `https://api.maptiler.com/maps/basic-v2-dark/{z}/{x}/{y}.png?key=${maptilerKey}`;
      tileAttribution = '&copy; MapTiler &copy; OpenStreetMap contributors';
      maxNativeZoom = 19;
    } else if (mapboxToken) {
      tileUrl = `https://api.mapbox.com/styles/v1/mapbox/dark-v11/tiles/{z}/{x}/{y}?access_token=${mapboxToken}`;
      tileAttribution = '&copy; Mapbox &copy; OpenStreetMap contributors';
      maxNativeZoom = 19;
    }

    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      subdomains: 'abcd',
      maxNativeZoom,
      maxZoom: 18,
      tileSize: 256,
    }).addTo(map);

    // If using default Esri base, add the crisp Dark Gray Reference labels layer
    if (!cartoKey && !maptilerKey && !mapboxToken) {
      L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}', {
        maxNativeZoom: 16,
        maxZoom: 18,
        tileSize: 256,
      }).addTo(map);
    }

    // Enterprise zoom controls at bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create Layer Groups
    geoJsonLayerGroupRef.current = L.layerGroup().addTo(map);
    assetLayerGroupRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    // Auto-fit initial bounds for West Bengal features
    try {
      const initialBounds = L.geoJSON(westBengalHeatGeoJSON as any).getBounds();
      if (initialBounds.isValid()) {
        map.fitBounds(initialBounds, { padding: [40, 40], maxZoom: 10 });
      }
    } catch {
      // Fallback to center
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render West Bengal Heat GeoJSON with Dynamic 5-Day Multi-Temporal Forecast & Minimalist Popup
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geoJsonLayerGroupRef.current) return;

    geoJsonLayerGroupRef.current.clearLayers();

    const dayKey = getDayKey(activeHour);

    const geoJsonLayer = L.geoJSON(activeGeoJSON as any, {
      style: (feature: any) => {
        const forecasts = feature?.properties?.forecasts;
        const forecast = forecasts?.[dayKey] || forecasts?.day1;
        const level = forecast?.level || 'low';
        const isSelected = selectedWardId === feature?.properties?.id;
        const riskStyle = getGeoJsonRiskStyle(level);
        return {
          fillColor: riskStyle.fillColor,
          color: isSelected ? '#ffffff' : riskStyle.color,
          weight: isSelected ? 3 : 2,
          fillOpacity: isSelected ? 0.48 : 0.35,
        };
      },
      onEachFeature: (feature: any, layer: L.Layer) => {
        const props = feature.properties;
        const forecasts = props?.forecasts;
        const forecast = forecasts?.[dayKey] || forecasts?.day1;
        const level = forecast?.level || 'low';
        const riskStyle = getGeoJsonRiskStyle(level);

        // 3. Minimalist Click Popup with Localized Context-Aware Advice
        const popupContent = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 4px 6px; min-width: 210px; max-width: 270px; color: #f8fafc;">
            <div style="font-size: 14px; font-weight: 700; color: #ffffff; margin-bottom: 5px;">${props.name}</div>
            <div style="display: inline-flex; align-items: center; gap: 5px; padding: 2px 9px; border-radius: 9999px; font-size: 11px; font-weight: 600; margin-bottom: 7px; background-color: ${riskStyle.badgeBg}; color: ${riskStyle.badgeText}; border: 1px solid ${riskStyle.badgeBorder};">
              <span style="width: 6px; height: 6px; border-radius: 9999px; background-color: ${riskStyle.fillColor}; display: inline-block;"></span>
              <span>${forecast.label}</span>
            </div>
            <div style="font-size: 12px; color: #cbd5e1; margin-bottom: 5px;">
              Forecast Temperature: <strong style="color: #ffffff; font-size: 13px;">${forecast.temp}</strong>
            </div>
            <div style="font-size: 11px; color: #94a3b8; line-height: 1.4; padding-top: 6px; border-top: 1px solid #334155;">
              💡 ${forecast.advice}
            </div>
          </div>
        `;

        layer.bindPopup(popupContent, {
          className: 'leaflet-popup-content-wrapper',
          closeButton: true,
          autoPan: true
        });

        // Hover Tooltip
        layer.bindTooltip(
          `
          <div class="font-sans text-xs p-1 space-y-1">
            <div class="font-bold text-white">${props.name}</div>
            <div class="text-xs font-semibold" style="color: ${riskStyle.fillColor}">${forecast.label} • ${forecast.temp}</div>
            <div class="text-[11px] text-slate-300">${forecast.advice}</div>
          </div>
          `,
          { sticky: true, className: 'leaflet-popup-content-wrapper' }
        );

        layer.on('click', () => {
          selectWard(props.id);
        });

        layer.on('mouseover', () => {
          if ('setStyle' in layer) {
            (layer as any).setStyle({
              weight: 3,
              fillOpacity: 0.52,
              color: '#ffffff',
            });
          }
        });

        layer.on('mouseout', () => {
          if ('setStyle' in layer) {
            const isSelected = selectedWardId === props.id;
            (layer as any).setStyle({
              weight: isSelected ? 3 : 2,
              fillOpacity: isSelected ? 0.48 : 0.35,
              color: isSelected ? '#ffffff' : riskStyle.color,
            });
          }
        });
      }
    });

    geoJsonLayerGroupRef.current.addLayer(geoJsonLayer);
  }, [activeHour, selectedWardId, selectWard, activeGeoJSON]);

  // 3. Render Minimalist Infrastructure Asset Badges for West Bengal
  useEffect(() => {
    if (!assetLayerGroupRef.current) return;
    assetLayerGroupRef.current.clearLayers();

    westBengalAssets.forEach((asset: InfrastructureAsset) => {
      let isVisible = false;
      let markerColor = '#94a3b8';
      let iconSvg = '';

      switch (asset.type) {
        case 'cooling_shelter':
          isVisible = layers.coolingShelters;
          markerColor = '#0ea5e9'; // Clean sky blue
          iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          `;
          break;
        case 'hydration_station':
          isVisible = layers.hydrationStations;
          markerColor = '#38bdf8'; // Water droplet
          iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
            </svg>
          `;
          break;
        case 'health_center':
          isVisible = layers.healthCenters;
          markerColor = '#34d399'; // Medical pulse / clinic
          iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          `;
          break;
        case 'hospital':
          isVisible = layers.hospitals;
          markerColor = '#f87171'; // Red cross
          iconSvg = `
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          `;
          break;
      }

      if (!isVisible) return;

      const usagePct = Math.round((asset.currentUsage / asset.capacity) * 100);
      const isCritical = usagePct >= 90;

      // Minimalist dark-slate circular badge with thin border
      const customIcon = L.divIcon({
        className: 'custom-asset-marker',
        html: `
          <div class="gis-marker-badge" style="border-color: ${isCritical ? '#f87171' : 'rgba(255,255,255,0.35)'}; color: ${markerColor};">
            ${iconSvg}
          </div>
        `,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker(asset.location, { icon: customIcon });

      marker.bindPopup(`
        <div class="font-sans text-xs p-1 max-w-[240px]">
          <div class="font-bold text-white text-sm border-b border-slate-700 pb-1.5 mb-2" style="color: ${markerColor}">
            ${asset.name}
          </div>
          <div class="space-y-1 text-slate-300">
            <div class="flex justify-between">
              <span class="text-slate-400">Class:</span>
              <span class="capitalize font-medium text-slate-200">${asset.type.replace('_', ' ')}</span>
            </div>
            <div class="flex justify-between font-mono-data">
              <span class="text-slate-400">Capacity:</span>
              <span class="font-semibold ${isCritical ? 'text-red-400' : 'text-emerald-400'}">
                ${asset.currentUsage} / ${asset.capacity} (${usagePct}%)
              </span>
            </div>
            <div class="text-[10px] text-slate-400 mt-1">
              ${asset.features.join(' • ')}
            </div>
          </div>
        </div>
      `, { className: 'leaflet-popup-content-wrapper' });

      if (assetLayerGroupRef.current) {
        assetLayerGroupRef.current.addLayer(marker);
      }
    });
  }, [layers]);

  // FlyTo on selected region / ward
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (!selectedWardId || selectedRegionId === 'west_bengal') {
      try {
        const bounds = L.geoJSON(activeGeoJSON as any).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
        }
      } catch {
        // Fallback
      }
    } else if (selectedWardId) {
      const feature = activeGeoJSON.features.find((f: any) => f.properties.id === selectedWardId);
      if (feature) {
        try {
          const bounds = L.geoJSON(feature as any).getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 13 });
          }
        } catch {
          // Fallback
        }
      }
    }
  }, [selectedRegionId, selectedWardId, activeGeoJSON]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0b0f19]">
      {/* Map Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top-Left: Live Backend Data Telemetry Chip */}
      <div className="absolute top-3 left-3 z-10 pointer-events-auto">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 backdrop-blur-md border border-slate-700/70 text-xs shadow-xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-slate-300 font-medium">Live Telemetry:</span>
          <span className="text-amber-400 font-semibold">West Bengal Heat Zones</span>
          <span className="text-[10px] text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-500/40 font-mono">
            FastAPI + pythermalcomfort
          </span>
        </div>
      </div>

      {/* Bottom-Left: Minimalist Heat Safety Guide Trigger */}
      <div className="absolute bottom-3 left-3 z-10 pointer-events-auto">
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition cursor-pointer shadow-lg backdrop-blur-md ${
            isLegendOpen
              ? 'bg-slate-800 text-white border-slate-600'
              : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/60 hover:text-white'
          }`}
          title="Heat Safety Guide"
        >
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-medium">Heat Safety Guide</span>
        </button>

        {/* Clean Minimalist Popover */}
        {isLegendOpen && (
          <div className="absolute bottom-10 left-0 w-64 p-3 rounded-xl bg-slate-900/95 border border-slate-800 shadow-2xl backdrop-blur-md text-xs space-y-2 z-30">
            <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
              <div>
                <div className="text-xs font-bold text-slate-100">Heat Safety Guide</div>
                <div className="text-[10px] text-slate-400">What the colors mean for you:</div>
              </div>
              <button
                onClick={() => setIsLegendOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] flex-shrink-0 shadow-sm" />
                <div className="leading-tight">
                  <span className="font-semibold text-rose-300 block text-xs">Severe Heat Risk</span>
                  <span className="text-[10px] text-slate-300">Dangerous — stay indoors with cooling</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] flex-shrink-0 shadow-sm" />
                <div className="leading-tight">
                  <span className="font-semibold text-amber-400 block text-xs">High Heat Warning</span>
                  <span className="text-[10px] text-slate-300">Drink water & limit outdoor sun</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#eab308] flex-shrink-0 shadow-sm" />
                <div className="leading-tight">
                  <span className="font-semibold text-yellow-300 block text-xs">Moderate Heat</span>
                  <span className="text-[10px] text-slate-300">Take shade breaks & stay hydrated</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#22c55e] flex-shrink-0 shadow-sm" />
                <div className="leading-tight">
                  <span className="font-semibold text-emerald-300 block text-xs">Normal Conditions</span>
                  <span className="text-[10px] text-slate-300">Comfortable outdoor conditions</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

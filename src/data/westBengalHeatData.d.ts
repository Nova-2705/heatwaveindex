import type { InfrastructureAsset } from '../types';

export interface WBHeatForecastDay {
  level: 'low' | 'moderate' | 'high' | 'severe';
  label: string;
  temp: string;
  advice: string;
}

export interface WBHeatFeatureProperties {
  id: string;
  name: string;
  forecasts: {
    day1: WBHeatForecastDay;
    day2: WBHeatForecastDay;
    day3: WBHeatForecastDay;
    day4: WBHeatForecastDay;
    day5: WBHeatForecastDay;
  };
}

export interface WBHeatGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: WBHeatFeatureProperties;
}

export interface WBHeatGeoJSONCollection {
  type: 'FeatureCollection';
  features: WBHeatGeoJSONFeature[];
}

export declare const westBengalHeatGeoJSON: WBHeatGeoJSONCollection;
export declare const westBengalAssets: InfrastructureAsset[];

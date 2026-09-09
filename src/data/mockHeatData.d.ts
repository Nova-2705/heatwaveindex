export interface HeatForecastDay {
  level: 'low' | 'moderate' | 'high' | 'severe';
  label: string;
  temp: string;
  advice: string;
}

export interface HeatFeatureProperties {
  id: string;
  name: string;
  forecasts: {
    day1: HeatForecastDay;
    day2: HeatForecastDay;
    day3: HeatForecastDay;
    day4: HeatForecastDay;
    day5: HeatForecastDay;
  };
}

export interface HeatGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'Polygon';
    coordinates: number[][][];
  };
  properties: HeatFeatureProperties;
}

export interface HeatGeoJSONCollection {
  type: 'FeatureCollection';
  features: HeatGeoJSONFeature[];
}

export declare const mockHeatGeoJSON: HeatGeoJSONCollection;

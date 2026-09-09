export const mockHeatGeoJSON = {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.15, 28.62],
            [77.22, 28.62],
            [77.22, 28.68],
            [77.15, 28.68],
            [77.15, 28.62]
          ]
        ]
      },
      "properties": {
        "id": "ward-01",
        "name": "Central Core / Connaught Precinct",
        "forecasts": {
          "day1": { "level": "moderate", "label": "Moderate Heat", "temp": "31°C", "advice": "Stay hydrated outdoors." },
          "day2": { "level": "high", "label": "High Heat Warning", "temp": "36°C", "advice": "Limit heavy physical activity between 12 PM - 4 PM." },
          "day3": { "level": "severe", "label": "Severe Heat Risk (Stay Indoors)", "temp": "41°C", "advice": "Cooling centers active. Avoid non-essential outdoor movement." },
          "day4": { "level": "high", "label": "High Heat Warning", "temp": "35°C", "advice": "High temperatures persist. Keep vulnerable groups indoors." },
          "day5": { "level": "moderate", "label": "Moderate Heat", "temp": "30°C", "advice": "Conditions improving." }
        }
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.23, 28.58],
            [77.30, 28.58],
            [77.30, 28.64],
            [77.23, 28.64],
            [77.23, 28.58]
          ]
        ]
      },
      "properties": {
        "id": "ward-02",
        "name": "East Metropolitan District",
        "forecasts": {
          "day1": { "level": "low", "label": "Normal Conditions", "temp": "27°C", "advice": "No restrictions." },
          "day2": { "level": "moderate", "label": "Moderate Heat", "temp": "30°C", "advice": "Carry water if commuting." },
          "day3": { "level": "severe", "label": "Severe Heat Risk (Stay Indoors)", "temp": "42°C", "advice": "Emergency protocol active. Hydration stations open." },
          "day4": { "level": "high", "label": "High Heat Warning", "temp": "37°C", "advice": "Exercise caution outdoors." },
          "day5": { "level": "low", "label": "Normal Conditions", "temp": "26°C", "advice": "Safe outdoor conditions." }
        }
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.10, 28.64],
            [77.18, 28.64],
            [77.18, 28.72],
            [77.10, 28.72],
            [77.10, 28.64]
          ]
        ]
      },
      "properties": {
        "id": "ward-03",
        "name": "West Industrial & Transit Corridor",
        "forecasts": {
          "day1": { "level": "moderate", "label": "Moderate Heat", "temp": "32°C", "advice": "Take shaded breaks." },
          "day2": { "level": "high", "label": "High Heat Warning", "temp": "38°C", "advice": "Hydrate frequently; avoid direct midday sun." },
          "day3": { "level": "severe", "label": "Severe Heat Risk (Stay Indoors)", "temp": "44°C", "advice": "Curfew on outdoor labor active. Misting stations deployed." },
          "day4": { "level": "high", "label": "High Heat Warning", "temp": "37°C", "advice": "Caution for outdoor workers." },
          "day5": { "level": "moderate", "label": "Moderate Heat", "temp": "31°C", "advice": "Normal work hours resumed." }
        }
      }
    },
    {
      "type": "Feature",
      "geometry": {
        "type": "Polygon",
        "coordinates": [
          [
            [77.17, 28.52],
            [77.25, 28.52],
            [77.25, 28.58],
            [77.17, 28.58],
            [77.17, 28.52]
          ]
        ]
      },
      "properties": {
        "id": "ward-04",
        "name": "South Urban Foothills",
        "forecasts": {
          "day1": { "level": "low", "label": "Normal Conditions", "temp": "28°C", "advice": "Pleasant conditions." },
          "day2": { "level": "moderate", "label": "Moderate Heat", "temp": "31°C", "advice": "Stay hydrated during peak sun." },
          "day3": { "level": "high", "label": "High Heat Warning", "temp": "39°C", "advice": "Stay in shaded zones during 12 PM - 4 PM." },
          "day4": { "level": "moderate", "label": "Moderate Heat", "temp": "32°C", "advice": "Cooling off gradually." },
          "day5": { "level": "low", "label": "Normal Conditions", "temp": "27°C", "advice": "Normal outdoor weather." }
        }
      }
    }
  ]
};

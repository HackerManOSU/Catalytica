// Import the Scheduler trigger and logger from Firebase Functions v2
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import admin from 'firebase-admin';
import axios from 'axios';
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as functions from "firebase-functions";
import cors from 'cors';


admin.initializeApp();
const db = admin.firestore();

// Set up Gemini
const genAI = new GoogleGenerativeAI("GEMINI_API_KEY_HERE");


// -----------------------------
// Weather-related Interfaces & Controllers
// -----------------------------
export interface Weather {
  weather_desc: string;
  humidity: number;
  temperature: number;
  wind_speed: number;
  wind_direction: number;
}

export async function addWeatherController(weatherData: Weather) {
  try {
    const docRef = await db.collection("weather").add(weatherData);
    return docRef; // return ref for fire.ts
  } catch (err) {
    console.log("Error adding weather: ", err);
    throw err;
  }
};

export async function getWeatherController(): Promise<Weather[]> {
  try {
    const snapshot = await db.collection("weather").get();
    return snapshot.docs.map(doc => {
      const weatherData = doc.data() as Weather;
      return { id: doc.id, ...weatherData };
    });
  }
  catch (err) {
    console.error("Error getting weather:", err);
    throw err;
  }
};


// API Key for Weather
const OPENWEATHER_API_KEY = 'OPENWEATHER_API_KEY_HERE';

// --------------------------------------------------------------------
// FIRMS Data Update Function with Weather Enrichment
// --------------------------------------------------------------------

// Define your FIRMSData interface
export interface FIRMSData {
  country_id?: string;
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  satellite?: string;
  instrument?: string;
  confidence: number;
  version?: string;
  bright_t31: number;
  frp: number;
  daynight?: string;
  [key: string]: any;
}

export const fetchRecentFIRMSData = async (days: number = 1): Promise<FIRMSData[]> => {
  const useMockData = process.env.VITE_USE_MOCK_DATA?.toLowerCase() === 'true';
  if (useMockData) {
    console.log('Using mock data as specified in environment variables');
    return getFallbackMockData();
  }

  try {
    const API_KEY = 'FIRMS_API_KEY_HERE';

    if (!API_KEY) {
      console.error('FIRMS API key not found');
      throw new Error('FIRMS API key not found');
    }

    const validDays = 2;
    const response = await axios.get(`https://firms.modaps.eosdis.nasa.gov/api/country/csv/${API_KEY}/VIIRS_SNPP_NRT/USA/${validDays}`);

    if (response.status !== 200) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const csvData: string = response.data;
    console.log("Raw CSV data (first 500 chars):", csvData.substring(0, 500));

    const lines = csvData.split('\n');
    if (lines.length === 0 || !lines[0].trim()) {
      console.warn("CSV response is empty or missing headers");
      return [];
    }

    const headers = lines[0].split(',');
    const parsedData: FIRMSData[] = [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      const values = lines[i].split(',');
      if (values.length !== headers.length) continue;

      const row: any = {};
      headers.forEach((header: string, index: number) => {
        row[header.trim()] = values[index];
      });

      parsedData.push({
        country_id: row.country_id || '',
        latitude: parseFloat(row.latitude) || 0,
        longitude: parseFloat(row.longitude) || 0,
        brightness: parseFloat(row.bright_ti4) || 0,
        scan: parseFloat(row.scan) || 0,
        track: parseFloat(row.track) || 0,
        acq_date: row.acq_date || new Date().toISOString().split('T')[0],
        acq_time: row.acq_time || "0000",
        satellite: row.satellite || '',
        instrument: row.instrument || '',
        confidence: row.confidence === 'h' ? 90 : row.confidence === 'n' ? 50 : row.confidence === 'l' ? 30 : parseFloat(row.confidence || '80'),
        version: row.version || '',
        bright_t31: parseFloat(row.bright_ti5) || 0,
        frp: parseFloat(row.frp) || 0,
        daynight: row.daynight || ''
      });
    }

    console.log(`Received and parsed ${parsedData.length} FIRMS data points`);
    return parsedData;
  } catch (error) {
    console.error('Error fetching FIRMS data:', error);
    console.log('Falling back to mock data due to error');
    return getFallbackMockData();
  }
};

function getFallbackMockData(): FIRMSData[] {
  const mockData: FIRMSData[] = [
    { country_id: "USA", latitude: 37.7749, longitude: -122.4194, brightness: 340.5, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 290.5, frp: 45.2, daynight: "N" },
    { country_id: "USA", latitude: 34.0522, longitude: -118.2437, brightness: 320.8, scan: 0.41, track: 0.37, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 285.6, frp: 36.7, daynight: "N" },
  ];

  return mockData.map(point => {
    const randomFrpAdjustment = Math.random() * 10 - 5;
    return {
      ...point,
      frp: Math.max(point.frp + randomFrpAdjustment, 1),
      acq_date: new Date().toISOString().split('T')[0]
    };
  });
}

export const scheduledFIRMSUpdate = onSchedule('every 1 minutes', async (event) => {
  try {
    const days = 1;
    const data = await fetchRecentFIRMSData(days);
    logger.info('Fetched FIRMS data:', JSON.stringify(data, null, 2));

    const enrichedData = await Promise.all(data.map(async (fire) => {
      try {
        const weatherResponse = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: {
            lat: fire.latitude,
            lon: fire.longitude,
            appid: OPENWEATHER_API_KEY,
            units: 'imperial',
          },
        });

        const weatherInfo: Weather = {
          weather_desc: weatherResponse.data.weather?.[0]?.description || "",
          humidity: weatherResponse.data.main?.humidity,
          temperature: weatherResponse.data.main?.temp,
          wind_speed: weatherResponse.data.wind?.speed,
          wind_direction: weatherResponse.data.wind?.deg,
        };
        return { ...fire, weather: weatherInfo };
      } catch (err) {
        logger.error(`Error fetching weather for fire at lat:${fire.latitude}, lon:${fire.longitude}:`, err);
        return { ...fire, weather: null };
      }
    }));

    logger.info('Enriched FIRMS data with weather:', JSON.stringify(enrichedData, null, 2));

    if (enrichedData.length === 0) {
      logger.warn('No FIRMS data returned. Skipping Firestore write.');
    } else {
      const writeResult = await db.collection('firmsUpdates').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: enrichedData,
      });
      logger.info('FIRMS data stored with document ID:', writeResult.id);
    }
  } catch (error) {
    logger.error('Error in scheduledFIRMSUpdate:', error);
  }
});

function haversineDistance(
  [lat1, lon1]: [number, number],
  [lat2, lon2]: [number, number]
): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

const corsHandler = cors({ origin: true });

export const generateRecommendations = functions.https.onRequest((req, res) => {
  corsHandler(req, res, async () => {
    try {
      const {
        lat,
        lng,
        weather,
        Temp,
        Wind,
        Humidity,
        severity,
        totalFires,
        population,
        region
      } = req.body;

      if (lat == null || lng == null) {
        return res.status(400).json({ error: "Latitude and longitude are required." });
      }

      const temperature = Temp != null ? Temp : "Unknown";
      const windSpeed = Wind != null ? Wind : "Unknown";
      const humidity = Humidity != null ? Humidity : "Unknown";
      const currentWeather = weather || "Unknown";

      const hasTempData = Temp != null;
      const hasWindData = Wind != null;
      const hasHumidityData = Humidity != null;

      const userLoc: [number, number] = [lat, lng];
      const allDocs = await db.collection("userEntries").get();

      const matchingReports: { entry: string; distance: number }[] = [];

      for (const doc of allDocs.docs) {
        const data = doc.data();
        if (!data.coordinates || typeof data.coordinates.lat !== "number" || typeof data.coordinates.lng !== "number") {
          continue;
        }

        const docLoc: [number, number] = [data.coordinates.lat, data.coordinates.lng];
        const distanceKm = haversineDistance(userLoc, docLoc);
        const distanceMi = distanceKm * 0.621371;

        if (distanceMi <= 15) {
          matchingReports.push({
            entry: data.entry || "No description",
            distance: distanceMi,
          });
        }
      }

      const sorted = matchingReports.sort((a, b) => a.distance - b.distance).slice(0, 30);
      const reportSnippets = sorted.map(
        (r, i) => `${i + 1}. "${r.entry}" (${r.distance.toFixed(1)} mi)`
      );

            const prompt = `
You are a wildfire safety assistant providing personalized recommendations. Use ONLY the specific data provided below for this exact location.

EXACT USER DATA:
* Current Location: ${lat}, ${lng}
* Current Weather Condition: ${currentWeather}
${hasTempData ? `* Current Temperature: ${temperature}°F (Fahrenheit)` : '* Temperature: Data unavailable'}
${hasWindData ? `* Current Wind Speed: ${windSpeed} mph (miles per hour)` : '* Wind Speed: Data unavailable'}
${hasHumidityData ? `* Current Humidity: ${humidity}% (percent)` : '* Humidity: Data unavailable'}
* Current Fire Severity Level: ${severity}
* Number of Active Fires in Region: ${totalFires}
* Local Population: ${population}
* Geographic Region: ${region}

Nearby Fire Reports (within 15 miles):
${reportSnippets.join("\n")}

INSTRUCTIONS:
1. Format your response as EXACTLY 3 bullet points, each starting with * (asterisk)
2. Each bullet point should directly reference the available weather conditions and fire severity
3. For unavailable data (marked "Data unavailable"), do NOT make assumptions - instead, provide recommendations that don't depend on that specific data
4. ${hasTempData ? `Use the actual temperature of ${temperature}°F in your analysis` : 'Do not reference specific temperature values since that data is unavailable'}
5. ${hasWindData ? `Use the actual wind speed of ${windSpeed} mph in your analysis` : 'Do not reference specific wind speed values since that data is unavailable'}
6. ${hasHumidityData ? `Use the actual humidity of ${humidity}% in your analysis` : 'Do not reference specific humidity values since that data is unavailable'}
7. Make recommendations relevant to the specific location (${lat}, ${lng}) and region (${region})
8. Keep each recommendation under 50 words and ensure they are practical, specific actions
9. DO NOT include any text before or after the 3 bullet points
`;

      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const text = await result.response.text();

      return res.status(200).json({ recommendations: text });
    } catch (err) {
      console.error("Gemini error:", err);
      return res.status(500).json({ error: "Failed to generate recommendations." });
    }
  });
});

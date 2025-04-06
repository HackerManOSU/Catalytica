// Import the Scheduler trigger and logger from Firebase Functions v2
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();

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
  } catch (err) {
    console.error("Error getting weather:", err);
    throw err;
  }
};

// --------------------------------------------------------------------
// Weather Update Function
// --------------------------------------------------------------------

// API Key
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY || '5c9b0fcd199a99e6da5ca17c4ffa43f3';

export const scheduledWeatherUpdate = onSchedule('every 1 minutes', async (event) => {
  try {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        q: 'London',
        appid: OPENWEATHER_API_KEY,
        units: 'imperial',
      },
    });

    // Log the weather data
    logger.info('Weather update:', response.data);

    const weatherData =
    {
      weather_desc: response.data.weather[0].description,
      humidity: response.data.main.humidity,
      temperature: response.data.main.temp,
      wind_speed: response.data.wind.speed,
      wind_direction: response.data.wind.deg
    }

    addWeatherController(weatherData)
    // Store the weather data in Firestore
    await db.collection('weatherUpdates').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: response.data,
    });
  } catch (error) {
    logger.error('Error fetching weather data:', error);
  }
});

// --------------------------------------------------------------------
// FIRMS Data Update Function
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
  [key: string]: any; // For any additional properties
}

/**
 * Fetch recent fire data from NASA FIRMS API
 * @param days Number of days of data to fetch (1-10)
 * @returns Array of FIRMS data points
 */

export const fetchRecentFIRMSData = async (days: number = 1): Promise<FIRMSData[]> => {
  const useMockData = process.env.VITE_USE_MOCK_DATA?.toLowerCase() === 'true';
  if (useMockData) {
    console.log('Using mock data as specified in environment variables');
    return getFallbackMockData();
  }

  try {
    const API_KEY = 'cf98c6449135681479583e01ac6894d9';
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
    // Log the first 500 characters of the CSV response for inspection
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


/**
 * Provides fallback mock data when the API request fails
 */
function getFallbackMockData(): FIRMSData[] {
  const mockData: FIRMSData[] = [
    { country_id: "USA", latitude: 37.7749, longitude: -122.4194, brightness: 340.5, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 290.5, frp: 45.2, daynight: "N" },
    { country_id: "USA", latitude: 34.0522, longitude: -118.2437, brightness: 320.8, scan: 0.41, track: 0.37, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 285.6, frp: 36.7, daynight: "N" },
    // Add additional mock data as needed
  ];

  return mockData.map(point => {
    const randomFrpAdjustment = Math.random() * 10 - 5; // -5 to +5 variation
    return {
      ...point,
      frp: Math.max(point.frp + randomFrpAdjustment, 1),
      acq_date: new Date().toISOString().split('T')[0]
    };
  });
}

export const scheduledFIRMSUpdate = onSchedule('every 1 minutes', async (event) => {
  try {
    // You can adjust the number of days if needed. Defaulting to 1.
    const days = 1;
    const data = await fetchRecentFIRMSData(days);

    logger.info('Fetched FIRMS data:', JSON.stringify(data, null, 2));

    if (data.length === 0) {
      logger.warn('No FIRMS data returned. Skipping Firestore write.');
    } else {
      const writeResult = await db.collection('firmsUpdates').add({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        data: data,
      });
      logger.info('FIRMS data stored with document ID:', writeResult.id);
    }
  } catch (error) {
    logger.error('Error in scheduledFIRMSUpdate:', error);
  }

});


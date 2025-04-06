// Import the Scheduler trigger and logger from Firebase Functions v2
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { logger } from 'firebase-functions';
import admin from 'firebase-admin';
import axios from 'axios';

admin.initializeApp();
const db = admin.firestore();

// API Key
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;

export const scheduledWeatherUpdate = onSchedule('every 1 minute', async (event) => {
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

    // Store the weather data in Firestore
    await db.collection('weatherUpdates').add({
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      data: response.data,
    });
  } catch (error) {
    logger.error('Error fetching weather data:', error);
  }
});
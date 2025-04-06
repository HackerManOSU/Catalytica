"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduledFIRMSUpdate = exports.fetchRecentFIRMSData = void 0;
// Import necessary modules from Firebase Functions v2 and other libraries
const scheduler_1 = require("firebase-functions/v2/scheduler");
const firebase_functions_1 = require("firebase-functions");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const axios_1 = __importDefault(require("axios"));
const db = firebase_admin_1.default.firestore();
/**
 * Fetch recent fire data from NASA FIRMS API
 * @param days Number of days of data to fetch (1-10)
 * @returns Array of FIRMS data points
 */
const fetchRecentFIRMSData = async (days = 1) => {
    var _a;
    // Check if we should use mock data based on environment variable
    const useMockData = ((_a = process.env.VITE_USE_MOCK_DATA) === null || _a === void 0 ? void 0 : _a.toLowerCase()) === 'true';
    if (useMockData) {
        console.log('Using mock data as specified in environment variables');
        return getFallbackMockData();
    }
    try {
        console.log('Using API key:', process.env.VITE_FIRMS_MAP_KEY);
        const API_KEY = process.env.VITE_FIRMS_MAP_KEY || '';
        if (!API_KEY) {
            console.error('FIRMS API key not found in environment variables');
            throw new Error('FIRMS API key not found');
        }
        // Ensure days parameter is within valid range
        const validDays = Math.min(Math.max(days, 1), 10);
        // Call the FIRMS API (CSV response)
        const response = await axios_1.default.get(`https://firms.modaps.eosdis.nasa.gov/api/country/csv/${API_KEY}/VIIRS_SNPP_NRT/USA/${validDays}`);
        if (response.status !== 200) {
            throw new Error(`API request failed with status ${response.status}`);
        }
        // Parse CSV data into an array of objects
        const csvData = response.data;
        const lines = csvData.split('\n');
        const headers = lines[0].split(',');
        const parsedData = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim())
                continue;
            const values = lines[i].split(',');
            if (values.length !== headers.length)
                continue;
            const row = {};
            headers.forEach((header, index) => {
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
    }
    catch (error) {
        console.error('Error fetching FIRMS data:', error);
        console.log('Falling back to mock data due to error');
        return getFallbackMockData();
    }
};
exports.fetchRecentFIRMSData = fetchRecentFIRMSData;
/**
 * Provides fallback mock data when the API request fails
 */
function getFallbackMockData() {
    const mockData = [
        { country_id: "USA", latitude: 37.7749, longitude: -122.4194, brightness: 340.5, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 290.5, frp: 45.2, daynight: "N" },
        { country_id: "USA", latitude: 34.0522, longitude: -118.2437, brightness: 320.8, scan: 0.41, track: 0.37, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 285.6, frp: 36.7, daynight: "N" },
        // Add additional mock data as needed
    ];
    return mockData.map(point => {
        const randomFrpAdjustment = Math.random() * 10 - 5; // -5 to +5 variation
        return Object.assign(Object.assign({}, point), { frp: Math.max(point.frp + randomFrpAdjustment, 1), acq_date: new Date().toISOString().split('T')[0] });
    });
}
/**
 * Scheduled Cloud Function to update FIRMS data every hour.
 * This function fetches the FIRMS data and stores it in Firestore.
 */
exports.scheduledFIRMSUpdate = (0, scheduler_1.onSchedule)('every 1 hours', async (event) => {
    try {
        // For this scheduled function, we'll use a default of 1 day of data (adjust as needed)
        const days = 1;
        const data = await (0, exports.fetchRecentFIRMSData)(days);
        // Store the fetched data in Firestore under the 'firmsUpdates' collection
        const writeResult = await db.collection('firmsUpdates').add({
            timestamp: firebase_admin_1.default.firestore.FieldValue.serverTimestamp(),
            data: data,
        });
        firebase_functions_1.logger.info('FIRMS data stored with document ID:', writeResult.id);
    }
    catch (error) {
        firebase_functions_1.logger.error('Error in scheduledFIRMSUpdate:', error);
    }
});
//# sourceMappingURL=firms.js.map
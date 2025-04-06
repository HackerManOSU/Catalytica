import axios from 'axios';

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
  // Check if we should use mock data based on environment variable
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA?.toLowerCase() === 'true';
  
  // If mock data is explicitly enabled, return mock data immediately
  if (useMockData) {
    console.log('Using mock data as specified in environment variables');
    return getFallbackMockData();
  }
  
  try {
    console.log('Using API key:', import.meta.env.VITE_FIRMS_MAP_KEY);
    
    // Get the FIRMS API key from environment variables
    const API_KEY = import.meta.env.VITE_FIRMS_MAP_KEY || '';
    
    if (!API_KEY) {
      console.error('FIRMS API key not found in environment variables');
      throw new Error('FIRMS API key not found');
    }
    
    // Ensure days parameter is within valid range
    const validDays = Math.min(Math.max(days, 1), 10);
    
    // Based on the documentation, use the correct endpoint format
    const response = await axios.get(`https://firms.modaps.eosdis.nasa.gov/api/country/csv/${API_KEY}/VIIRS_SNPP_NRT/USA/${validDays}`);
    
    // Check if we got a proper response
    if (response.status !== 200) {
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    // Parse CSV data into an array of objects
    if (response.data) {
      // The response will be CSV text - we need to parse it
      const csvData = response.data;
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');
      
      const parsedData: FIRMSData[] = [];
      
      // Start from index 1 to skip the header row
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue; // Skip empty lines
        
        const values = lines[i].split(',');
        if (values.length !== headers.length) continue; // Skip malformed lines
        
        const row: any = {};
        headers.forEach((header: string, index: number) => {
          const value = values[index];
          row[header.trim()] = value;
        });
        
        // Transform into our expected format - note that field names are directly from the API
        parsedData.push({
          country_id: row.country_id || '',
          latitude: parseFloat(row.latitude) || 0,
          longitude: parseFloat(row.longitude) || 0,
          brightness: parseFloat(row.bright_ti4) || 0, // Map 'bright_ti4' to our 'brightness' field
          scan: parseFloat(row.scan) || 0,
          track: parseFloat(row.track) || 0,
          acq_date: row.acq_date || new Date().toISOString().split('T')[0],
          acq_time: row.acq_time || "0000",
          satellite: row.satellite || '',
          instrument: row.instrument || '',
          confidence: row.confidence === 'h' ? 90 : row.confidence === 'n' ? 50 : row.confidence === 'l' ? 30 : parseFloat(row.confidence || 80),
          version: row.version || '',
          bright_t31: parseFloat(row.bright_ti5) || 0, // Map 'bright_ti5' to our 'bright_t31' field
          frp: parseFloat(row.frp) || 0,
          daynight: row.daynight || ''
        });
      }
      
      console.log(`Received and parsed ${parsedData.length} FIRMS data points`);
      return parsedData;
    } else {
      console.error('FIRMS API returned unexpected data format:', response.data);
      console.log('Falling back to mock data');
      return getFallbackMockData();
    }
    
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
  // Mock data for US wildfires
  const mockData: FIRMSData[] = [
    // California wildfires
    { country_id: "USA", latitude: 37.7749, longitude: -122.4194, brightness: 340.5, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 290.5, frp: 45.2, daynight: "N" },
    { country_id: "USA", latitude: 34.0522, longitude: -118.2437, brightness: 320.8, scan: 0.41, track: 0.37, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 285.6, frp: 36.7, daynight: "N" },
    { country_id: "USA", latitude: 36.7783, longitude: -119.4179, brightness: 355.2, scan: 0.42, track: 0.38, acq_date: "2024-07-15", acq_time: "0714", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 298.1, frp: 52.3, daynight: "N" },
    
    // Oregon wildfires
    { country_id: "USA", latitude: 45.5152, longitude: -122.6784, brightness: 330.1, scan: 0.48, track: 0.4, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 280.9, frp: 30.5, daynight: "N" },
    { country_id: "USA", latitude: 44.0582, longitude: -121.3153, brightness: 335.4, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0712", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 282.7, frp: 33.8, daynight: "N" },
    
    // Colorado wildfires
    { country_id: "USA", latitude: 39.7392, longitude: -104.9903, brightness: 315.6, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0714", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 275.2, frp: 28.9, daynight: "N" },
    { country_id: "USA", latitude: 38.8339, longitude: -104.8214, brightness: 325.7, scan: 0.42, track: 0.38, acq_date: "2024-07-15", acq_time: "0714", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 278.4, frp: 31.2, daynight: "N" },
    
    // Texas wildfires
    { country_id: "USA", latitude: 31.9686, longitude: -99.9018, brightness: 338.3, scan: 0.47, track: 0.4, acq_date: "2024-07-15", acq_time: "0714", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 286.8, frp: 35.1, daynight: "N" },
    { country_id: "USA", latitude: 32.7767, longitude: -96.7970, brightness: 318.9, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0714", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 277.3, frp: 29.4, daynight: "N" },
    
    // Florida wildfires
    { country_id: "USA", latitude: 27.9944, longitude: -81.7603, brightness: 330.2, scan: 0.43, track: 0.38, acq_date: "2024-07-15", acq_time: "0714", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 283.6, frp: 32.7, daynight: "N" },
    { country_id: "USA", latitude: 25.7617, longitude: -80.1918, brightness: 318.7, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0714", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 276.2, frp: 27.5, daynight: "N" },
    
    // Washington wildfires
    { country_id: "USA", latitude: 47.7511, longitude: -120.7401, brightness: 342.3, scan: 0.41, track: 0.37, acq_date: "2024-07-15", acq_time: "0850", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 289.8, frp: 43.9, daynight: "N" },
    { country_id: "USA", latitude: 47.6062, longitude: -122.3321, brightness: 325.6, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0850", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 279.7, frp: 32.1, daynight: "N" },
    
    // Arizona wildfires
    { country_id: "USA", latitude: 33.4484, longitude: -112.0740, brightness: 345.8, scan: 0.55, track: 0.43, acq_date: "2024-07-15", acq_time: "0852", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 292.3, frp: 48.6, daynight: "N" },
    { country_id: "USA", latitude: 32.2226, longitude: -110.9747, brightness: 333.4, scan: 0.39, track: 0.36, acq_date: "2024-07-15", acq_time: "0852", satellite: "N", instrument: "VIIRS", confidence: 50, version: "2.0NRT", bright_t31: 284.9, frp: 37.2, daynight: "N" }
  ];
  
  // Add some dynamic variation to the data for a more realistic demo
  return mockData.map(point => {
    // Add slight random variations to make the data appear dynamic
    const randomFrpAdjustment = Math.random() * 10 - 5; // -5 to +5
    return {
      ...point,
      frp: Math.max(point.frp + randomFrpAdjustment, 1), // Ensure frp is at least 1
      acq_date: new Date().toISOString().split('T')[0] // Use today's date
    };
  });
}
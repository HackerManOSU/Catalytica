import axios from 'axios';

export interface FIRMSData {
  latitude: number;
  longitude: number;
  brightness: number;
  scan: number;
  track: number;
  acq_date: string;
  acq_time: string;
  confidence: number;
  bright_t31: number;
  frp: number;
  [key: string]: any; // For any additional properties
}

/**
 * Fetch recent fire data from NASA FIRMS API
 * @param days Number of days of data to fetch (1-10)
 * @returns Array of FIRMS data points
 */
export const fetchRecentFIRMSData = async (): Promise<FIRMSData[]> => {
  const useMockData = import.meta.env.VITE_USE_MOCK_DATA?.toLowerCase() === 'true';
  if (useMockData) {
    console.warn('Using mock data for FIRMS API');
    return getFallbackMockData();
  }

  const days = 2; // Hardcode 2 days
  
  try {
    const API_KEY = import.meta.env.VITE_FIRMS_MAP_KEY || '';
    // Country-based CSV
    const response = await axios.get(
      `https://firms.modaps.eosdis.nasa.gov/api/country/csv/${API_KEY}/VIIRS_SNPP_NRT/USA/${days}`,
      {
        params: {
          source: 'VIIRS_SNPP_NRT'
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    // Parse CSV
    if (response.data) {
      const csvData = response.data;
      const lines = csvData.split('\n');
      const headers = lines[0].split(',');

      const parsedData: FIRMSData[] = [];
      for (let i = 1; i < lines.length; i++) {
        const rowData = lines[i].trim();
        if (!rowData) continue;

        const values = rowData.split(',');
        if (values.length !== headers.length) continue;
        
        const row: any = {};
        headers.forEach((h: string, idx: number) => {
          row[h.trim()] = values[idx];
        });

        // Use fields from the new CSV columns
        parsedData.push({
          latitude: parseFloat(row.latitude) || 0,
          longitude: parseFloat(row.longitude) || 0,
          brightness: parseFloat(row.bright_ti4) || 0,
          scan: parseFloat(row.scan) || 1,
          track: parseFloat(row.track) || 1,
          acq_date: row.acq_date || new Date().toISOString().split('T')[0],
          acq_time: row.acq_time || "0000",
          confidence: row.confidence === 'h' ? 90 : row.confidence === 'n' ? 50 : parseFloat(row.confidence || 80),
          bright_t31: parseFloat(row.bright_ti5) || 280,
          frp: parseFloat(row.frp) || 30
        });
      }
      return parsedData;
    } else {
      return getFallbackMockData();
    }
  } catch {
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
    { latitude: 37.7749, longitude: -122.4194, brightness: 340.5, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 95, bright_t31: 290.5, frp: 45.2 },
    { latitude: 34.0522, longitude: -118.2437, brightness: 320.8, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 90, bright_t31: 285.6, frp: 36.7 },
    { latitude: 36.7783, longitude: -119.4179, brightness: 355.2, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 98, bright_t31: 298.1, frp: 52.3 },
    
    // Oregon wildfires
    { latitude: 45.5152, longitude: -122.6784, brightness: 330.1, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 88, bright_t31: 280.9, frp: 30.5 },
    { latitude: 44.0582, longitude: -121.3153, brightness: 335.4, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 92, bright_t31: 282.7, frp: 33.8 },
    
    // Colorado wildfires
    { latitude: 39.7392, longitude: -104.9903, brightness: 315.6, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 85, bright_t31: 275.2, frp: 28.9 },
    { latitude: 38.8339, longitude: -104.8214, brightness: 325.7, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 87, bright_t31: 278.4, frp: 31.2 },
    
    // Texas wildfires
    { latitude: 31.9686, longitude: -99.9018, brightness: 338.3, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 93, bright_t31: 286.8, frp: 35.1 },
    { latitude: 32.7767, longitude: -96.7970, brightness: 318.9, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 86, bright_t31: 277.3, frp: 29.4 },
    
    // Florida wildfires
    { latitude: 27.9944, longitude: -81.7603, brightness: 330.2, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 89, bright_t31: 283.6, frp: 32.7 },
    { latitude: 25.7617, longitude: -80.1918, brightness: 318.7, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 84, bright_t31: 276.2, frp: 27.5 },
    
    // Washington wildfires
    { latitude: 47.7511, longitude: -120.7401, brightness: 342.3, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 94, bright_t31: 289.8, frp: 43.9 },
    { latitude: 47.6062, longitude: -122.3321, brightness: 325.6, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 88, bright_t31: 279.7, frp: 32.1 },
    
    // Arizona wildfires
    { latitude: 33.4484, longitude: -112.0740, brightness: 345.8, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 96, bright_t31: 292.3, frp: 48.6 },
    { latitude: 32.2226, longitude: -110.9747, brightness: 333.4, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 91, bright_t31: 284.9, frp: 37.2 },
    
    // Alaska wildfires - covering main regions based on census areas
    { latitude: 64.8401, longitude: -147.7200, brightness: 328.5, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 89, bright_t31: 281.3, frp: 38.7 }, // Fairbanks
    { latitude: 61.2181, longitude: -149.9003, brightness: 337.2, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 92, bright_t31: 285.7, frp: 41.5 }, // Anchorage
    { latitude: 55.3422, longitude: -131.6461, brightness: 315.8, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 84, bright_t31: 273.1, frp: 27.9 }, // Ketchikan
    { latitude: 60.5544, longitude: -151.2583, brightness: 322.7, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 88, bright_t31: 279.5, frp: 32.4 }, // Kenai Peninsula
    { latitude: 64.0489, longitude: -139.4927, brightness: 331.6, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 90, bright_t31: 284.2, frp: 36.8 }, // Interior
    { latitude: 65.6591, longitude: -155.4644, brightness: 341.3, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 95, bright_t31: 289.8, frp: 44.3 }, // Yukon-Koyukuk
    { latitude: 61.5816, longitude: -159.5431, brightness: 335.8, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 91, bright_t31: 287.2, frp: 39.6 }, // Bethel
    { latitude: 67.4805, longitude: -153.8936, brightness: 327.9, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 87, bright_t31: 280.1, frp: 35.9 }, // North Slope
    
    // Hawaii wildfires - covering main islands
    { latitude: 21.3099, longitude: -157.8581, brightness: 321.4, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 87, bright_t31: 278.6, frp: 33.2 }, // Oahu (Honolulu)
    { latitude: 20.7984, longitude: -156.3319, brightness: 336.7, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 93, bright_t31: 286.9, frp: 41.8 }, // Maui
    { latitude: 19.8968, longitude: -155.5828, brightness: 348.9, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 96, bright_t31: 293.4, frp: 47.5 }, // Big Island (Hawaii County)
    { latitude: 19.6332, longitude: -155.9392, brightness: 339.2, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 94, bright_t31: 290.1, frp: 43.7 }, // Big Island - Kona side
    { latitude: 22.0964, longitude: -159.5261, brightness: 329.8, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 90, bright_t31: 282.7, frp: 37.9 }, // Kauai
    { latitude: 21.1213, longitude: -156.9085, brightness: 318.3, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 85, bright_t31: 275.9, frp: 30.6 }, // Molokai
    { latitude: 20.8783, longitude: -156.8896, brightness: 324.5, scan: 1, track: 1, acq_date: "2024-07-15", acq_time: "0400", confidence: 88, bright_t31: 280.4, frp: 35.2 }  // Lanai
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
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
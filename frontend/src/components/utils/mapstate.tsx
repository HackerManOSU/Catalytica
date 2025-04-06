import { createContext, useContext, useReducer, useEffect } from 'react';

// Define types for the state and action payload
type MapState = {
  currentLongitude: number | null;
  currentLatitude: number | null;
  currentSeverity: number | null;
  currentPopulation: number | null;
  totalAcresBurned: number | null;
  selectedRegion: string | null;
};

type MapAction = 
  | { type: 'SET_CURRENT_LONGITUDE'; payload: number }
  | { type: 'SET_CURRENT_LATITUDE'; payload: number }
  | { type: 'SET_CURRENT_SEVERITY'; payload: number }
  | { type: 'SET_CURRENT_POPULATION'; payload: number }
  | { type: 'SET_TOTAL_ACRES_BURNED'; payload: number }
  | { type: 'SET_SELECTED_REGION'; payload: string }
  | { type: 'RESET_MAP_STATE' };

// Get initial state from localStorage if available
const getInitialState = (): MapState => {
  try {
    const savedState = localStorage.getItem('mapState');
    return savedState ? JSON.parse(savedState) : {
      currentLongitude: null,
      currentLatitude: null,
      currentSeverity: null,
      currentPopulation: null,
      totalAcresBurned: null,
      selectedRegion: null,
    };
  } catch (error) {
    console.error('Error loading map state from localStorage:', error);
    return {
      currentLongitude: null,
      currentLatitude: null,
      currentSeverity: null,
      currentPopulation: null,
      totalAcresBurned: null,
      selectedRegion: null,
    };
  }
};

// Reducer function
function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'SET_CURRENT_LONGITUDE':
      return { ...state, currentLongitude: action.payload };
    case 'SET_CURRENT_LATITUDE':
      return { ...state, currentLatitude: action.payload };
    case 'SET_CURRENT_SEVERITY':
      return { ...state, currentSeverity: action.payload };
    case 'SET_CURRENT_POPULATION':
      return { ...state, currentPopulation: action.payload };
    case 'SET_TOTAL_ACRES_BURNED':
      return { ...state, totalAcresBurned: action.payload };
    case 'SET_SELECTED_REGION':
      return { ...state, selectedRegion: action.payload };
    case 'RESET_MAP_STATE':
      return getInitialState();
    default:
      return state;
  }
}

// Create context with explicit types
const MapStateContext = createContext<MapState | undefined>(undefined);
const MapDispatchContext = createContext<React.Dispatch<MapAction> | undefined>(undefined);

// Provider component
export function MapStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(mapReducer, getInitialState());

  // This effect ensures state is saved whenever it changes
  useEffect(() => {
    localStorage.setItem('mapState', JSON.stringify(state));
  }, [state]);

  return (
    <MapStateContext.Provider value={state}>
      <MapDispatchContext.Provider value={dispatch}>
        {children}
      </MapDispatchContext.Provider>
    </MapStateContext.Provider>
  );
}

// Custom hooks to use state and dispatch
export function useMapState() {
  const context = useContext(MapStateContext);
  if (context === undefined) {
    throw new Error('useMapState must be used within a MapStateProvider');
  }
  return context;
}

export function useMapDispatch() {
  const context = useContext(MapDispatchContext);
  if (context === undefined) {
    throw new Error('useMapDispatch must be used within a MapStateProvider');
  }
  return context;
}

// Action creators with proper typing
export const MapActions = {
  setCurrentLongitude: (longitude: number) => ({
    type: 'SET_CURRENT_LONGITUDE' as const,
    payload: longitude
  }),
  setCurrentLatitude: (latitude: number) => ({
    type: 'SET_CURRENT_LATITUDE' as const,
    payload: latitude
  }),
  setCurrentSeverity: (severity: number) => ({
    type: 'SET_CURRENT_SEVERITY' as const,
    payload: severity
  }),
  setCurrentPopulation: (population: number) => ({
    type: 'SET_CURRENT_POPULATION' as const,
    payload: population
  }),
  setTotalAcresBurned: (acres: number) => ({
    type: 'SET_TOTAL_ACRES_BURNED' as const,
    payload: acres
  }),
  setSelectedRegion: (region: string) => ({
    type: 'SET_SELECTED_REGION' as const,
    payload: region
  }),
  resetMapState: () => ({ type: 'RESET_MAP_STATE' as const })
};
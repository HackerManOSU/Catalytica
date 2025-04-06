import USMap from '../Maps/USMap';
import HawaiiMap from '../Maps/HawaiiMap';
import AlaskaMap from '../Maps/AlaskaMap';
import { requestAndStoreLocation } from '../GeoLocation/location';
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';

function App() {
  // Add state for fullscreen maps
  const [alaskaFullscreen, setAlaskaFullscreen] = useState(false);
  const [hawaiiFullscreen, setHawaiiFullscreen] = useState(false);
  const [usFullscreen, setUsFullscreen] = useState(false);

  useEffect(() => {
    requestAndStoreLocation();
  }, []);

  // Disable scrolling when modal is open
  useEffect(() => {
    if (alaskaFullscreen || hawaiiFullscreen || usFullscreen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [alaskaFullscreen, hawaiiFullscreen, usFullscreen]);

  return (
    <div className="p-4 bg-[black] min-h-screen">
      {!alaskaFullscreen && !hawaiiFullscreen && !usFullscreen && (
        <>
          <div className="flex-grow flex items-center justify-center">
            <motion.div
              className="text-white text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            >
              <h1 className="text-4xl font-bold mb-4">WildfireWatch</h1>
              <p className="text-xl mb-8">Real-time wildfire monitoring and resource allocation</p>
            </motion.div>
          </div>
          
          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Left column for Alaska and Hawaii */}
              <div className="md:col-span-1 flex flex-col gap-6">
                <div style={{ height: "300px" }}>
                  <div className="mb-2">
                    <h2 className="text-white text-xl font-semibold">Alaska</h2>
                  </div>
                  <div style={{ height: "280px" }} className="relative overflow-visible z-0">
                  <div className="absolute inset-0 z-0">
                    <AlaskaMap />
                  </div>
                  <button
                    onClick={() => setAlaskaFullscreen(true)}
                    className="absolute top-2 right-2 text-white bg-gray-800 hover:bg-gray-700 p-1 rounded-md z-[999]"
                    title="View fullscreen"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                  </div>
                </div>
                <div style={{ height: "300px" }}>
                  <div className="mb-2">
                    <h2 className="text-white text-xl font-semibold">Hawaii</h2>
                  </div>
                  <div style={{ height: "280px" }} className="relative overflow-visible z-0">
                  <div className="absolute inset-0 z-0">
                    <HawaiiMap />
                  </div>
                  <button
                    onClick={() => setHawaiiFullscreen(true)}
                    className="absolute top-2 right-2 text-white bg-gray-800 hover:bg-gray-700 p-1 rounded-md z-[999]"
                    title="View fullscreen"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Right column for main US map */}
              <div className="md:col-span-3">
                <div className="mb-2">
                  <h2 className="text-white text-xl font-semibold">Mainland US</h2>
                </div>
                <div style={{ height: "600px" }} className="relative overflow-visible z-0">
                <div className="absolute inset-0 z-0">
                  <USMap />
                </div>
                <button
                  onClick={() => setUsFullscreen(true)}
                  className="absolute top-2 right-2 text-white bg-gray-800 hover:bg-gray-700 p-1 rounded-md z-[999]"
                  title="View fullscreen"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 01-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 011.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Alaska Fullscreen Modal */}
      {alaskaFullscreen && (
        <div className="fixed inset-0 bg-black z-[999] flex flex-col h-screen w-screen">
          <div className="p-3 flex justify-between items-center bg-gray-900">
            <h2 className="text-xl font-bold text-white">Alaska Wildfire Map</h2>
            <button 
              onClick={() => setAlaskaFullscreen(false)}
              className="text-white hover:text-gray-300 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-grow h-full">
            <AlaskaMap fullscreen={true}/>
          </div>
        </div>
      )}
      
      {/* Hawaii Fullscreen Modal */}
      {hawaiiFullscreen && (
        <div className="fixed inset-0 bg-black z-[999] flex flex-col h-screen w-screen">
          <div className="p-3 flex justify-between items-center bg-gray-900">
            <h2 className="text-xl font-bold text-white">Hawaii Wildfire Map</h2>
            <button 
              onClick={() => setHawaiiFullscreen(false)}
              className="text-white hover:text-gray-300 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-grow h-full">
            <HawaiiMap fullscreen={true}/>
          </div>
        </div>
      )}
      
      {/* US Fullscreen Modal */}
      {usFullscreen && (
        <div className="fixed inset-0 bg-black z-[999] flex flex-col h-screen w-screen">
          <div className="p-3 flex justify-between items-center bg-gray-900">
            <h2 className="text-xl font-bold text-white">Mainland US Wildfire Map</h2>
            <button 
              onClick={() => setUsFullscreen(false)}
              className="text-white hover:text-gray-300 p-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="flex-grow h-full">
            <USMap fullscreen={true} />
          </div>
        </div>
      )}
    </div>
  )
}

export default App
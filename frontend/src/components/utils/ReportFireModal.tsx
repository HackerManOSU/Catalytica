import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../Lib/firebase';
import { addDoc, collection } from 'firebase/firestore';
import { X } from 'lucide-react';

import Cookies from 'js-cookie';

interface ReportFireModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportFireModal: React.FC<ReportFireModalProps> = ({ isOpen, onClose }) => {
  const [reportText, setReportText] = useState('');
  const maxChars = 500;
  
  const handleSubmit = async () => {
    if (!reportText.trim()) return;
  
    try {
      const locationCookie = Cookies.get('userLocation');
  
      if (!locationCookie) {
        alert('Location not found. Please enable location sharing.');
        return;
      }
  
      const { lat, lng } = JSON.parse(locationCookie);
  
      await addDoc(collection(db, 'userEntries'), {
        entry: reportText,
        coordinates: {
          lat,
          lng,
        },
        timestamp: new Date(),
      });
  
      console.log('Fire report submitted with coordinates:', lat, lng);
      onClose();
    } catch (error) {
      console.error('Error submitting fire report:', error);
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div 
        className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.2 }}
      >
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>
        
        <h2 className="text-2xl font-bold text-white mb-4">Report a Fire</h2>
        
        <div className="mb-4">
          <label htmlFor="report" className="block text-white mb-2">
            Please provide details about the fire (max 500 characters)
          </label>
          <textarea
            id="report"
            value={reportText}
            onChange={(e) => setReportText(e.target.value.slice(0, maxChars))}
            className="w-full h-32 p-3 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="Describe the fire, its location, size, and any other important details..."
          />
          <p className="text-right text-gray-400 text-sm mt-1">
            {reportText.length}/{maxChars} characters
          </p>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 transition"
            disabled={reportText.trim().length === 0}
          >
            Submit Report
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportFireModal;
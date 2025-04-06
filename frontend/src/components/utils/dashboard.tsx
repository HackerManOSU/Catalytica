import { motion } from 'framer-motion';

const Speedometer: React.FC<{ value: number }> = ({ value }) => {
    return (
      <svg viewBox="0 0 200 100" width="250" height="200">
        {/* Background arc - full length */}
        <path 
          d="M10 90 A80 80 0 0 1 190 90" 
          fill="none" 
          stroke="#333" 
          strokeWidth="20" 
        />
        
        {/* Value arc */}
        <path 
          d={`M10 90 A80 80 0 0 1 190 90`}
          fill="none" 
          stroke="#ff9966" 
          strokeWidth="20"
          strokeDasharray={`${(value / 100) * 251.33}, 251.33`}
        />
        
        {/* Value text */}
        <text 
          x="100" 
          y="70" 
          textAnchor="middle" 
          fontSize="30" 
          fill="#ff9966"
        >
          {value}%
        </text>
      </svg>
    );
  };

const Dashboard: React.FC = () => {
  return (
    <motion.div
      className="text-white w-full"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Severity Speedometer */}
        <div className="bg-gray-800 rounded-lg p-6 flex flex-col items-center">
          <h2 className="text-2xl font-semibold mb-4">Fire Severity</h2>
          <Speedometer value={90} />
          <p className="mt-4 text-orange-500 font-bold">High Risk</p>
        </div>

        {/* Active Fires */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Active Fires</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-5xl font-bold text-orange-500">23</p>
              <p className="text-sm text-gray-400">Current Fires</p>
            </div>
            <div className="text-right">
              <p className="text-red-500">↑ 5 from last week</p>
            </div>
          </div>
          <h2 className="text-2xl font-semibold mb-4 mt-4">Total Acres Burned</h2>
          <div>
              <p className="text-5xl font-bold text-orange-500">5000</p>
          </div>

        </div>

        {/* Affected Area */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-4">Total Population</h2>
          <div className="flex flex-col ">
            <div>
              <p className="text-5xl font-bold text-orange-500">4,250</p>
              <p className="text-sm text-gray-400">People</p>
            </div>
            <h2 className="text-2xl font-semibold mb-4 mt-4">Estimated Rescue Cost</h2>
            <div>
              <p className="text-5xl font-bold text-orange-500">$50,000</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default Dashboard;
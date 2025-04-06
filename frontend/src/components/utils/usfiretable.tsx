import FireAnimation from './fireicon';
import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../Lib/firebase';
import { useMapState } from '../utils/mapstate';

const getFireLevel = (frp: number) => {
    if (!Number.isFinite(frp)) return null; // skip bad values
    if (frp > 1000) return 6; // special "Severe" level (optional)
    if (frp >= 800) return 5;
    if (frp >= 600) return 4;
    if (frp >= 400) return 3;
    if (frp >= 200) return 2;
    return 1;
};
  

const UsFireTable = () => {
  const [stats, setStats] = useState<{ [key: number]: { count: number; acres: number } }>({});

  useEffect(() => {
    const fetchFirmsUpdates = async () => {
      const snapshot = await getDocs(collection(db, "firmsUpdates"));
      const bucket: { [key: number]: { count: number; acres: number } } = {
        1: { count: 0, acres: 0 },
        2: { count: 0, acres: 0 },
        3: { count: 0, acres: 0 },
        4: { count: 0, acres: 0 },
        5: { count: 0, acres: 0 },
      };

      snapshot.forEach(doc => {
        const data = doc.data();
        Object.values(data).forEach((entryGroup: any) => {
          if (Array.isArray(entryGroup)) {
            entryGroup.forEach((fire: any) => {
                const frp = fire.frp;
                const level = getFireLevel(frp);
                
                if (level && bucket[level]) {
                  bucket[level].count += 1;
                  bucket[level].acres += frp * 0.5;
                }
                

            
            });
          }
        });
      });

      setStats(bucket);
    };

    fetchFirmsUpdates();
  }, []);

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-800 text-gray-300 uppercase text-sm">
            <th className="py-3 px-4 text-left">Severity</th>
            <th className="py-3 px-4 text-left">Total Fires</th>
            <th className="py-3 px-4 text-left">Estimated Acres Burned</th>
          </tr>
        </thead>
        <tbody className="text-gray-200">
          {[5, 4, 3, 2, 1].map(level => (
            <tr key={level} className="border-b border-gray-700">
              <td className="py-3 px-4">
                <div className="flex space-x-2 max-w-[250px]">
                  {[...Array(5)].map((_, i) => (
                    <FireAnimation key={i} size={30} isVisible={i < level} />
                  ))}
                </div>
              </td>
              <td className="py-3 px-4">
                <p>{stats[level]?.count || 0}</p>
              </td>
              <td className="py-3 px-4">
                <p>{stats[level]?.acres.toFixed(1) || 0}</p>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UsFireTable;

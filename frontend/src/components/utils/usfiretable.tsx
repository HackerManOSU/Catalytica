import FireAnimation from './fireicon'; // Adjust path as needed

function UsFireTable() {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-gray-900 rounded-lg overflow-hidden">
        <thead>
          <tr className="bg-gray-800 text-gray-300 uppercase text-sm">
            <th className="py-3 px-4 text-left">Severity</th>
            <th className="py-3 px-4 text-left">Total Fires</th>
            <th className="py-3 px-4 text-left">Total Acres Burned</th>
          </tr>
        </thead>
        <tbody className="text-gray-200">
          <tr className="border-b border-gray-700">
            <td className="py-3 px-4">
              <div className="flex space-x-2 w-full max-w-[250px]">
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
              </div>
            </td>
            <td className="py-3 px-4"><p>5</p></td>
            <td className="py-3 px-4"><p>5000</p></td>
          </tr>
          <tr className="border-b border-gray-700">
            <td className="py-3 px-4">
              <div className="flex space-x-2 max-w-[250px]">
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={false} />
              </div>
            </td>
            <td className="py-3 px-4"><p>4</p></td>
            <td className="py-3 px-4"><p>4000</p></td>
          </tr>
          <tr className="border-b border-gray-700">
            <td className="py-3 px-4">
              <div className="flex space-x-2 max-w-[250px]">
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={false} />
                <FireAnimation size={30} isVisible={false} />
              </div>
            </td>
            <td className="py-3 px-4"><p>3</p></td>
            <td className="py-3 px-4"><p>3000</p></td>
          </tr>
          <tr className="border-b border-gray-700">
            <td className="py-3 px-4">
              <div className="flex space-x-2 max-w-[250px]">
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={false} />
                <FireAnimation size={30} isVisible={false} />
                <FireAnimation size={30} isVisible={false} />
              </div>
            </td>
            <td className="py-3 px-4"><p>2</p></td>
            <td className="py-3 px-4"><p>2000</p></td>
          </tr>
          <tr>
            <td className="py-3 px-4">
              <div className="flex space-x-2 max-w-[250px]">
                <FireAnimation size={30} isVisible={true} />
                <FireAnimation size={30} isVisible={false} />
                <FireAnimation size={30} isVisible={false} />
                <FireAnimation size={30} isVisible={false} />
                <FireAnimation size={30} isVisible={false} />
              </div>
            </td>
            <td className="py-3 px-4"><p>1</p></td>
            <td className="py-3 px-4"><p>1000</p></td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

export default UsFireTable;

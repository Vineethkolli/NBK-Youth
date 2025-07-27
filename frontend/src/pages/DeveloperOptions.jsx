import { useAuth } from '../context/AuthContext';
import ClearData from '../components/developer/ClearData';
import MongoStorageInfo from '../components/developer/DatabaseInfo';

function DeveloperOptions() {
  const { user } = useAuth();

  if (user?.role !== 'developer') {
    return <div>Access denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
{/* MongoDB Storage */}
      <MongoStorageInfo />

      {/* Clear Data */}
      <ClearData />
    </div>
  );
}

export default DeveloperOptions;

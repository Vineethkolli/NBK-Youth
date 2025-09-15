import { useAuth } from '../context/AuthContext';
import ClearData from '../components/developer/ClearData';
import ProcessedDataManager from '../components/developer/ProcessedDataManager';
import SnapshotManager from '../components/developer/SnapshotManager';

function DeveloperOptions() {
  const { user } = useAuth();

  if (user?.role !== 'developer') {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-600 text-lg font-semibold">
        Access Denied
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-blue-200 rounded-xl shadow-md p-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-blue-800 mb-1">Backend Health Monitor</h2>
        </div>
        <a
          href="https://r4styp9l.status.cron-job.org/"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-all"
        >
          Status
        </a>
      </div>
      
      <ClearData />

      <SnapshotManager />

      <ProcessedDataManager />
    </div>
  );
}

export default DeveloperOptions;

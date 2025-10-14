import ServiceDriveMonitor from '../components/monitor/ServiceDriveMonitor';
import CloudinaryMonitor from '../components/monitor/CloudinaryMonitor';
import MongoDBMonitor from '../components/monitor/MongodbMonitor';
import GithubActionsMonitor from '../components/monitor/GithubActionsMonitor';

export default function Monitor() {
  return (
    <div className="max-w-1xl mx-auto space-y-6">
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

      <ServiceDriveMonitor />

      <CloudinaryMonitor />

      <MongoDBMonitor />

      <GithubActionsMonitor />

    </div>
  );
}

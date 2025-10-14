import ServiceDriveMonitor from '../components/monitor/ServiceDriveMonitor';
import CloudinaryMonitor from '../components/monitor/CloudinaryMonitor';
import MongoDBMonitor from '../components/monitor/MongodbMonitor';

export default function Monitor() {
  return (
    <div className="max-w-1xl mx-auto space-y-6">

      <ServiceDriveMonitor />

      <CloudinaryMonitor />

      <MongoDBMonitor />

    </div>
  );
}

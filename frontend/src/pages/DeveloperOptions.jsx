import { useAuth } from '../context/AuthContext';
import PaymentDetails from '../components/developer/PaymentDetails';
import ClearData from '../components/developer/ClearData';
import MaintenanceMode from '../components/developer/MaintenanceMode';
import RoleStatistics from '../components/developer/Stats';

function DeveloperOptions() {
  const { user } = useAuth();

  if (user?.role !== 'developer') {
    return <div>Access denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Maintenance Mode Section */}
      <MaintenanceMode />

      {/* Role Statistics */}
      <RoleStatistics />

      {/* Payment Details */}
      <PaymentDetails />

      {/* Clear Data */}
      <ClearData />
    </div>
  );
}

export default DeveloperOptions;

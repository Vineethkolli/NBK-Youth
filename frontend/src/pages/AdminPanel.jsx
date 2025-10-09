import { useAuth } from '../context/AuthContext';
import PaymentDetails from '../components/adminPanel/PaymentDetails';
import MaintenanceMode from '../components/adminPanel/MaintenanceMode';
import RoleStatistics from '../components/adminPanel/Stats';
import BannerManager from '../components/adminPanel/BannerManager';
import EventLabelManager from '../components/adminPanel/EventLabelManager';

function AdminPanel() {
  const { user } = useAuth();

  if (user?.role === 'user') {
    return <div>Access denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      <BannerManager />

      <MaintenanceMode />

      <EventLabelManager />

      <RoleStatistics />

      <PaymentDetails />
    </div>
  );
}

export default AdminPanel;

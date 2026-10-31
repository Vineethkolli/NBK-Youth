import { useAuth } from '../context/AuthContext';
import PaymentDetails from '../components/adminPanel/PaymentDetails';
import MaintenanceMode from '../components/adminPanel/MaintenanceMode';
import BannerManager from '../components/adminPanel/BannerManager';
import EventLabelManager from '../components/adminPanel/EventLabelManager';

function AdminPanel() {
  const { hasAccess } = useAuth();

  if (!hasAccess('Privileged')) {
    return <div className="text-center mt-10 text-red-500 font-semibold">Access denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h2 className="text-2xl font-semibold">Admin Panel</h2>
      <EventLabelManager />
      <BannerManager />
      <MaintenanceMode />
      <PaymentDetails />
    </div>
  );
}

export default AdminPanel;

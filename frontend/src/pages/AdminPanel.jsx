import { useAuth } from '../context/AuthContext';
import PaymentDetails from '../components/developer/PaymentDetails';
import MaintenanceMode from '../components/developer/MaintenanceMode';
import RoleStatistics from '../components/developer/Stats';
import BannerManager from '../components/developer/BannerManager';

function AdminPanel() {
    const { user } = useAuth();
  
    if (user?.role == 'user') {
      return <div>Access denied</div>;
    }
  
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Maintenance Mode Section */}
        <MaintenanceMode />
  
        {/* Banner Manager */}
        <BannerManager />
  
        {/* Role Statistics */}
        <RoleStatistics />
  
        {/* Payment Details */}
        <PaymentDetails />

      </div>
    );
  }
  
  export default AdminPanel;
  
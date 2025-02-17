import { useAuth } from '../context/AuthContext';
import PaymentDetails from '../components/developer/PaymentDetails';
import ClearData from '../components/developer/ClearData';

function DeveloperOptions() {
  const { user } = useAuth();

  if (user?.role !== 'developer') {
    return <div>Access denied</div>;
  }

  return (
    <div className="max-w-1xl mx-auto space-y-6">
      {/* Payment Details Section */}
      <PaymentDetails />

      {/* Clear Data Section */}
      <ClearData />
    </div>
  );
}

export default DeveloperOptions;

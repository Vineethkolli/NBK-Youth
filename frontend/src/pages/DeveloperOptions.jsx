import { useAuth } from '../context/AuthContext';
import ClearData from '../components/developer/ClearData';

function DeveloperOptions() {
  const { user } = useAuth();

  if (user?.role !== 'developer') {
    return <div>Access denied</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">

      {/* Clear Data */}
      <ClearData />
    </div>
  );
}

export default DeveloperOptions;

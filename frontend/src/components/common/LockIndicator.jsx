import { Lock, Unlock } from 'lucide-react';
import { useLockSettings } from '../../context/LockContext';

function LockIndicator({ className = "" }) {
  const { lockSettings } = useLockSettings();

  return (
    <div className={`flex items-center ${className}`}>
      {lockSettings.isLocked ? (
        <>
          <Lock className="h-4 w-4 text-red-600 mr-2" />
          <span className="text-red-600 font-medium"></span>
        </>
      ) : (
        <>
          <Unlock className="h-4 w-4 text-green-600 mr-2" />
          <span className="text-green-600 font-medium"></span>
        </>
      )}
    </div>
  );
}

export default LockIndicator;
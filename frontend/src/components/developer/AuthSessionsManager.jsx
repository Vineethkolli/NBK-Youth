import { useState } from 'react';
import { Fingerprint, Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';
import PinDialog from '../myFiles/PinDialog';

export default function AuthSessionsManager() {
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [invalidating, setInvalidating] = useState(false);

  const invalidateSessions = async (pin) => {
    setInvalidating(true);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/sessions/invalidate-all`,
        { pin }
      );

      setPinDialogOpen(false);

      toast.success(
        `${data.invalidatedCount} authentication sessions invalidated`
      );
    } catch (error) {
      throw new Error(
        error.response?.data?.message || 'Could not invalidate sessions'
      );
    } finally {
      setInvalidating(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Fingerprint className="h-5 w-5 text-red-600 shrink-0" />

            <h2 className="text-xl font-semibold">
              Auth Sessions
            </h2>
          </div>

          <p className="text-sm text-gray-500 mt-1">
            This will invalidate every active authentication session of all users.
          </p>
        </div>

        <button
          onClick={() => setPinDialogOpen(true)}
          disabled={invalidating}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-white shrink-0 ${
            invalidating
              ? 'bg-red-300 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-700'
          }`}
        >
          {invalidating && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}

          {invalidating ? 'Invalidating...' : 'Invalidate'}
        </button>
      </div>

      <PinDialog
        open={pinDialogOpen}
        title="Invalidate Auth Sessions"
        onSubmit={invalidateSessions}
        onClose={() => {
          if (!invalidating) {
            setPinDialogOpen(false);
          }
        }}
      />
    </>
  );
}

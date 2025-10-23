import { useState } from 'react';
import { AlertTriangle, Loader2} from 'lucide-react';

function DeleteUserConfirm({ user, onConfirm, onClose }) {
  const [confirmStep, setConfirmStep] = useState(1);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    if (confirmStep === 1) {
      setConfirmStep(2);
      return;
    }

    setIsDeleting(true);
    await onConfirm(user);
    setIsDeleting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-90">
        <div className="flex items-center mb-3">
          <AlertTriangle className="h-5 w-5 text-yellow-700 mr-3" />
          <h3 className="text-lg font-medium">Delete User</h3>
        </div>

        <p className="text-lg font-medium mb-4">
          {confirmStep === 1
            ? `Are you sure you want to delete the user "${user.name}"?`
            : 'Are you sure? This action is irreversible.'}
        </p>

        <div className="flex justify-end space-x-4">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg text-white flex items-center ${
              isDeleting
                ? 'bg-red-400 cursor-not-allowed'
                : 'bg-red-600 hover:bg-red-700'
            } transition-all`}
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="h-5 w-5 mr-2 animate-spin" />}
            {isDeleting ? 'Deleting...' : confirmStep === 1 ? 'Yes, Continue' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default DeleteUserConfirm;

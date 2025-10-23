import { useState, useEffect } from 'react';
import { Edit2, Trash2, Clock } from 'lucide-react';
import EditNameModal from '../common/UpdateNameForm';

function PlayerList({ 
  players, 
  isEditMode, 
  timerRequired, 
  onTimeUpdate, 
  onStatusUpdate, 
  onEdit,
  onDelete 
}) {
  const [modalPlayerId, setModalPlayerId] = useState(null);
  const [modalInitialName, setModalInitialName] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isEditMode && modalPlayerId) {
      setModalPlayerId(null);
      setModalInitialName('');
      setIsModalOpen(false);
    }
  }, [isEditMode, modalPlayerId]);

  const sortPlayersByRank = (players) => {
    if (timerRequired) {
      return [...players].sort((a, b) => {
        if (!a.timeCompleted) return 1;
        if (!b.timeCompleted) return -1;
        return a.timeCompleted - b.timeCompleted;
      });
    } else {
      const ranks = {
        'winner-1st': 1,
        'winner-2nd': 2,
        'winner-3rd': 3,
        '': 4,
        'eliminated': 5,
      };
      return [...players].sort((a, b) => ranks[a.status || ''] - ranks[b.status || '']);
    }
  };

  const getStatusBadge = (player) => {
    if (!player.status && !player.timeCompleted) return null;

    let bgColor = '';
    let text = '';

    if (timerRequired && player.timeCompleted) {
      const minutes = Math.floor(player.timeCompleted / 60000);
      const seconds = Math.floor((player.timeCompleted % 60000) / 1000);
      const ms = player.timeCompleted % 1000;
      text = `${minutes}m ${seconds}s ${ms}ms`;
      bgColor = 'bg-indigo-100 text-indigo-800';
    } else if (player.status) {
      if (player.status === 'eliminated') {
        bgColor = 'bg-red-100 text-red-800';
        text = 'Eliminated';
      } else {
        const rank = player.status.split('-')[1];
        bgColor = 'bg-green-100 text-green-800';
        text = `Winner (${rank})`;
      }
    }

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${bgColor}`}>
        {text}
      </span>
    );
  };

  const handleNameChange = (playerId, name) => {
    setModalPlayerId(playerId);
    setModalInitialName(name);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (newName) => {
    if (!modalPlayerId) return;
    try {
      await onEdit(modalPlayerId, newName);
      setIsModalOpen(false);
      setModalPlayerId(null);
      setModalInitialName('');
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update player name';
      console.error('Update player failed', message);
      throw error;
    }
  };

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {sortPlayersByRank(players).map((player) => (
        <div
          key={player._id}
          className={`bg-white rounded-lg shadow p-4 flex justify-between items-center ${
            (player.timeCompleted || player.status) ? 'border-l-4 border-green-500' : ''
          }`}
        >
          <div className="space-y-2 flex-1">
            <h3 className="font-medium">{player.name}</h3>
            {getStatusBadge(player)}
          </div>

          <div className="flex items-center space-x-2">
            {timerRequired ? (
              <button
                onClick={() => onTimeUpdate(player)}
                className="text-gray-600 hover:text-gray-800"
              >
                <Clock className="h-5 w-5" />
              </button>
            ) : (
              <select
                value={player.status || ''}
                onChange={(e) => onStatusUpdate(player._id, e.target.value)}
                className="form-select text-sm"
              >
                <option value="">Select Status</option>
                <option value="eliminated">Eliminated</option>
                <option value="winner-1st">Winner (1st)</option>
                <option value="winner-2nd">Winner (2nd)</option>
                <option value="winner-3rd">Winner (3rd)</option>
              </select>
            )}

            {isEditMode && (
              <>
                <button
                  onClick={() => handleNameChange(player._id, player.name)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  <Edit2 className="h-4 w-4" />
                </button>
                <button
                  onClick={() => onDelete(player._id)}
                  className="text-red-600 hover:text-red-800"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
    <EditNameModal
      isOpen={isModalOpen}
      title="Update Player"
      initialValue={modalInitialName}
      onClose={() => {
        setIsModalOpen(false);
        setModalPlayerId(null);
        setModalInitialName('');
      }}
      onSubmit={handleModalSubmit}
    />
    </>
  );
}

export default PlayerList;

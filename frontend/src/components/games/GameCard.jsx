import { useState } from 'react';
import { Edit2, Trash2, ChevronRight, Check } from 'lucide-react';
import { getTopPlayers } from '../../utils/gameUtils';

function GameCard({ game, isEditMode, onSelect, onEdit, onDelete }) {
  const [editingGameId, setEditingGameId] = useState(null);
  const [newGameName, setNewGameName] = useState('');
  const [error, setError] = useState('');

  const topPlayers = getTopPlayers(game);

  const getRankBadge = (index, player) => {
    // For timer-based games
    if (game.timerRequired) {
      const colors = [
        'bg-yellow-400 text-yellow-900',
        'bg-gray-300 text-gray-800',
        'bg-orange-400 text-orange-900'
      ];
      return colors[index] || 'bg-gray-200 text-gray-700';
    }

    // For non-timer games, use the actual rank from status
    const rank = player.status.split('-')[1];
    switch (rank) {
      case '1st':
        return 'bg-yellow-400 text-yellow-900';
      case '2nd':
        return 'bg-gray-300 text-gray-800';
      case '3rd':
        return 'bg-orange-400 text-orange-900';
      default:
        return 'bg-gray-200 text-gray-700';
    }
  };

  const handleNameEdit = (gameId, name) => {
    setEditingGameId(gameId);
    setNewGameName(name);
    setError('');
  };

  const saveGameName = async (gameId) => {
    if (!newGameName.trim()) return;

    try {
      await onEdit(gameId, newGameName);
      setEditingGameId(null);
      setNewGameName('');
      setError('');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update game name');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex justify-between items-start mb-2">
        <div>
          {editingGameId === game._id ? (
            <input
              type="text"
              value={newGameName}
              onChange={(e) => setNewGameName(e.target.value)}
              onBlur={() => saveGameName(game._id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveGameName(game._id);
                if (e.key === 'Escape') {
                  setEditingGameId(null);
                  setNewGameName('');
                  setError('');
                }
              }}
              className="form-input text-lg font-medium w-full"
              autoFocus
            />
          ) : (
            <h3 className="text-lg font-medium">{game.name}</h3>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="text-sm text-gray-500">
            {game.players.length} player{game.players.length !== 1 && 's'}
          </p>
        </div>
        {isEditMode && (
          <div className="flex space-x-2">
            {editingGameId === game._id ? (
              <button
                onClick={() => saveGameName(game._id)}
                className="text-green-600 hover:text-green-800"
              >
                <Check className="h-5 w-5" />
              </button>
            ) : (
              <button
                onClick={() => handleNameEdit(game._id, game.name)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => onDelete(game)}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {topPlayers.map((player, index) => (
          <div
            key={player._id}
            className="inline-flex items-center"
          >
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadge(index, player)}`}>
              <span translate="no">
              {game.timerRequired ? index + 1 : player.status.split('-')[1][0]}
              </span>
            </div>
            <span className="ml-1 text-sm">
              {player.name}
              {game.timerRequired && player.timeCompleted && (
                <span className="text-xs text-gray-500 ml-1">
                  ({Math.floor(player.timeCompleted / 60000)}m {Math.floor((player.timeCompleted % 60000) / 1000)}s)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onSelect(game)}
        className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
      >
        <span className="mr-2">Players</span>
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

export default GameCard;

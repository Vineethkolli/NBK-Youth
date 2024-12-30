import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import GameForm from '../components/games/GameForm';
import PlayerForm from '../components/games/PlayerForm';
import TimeForm from '../components/games/TimeForm';
import GameCard from '../components/games/GameCard';
import PlayerList from '../components/games/PlayerList';

function LetsPlay() {
  const { user } = useAuth();
  const [games, setGames] = useState([]);
  const [selectedGame, setSelectedGame] = useState(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showGameForm, setShowGameForm] = useState(false);
  const [showPlayerForm, setShowPlayerForm] = useState(false);
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const isPrivilegedUser = ['developer', 'financier', 'admin'].includes(user?.role);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/games`);
      setGames(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      toast.error('Failed to fetch games');
    }
  };

  // Game CRUD operations
  const handleCreateGame = async (formData) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/games`, formData);
      setGames(prevGames => [...prevGames, data].sort((a, b) => a.name.localeCompare(b.name)));
      setShowGameForm(false);
      toast.success('Game created successfully');
    } catch (error) {
      toast.error('Failed to create game');
    }
  };

  const handleGameEdit = async (game) => {
    const newName = prompt('Enter new game name:', game.name);
    if (!newName || newName === game.name) return;

    try {
      const { data } = await axios.put(`${API_URL}/api/games/${game._id}`, {
        name: newName
      });
      setGames(prevGames => 
        prevGames.map(g => g._id === game._id ? data : g)
          .sort((a, b) => a.name.localeCompare(b.name))
      );
      if (selectedGame?._id === game._id) {
        setSelectedGame(data);
      }
      toast.success('Game updated successfully');
    } catch (error) {
      toast.error('Failed to update game');
    }
  };

  const handleGameDelete = async (game) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      await axios.delete(`${API_URL}/api/games/${game._id}`);
      setGames(prevGames => prevGames.filter(g => g._id !== game._id));
      if (selectedGame?._id === game._id) {
        setSelectedGame(null);
      }
      toast.success('Game deleted successfully');
    } catch (error) {
      toast.error('Failed to delete game');
    }
  };

  // Player management
  const handleAddPlayer = async (playerName) => {
    try {
      const { data: newPlayer } = await axios.post(`${API_URL}/api/games/${selectedGame._id}/players`, {
        name: playerName
      });
      
      const updatedGame = {
        ...selectedGame,
        players: [...selectedGame.players, newPlayer]
      };
      
      setSelectedGame(updatedGame);
      setGames(prevGames => 
        prevGames.map(g => g._id === selectedGame._id ? updatedGame : g)
      );
      
      setShowPlayerForm(false);
      toast.success('Player added successfully');
    } catch (error) {
      toast.error('Failed to add player');
    }
  };

  const handlePlayerDelete = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    try {
      await axios.delete(`${API_URL}/api/games/${selectedGame._id}/players/${playerId}`);
      
      const updatedGame = {
        ...selectedGame,
        players: selectedGame.players.filter(p => p._id !== playerId)
      };
      
      setSelectedGame(updatedGame);
      setGames(prevGames => 
        prevGames.map(g => g._id === selectedGame._id ? updatedGame : g)
      );
      
      toast.success('Player deleted successfully');
    } catch (error) {
      toast.error('Failed to delete player');
    }
  };

  const handleTimeUpdate = async (milliseconds) => {
    try {
      const { data: updatedPlayer } = await axios.put(
        `${API_URL}/api/games/${selectedGame._id}/players/${selectedPlayer._id}`,
        { timeCompleted: milliseconds }
      );
      
      const updatedGame = {
        ...selectedGame,
        players: selectedGame.players.map(p => 
          p._id === selectedPlayer._id ? updatedPlayer : p
        )
      };
      
      setSelectedGame(updatedGame);
      setGames(prevGames => 
        prevGames.map(g => g._id === selectedGame._id ? updatedGame : g)
      );
      
      setShowTimeForm(false);
      setSelectedPlayer(null);
      toast.success('Time updated successfully');
    } catch (error) {
      toast.error('Failed to update time');
    }
  };

  const handleStatusUpdate = async (playerId, status) => {
    try {
      const { data: updatedPlayer } = await axios.put(
        `${API_URL}/api/games/${selectedGame._id}/players/${playerId}`,
        { status }
      );
      
      const updatedGame = {
        ...selectedGame,
        players: selectedGame.players.map(p => 
          p._id === playerId ? updatedPlayer : p
        )
      };
      
      setSelectedGame(updatedGame);
      setGames(prevGames => 
        prevGames.map(g => g._id === selectedGame._id ? updatedGame : g)
      );
      
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-0l mx-auto space-y-6">
      {/* Game List View */}
      {!selectedGame && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Let's Play</h1>
            {isPrivilegedUser && (
              <div className="space-x-2">
                <button
                  onClick={() => setShowGameForm(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Game
                </button>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Done Editing' : 'Edit Mode'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.map(game => (
              <GameCard
                key={game._id}
                game={game}
                isEditMode={isEditMode}
                onSelect={() => setSelectedGame(game)}
                onEdit={() => handleGameEdit(game)}
                onDelete={() => handleGameDelete(game)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Player List View */}
      {selectedGame && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <button
                onClick={() => setSelectedGame(null)}
                className="text-gray-600 hover:text-gray-800 mb-2"
              >
                ← Back to Games
              </button>
              <h2 className="text-2xl font-semibold">{selectedGame.name}</h2>
            </div>
            {isPrivilegedUser && (
              <div className="space-x-2">
                <button
                  onClick={() => setShowPlayerForm(true)}
                  className="btn-primary"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Player
                </button>
                <button
                  onClick={() => setIsEditMode(!isEditMode)}
                  className={`btn-secondary ${isEditMode ? 'bg-red-100' : ''}`}
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  {isEditMode ? 'Done Editing' : 'Edit Mode'}
                </button>
              </div>
            )}
          </div>

          <PlayerList
            players={selectedGame.players}
            isEditMode={isEditMode}
            timerRequired={selectedGame.timerRequired}
            onTimeUpdate={(player) => {
              setSelectedPlayer(player);
              setShowTimeForm(true);
            }}
            onStatusUpdate={handleStatusUpdate}
            onEdit={() => {}} // Add edit functionality if needed
            onDelete={handlePlayerDelete}
          />
        </div>
      )}

      {/* Modals */}
      {showGameForm && (
        <GameForm
          onSubmit={handleCreateGame}
          onClose={() => setShowGameForm(false)}
        />
      )}

      {showPlayerForm && (
        <PlayerForm
          onSubmit={handleAddPlayer}
          onClose={() => setShowPlayerForm(false)}
        />
      )}

      {showTimeForm && (
        <TimeForm
          onSubmit={handleTimeUpdate}
          onClose={() => {
            setShowTimeForm(false);
            setSelectedPlayer(null);
          }}
        />
      )}
    </div>
  );
}

export default LetsPlay;
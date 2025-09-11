import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, ArrowLeft } from 'lucide-react';
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

  // Effect to handle browser back button functionality
  useEffect(() => {
    const handlePopState = (event) => {
      // When the user navigates back, if the history state is null or not our 'players' view,
      // it means we should be on the games list.
      if (!event.state || event.state.view !== 'players') {
        setSelectedGame(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    // Cleanup the event listener when the component unmounts
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, []); // Empty dependency array ensures this runs only once

  const fetchGames = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/games`);
      setGames(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      toast.error('Failed to fetch games');
    }
  };

  // --- Navigation Handlers ---
  const handleSelectGame = (game) => {
    setSelectedGame(game);
    // Push a new state into the browser history to represent the player view
    window.history.pushState({ view: 'players' }, '');
  };

  const handleGoBack = () => {
    // This uses the browser's history to go back, triggering the popstate event
    window.history.back();
  };

  // --- Game CRUD operations ---
  const handleCreateGame = async (formData) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/games`, formData);
      setGames((prevGames) => [...prevGames, data].sort((a, b) => a.name.localeCompare(b.name)));
      setShowGameForm(false);
      toast.success('Game created successfully');
    } catch (error) {
      throw error;
    }
  };

  const handleGameEdit = async (gameId, newName) => {
    try {
      const { data } = await axios.put(`${API_URL}/api/games/${gameId}`, { name: newName });
      setGames((prevGames) =>
        prevGames.map((g) => (g._id === gameId ? data : g)).sort((a, b) => a.name.localeCompare(b.name))
      );
      if (selectedGame?._id === gameId) {
        setSelectedGame(data);
      }
      toast.success('Game updated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update game');
    }
  };

  const handleGameDelete = async (game) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;
    try {
      await axios.delete(`${API_URL}/api/games/${game._id}`);
      setGames((prevGames) => prevGames.filter((g) => g._id !== game._id));
      if (selectedGame?._id === game._id) {
        setSelectedGame(null);
      }
      toast.success('Game deleted successfully');
    } catch (error) {
      toast.error('Failed to delete game');
    }
  };

  // --- Player management ---
  const handleAddPlayer = async (playerName) => {
    try {
      const { data } = await axios.post(`${API_URL}/api/games/${selectedGame._id}/players`, {
        name: playerName,
      });
      setGames((prevGames) =>
        prevGames.map((g) => (g._id === selectedGame._id ? data : g))
      );
      setSelectedGame(data);
      setShowPlayerForm(false);
      toast.success('Player added successfully');
    } catch (error) {
      throw error;
    }
  };

  const handleUpdatePlayer = async (playerId, newName) => {
    try {
      const { data } = await axios.put(
        `${API_URL}/api/games/${selectedGame._id}/players/${playerId}`,
        { name: newName }
      );
      setGames((prevGames) =>
        prevGames.map((g) => (g._id === selectedGame._id ? data : g))
      );
      setSelectedGame(data);
      toast.success('Player updated successfully');
    } catch (error) {
      throw error;
    }
  };

  const handlePlayerDelete = async (playerId) => {
    if (!window.confirm('Are you sure you want to delete this player?')) return;
    try {
      const { data } = await axios.delete(
        `${API_URL}/api/games/${selectedGame._id}/players/${playerId}`
      );
      setGames((prevGames) =>
        prevGames.map((g) => (g._id === selectedGame._id ? data : g))
      );
      setSelectedGame(data);
      toast.success('Player deleted successfully');
    } catch (error) {
      toast.error('Failed to delete player');
    }
  };

  const handleTimeUpdate = async (milliseconds) => {
    try {
      const { data } = await axios.put(
        `${API_URL}/api/games/${selectedGame._id}/players/${selectedPlayer._id}`,
        { timeCompleted: milliseconds }
      );
      setGames((prevGames) =>
        prevGames.map((g) => (g._id === selectedGame._id ? data : g))
      );
      setSelectedGame(data);
      setShowTimeForm(false);
      setSelectedPlayer(null);
      toast.success('Time updated successfully');
    } catch (error) {
      toast.error('Failed to update time');
    }
  };

  const handleStatusUpdate = async (playerId, status) => {
    try {
      const { data } = await axios.put(
        `${API_URL}/api/games/${selectedGame._id}/players/${playerId}`,
        { status }
      );
      setGames((prevGames) =>
        prevGames.map((g) => (g._id === selectedGame._id ? data : g))
      );
      setSelectedGame(data);
      toast.success('Status updated successfully');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Game List View */}
      {!selectedGame && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Activities</h1>
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
                  {isEditMode ? 'Done' : 'Edit'}
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {games.length > 0 ? (
              games.map((game) => (
                <GameCard
                  key={game._id}
                  game={game}
                  isEditMode={isEditMode}
                  onSelect={() => handleSelectGame(game)}
                  onEdit={(gameId, newName) => handleGameEdit(gameId, newName)}
                  onDelete={() => handleGameDelete(game)}
                />
              ))
            ) : (
              <div className="text-center text-gray-500">
                No games created yet
              </div>
            )}
          </div>
        </div>
      )}

      {/* Player List View */}
      {selectedGame && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <div>
              <button
                onClick={handleGoBack}
                className="flex items-center text-gray-600 hover:text-gray-800 mb-2"
              >
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to Games
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
                  {isEditMode ? 'Done' : 'Edit'}
                </button>
              </div>
            )}
          </div>

          {selectedGame.players.length > 0 ? (
            <PlayerList
              players={selectedGame.players}
              isEditMode={isEditMode}
              timerRequired={selectedGame.timerRequired}
              onTimeUpdate={(player) => {
                setSelectedPlayer(player);
                setShowTimeForm(true);
              }}
              onStatusUpdate={handleStatusUpdate}
              onEdit={handleUpdatePlayer}
              onDelete={handlePlayerDelete}
            />
          ) : (
            <div className="text-center text-gray-500 text-g">
              No players added yet
            </div>
          )}
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
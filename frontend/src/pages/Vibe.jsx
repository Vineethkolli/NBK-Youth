import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CollectionManager from '../components/vibe/CollectionManager';
import MusicPlayer from '../components/vibe/MusicPlayer';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';

function Vibe() {
  const { user } = useAuth();
  const [collections, setCollections] = useState([]);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState([]);
  const [queueIndex, setQueueIndex] = useState(0);

  const isPrivilegedUser = ['developer', 'financier', 'admin'].includes(user?.role);

  useEffect(() => {
    fetchCollections();
  }, []);

  const fetchCollections = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/collections`);
      setCollections(data);
    } catch (error) {
      toast.error('Failed to fetch collections');
    }
  };

  const handleSongSelect = (song, songList) => {
    setCurrentSong(song);
    setQueue(songList);
    setQueueIndex(songList.findIndex(s => s._id === song._id));
    setIsPlaying(true);
  };

  const handleNext = () => {
    if (queueIndex < queue.length - 1) {
      setQueueIndex(prev => prev + 1);
      setCurrentSong(queue[queueIndex + 1]);
    }
  };

  const handlePrevious = () => {
    if (queueIndex > 0) {
      setQueueIndex(prev => prev - 1);
      setCurrentSong(queue[queueIndex - 1]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {isPrivilegedUser && (
          <CollectionManager 
            collections={collections}
            onUpdate={fetchCollections}
          />
        )}

        <div className="grid grid-cols-1 gap-6">
          {collections.map(collection => (
            <div key={collection._id} className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">{collection.name}</h2>
              <div className="space-y-4">
                {collection.subCollections?.map(subCollection => (
                  <div key={subCollection._id} className="bg-gray-50 rounded-lg p-4">
                    <h3 className="text-lg font-medium mb-3">{subCollection.name}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {subCollection.songs?.map(song => (
                        <div
                          key={song._id}
                          onClick={() => handleSongSelect(song, subCollection.songs)}
                          className={`p-4 rounded-lg cursor-pointer transition-colors ${
                            currentSong?._id === song._id
                              ? 'bg-indigo-100'
                              : 'bg-white hover:bg-gray-100'
                          }`}
                        >
                          <p className="font-medium truncate">{song.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentSong && (
        <MusicPlayer
          song={currentSong}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onNext={handleNext}
          onPrevious={handlePrevious}
          hasNext={queueIndex < queue.length - 1}
          hasPrevious={queueIndex > 0}
        />
      )}
    </div>
  );
}

export default Vibe;
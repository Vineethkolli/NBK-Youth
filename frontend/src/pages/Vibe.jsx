import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CollectionManager from '../components/vibe/CollectionManager';
import CollectionItem from '../components/vibe/CollectionItem';
import SearchBar from '../components/vibe/SearchBar';
import MusicPlayer from '../components/vibe/MusicPlayer';
import UploadToCollectionForm from '../components/vibe/UploadToCollection';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { createSongQueue } from '../utils/songQueue';
import { filterCollections } from '../utils/search';
import { useMusicPlayer } from '../context/MusicContext';

function Vibe() {
  const { user } = useAuth();
  const { currentSong, handleSongSelect } = useMusicPlayer();
  const [collections, setCollections] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);

  useEffect(() => {
    fetchCollections();
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'NAVIGATE_TO_VIBE') {
        // User clicked on media notification, focus on the vibe page
        console.log('Navigated to Vibe from media notification');
      }
    };

    navigator.serviceWorker?.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker?.removeEventListener('message', handleMessage);
    };
  }, []);

  const fetchCollections = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/collections`);
      data.sort((a, b) => a.name.localeCompare(b.name));
      setCollections(data);
    } catch (error) {
      toast.error('Failed to fetch collections');
    }
  };

  const handleSongPlay = (song) => {
    const queue = createSongQueue(collections);
    handleSongSelect(song, queue);
  };

  // Collection operations
  const handleCollectionEdit = async (collection) => {
  const newName = prompt('Enter new collection name:', collection.name);
  if (!newName || newName === collection.name) return;

  // Check if a collection with same name (case-insensitive) already exists
  const nameExists = collections.some(c =>
    c._id !== collection._id && c.name.toLowerCase() === newName.trim().toLowerCase()
  );

  if (nameExists) {
    toast.error('Failed to update collection');
    toast.error('A collection with this name already exists');
    return;
  }

  try {
    await axios.put(`${API_URL}/api/collections/${collection._id}`, {
      name: newName.trim()
    });
    toast.success('Collection updated successfully');
    fetchCollections();
  } catch (error) {
    toast.error('Failed to update collection');
  }
};


  const handleCollectionDelete = async (collection) => {
    if (!window.confirm('Are you sure you want to delete this collection?')) return;
    try {
      await axios.delete(`${API_URL}/api/collections/${collection._id}`);
      toast.success('Collection deleted successfully');
      fetchCollections();
    } catch (error) {
      toast.error('Failed to delete collection');
    }
  };

  // Song operations
  const handleSongEdit = async (song) => {
    const newName = prompt('Enter new song name:', song.name);
    if (!newName || newName === song.name) return;

    try {
      const collection = collections.find(c => 
        c.songs.some(s => s._id === song._id)
      );

      if (!collection) throw new Error('Song not found');

      await axios.put(
        `${API_URL}/api/collections/${collection._id}/songs/${song._id}`,
        { name: newName }
      );
      toast.success('Song updated successfully');
      fetchCollections();
    } catch (error) {
      toast.error('Failed to update song');
    }
  };

  const handleSongDelete = async (song) => {
    if (!window.confirm('Are you sure you want to delete this song?')) return;
    try {
      const collection = collections.find(c => 
        c.songs.some(s => s._id === song._id)
      );

      if (!collection) throw new Error('Song not found');

      await axios.delete(
        `${API_URL}/api/collections/${collection._id}/songs/${song._id}`
      );
      toast.success('Song deleted successfully');
      fetchCollections();
    } catch (error) {
      toast.error('Failed to delete song');
    }
  };

  const handleUploadToCollection = (collection) => {
    setSelectedCollection(collection);
    setShowUploadForm(true);
  };

  const handleUploadSuccess = () => {
    fetchCollections();
    setShowUploadForm(false);
    setSelectedCollection(null);
  };

  const filteredCollections = filterCollections(collections, searchQuery);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4 md:items-center">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
        <CollectionManager 
          collections={collections}
          onUpdate={fetchCollections}
          isEditMode={isEditMode}
          onEditModeToggle={() => {
            setIsEditMode(!isEditMode);
            setUploadMode(false); // Exit upload mode when entering edit mode
          }}
          uploadMode={uploadMode}
          onUploadModeToggle={() => {
            setUploadMode(!uploadMode);
            setIsEditMode(false); // Exit edit mode when entering upload mode
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredCollections.map(collection => (
          <CollectionItem
            key={collection._id}
            collection={collection}
            isEditMode={isEditMode}
            uploadMode={uploadMode}
            currentSong={currentSong}
            onSongPlay={handleSongPlay}
            onEdit={handleCollectionEdit}
            onDelete={handleCollectionDelete}
            onSongEdit={handleSongEdit}
            onSongDelete={handleSongDelete}
            onUploadToCollection={handleUploadToCollection}
          />
        ))}
      </div>

      {/* Upload to Collection Form */}
      {showUploadForm && selectedCollection && (
        <UploadToCollectionForm
          collection={selectedCollection}
          onClose={() => {
            setShowUploadForm(false);
            setSelectedCollection(null);
          }}
          onSuccess={handleUploadSuccess}
        />
      )}

      <MusicPlayer />
    </div>
  );
}

export default Vibe;

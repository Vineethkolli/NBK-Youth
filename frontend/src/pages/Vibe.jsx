import { useState, useEffect } from 'react';
import CollectionManager from '../components/vibe/CollectionManager';
import CollectionItem from '../components/vibe/CollectionItem';
import MusicPlayer from '../components/vibe/MusicPlayer';
import UploadToCollectionForm from '../components/vibe/UploadToCollection';
import EditNameModal from '../components/common/UpdateNameForm';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../utils/config';
import { createSongQueue } from '../utils/songQueue';
import { Search } from 'lucide-react';
import { filterCollections } from '../utils/songSearch';
import { useMusicPlayer } from '../context/MusicContext';

function Vibe() {
  const { currentSong, handleSongSelect } = useMusicPlayer();
  const [collections, setCollections] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [editModalState, setEditModalState] = useState({
    isOpen: false,
    type: null, // 'collection' or 'song'
    itemId: null,
    initialValue: '',
    isUpdating: false
  });

  useEffect(() => {
    fetchCollections();
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'NAVIGATE_TO_VIBE') {
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
  const handleCollectionEdit = (collection) => {
    setEditModalState({
      isOpen: true,
      type: 'collection',
      itemId: collection._id,
      initialValue: collection.name,
      isUpdating: false
    });
  };

    const handleCollectionNameUpdate = async (newName) => {
    const collection = collections.find(c => c._id === editModalState.itemId);
    if (!collection || newName === collection.name) {
      setEditModalState(prev => ({ ...prev, isOpen: false }));
      return;
    }

    // Check if a collection with same name (case-insensitive) already exists
    const nameExists = collections.some(c =>
      c._id !== collection._id && c.name.toLowerCase() === newName.trim().toLowerCase()
    );

    if (nameExists) {
      throw new Error('Collection name already exists. Please choose a different name.');
    }

    setEditModalState(prev => ({ ...prev, isUpdating: true }));
    try {
      await axios.put(`${API_URL}/api/collections/${collection._id}`, {
        name: newName.trim()
      });
      toast.success('Collection updated successfully');
      fetchCollections();
      setEditModalState(prev => ({ ...prev, isOpen: false, isUpdating: false }));
    } catch (error) {
      setEditModalState(prev => ({ ...prev, isUpdating: false }));
      throw error;
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
  const handleSongEdit = (song) => {
    const collection = collections.find(c => 
      c.songs.some(s => s._id === song._id)
    );

    if (!collection) {
      toast.error('Collection not found');
      return;
    }

    setEditModalState({
      isOpen: true,
      type: 'song',
      itemId: song._id,
      initialValue: song.name,
      isUpdating: false,
      collectionId: collection._id
    });
  };

  const handleSongNameUpdate = async (newName) => {
    const collection = collections.find(c => c._id === editModalState.collectionId);
    const song = collection?.songs.find(s => s._id === editModalState.itemId);

    if (!collection || !song || newName === song.name) {
      setEditModalState(prev => ({ ...prev, isOpen: false }));
      return;
    }

    setEditModalState(prev => ({ ...prev, isUpdating: true }));
    try {
      await axios.put(
        `${API_URL}/api/collections/${collection._id}/songs/${song._id}`,
        { name: newName.trim() }
      );
      toast.success('Song updated successfully');
      fetchCollections();
      setEditModalState(prev => ({ ...prev, isOpen: false, isUpdating: false }));
    } catch (error) {
      setEditModalState(prev => ({ ...prev, isUpdating: false }));
      throw error;
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
          <div className="relative">
  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search songs, collections..."
    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
  />
</div>
        </div>
        <CollectionManager 
          collections={collections}
          onUpdate={fetchCollections}
          isEditMode={isEditMode}
          onEditModeToggle={() => {
            setIsEditMode(!isEditMode);
            setUploadMode(false);
          }}
          uploadMode={uploadMode}
          onUploadModeToggle={() => {
            setUploadMode(!uploadMode);
            setIsEditMode(false); 
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
      
      {/* Ad free Box */}
      <div className="flex justify-center">
        <div className="w-full max-w-2xl text-center">
          <div className="rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-[1px] shadow-lg">
            <div className="bg-white  rounded-2xl py-4 px-3 flex flex-col items-center justify-center">
              <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent leading-tight pb-1">
                Enjoy Ad-Free Music 🎧
              </h2>
              <p className="mt-2 text-gray-700 text-base md:text-lg">
                Feel the rhythm, Skip the noise
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Name Modal */}
      <EditNameModal
        isOpen={editModalState.isOpen}
        title={`Update ${editModalState.type === 'collection' ? 'Collection' : 'Song'}`}
        initialValue={editModalState.initialValue}
        onSubmit={editModalState.type === 'collection' ? handleCollectionNameUpdate : handleSongNameUpdate}
        onClose={() => setEditModalState(prev => ({ ...prev, isOpen: false }))}
        isUpdating={editModalState.isUpdating}
      />
    </div>
  );
}

export default Vibe;

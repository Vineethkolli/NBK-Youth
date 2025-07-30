import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import CollectionManager from '../components/vibe/CollectionManager';
import CollectionItem from '../components/vibe/CollectionItem';
import SearchBar from '../components/vibe/SearchBar';
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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchCollections();
  }, []);

  // Listen for messages from service worker
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && event.data.type === 'NAVIGATE_TO_VIBE') {
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

  // Collection CRUD operations
  const handleCollectionEdit = async (collection) => {
    const newName = prompt('Enter new collection name:', collection.name);
    if (!newName || newName === collection.name) return;

    try {
      await axios.put(`${API_URL}/api/collections/${collection._id}`, {
        name: newName
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

  // Sub-collection CRUD operations
  const handleSubCollectionEdit = async (subCollection) => {
    const newName = prompt('Enter new sub-collection name:', subCollection.name);
    if (!newName || newName === subCollection.name) return;

    try {
      const collectionId = collections.find(c => 
        c.subCollections.some(sc => sc._id === subCollection._id)
      )?._id;
      
      if (!collectionId) throw new Error('Collection not found');

      await axios.put(
        `${API_URL}/api/collections/${collectionId}/subcollections/${subCollection._id}`,
        { name: newName }
      );
      toast.success('Sub-collection updated successfully');
      fetchCollections();
    } catch (error) {
      toast.error('Failed to update sub-collection');
    }
  };

  const handleSubCollectionDelete = async (subCollection) => {
    if (!window.confirm('Are you sure you want to delete this sub-collection?')) return;
    try {
      const collectionId = collections.find(c => 
        c.subCollections.some(sc => sc._id === subCollection._id)
      )?._id;
      
      if (!collectionId) throw new Error('Collection not found');

      await axios.delete(
        `${API_URL}/api/collections/${collectionId}/subcollections/${subCollection._id}`
      );
      toast.success('Sub-collection deleted successfully');
      fetchCollections();
    } catch (error) {
      toast.error('Failed to delete sub-collection');
    }
  };

  // Song CRUD operations
  const handleSongEdit = async (song) => {
    const newName = prompt('Enter new song name:', song.name);
    if (!newName || newName === song.name) return;

    try {
      const collection = collections.find(c => 
        c.subCollections.some(sc => 
          sc.songs.some(s => s._id === song._id)
        )
      );
      
      const subCollection = collection?.subCollections.find(sc => 
        sc.songs.some(s => s._id === song._id)
      );

      if (!collection || !subCollection) throw new Error('Song not found');

      await axios.put(
        `${API_URL}/api/collections/${collection._id}/subcollections/${subCollection._id}/songs/${song._id}`,
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
        c.subCollections.some(sc => 
          sc.songs.some(s => s._id === song._id)
        )
      );
      
      const subCollection = collection?.subCollections.find(sc => 
        sc.songs.some(s => s._id === song._id)
      );

      if (!collection || !subCollection) throw new Error('Song not found');

      await axios.delete(
        `${API_URL}/api/collections/${collection._id}/subcollections/${subCollection._id}/songs/${song._id}`
      );
      toast.success('Song deleted successfully');
      fetchCollections();
    } catch (error) {
      toast.error('Failed to delete song');
    }
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
            onEditModeToggle={() => setIsEditMode(!isEditMode)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6">
          {filteredCollections.map(collection => (
            <CollectionItem
              key={collection._id}
              collection={collection}
              isEditMode={isEditMode}
              currentSong={currentSong}
              onSongPlay={handleSongPlay}
              onEdit={handleCollectionEdit}
              onDelete={handleCollectionDelete}
              onSubCollectionEdit={handleSubCollectionEdit}
              onSubCollectionDelete={handleSubCollectionDelete}
              onSongEdit={handleSongEdit}
              onSongDelete={handleSongDelete}
            />
          ))}
        </div>
      </div>
  );
}

export default Vibe;
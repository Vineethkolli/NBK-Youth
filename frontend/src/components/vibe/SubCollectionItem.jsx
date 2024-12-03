import { Edit2, Trash2 } from 'lucide-react';
import SongItem from './SongItem';

function SubCollectionItem({ 
  subCollection, 
  isEditMode,
  currentSong,
  onSongPlay,
  onEdit,
  onDelete,
  onSongEdit,
  onSongDelete 
}) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-medium">{subCollection.name}</h3>
        {isEditMode && (
          <div className="flex space-x-2">
            <button
              onClick={onEdit}
              className="text-blue-600 hover:text-blue-800"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subCollection.songs
          ?.sort((a, b) => a.name.localeCompare(b.name))
          .map(song => (
            <SongItem
              key={song._id}
              song={song}
              isPlaying={currentSong?._id === song._id}
              onPlay={onSongPlay}
              onEdit={() => onSongEdit(song)}
              onDelete={() => onSongDelete(song)}
              isEditMode={isEditMode}
            />
          ))}
      </div>
    </div>
  );
}

export default SubCollectionItem;
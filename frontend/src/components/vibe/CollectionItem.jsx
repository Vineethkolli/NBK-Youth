import { Edit2, Trash2, Upload } from 'lucide-react';
import SongItem from './SongItem';

function CollectionItem({
  collection,
  isEditMode,
  uploadMode,
  currentSong,
  onSongPlay,
  onEdit,
  onDelete,
  onSongEdit,
  onSongDelete,
  onUploadToCollection
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{collection.name}</h2>
        <div className="flex space-x-2">
          {uploadMode && (
            <button
              onClick={() => onUploadToCollection(collection)}
              className="text-gray-800"
              title="Upload to this collection"
            >
              <Upload className="h-5 w-5" />
            </button>
          )}
          {isEditMode && (
            <>
              <button
                onClick={() => onEdit(collection)}
                className="text-blue-600 hover:text-blue-800"
              >
                <Edit2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(collection)}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {collection.songs
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

export default CollectionItem;
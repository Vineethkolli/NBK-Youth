import { Edit2, Trash2 } from 'lucide-react';
import SubCollectionItem from './SubCollectionItem';

function CollectionItem({
  collection,
  isEditMode,
  currentSong,
  onSongPlay,
  onEdit,
  onDelete,
  onSubCollectionEdit,
  onSubCollectionDelete,
  onSongEdit,
  onSongDelete
}) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">{collection.name}</h2>
        {isEditMode && (
          <div className="flex space-x-2">
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
          </div>
        )}
      </div>

      <div className="space-y-4">
        {collection.subCollections
          ?.sort((a, b) => a.name.localeCompare(b.name))
          .map(subCollection => (
            <SubCollectionItem
              key={subCollection._id}
              subCollection={subCollection}
              isEditMode={isEditMode}
              currentSong={currentSong}
              onSongPlay={onSongPlay}
              onEdit={() => onSubCollectionEdit(subCollection)}
              onDelete={() => onSubCollectionDelete(subCollection)}
              onSongEdit={onSongEdit}
              onSongDelete={onSongDelete}
            />
          ))}
      </div>
    </div>
  );
}

export default CollectionItem;
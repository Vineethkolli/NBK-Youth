import { Edit2, Trash2, Play, Pause, Loader2 } from 'lucide-react';
import { useState } from 'react';

function SongItem({ song, isPlaying, onPlay, onEdit, onDelete, isEditMode }) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await onDelete(song);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className={`p-4 rounded-lg cursor-pointer transition-colors flex justify-between items-center notranslate ${
        isPlaying ? 'bg-indigo-100' : 'bg-gray-100 hover:bg-gray-200'
      }`}
    >
      <div
  className="font-medium flex-1 flex items-center min-w-0"
  onClick={() => !isEditMode && onPlay(song)}
>
  <div className="shrink-0">
    {isPlaying ? (
      <Pause className="h-4 w-4 mr-2 text-indigo-600" />
    ) : (
      <Play className="h-4 w-4 mr-2" />
    )}
  </div>
  <span className="truncate block min-w-0">{song.name}</span>
</div>


      {isEditMode && (
        <div className="flex space-x-2 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isDeleting) onEdit();
            }}
            className={`text-indigo-600 hover:text-indigo-800 transition-opacity ${
              isDeleting ? 'opacity-50 pointer-events-none' : ''
            }`}
            disabled={isDeleting}
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleDelete}
            className={`text-red-600 hover:text-red-800 transition-opacity ${
              isDeleting ? 'opacity-50 pointer-events-none' : ''
            }`}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default SongItem;

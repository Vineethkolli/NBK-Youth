import { Edit2, Trash2, Play, Pause } from 'lucide-react';

function SongItem({ song, isPlaying, onPlay, onEdit, onDelete, isEditMode }) {
  return (
    <div
className={`p-4 rounded-lg cursor-pointer transition-colors flex justify-between items-center notranslate ${
  isPlaying ? 'bg-indigo-100' : 'bg-gray-100 hover:bg-gray-200'
}`}

    >
      <div 
        className="font-medium truncate flex-1 flex items-center"
        onClick={() => !isEditMode && onPlay(song)}
      >
        {isPlaying ? (
          <Pause className="h-4 w-4 mr-2 text-indigo-600" />
        ) : (
          <Play className="h-4 w-4 mr-2" />
        )}
        {song.name}
      </div>
      
      {isEditMode && (
        <div className="flex space-x-2 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export default SongItem;

import { Trash2, Pin, Edit2, Check } from 'lucide-react';
import MediaPreview from './MediaPreview';
import { useState } from 'react';

function MomentGrid({ moments, isEditMode, onDelete, onTogglePin, onUpdateTitle }) {
  const getEmbedUrl = (url) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  const [editingTitleId, setEditingTitleId] = useState(null);
  const [tempTitle, setTempTitle] = useState('');
  const [deletingId, setDeletingId] = useState(null);

  const handleEditTitle = (id, currentTitle) => {
    setEditingTitleId(id);
    setTempTitle(currentTitle);
  };

  const handleSaveTitle = (id) => {
    onUpdateTitle(id, tempTitle);
    setEditingTitleId(null);
  };

  const handleDeleteClick = async (id) => {
    setDeletingId(id);
    await onDelete(id);
    setTimeout(() => setDeletingId(null), 600); // block for 0.6s for feedback
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {moments.map((moment) => (
        <div key={moment._id} className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="relative">
            {moment.type === 'youtube' ? (
              <iframe
                src={getEmbedUrl(moment.url)}
                className="w-full aspect-video"
                allowFullScreen
                title={moment.title || 'YouTube Video'}
              />
            ) : (
              <MediaPreview
                url={moment.url}
                type={moment.url.includes('image') ? 'image' : 'video'}
                title={moment.title}
                downloadUrl={moment.downloadUrl}
              />
            )}

            {isEditMode && (
              <div className="absolute top-2 right-2 flex space-x-2">
                <button
                  onClick={() => onTogglePin(moment._id)}
                  className={`p-1 rounded-full ${moment.isPinned ? 'bg-yellow-500' : 'bg-gray-500'} text-white hover:opacity-75 transition-colors`}
                >
                  <Pin className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteClick(moment._id)}
                  className={`p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors ${deletingId === moment._id ? 'opacity-50 cursor-not-allowed' : ''}`}
                  disabled={deletingId === moment._id}
                  style={deletingId === moment._id ? { pointerEvents: 'none', opacity: 0.5 } : {}}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <div className="p-4">
            {editingTitleId === moment._id ? (
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  className="border rounded px-2 py-1 w-full"
                />
                <button onClick={() => handleSaveTitle(moment._id)} className="text-green-600">
                  <Check className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">{moment.title}</h3>
                {isEditMode && (
                  <button onClick={() => handleEditTitle(moment._id, moment.title)} className="text-gray-500 hover:text-gray-700">
                    <Edit2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export default MomentGrid;

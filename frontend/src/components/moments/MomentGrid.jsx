import { Trash2, Pin } from 'lucide-react';
import MediaPreview from './MediaPreview';

function MomentGrid({ moments, isEditMode, onDelete, onTogglePin }) {
  const getEmbedUrl = (url) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
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
                  onClick={() => onDelete(moment._id)}
                  className="p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {moment.title && (
            <div className="p-4">
              <h3 className="font-semibold text-lg">{moment.title}</h3>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default MomentGrid;
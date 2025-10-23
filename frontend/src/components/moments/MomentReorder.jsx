import { useState, useEffect } from 'react';
import { GripHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function MomentReorder({ moments, onSave, onCancel }) {
  const [localMoments, setLocalMoments] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (moments?.length) {
      // always show in descending order (highest on top)
      const sorted = [...moments].sort(
        (a, b) => b.order - a.order || new Date(b.createdAt) - new Date(a.createdAt)
      );
      setLocalMoments(sorted);
      setHasChanges(false);
    }
  }, [moments]);

  // Helpers
  const getEmbedUrl = (url) => {
    if (!url) return '';
    const videoId = url.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/
    );
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  const getDriveThumbnailUrl = (url) => {
    if (!url) return '';
    const fileUrl = url?.url || url;
    const fileId = fileUrl.match(/[?&]id=([^&]+)/)?.[1];
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w600` : fileUrl;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(localMoments);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setLocalMoments(items);
    setHasChanges(true);
  };

  const moveItem = (index, direction) => {
    const newItems = [...localMoments];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const [item] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, item);
    setLocalMoments(newItems);
    setHasChanges(true);
  };

  const handleSave = () => {
    // assign descending order: top = highest
    const reordered = localMoments.map((m, idx) => ({
      ...m,
      order: localMoments.length - idx,
    }));
    onSave(reordered);
    setHasChanges(false);
  };

  const renderPreviewThumbnails = (moment) => {
    const mediaFiles = moment.mediaFiles || moment.media;
    if (moment.type === 'upload' && mediaFiles?.length > 0) {
      const firstFile = mediaFiles[0];
      const remaining = mediaFiles.length - 1;
      return (
        <div className="relative w-full h-48">
          <img
            src={getDriveThumbnailUrl(firstFile.url)}
            alt={firstFile.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src =
                'https://placehold.co/600x400/eeeeee/cccccc?text=Error';
            }}
          />
          {remaining > 0 && (
            <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 text-white text-sm rounded">
              +{remaining} more
            </div>
          )}
        </div>
      );
    }
    if (moment.type === 'drive' && moment.url) {
      return (
        <img
          src={getDriveThumbnailUrl(moment.url)}
          alt={moment.title}
          className="w-full h-48 object-cover"
        />
      );
    }
    return (
      <div className="flex items-center justify-center h-48 bg-gray-100 text-gray-400">
        No Media
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 flex flex-col items-center space-y-3">
        <p className="text-indigo-800 text-sm text-center">
          <GripHorizontal className="h-4 w-4 inline mb-1" /> Drag or use arrows
          to change order of moments.
        </p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md disabled:opacity-50 transition"
          >
            Save
          </button>
        </div>
      </div>

      {/* Reorder Grid */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="moment-reorder">
          {(provided) => (
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {localMoments.map((moment, index) => (
                <Draggable key={moment._id} draggableId={moment._id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform ${
                        snapshot.isDragging
                          ? 'ring-2 ring-indigo-500'
                          : 'hover:shadow-lg'
                      }`}
                    >
                      {/* Media + Order Number */}
                      <div className="relative">
                        <div className="w-full h-48">
                          {moment.type === 'youtube' ? (
                            <iframe
                              src={getEmbedUrl(moment.url)}
                              className="w-full h-full pointer-events-none"
                              title={moment.title}
                            />
                          ) : (
                            renderPreviewThumbnails(moment)
                          )}
                        </div>
                        <div className="absolute top-2 left-2 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                          {index + 1}
                        </div>
                      </div>

                      {/* Title */}
                      <div className="p-2 text-center text-sm font-semibold truncate">
                        {moment.title || 'Untitled'}
                      </div>

                      {/* Reorder Controls */}
                      <div className="p-3 bg-gray-50 border-t flex justify-center items-center space-x-4">
                        <div {...dragProvided.dragHandleProps} className="flex items-center">
                          <GripHorizontal className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => moveItem(index, -1)}
                            disabled={index === 0}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveItem(index, 1)}
                            disabled={index === localMoments.length - 1}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
}

export default MomentReorder;

import { useState, useEffect } from 'react';
import { GripHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function GalleryReorder({ mediaFiles, onSave, onCancel }) {
  const [localMediaFiles, setLocalMediaFiles] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (mediaFiles?.length) {
      // always show in descending order (highest order first)
      const sorted = [...mediaFiles].sort(
        (a, b) => b.order - a.order || new Date(b.createdAt) - new Date(a.createdAt)
      );
      setLocalMediaFiles(sorted);
      setHasChanges(false);
    }
  }, [mediaFiles]);

  const getDriveThumbnailUrl = (url) => {
    if (!url) return '';
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    return fileId ? `https://drive.google.com/thumbnail?id=${fileId}&sz=w600` : url;
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(localMediaFiles);
    const [reordered] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reordered);
    setLocalMediaFiles(items);
    setHasChanges(true);
  };

  const moveItem = (index, direction) => {
    const newItems = [...localMediaFiles];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newItems.length) return;

    const [item] = newItems.splice(index, 1);
    newItems.splice(targetIndex, 0, item);
    setLocalMediaFiles(newItems);
    setHasChanges(true);
  };

  const handleSave = () => {
    // assign descending order: top = highest
    const reordered = localMediaFiles.map((m, idx) => ({
      ...m,
      order: localMediaFiles.length - idx,
    }));
    onSave(reordered);
    setHasChanges(false);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4">
      {/* Info + Save/Cancel */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-center space-y-3 mb-6">
        <p className="text-blue-800 text-sm text-center">
          <GripHorizontal className="h-4 w-4 inline mb-1" /> Drag or use arrows to change order of media files.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition"
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
        <Droppable droppableId="media-reorder">
          {(provided) => (
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {localMediaFiles.map((file, index) => (
                <Draggable key={file._id} draggableId={file._id} index={index}>
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform ${
                        snapshot.isDragging ? 'ring-2 ring-indigo-500' : 'hover:shadow-lg'
                      }`}
                    >
                      {/* Media + Order Number */}
                      <div className="relative">
                        <div className="w-full h-32">
                          <img
                            src={getDriveThumbnailUrl(file.url)}
                            alt={file.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = 'https://placehold.co/400x300/eeeeee/cccccc?text=Error';
                            }}
                          />
                        </div>
                        <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        
                        {/* Video indicator - Bottom Left */}
                        {file.type === 'video' && (
                          <div className="absolute bottom-2 left-2 flex items-center space-x-1 bg-black/70 rounded-full px-2 py-1">
                            <div className="w-0 h-0 border-l-[4px] border-l-white border-t-[2px] border-t-transparent border-b-[2px] border-b-transparent"></div>
                            <span className="text-white text-xs">Video</span>
                          </div>
                        )}
                      </div>

                      {/* File Name */}
                      <div className="p-2 text-center text-xs font-semibold truncate">
                        {file.name || 'Untitled'}
                      </div>

                      {/* Reorder Controls */}
                      <div className="p-2 bg-gray-50 border-t flex justify-center items-center space-x-3">
                        <div {...dragProvided.dragHandleProps} className="flex items-center">
                          <GripHorizontal className="h-4 w-4 text-gray-500 hover:text-gray-700" />
                        </div>
                        <div className="flex space-x-1">
                          <button
                            onClick={() => moveItem(index, -1)}
                            disabled={index === 0}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                          >
                            <ArrowUp className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => moveItem(index, 1)}
                            disabled={index === localMediaFiles.length - 1}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                          >
                            <ArrowDown className="h-3 w-3" />
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

export default GalleryReorder;

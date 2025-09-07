import { useState, useEffect } from 'react';
import { Save, X, GripHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';

function MediaReorder({ momentId, mediaFiles, onCancel, onSaveSuccess }) {
  const [localMedia, setLocalMedia] = useState([]);

  useEffect(() => {
    if (mediaFiles) {
      const sorted = [...mediaFiles].sort((a, b) => b.order - a.order || b.createdAt.localeCompare(a.createdAt));
      setLocalMedia(sorted);
    }
  }, [mediaFiles]);

  const moveItem = (index, direction) => {
    const newMedia = [...localMedia];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= newMedia.length) return;
    [newMedia[index], newMedia[targetIndex]] = [newMedia[targetIndex], newMedia[index]];
    setLocalMedia(newMedia);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    const newMedia = Array.from(localMedia);
    const [moved] = newMedia.splice(result.source.index, 1);
    newMedia.splice(result.destination.index, 0, moved);
    setLocalMedia(newMedia);
  };

  const handleSave = async () => {
    try {
      const reordered = localMedia.map((m, index) => ({ ...m, order: localMedia.length - index }));
      await axios.put(`/api/moments/${momentId}/media-order`, { mediaFiles: reordered });
      onSaveSuccess(reordered);
    } catch (err) {
      console.error('Failed to save media order', err);
    }
  };

  return (
    <div className="p-4">
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="media" direction="horizontal">
          {(provided) => (
            <div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              ref={provided.innerRef}
              {...provided.droppableProps}
            >
              {localMedia.map((media, index) => (
                <Draggable key={media._id} draggableId={media._id} index={index}>
                  {(provided) => (
                    <div
                      className="relative border rounded-lg p-2 bg-white shadow"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                    >
                      {/* Order badge */}
                      <span className="absolute top-1 left-1 bg-green-600 text-white text-xs rounded-full px-2 py-0.5">
                        {index + 1}
                      </span>

                      {/* Drag handle */}
                      <div {...provided.dragHandleProps} className="absolute top-1 right-1 cursor-grab">
                        <GripHorizontal className="h-4 w-4 text-gray-600" />
                      </div>

                      {/* Thumbnail */}
                      {media.type === 'image' ? (
                        <img src={media.url} alt="" className="w-full h-32 object-cover rounded" />
                      ) : (
                        <video src={media.url} className="w-full h-32 object-cover rounded" />
                      )}

                      <div className="mt-2 text-center text-sm">{media.name}</div>

                      {/* Arrow buttons */}
                      <div className="flex justify-center gap-2 mt-2">
                        <button
                          onClick={() => moveItem(index, -1)}
                          className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                        >
                          <ArrowUp size={16} />
                        </button>
                        <button
                          onClick={() => moveItem(index, 1)}
                          className="p-1 rounded bg-gray-200 hover:bg-gray-300"
                        >
                          <ArrowDown size={16} />
                        </button>
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

      {/* Save / Cancel */}
      <div className="flex justify-end gap-2 mt-4">
        <button onClick={onCancel} className="px-4 py-2 bg-gray-200 rounded flex items-center gap-1">
          <X size={16} /> Cancel
        </button>
        <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded flex items-center gap-1">
          <Save size={16} /> Save
        </button>
      </div>
    </div>
  );
}

export default MediaReorder;

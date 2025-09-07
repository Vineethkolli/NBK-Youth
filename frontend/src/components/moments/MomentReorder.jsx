import { useState, useEffect } from 'react';
import { Save, X, GripHorizontal, ArrowUp, ArrowDown } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

function MomentReorder({ moments, onSave, onCancel, onMediaOrderSave }) {
  const [localMoments, setLocalMoments] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [expandedMoment, setExpandedMoment] = useState(null);

  useEffect(() => {
    // Keep moment objects but normalize orders if you want; keep original otherwise
    setLocalMoments([...moments]);
    setHasChanges(false);
  }, [moments]);

  const updateMomentOrders = (arr) => {
    // Assign order such that first item has highest order (so sorting by order desc shows first at top)
    const total = arr.length;
    return arr.map((moment, index) => ({
      ...moment,
      order: total - index
    }));
  };

  const updateMediaOrders = (files) => {
    const total = files.length;
    return files.map((file, index) => ({
      ...file,
      order: total - index
    }));
  };

  const onDragEnd = (result) => {
    const { source, destination, type } = result;
    
    if (!destination || source.index === destination.index) return;

    if (type === 'moments') {
      // Reorder moments
      const updated = Array.from(localMoments);
      const [moved] = updated.splice(source.index, 1);
      updated.splice(destination.index, 0, moved);
      
      // Update order values (top = highest)
      const reordered = updateMomentOrders(updated);
      
      setLocalMoments(reordered);
      setHasChanges(true);
    } else if (type === 'media') {
      // Reorder media within a moment
      const momentIndex = localMoments.findIndex(m => m._id === expandedMoment);
      if (momentIndex === -1) return;

      const updated = [...localMoments];
      const mediaFiles = Array.from(updated[momentIndex].mediaFiles);
      const [moved] = mediaFiles.splice(source.index, 1);
      mediaFiles.splice(destination.index, 0, moved);

      // Update order values (top = highest)
      const reorderedMedia = updateMediaOrders(mediaFiles);

      updated[momentIndex] = {
        ...updated[momentIndex],
        mediaFiles: reorderedMedia
      };

      setLocalMoments(updated);
      setHasChanges(true);
    }
  };

  const moveMoment = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= localMoments.length) return;
    
    const updated = Array.from(localMoments);
    const [item] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, item);
    
    const reordered = updateMomentOrders(updated);
    
    setLocalMoments(reordered);
    setHasChanges(true);
  };

  const moveMedia = (momentIndex, fromIndex, toIndex) => {
    const moment = localMoments[momentIndex];
    if (!moment.mediaFiles || toIndex < 0 || toIndex >= moment.mediaFiles.length) return;

    const updated = [...localMoments];
    const mediaFiles = Array.from(updated[momentIndex].mediaFiles);
    const [item] = mediaFiles.splice(fromIndex, 1);
    mediaFiles.splice(toIndex, 0, item);

    const reorderedMedia = updateMediaOrders(mediaFiles);

    updated[momentIndex] = {
      ...updated[momentIndex],
      mediaFiles: reorderedMedia
    };

    setLocalMoments(updated);
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      // Save moment order
      // We will send objects with _id and order fields — backend will update each document
      const momentsToSend = localMoments.map(m => ({ _id: m._id, order: m.order }));
      await onSave(momentsToSend);
      
      // Save media order for upload type moments
      for (const moment of localMoments) {
        if (moment.type === 'upload' && moment.mediaFiles?.length > 0) {
          // ensure media files are sent with _id and order
          const mediaFilesToSend = moment.mediaFiles.map(f => ({ _id: f._id, name: f.name, url: f.url, type: f.type, order: f.order, mediaPublicId: f.mediaPublicId }));
          await onMediaOrderSave(moment._id, mediaFilesToSend);
        }
      }
      
      setHasChanges(false);
    } catch (error) {
      console.error('Failed to save order:', error);
    }
  };

  const handleCancel = () => {
    setLocalMoments([...moments]);
    setHasChanges(false);
    onCancel();
  };

  const getDirectMediaUrl = (url) => {
    const fileId = url.match(/[?&]id=([^&]+)/)?.[1];
    if (!fileId) return url;
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  };

  const getEmbedUrl = (url) => {
    const videoId = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?]+)/);
    return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex flex-col items-center space-y-3">
        <p className="text-blue-800 text-sm text-center">
          <GripHorizontal className="h-4 w-4 inline mb-1" /> 
          Drag or use arrows to change order of moments and media files.
        </p>
        <div className="flex justify-center space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md shadow-sm transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasChanges}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md shadow-sm disabled:opacity-50 transition"
          >
            Save
          </button>
        </div>
      </div>

      {/* Moments Reorder */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="moments-droppable" type="moments">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-4"
            >
              {localMoments.map((moment, momentIndex) => (
                <Draggable
                  key={moment._id}
                  draggableId={moment._id}
                  index={momentIndex}
                >
                  {(dragProvided, snapshot) => (
                    <div
                      ref={dragProvided.innerRef}
                      {...dragProvided.draggableProps}
                      className={`bg-white rounded-lg shadow-md overflow-hidden transition-transform ${
                        snapshot.isDragging ? 'ring-2 ring-indigo-500' : 'hover:shadow-lg'
                      }`}
                    >
                      {/* Moment Header */}
                      <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold">
                            {momentIndex + 1}
                          </div>
                          <h3 className="font-semibold">{moment.title}</h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div {...dragProvided.dragHandleProps} className="cursor-move">
                            <GripHorizontal className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                          </div>
                          <button
                            onClick={() => moveMoment(momentIndex, momentIndex - 1)}
                            disabled={momentIndex === 0}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => moveMoment(momentIndex, momentIndex + 1)}
                            disabled={momentIndex === localMoments.length - 1}
                            className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      {/* Moment Preview */}
                      <div className="p-4">
                        {moment.type === 'youtube' ? (
                          <div className="aspect-video">
                            <iframe
                              src={getEmbedUrl(moment.url)}
                              className="w-full h-full rounded"
                              title={moment.title}
                            />
                          </div>
                        ) : moment.type === 'drive' ? (
                          <div className="aspect-video">
                            {moment.url.includes('image') ? (
                              <img
                                src={getDirectMediaUrl(moment.url)}
                                alt={moment.title}
                                className="w-full h-full object-cover rounded"
                              />
                            ) : (
                              <video
                                src={getDirectMediaUrl(moment.url)}
                                className="w-full h-full object-cover rounded"
                                muted
                              />
                            )}
                          </div>
                        ) : (
                          <div>
                            {/* Upload type - show media reorder */}
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium">Media Files ({moment.mediaFiles?.length || 0})</span>
                              <button
                                onClick={() => setExpandedMoment(expandedMoment === moment._id ? null : moment._id)}
                                className="text-indigo-600 hover:text-indigo-800 text-sm"
                              >
                                {expandedMoment === moment._id ? 'Collapse' : 'Expand'}
                              </button>
                            </div>

                            {expandedMoment === moment._id && moment.mediaFiles?.length > 0 && (
                              <Droppable droppableId={`media-${moment._id}`} type="media">
                                {(mediaProvided) => (
                                  <div
                                    ref={mediaProvided.innerRef}
                                    {...mediaProvided.droppableProps}
                                    className="grid grid-cols-3 md:grid-cols-4 gap-3"
                                  >
                                    {moment.mediaFiles.map((file, fileIndex) => (
                                      <Draggable
                                        key={file._id}
                                        draggableId={file._id}
                                        index={fileIndex}
                                      >
                                        {(fileProvided, fileSnapshot) => (
                                          <div
                                            ref={fileProvided.innerRef}
                                            {...fileProvided.draggableProps}
                                            className={`relative aspect-square rounded overflow-hidden ${
                                              fileSnapshot.isDragging ? 'ring-2 ring-indigo-500' : ''
                                            }`}
                                          >
                                            <div className="absolute top-1 left-1 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10">
                                              {fileIndex + 1}
                                            </div>
                                            
                                            {file.type === 'image' ? (
                                              <img
                                                src={getDirectMediaUrl(file.url)}
                                                alt={file.name}
                                                className="w-full h-full object-cover"
                                              />
                                            ) : (
                                              <video
                                                src={getDirectMediaUrl(file.url)}
                                                className="w-full h-full object-cover"
                                                muted
                                              />
                                            )}

                                            <div className="absolute bottom-1 right-1 flex space-x-1">
                                              <div {...fileProvided.dragHandleProps} className="cursor-move">
                                                <GripHorizontal className="h-4 w-4 text-white bg-black bg-opacity-50 rounded p-0.5" />
                                              </div>
                                              <button
                                                onClick={() => moveMedia(momentIndex, fileIndex, fileIndex - 1)}
                                                disabled={fileIndex === 0}
                                                className="p-0.5 rounded bg-black bg-opacity-50 text-white disabled:opacity-50"
                                              >
                                                <ArrowUp className="h-3 w-3" />
                                              </button>
                                              <button
                                                onClick={() => moveMedia(momentIndex, fileIndex, fileIndex + 1)}
                                                disabled={fileIndex === moment.mediaFiles.length - 1}
                                                className="p-0.5 rounded bg-black bg-opacity-50 text-white disabled:opacity-50"
                                              >
                                                <ArrowDown className="h-3 w-3" />
                                              </button>
                                            </div>
                                          </div>
                                        )}
                                      </Draggable>
                                    ))}
                                    {mediaProvided.placeholder}
                                  </div>
                                )}
                              </Droppable>
                            )}
                          </div>
                        )}
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

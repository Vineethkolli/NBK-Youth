import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, GripHorizontal } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

function SlidesOrder({
  slides,
  setSlides,
  setCurrentSlide,
  setIsEditingOrder,
}) {
  const [localSlides, setLocalSlides] = useState([...slides]);

  useEffect(() => {
    setLocalSlides([...slides]);
  }, [slides]);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination || source.index === destination.index) return;

    const updated = Array.from(localSlides);
    const [moved] = updated.splice(source.index, 1);
    updated.splice(destination.index, 0, moved);

    setLocalSlides(updated);
  };

  const moveSlide = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= localSlides.length) return;
    const updated = Array.from(localSlides);
    const [item] = updated.splice(fromIndex, 1);
    updated.splice(toIndex, 0, item);
    setLocalSlides(updated);
  };

  const saveOrder = async () => {
    const updatedSlides = localSlides.map((slide, index) => ({
      ...slide,
      order: index,
    }));

    try {
      await axios.put(`${API_URL}/api/homepage/slides/order`, {
        slides: updatedSlides,
      });
      setSlides(updatedSlides);
      setCurrentSlide(0);
      setIsEditingOrder(false);
      toast.success('Slide order updated successfully');
    } catch (error) {
      toast.error('Failed to update slide order');
    }
  };

  const cancelOrder = () => {
    setLocalSlides([...slides]);
    setIsEditingOrder(false);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-3 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reorder Slides</h3>
            <div className="flex space-x-4">
              <button
                onClick={cancelOrder}
                className="px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={saveOrder}
                className="flex items-center px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                Save
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            <GripHorizontal className="h-4 w-4 inline mr-1" />
            Drag slides or use arrows to reorder.
          </p>
        </div>

        {/* Slides Grid with DragDropContext */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="slides-droppable" direction="horizontal">
            {(provided) => (
              <div
                className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]"
                ref={provided.innerRef}
                {...provided.droppableProps}
              >
                <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {localSlides.map((slide, index) => (
                    <Draggable
                      key={slide._id}
                      draggableId={slide._id}
                      index={index}
                    >
                      {(dragProvided, snapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          className={`relative bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 $
                            snapshot.isDragging
                              ? 'ring-2 ring-indigo-500'
                              : 'border-gray-200 hover:border-indigo-300 hover:shadow-md'
                          }`}
                        >
                          {/* Order Number Badge */}
                          <div className="absolute top-1 left-1 bg-indigo-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold z-10">
                            {index + 1}
                          </div>

                          {/* Slide Preview */}
                          <div className="aspect-video bg-gray-100">
                            {slide.type === 'image' ? (
                              <img
                                src={slide.url}
                                alt={`Slide ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <video
                                src={slide.url}
                                className="w-full h-full object-cover"
                                muted
                              />
                            )}
                          </div>

                          {/* Controls */}
                          <div className="p-2 bg-gray-50 flex justify-center items-center space-x-3">
                             {/* Drag Handle Moved Here */}
                            <div
                              className="cursor-move p-1"
                              title="Drag"
                              {...dragProvided.dragHandleProps}
                            >
                              <GripHorizontal className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                            </div>
                            <button
                              onClick={() => moveSlide(index, index - 1)}
                              disabled={index === 0}
                              className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                              title="Move up"
                            >
                              <ArrowUp className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => moveSlide(index, index + 1)}
                              disabled={index === localSlides.length - 1}
                              className="p-1 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 transition-colors"
                              title="Move down"
                            >
                              <ArrowDown className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}

export default SlidesOrder;

import { ArrowUp, ArrowDown, GripHorizontal } from 'lucide-react';
import { useState } from 'react';
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
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    setDragOverItem(index);
  };

  const handleDrop = async () => {
    if (draggedItem === null || dragOverItem === null || draggedItem === dragOverItem) return;

    const newSlides = [...localSlides];
    const dragged = newSlides[draggedItem];
    newSlides.splice(draggedItem, 1);
    newSlides.splice(dragOverItem, 0, dragged);
    setLocalSlides(newSlides);

    // reset
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const moveSlide = (fromIndex, toIndex) => {
    if (toIndex < 0 || toIndex >= localSlides.length) return;

    const newSlides = [...localSlides];
    const item = newSlides[fromIndex];
    newSlides.splice(fromIndex, 1);
    newSlides.splice(toIndex, 0, item);

    setLocalSlides(newSlides);
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
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-3 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Reorder Slides</h3>
            <div className="flex space-x-2">
              <button
                onClick={cancelOrder}
                className="flex items-center px-2 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
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
            Drag slides or use arrows to reorder.
          </p>
        </div>

        {/* Slides Grid */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="grid grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {localSlides.map((slide, index) => (
              <div
                key={slide._id}
                draggable
                onDragStart={e => handleDragStart(e, index)}
                onDragOver={e => handleDragOver(e, index)}
                onDrop={handleDrop}
                onDragEnd={handleDrop}
                className={`relative bg-white border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                  index === dragOverItem ? 'ring-2 ring-indigo-500' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                {/* Order Number Badge */}
                <div className="absolute top-2 left-2 bg-gray-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold z-10">
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
                <div className="p-3 bg-gray-50 flex justify-center items-center space-x-3">
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
                  <div className="cursor-move p-1" title="Drag" draggable>
                    <GripHorizontal className="h-5 w-5 text-gray-500 hover:text-gray-700" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default SlidesOrder;

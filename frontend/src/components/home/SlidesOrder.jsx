/* SlidesOrder.jsx */
import { GripVertical } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

function SlidesOrder({
  slides,
  setSlides,
  setCurrentSlide,
  draggedSlide,
  setDraggedSlide,
  setIsEditingOrder,
}) {
  const handleDragStart = (e, index) => {
    setDraggedSlide(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    if (draggedSlide === null || draggedSlide === dropIndex) return;

    const newSlides = [...slides];
    const draggedItem = newSlides[draggedSlide];
    newSlides.splice(draggedSlide, 1);
    newSlides.splice(dropIndex, 0, draggedItem);

    const updatedSlides = newSlides.map((slide, index) => ({
      ...slide,
      order: index,
    }));

    try {
      await axios.put(`${API_URL}/api/homepage/slides/order`, {
        slides: updatedSlides,
      });
      setSlides(updatedSlides);
      setCurrentSlide(dropIndex);
      toast.success('Slide order updated successfully');
    } catch (error) {
      toast.error('Failed to update slide order');
    }

    setDraggedSlide(null);
  };

  return (
    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 rounded-lg p-6 inline-block">
      <div className="flex justify-between items-center mb-4">
        <p className="text-white text-sm">Drag slides to reorder</p>
      </div>
      <div className="flex space-x-4 overflow-x-auto">
        {slides.map((slide, index) => (
          <div
            key={slide._id}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, index)}
            className={`flex-shrink-0 w-32 h-20 rounded cursor-move border-2 relative ${
              draggedSlide === index ? 'opacity-50' : ''
            }`}
          >
            {slide.type === 'image' ? (
              <img
                src={slide.url}
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <video
                src={slide.url}
                className="w-full h-full object-cover rounded"
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <GripVertical className="h-4 w-4 text-white/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SlidesOrder;
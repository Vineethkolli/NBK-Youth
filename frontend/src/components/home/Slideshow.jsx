import { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  GripHorizontal,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';
import SlidesOrder from './SlidesOrder';

function Slideshow({ isEditing }) {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);

  const videoRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swipeThreshold = 50;
  const { user } = useAuth();

  // Fetch slides on mount
  useEffect(() => {
    fetchSlides();
  }, []);

  // Clamp currentSlide whenever slides change
  useEffect(() => {
    if (slides.length === 0) {
      setCurrentSlide(0);
    } else if (currentSlide >= slides.length) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides, currentSlide]);

  // Auto-advance logic
  useEffect(() => {
    let timeout;

    const slide = slides[currentSlide];
    if (!slide) return;

    if (!isEditing) {
      if (slide.type === 'image') {
        timeout = setTimeout(nextSlide, 3000);
      } else if (slide.type === 'video') {
        const video = videoRef.current;
        if (video) {
          video.play();
          video.onended = nextSlide;
        }
      }
    }

    return () => {
      clearTimeout(timeout);
      if (videoRef.current) {
        videoRef.current.onended = null;
      }
    };
  }, [currentSlide, slides, isEditing]);

  async function fetchSlides() {
    try {
      const { data } = await axios.get(`${API_URL}/api/homepage/slides`);
      setSlides(data);
    } catch (err) {
      toast.error('Failed to fetch slides');
    }
  }

  // Utility to convert File -> base64
  function toBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject('File read error');
    });
  }

  const handleFileUpload = async e => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      toast.error('File size should be less than 100MB');
      return;
    }

    const type = file.type.startsWith('image/') ? 'image' : 'video';
    setIsUploading(true);

    try {
      const base64 = await toBase64(file);
      await axios.post(`${API_URL}/api/homepage/slides`, {
        file: base64,
        type,
      });
      toast.success('Slide added successfully');
      await fetchSlides();
    } catch (err) {
      toast.error('Failed to upload slide');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    setIsDeleting(currentSlide);
    try {
      await axios.delete(`${API_URL}/api/homepage/slides/${id}`);
      toast.success('Slide deleted successfully');
      await fetchSlides();
    } catch {
      toast.error('Failed to delete slide');
    } finally {
      setIsDeleting(null);
    }
  };

  const nextSlide = () =>
    setCurrentSlide(prev => (prev + 1) % slides.length);

  const previousSlide = () =>
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);

  const handleTouchStart = e =>
    (touchStartX.current = e.touches[0].clientX);
  const handleTouchMove = e =>
    (touchEndX.current = e.touches[0].clientX);
  const handleTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > swipeThreshold) {
      delta > 0 ? nextSlide() : previousSlide();
    }
  };

  // No slides or loading state
  if (slides.length === 0 || !slides[currentSlide]) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        {isEditing ? (
          <div className="text-center">
            <input
              type="file"
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
              id="slide-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="slide-upload"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <Plus className="h-5 w-5 mr-2" />
              )}
              {isUploading ? 'Adding...' : 'Add Slide'}
            </label>
          </div>
        ) : (
          <p className="text-gray-500">No slides available</p>
        )}
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div
      className="relative h-96 bg-black rounded-lg overflow-hidden group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {slide.type === 'image' ? (
        <img
          src={slide.url}
          alt="Slide"
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src={slide.url}
          className="w-full h-full object-cover"
          controls={isEditing}
          muted={false}
        />
      )}

      {isEditing && (
        // <-- Added touch-stop-propagation here
        <div
          className="absolute top-2 right-2 space-x-2"
          onTouchStart={e => e.stopPropagation()}
          onTouchMove={e => e.stopPropagation()}
          onTouchEnd={e => e.stopPropagation()}
        >
          <button
            onClick={() => setIsEditingOrder(!isEditingOrder)}
            className={`inline-flex items-center px-2 py-1 rounded-md shadow-sm transition-colors ${
              isEditingOrder
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            <GripHorizontal className="h-4 w-4 mr-1" />
            {isEditingOrder ? 'Ordering...' : 'Reorder'}
          </button>

          <input
            type="file"
            accept="image/*,video/*"
            onChange={handleFileUpload}
            className="hidden"
            id="slide-upload"
            disabled={isUploading}
          />
          <label
            htmlFor="slide-upload"
            className={`inline-flex items-center px-2 py-1 rounded-md shadow-sm bg-white ${
              isUploading
                ? 'cursor-not-allowed opacity-50'
                : 'cursor-pointer'
            }`}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-1" />
            )}
            {isUploading ? 'Adding...' : 'Add'}
          </label>

          <button
            onClick={() => handleDelete(slide._id)}
            className={`inline-flex items-center px-2 py-1 rounded-md shadow-sm bg-red-600 text-white ${
              isDeleting === currentSlide
                ? 'cursor-not-allowed opacity-50'
                : ''
            }`}
            disabled={isDeleting === currentSlide}
          >
            {isDeleting === currentSlide ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4 mr-1" />
            )}
            {isDeleting === currentSlide
              ? 'Deleting...'
              : 'Delete'}
          </button>
        </div>
      )}

      {slides.length > 1 && !isEditingOrder && (
        <>
          <button
            onClick={previousSlide}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 p-2 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <ArrowRight className="h-6 w-6" />
          </button>
        </>
      )}

      {isEditingOrder ? (
        <SlidesOrder
          slides={slides}
          setSlides={setSlides}
          setCurrentSlide={setCurrentSlide}
          setIsEditingOrder={setIsEditingOrder}
        />
      ) : (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full ${
                idx === currentSlide
                  ? 'bg-white'
                  : 'bg-white/50'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Slideshow;

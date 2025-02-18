import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';

function Slideshow({ isEditing }) {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const videoRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swipeThreshold = 50; 
  const { user } = useAuth();

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    let interval;

    if (slides.length > 0 && !isEditing) {
      const currentSlideData = slides[currentSlide];

      if (currentSlideData.type === 'image') {
        interval = setTimeout(nextSlide, 3000); // Display image for 3 seconds
      } else if (currentSlideData.type === 'video') {
        const video = videoRef.current;
        if (video) {
          video.play(); 
          video.onended = nextSlide; 
        }
      }
    }

    return () => {
      clearTimeout(interval);
      if (videoRef.current) {
        videoRef.current.onended = null; 
      }
    };
  }, [currentSlide, slides, isEditing]);

  const fetchSlides = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/homepage/slides`);
      setSlides(data);
    } catch (error) {
      toast.error('Failed to fetch slides');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 100 * 1024 * 1024) {
      return toast.error('File size should be less than 100MB');
    }

    const type = file.type.startsWith('image/') ? 'image' : 'video';
    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        await axios.post(`${API_URL}/api/homepage/slides`, {
          file: reader.result,
          type
        });
        toast.success('Slide added successfully');
        fetchSlides();
      };
    } catch (error) {
      toast.error('Failed to upload slide');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/api/homepage/slides/${id}`);
      toast.success('Slide deleted successfully');
      fetchSlides();
    } catch (error) {
      toast.error('Failed to delete slide');
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const previousSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  // Touch event handlers for swipe functionality
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const swipeDistance = touchStartX.current - touchEndX.current;
    if (Math.abs(swipeDistance) > swipeThreshold) {
      if (swipeDistance > 0) {
        nextSlide();
      } else {
        previousSlide();
      }
    }
  };

  if (slides.length === 0) {
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
              <Plus className="h-5 w-5 mr-2" />
              Add Slide
            </label>
          </div>
        ) : (
          <p className="text-gray-500">No slides available</p>
        )}
      </div>
    );
  }

  const currentSlideData = slides[currentSlide];

  return (
    <div
      className="relative h-96 bg-black rounded-lg overflow-hidden group"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {currentSlideData.type === 'image' ? (
        <img
          src={currentSlideData.url}
          alt="Slide"
          className="w-full h-full object-cover"
        />
      ) : (
        <video
          ref={videoRef}
          src={currentSlideData.url}
          className="w-full h-full object-cover"
          autoPlay
          controls={isEditing}
          muted={false} 
        />
      )}

      {isEditing && (
        <div className="absolute top-4 right-4 space-x-2">
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
            className="inline-flex items-center px-3 py-1 bg-white rounded-md shadow-sm cursor-pointer"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </label>
          <button
            onClick={() => handleDelete(currentSlideData._id)}
            className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded-md shadow-sm"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Delete
          </button>
        </div>
      )}

      {slides.length > 1 && (
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

      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-2 h-2 rounded-full ${
              index === currentSlide ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

export default Slideshow;

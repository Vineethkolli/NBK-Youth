import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, ArrowLeft, ArrowRight, Loader2, GripHorizontal, VolumeX, Volume2, Pause, Play } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';
import SlidesOrder from './SlidesOrder';
import SlidesUpload from './SlidesUpload';

function Slideshow({ isEditing }) {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDeleting, setIsDeleting] = useState(null);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  // Playback state
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);

  const videoRef = useRef(null);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swipeThreshold = 50;
  const { user } = useAuth();

  useEffect(() => {
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) {
      setCurrentSlide(0);
    } else if (currentSlide >= slides.length) {
      setCurrentSlide(slides.length - 1);
    }
  }, [slides, currentSlide]);

  // Auto timeout logic
  useEffect(() => {
    let timeout;
    const slide = slides[currentSlide];
    if (!slide || isEditingOrder) return;

    if (!isEditing) {
      if (slide.type === 'image') {
        timeout = setTimeout(nextSlide, 3000);
      } else if (slide.type === 'video') {
        const video = videoRef.current;
        if (video) {
          video.autoplay = true;
          video.playsInline = true;

          video.muted = false;
          video
            .play()
            .then(() => {
              setIsMuted(false);
              setIsPlaying(true);
            })
            .catch(() => {
              video.muted = true;
              setIsMuted(true);
              video.play().catch(() => {});
            });

          video.onended = nextSlide;

          const handlePause = () => {
            setIsPlaying(false);
            timeout = setTimeout(() => {
              if (video.paused) {
                nextSlide();
              }
            }, 3000);
          };

          const handlePlay = () => {
            setIsPlaying(true);
            clearTimeout(timeout);
          };

          video.addEventListener('pause', handlePause);
          video.addEventListener('play', handlePlay);

          return () => {
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('play', handlePlay);
          };
        }
      }
    }

    return () => {
      clearTimeout(timeout);
      if (videoRef.current) {
        videoRef.current.onended = null;
      }
    };
  }, [currentSlide, slides, isEditing, isEditingOrder]);

  async function fetchSlides() {
    try {
      const { data } = await axios.get(`${API_URL}/api/homepage/slides`);
      setSlides(data);
    } catch {
      toast.error('Failed to fetch slides');
    }
  }

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this slide?');
    if (!confirmDelete) return;
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

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const previousSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  // Touch handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const deltaX = touchStartX.current - touchEndX.current;
    if (Math.abs(deltaX) > swipeThreshold) {
      deltaX > 0 ? nextSlide() : previousSlide();
    }
  };

  const toggleMute = () => {
    setIsMuted((m) => !m);
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
    }
  };

  const togglePlay = () => {
    setIsPlaying((p) => {
      const video = videoRef.current;
      if (video) {
        if (p) video.pause();
        else video.play().catch(() => {});
      }
      return !p;
    });
  };

  if (slides.length === 0 || !slides[currentSlide]) {
    return (
      <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
        {isEditing ? (
          <div className="text-center">
            <button
              onClick={() => setIsUploadOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Slides
            </button>
            <SlidesUpload
              open={isUploadOpen}
              onClose={() => setIsUploadOpen(false)}
              onUploaded={fetchSlides}
            />
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
        <img src={slide.url} alt="Slide" className="w-full h-full object-cover" />
      ) : (
        <video
          ref={videoRef}
          src={slide.url}
          className="w-full h-full object-cover"
          muted={isMuted}
          autoPlay={!isEditing}
          loop={false}
          playsInline
          controls={isEditing}
        />
      )}

      {/* Controls for non-editing mode (mute/play) */}
      {!isEditing && slide.type === 'video' && (
        <div className="absolute bottom-3 right-3 flex space-x-2 bg-black/30 backdrop-blur-md p-1 rounded-full shadow-lg">
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleMute();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 text-white shadow-md active:scale-95"
          >
            {isMuted ? <VolumeX className="h-5 w-5" strokeWidth={2.5} /> : <Volume2 className="h-5 w-5" strokeWidth={2.5} />}
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-all duration-200 text-white shadow-md active:scale-95"
          >
            {isPlaying ? <Pause className="h-5 w-5" strokeWidth={2.5} /> : <Play className="h-5 w-5" strokeWidth={2.5} />}
          </button>
        </div>
      )}

      {/* Editing tools */}
      {isEditing && (
        <div
          className="absolute top-2 right-2 space-x-2"
          onTouchStart={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center px-2 py-1 rounded-md shadow-sm bg-white text-gray-800 hover:bg-gray-50"
          >
            <Plus className="h-4 w-4 mr-1" /> Add
          </button>
          <SlidesUpload open={isUploadOpen} onClose={() => setIsUploadOpen(false)} onUploaded={fetchSlides} />

          <button
            onClick={() => setIsEditingOrder(!isEditingOrder)}
            className={`inline-flex items-center px-2 py-1 rounded-md shadow-sm transition-colors ${
              isEditingOrder ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-white text-gray-800 hover:bg-gray-50'
            }`}
          >
            <GripHorizontal className="h-4 w-4 mr-1" />
            {isEditingOrder ? 'Ordering...' : 'Reorder'}
          </button>

          <button
            onClick={() => handleDelete(slide._id)}
            className={`inline-flex items-center px-2 py-1 rounded-md shadow-sm bg-red-600 text-white ${
              isDeleting === currentSlide ? 'cursor-not-allowed opacity-50' : ''
            }`}
            disabled={isDeleting === currentSlide}
          >
            {isDeleting === currentSlide ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Trash2 className="h-4 w-4 mr-1" />}
            {isDeleting === currentSlide ? 'Deleting...' : 'Delete'}
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
        <SlidesOrder slides={slides} setSlides={setSlides} setCurrentSlide={setCurrentSlide} setIsEditingOrder={setIsEditingOrder} />
      ) : (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {slides.map((_, idx) => (
            <button key={idx} onClick={() => setCurrentSlide(idx)} className={`w-2 h-2 rounded-full ${idx === currentSlide ? 'bg-white' : 'bg-white/50'}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export default Slideshow;

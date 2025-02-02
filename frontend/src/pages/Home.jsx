import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Edit2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import Slideshow from '../components/home/Slideshow';
import Timeline from '../components/home/Timeline';
import Footer from '../components/Footer';

function Home() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/homepage/events`);
      setEvents(data);
    } catch (error) {
      toast.error('Failed to fetch events');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-0 space-y-8">
      {['developer', 'financier', 'admin'].includes(user?.role) && (
        <div className="flex justify-end">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md"
          >
            <Edit2 className="h-4 w-4 mr-2" />
            {isEditing ? 'Done Editing' : 'Edit Homepage'}
          </button>
        </div>
      )}

      {/* Slideshow Component */}
      <Slideshow isEditing={isEditing} />

      {/* Welcome Message at Top Left */}
      <div className="bg-white shadow rounded-lg p-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Hello, {user?.name}!
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to NBK Youth Web APP.
        </p>
      </div>

      {/* Timeline Component */}
      <Timeline events={events} isEditing={isEditing} onUpdate={fetchEvents} />

       {/* Mode Section Below Welcome */}
       <div className="bg-gray-100 border-t border-gray-200 rounded-lg">
        <div className="px-0 py-4 sm:px-0 sm:py-6">
          <h2 className="text-xl font-medium text-gray-800">Current Mode:</h2>
          <div className="mt-2 flex items-center">
            <div className="inline-flex items-center px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-full shadow">
              Development & Testing
            </div>
          </div>
          <p className="mt-2 text-sm text-black-500">
            First Phase of Development Completed 31-12-24.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Raise Concerns, Recommend Enhancements, Share Your Thoughts.
          </p>
        </div>
        <p className="mt-4 text-sm text-gray-500">
            If any issue is faced at any time, just refresh the page by scrolling down. We are working hard to sort out the errors.
          </p>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

export default Home;

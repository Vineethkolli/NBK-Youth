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
  const { user, hasAccess } = useAuth();
  const [isSlidesEditing, setIsSlidesEditing] = useState(false);
  const [isTimelineEditing, setIsTimelineEditing] = useState(false);
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
    <div>
      <div className="space-y-8">
        {hasAccess('Privileged') && (
          <div className="flex justify-end mb-2">
            <button
              onClick={() => setIsSlidesEditing(!isSlidesEditing)}
              className="inline-flex items-center px-2 rounded-md"
            >
              <Edit2 className="h-4 w-4 mr-1" />
              {isSlidesEditing ? 'Done' : 'Edit Slides'}
            </button>
          </div>
        )}

        <Slideshow isEditing={isSlidesEditing} />

        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Hello, {user?.name}!
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Welcome to NBK Youth Web APP.
          </p>
        </div>

        <Timeline
          events={events}
          isTimelineEditing={isTimelineEditing}
          setIsTimelineEditing={setIsTimelineEditing}
          onUpdate={fetchEvents}
        />

        <Footer />
      </div>
    </div>
  );
}

export default Home;

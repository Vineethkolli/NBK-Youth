import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../utils/config';

const EventLabelContext = createContext();

export const useEventLabel = () => useContext(EventLabelContext);

export const EventLabelProvider = ({ children }) => {
  const [eventLabel, setEventLabel] = useState(null);

  useEffect(() => {
    fetchEventLabel();
  }, []);

  const fetchEventLabel = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/event-label`);
      setEventLabel(data);
    } catch (error) {
      console.error('Failed to fetch event label:', error);
    }
  };

  const refreshEventLabel = () => {
    fetchEventLabel();
  };

  return (
    <EventLabelContext.Provider value={{ eventLabel, refreshEventLabel }}>
      {children}
    </EventLabelContext.Provider>
  );
};

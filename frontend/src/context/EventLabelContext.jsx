import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const EventLabelContext = createContext();

export const useEventLabel = () => useContext(EventLabelContext);

export const EventLabelProvider = ({ children }) => {
  const [eventLabel, setEventLabel] = useState(null);

  useEffect(() => {
    fetchEventLabel();
  }, []);

  const fetchEventLabel = async () => {
    try {
      const { data } = await api.get(`/api/event-label`);
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

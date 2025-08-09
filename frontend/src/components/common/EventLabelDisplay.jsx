// src/components/common/EventLabelDisplay.jsx
import { useEventLabel } from '../../context/EventLabelContext';

function EventLabelDisplay({ className = "" }) {
  const { eventLabel } = useEventLabel();

  if (!eventLabel) return null;

  return (
    <span
      id="event-label-display"
      className={`inline-block px-3 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 ${className}`}
    >
      {eventLabel.label}
    </span>
  );
}

export default EventLabelDisplay;

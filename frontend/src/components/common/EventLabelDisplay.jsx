import { useEventLabel } from '../../context/EventLabelContext';

function EventLabelDisplay({ className = "" }) {
  const { eventLabel } = useEventLabel();

  if (!eventLabel) return null;

  return (
    <span
      className={`inline-block px-3 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800 ${className}`}
    >
      {eventLabel.label}
    </span>
  );
}

export default EventLabelDisplay;

import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatDateTime } from '../../utils/dateTime';
import { useEventLabel } from '../../context/EventLabelContext';

function EventTimelineTeluguPrint({ events }) {
  const printRef = useRef();
  const { eventLabel } = useEventLabel();

  const handlePrint = () => {
    const renderedLabel = document.getElementById('event-label-display')?.innerText?.trim();
    const content = printRef.current.innerHTML;
    const printWindow = window.open('height=700,width=1000');

    if (!printWindow) {
      toast.error('Please allow pop-ups to print the event timeline');
      return;
    }

    printWindow.document.write('<meta charset="UTF-8" />');
    printWindow.document.write('<style>body { font-family: sans-serif; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; } th { background: #f4f4f4; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="text-align: center;"><h2><span translate="no">కార్యక్రమాల టైమ్‌లైన్</span></h2></div>');
    if (renderedLabel) {
      printWindow.document.write(`<div class="event-label" style="text-align: center; margin-bottom: 10px; color: #666;">${renderedLabel}</div>`);
    } else if (eventLabel?.label) {
      printWindow.document.write(`<div class="event-label" style="text-align: center; margin-bottom: 10px; color: #666;">${eventLabel.label}</div>`);
    }
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const sortedEvents = [...events].sort(
    (firstEvent, secondEvent) => new Date(secondEvent.dateTime) - new Date(firstEvent.dateTime),
  );

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="h-4 w-4 mr-1 inline" />
        <span>Print</span>
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        <table>
          <thead>
            <tr>
              <th>క్ర.సం.</th>
              <th>కార్యక్రమం</th>
              <th>తేదీ మరియు సమయం</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((event, index) => (
              <tr key={event._id || `${event.name}-${event.dateTime}`}>
                <td><span translate="no">{index + 1}</span></td>
                <td>{event.name || '-'}</td>
                <td><span translate="no">{event.dateTime ? formatDateTime(event.dateTime) : '-'}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default EventTimelineTeluguPrint;

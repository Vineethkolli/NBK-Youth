import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';
import { useEventLabel } from '../../context/EventLabelContext';

function EventTimelineEnglishPrint({ events }) {
  const { eventLabel } = useEventLabel();

  const handlePrint = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    const renderedLabel = eventLabel?.label || '';
    const sortedEvents = [...events].sort(
      (firstEvent, secondEvent) => new Date(secondEvent.dateTime) - new Date(firstEvent.dateTime),
    );

    doc.setFontSize(16);
    doc.text('Event Timeline', 105, 20, { align: 'center' });

    if (renderedLabel) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(renderedLabel, 105, 27, { align: 'center' });
    }

    autoTable(doc, {
      startY: renderedLabel ? 35 : 30,
      head: [['S.No', 'Event Name', 'Date & Time']],
      body: sortedEvents.map((event, index) => [
        index + 1,
        event.name || '-',
        event.dateTime ? formatDateTime(event.dateTime) : '-',
      ]),
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7 },
    });

    const pageCount = doc.getNumberOfPages();
    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);
      doc.setFontSize(9);
      doc.setTextColor(100);
      const pageHeight = doc.internal.pageSize.height;
      const pageWidth = doc.internal.pageSize.width;
      doc.text(timestamp, 10, pageHeight - 10);
      doc.text(`Page ${page} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }

    doc.save('Event_Timeline.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-2" />
      Print
    </button>
  );
}

export default EventTimelineEnglishPrint;
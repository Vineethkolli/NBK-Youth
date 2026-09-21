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

    // Footer
const pageCount = doc.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  doc.setFontSize(9);

  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  doc.text(`${timestamp}`, 10, pageHeight - 10);

  const linkText = "Gangavaram App | https://nbkyouth.vercel.app";
  const textWidth = doc.getTextWidth(linkText);
  const centerX = (pageWidth - textWidth) / 2;

  doc.textWithLink(linkText, centerX, pageHeight - 10, {
    url: "https://nbkyouth.vercel.app"
  });

  doc.text(
    `Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
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
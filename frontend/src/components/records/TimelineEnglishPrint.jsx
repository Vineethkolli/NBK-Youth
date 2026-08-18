import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';

const TimelineEnglishPrint = ({ records, selectedEvent }) => {
  const handlePrint = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const timestamp = new Date().toLocaleString();
    let yPos = 20;

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    const title = 'Timeline Report';
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPos);
    yPos += 10;

    if (selectedEvent) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(selectedEvent, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;
    }

    const formatAmount = (amount) =>
      new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0);

    const printRecord = (rec) => {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      const amountLeft = (rec.amountCollected || 0) - (rec.amountSpent || 0);
      const previousAmount = rec.previousAmount || 0;
      const finalAmountLeft = amountLeft + previousAmount;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(String(rec.year), 15, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        theme: 'grid',
        margin: { left: 15, right: 15 },
        head: [['Amount Collected', 'Amount Spent', 'Amount Left', 'Previous Amount', 'Final Amount Left']],
        body: [
          [
            formatAmount(rec.amountCollected),
            formatAmount(rec.amountSpent),
            formatAmount(amountLeft),
            formatAmount(previousAmount),
            formatAmount(finalAmountLeft)
          ]
        ],
        headStyles: {
          fillColor: [33, 115, 175],
          textColor: [255, 255, 255],
          fontSize: 10,
          halign: 'center'
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          halign: 'center'
        }
      });

      yPos = doc.lastAutoTable.finalY + 6;

      if (rec.remarks && rec.remarks.trim() !== '') {
        doc.setFontSize(11);
        doc.setTextColor(60);
        doc.text(rec.remarks, 20, yPos);
        yPos += 10;
      }

      yPos += 4;
    };

    records.forEach(printRecord);

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100);

      doc.text(timestamp, 10, pageHeight - 8);

      const footerText = 'Gangavaram App | https://nbkyouth.vercel.app';
      const linkWidth = doc.getTextWidth(footerText);

      doc.textWithLink(footerText, (pageWidth - linkWidth) / 2, pageHeight - 8, {
        url: 'https://nbkyouth.vercel.app'
      });

      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 35, pageHeight - 8);
    }

    doc.save(`${selectedEvent || ''} Timeline.pdf`);
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      Print
    </button>
  );
};

export default TimelineEnglishPrint;

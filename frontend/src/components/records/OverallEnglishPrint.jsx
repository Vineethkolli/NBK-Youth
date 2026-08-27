import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';

const OverallEnglishPrint = ({
  events,
  totals,
  totalInflow,
  amountLeft
}) => {
  const handlePrint = () => {
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const timestamp = new Date().toLocaleString();

    const formatAmount = (amount) =>
      new Intl.NumberFormat('en-IN', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount || 0);

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);

    doc.text(
      'Overall Records Report',
      pageWidth / 2,
      20,
      { align: 'center' }
    );

    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);

    doc.text(
      'Data from 2023 onwards',
      pageWidth / 2,
      29,
      { align: 'center' }
    );

    autoTable(doc, {
      startY: 38,
      theme: 'grid',
      head: [[
        'Total Inflow',
        'Amount Collected',
        'Amount Spent',
        'Additional Amount',
        'Amount Left'
      ]],
      body: [[
        formatAmount(totalInflow),
        formatAmount(totals.amountCollected),
        formatAmount(totals.amountSpent),
        formatAmount(totals.additionalAmount),
        formatAmount(amountLeft)
      ]],
      headStyles: {
        fillColor: [33, 115, 175],
        textColor: [255, 255, 255],
        halign: 'center'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: 'center'
      }
    });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(14);

    doc.text(
      'Event Stats',
      14,
      doc.lastAutoTable.finalY + 14
    );

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 19,
      theme: 'grid',
      head: [[
        'Event',
        'Amount Collected',
        'Amount Spent',
        'Additional Amount',
        'Amount Left'
      ]],
      body: events.map((event) => {
        const latestRecord = event.latestRecord;

        const eventAmountLeft =
          (Number(latestRecord.amountCollected) || 0) -
          (Number(latestRecord.amountSpent) || 0) +
          (Number(latestRecord.additionalAmount) || 0) +
          (Number(latestRecord.previousAmount) || 0);

        return [
          event.eventName,
          formatAmount(event.amountCollected),
          formatAmount(event.amountSpent),
          formatAmount(event.additionalAmount),
          formatAmount(eventAmountLeft)
        ];
      }),
      headStyles: {
        fillColor: [33, 115, 175],
        textColor: [255, 255, 255],
        halign: 'center'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        halign: 'center'
      }
    });

    const additionalDetails = events.flatMap((event) =>
      (event.additionalDetails || []).map((detail) => [
        event.eventName,
        detail.year,
        formatAmount(detail.amount),
        detail.remarks || '-'
      ])
    );

    if (additionalDetails.length > 0) {
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);

      doc.text(
        'Additional Amount Details',
        14,
        doc.lastAutoTable.finalY + 14
      );

      autoTable(doc, {
        startY: doc.lastAutoTable.finalY + 19,
        theme: 'grid',
        head: [[
          'Event',
          'Year',
          'Additional Amount',
          'Remarks'
        ]],
        body: additionalDetails,
        headStyles: {
          fillColor: [33, 115, 175],
          textColor: [255, 255, 255],
          halign: 'center'
        },
        styles: {
          fontSize: 9,
          cellPadding: 3,
          halign: 'center'
        }
      });
    }

    const pageCount = doc.getNumberOfPages();

    for (let page = 1; page <= pageCount; page += 1) {
      doc.setPage(page);

      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);

      doc.text(
        timestamp,
        10,
        pageHeight - 8
      );

      const footerText =
        'Gangavaram App | https://nbkyouth.vercel.app';

      const linkWidth = doc.getTextWidth(footerText);

      doc.textWithLink(
        footerText,
        (pageWidth - linkWidth) / 2,
        pageHeight - 8,
        {
          url: 'https://nbkyouth.vercel.app'
        }
      );

      doc.text(
        `Page ${page} of ${pageCount}`,
        pageWidth - 35,
        pageHeight - 8
      );
    }

    doc.save('Overall Records.pdf');
  };

  return (
    <button
      onClick={handlePrint}
      className="btn-secondary flex items-center"
    >
      <Printer className="mr-1 inline h-4 w-4" />
      Print
    </button>
  );
};

export default OverallEnglishPrint;
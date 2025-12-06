import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';

const FinancialEnglishPrint = ({ records, selectedEvent }) => {

  const handlePrint = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    const title = "Financial Timeline";
    doc.setFontSize(16);
    doc.text(title, 105, 15, { align: "center" });

    if (selectedEvent) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(selectedEvent, 105, 22, { align: "center" });
    }

    const tableHead = [
      ["Year", "Amount Left", "Interest", "Maturity Amount", "FD Start", "FD Maturity", "FD Account", "Remarks"]
    ];

    const tableBody = records.map(rec => [
      rec.year,
      rec.amountLeft,
      rec.maturityAmount - rec.amountLeft,
      rec.maturityAmount,
      rec.fdStartDate ? formatDateTime(rec.fdStartDate).split(",")[0] : '-',
      rec.fdMaturityDate ? formatDateTime(rec.fdMaturityDate).split(",")[0] : '-',
      rec.fdAccount || '-',
      rec.remarks || '-'
    ]);

    autoTable(doc, {
      head: tableHead,
      body: tableBody,
      startY: selectedEvent ? 30 : 25,
      margin: { left: 10, right: 10 },
      styles: { fontSize: 10 }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(80, 80, 80);

      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;

      doc.text(`${timestamp}`, 10, pageHeight - 10);

      const linkText = "NBK Youth App | https://nbkyouth.vercel.app";
      const textWidth = doc.getTextWidth(linkText);
      const centerX = (pageWidth - textWidth) / 2;

      doc.textWithLink(linkText, centerX, pageHeight - 10, {
        url: "https://nbkyouth.vercel.app",
      });

      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
    }

    doc.save(`${selectedEvent || " "} Financial Timeline.pdf`);
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      Print
    </button>
  );
};

export default FinancialEnglishPrint;

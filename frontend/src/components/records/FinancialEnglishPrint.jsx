import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';

const FinancialEnglishPrint = ({ records, selectedEvent }) => {

  const handlePrint = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const timestamp = new Date().toLocaleString();
    let yPos = 20;

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    const title = "Financial Timeline Report";
    const titleWidth = doc.getTextWidth(title);
    doc.text(title, (pageWidth - titleWidth) / 2, yPos);
    yPos += 10;

    if (selectedEvent) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(selectedEvent, pageWidth / 2, yPos, { align: "center" });
      yPos += 10;
    }

    const formatAmount = (amount) =>
      new Intl.NumberFormat("en-IN", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount);

    const printRecord = (rec) => {
      if (yPos > 230) {
        doc.addPage();
        yPos = 20;
      }

      const interest = rec.maturityAmount - rec.amountLeft;
      const interestText = `${interest > 0 ? "+" : ""}${formatAmount(interest)}`;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(String(rec.year), 15, yPos);
      yPos += 4;

      autoTable(doc, {
        startY: yPos,
        theme: "grid",
        margin: { left: 15, right: 15 },
        head: [["Amount Left", "Interest", "Maturity Amount"]],
        body: [
          [
            formatAmount(rec.amountLeft),
            interestText,
            formatAmount(rec.maturityAmount),
          ],
          [
            {
              content: "FD Start",
              styles: { fillColor: [230, 230, 230], fontStyle: "bold" },
            },
            {
              content: "FD Maturity",
              styles: { fillColor: [230, 230, 230], fontStyle: "bold" },
            },
            {
              content: "FD Account",
              styles: { fillColor: [230, 230, 230], fontStyle: "bold" },
            },
          ],
          [
            rec.fdStartDate ? formatDateTime(rec.fdStartDate).split(",")[0] : "-",
            rec.fdMaturityDate
              ? formatDateTime(rec.fdMaturityDate).split(",")[0]
              : "-",
            rec.fdAccount || "-",
          ],
        ],
        headStyles: {
          fillColor: [33, 115, 175],
          textColor: [255, 255, 255],
          fontSize: 10,
          halign: "center",
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
          halign: "center",
        },
      });

      yPos = doc.lastAutoTable.finalY + 6;

      if (rec.remarks && rec.remarks.trim() !== "") {
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

      const footerText = "Gangavaram App | https://nbkyouth.vercel.app";
      const linkWidth = doc.getTextWidth(footerText);

      doc.textWithLink(
        footerText,
        (pageWidth - linkWidth) / 2,
        pageHeight - 8,
        { url: "https://nbkyouth.vercel.app" }
      );

      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 35, pageHeight - 8);
    }

    doc.save(`${selectedEvent || ""} Financial Timeline.pdf`);
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      Print
    </button>
  );
};

export default FinancialEnglishPrint;

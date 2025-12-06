import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { useEventLabel } from '../../context/EventLabelContext';

const ActivitiesEnglishPrint = ({ games }) => {
  const { eventLabel } = useEventLabel();

  const handlePrint = () => {
    const doc = new jsPDF();
    const title = "Activities";
    const timestamp = new Date().toLocaleString();

    doc.setFontSize(16);
    doc.text(title, 105, 15, { align: "center" });

    if (eventLabel) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(eventLabel.label, 105, 22, { align: "center" });
    }

    let startY = eventLabel ? 30 : 25;

    games.forEach((game) => {

      const winnersSorted = game.players
        .filter(player => player.status && player.status.startsWith("winner-"))
        .sort((a, b) => {
          const rankA = parseInt(a.status.split("-")[1]);
          const rankB = parseInt(b.status.split("-")[1]);
          return rankA - rankB;
        });

      if (winnersSorted.length === 0) return;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text(game.name, 14, startY);
      startY += 7;

      const headers = ["S.No", "Winner", "Name"];
      const body = winnersSorted.map((player, index) => [
        index + 1,
        player.status.split("-")[1],
        player.name,
      ]);

      autoTable(doc, {
        head: [headers],
        body: body,
        startY: startY,
        margin: { top: 10 },
        theme: "grid",
        headStyles: { fillColor: [33,115,175], textColor: [255,255,255], fontSize: 10 },
        styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: "center" },
        columnStyles: { 0: { cellWidth: 40 }, 1: { cellWidth: 45 }, 2: { cellWidth: 95 } }
      });

      startY = doc.lastAutoTable.finalY + 10;

if (startY > doc.internal.pageSize.height - 30 && game !== games[games.length - 1]) {
    doc.addPage();
    startY = 20;
}
    });

    // Footer
const pageCount = doc.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  doc.setFontSize(9);
  doc.setTextColor(100);

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

    doc.save("Activities.pdf");
  };

  return (
    <button
      onClick={handlePrint}
      className="btn-primary"
    >
      <Printer className="h-4 w-4 mr-2" />
      Print
    </button>
  );
};

export default ActivitiesEnglishPrint;

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { useEventLabel } from '../../context/EventLabelContext';
import { API_URL } from '../../utils/config';

const StatsPrint = ({ stats }) => {
  const { eventLabel } = useEventLabel();

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const displayAmountWithShortage = (amount) => {
    return amount < 0 ? `${formatAmount(amount)} (Shortage)` : formatAmount(amount);
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    const title = 'NBK Youth Statistics Report';
    const titleWidth = doc.getTextWidth(title);
    const xPos = (doc.internal.pageSize.width - titleWidth) / 2;
    doc.text(title, xPos, yPos);
    yPos += 10;

    if (eventLabel) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(eventLabel.label, 105, yPos, { align: 'center' });
      yPos += 10;
    } else {
      yPos += 5;
    }

    // Budget Stats
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Budget Statistics', 15, yPos);
    yPos += 4;
    const amountLeft = stats.budgetStats.amountLeft.amount;
    const previousYearAmount = stats.budgetStats.previousYearAmount.amount;
    const totalIncludingPrevious = amountLeft + previousYearAmount;
    const budgetHead = ['Category', 'Count', 'Amount'];
    const budgetBody = [
      ['Total Income', `${stats.budgetStats.totalIncome.count} entries`, formatAmount(stats.budgetStats.totalIncome.amount)],
      ['Amount Received', `${stats.budgetStats.amountReceived.count} entries`, formatAmount(stats.budgetStats.amountReceived.amount)],
      ['Amount Pending', `${stats.budgetStats.amountPending.count} entries`, formatAmount(stats.budgetStats.amountPending.amount)],
      ['Total Expenses', `${stats.budgetStats.totalExpenses.count} entries`, formatAmount(stats.budgetStats.totalExpenses.amount)],
      ['Amount Left', '-', displayAmountWithShortage(amountLeft)],
      ['Previous Year Amount', '-', formatAmount(previousYearAmount)],
      ['Amount Left (including previous)', '-', displayAmountWithShortage(totalIncludingPrevious)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [budgetHead],
      body: budgetBody,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' },
      columnStyles: { 0: { cellWidth: 85 }, 1: { cellWidth: 45 }, 2: { cellWidth: 50 } }
    });
    yPos = doc.lastAutoTable.finalY + 16;

    // Payment Mode Stats
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Payment Mode Statistics', 15, yPos);
    yPos += 4;
    const paymentHead = ['Mode', 'Count', 'Amount Received', 'Amount Left'];
    const paymentBody = [
      ['Online', `${stats.budgetStats.online.count} entries`, formatAmount(stats.budgetStats.online.amount), formatAmount(stats.budgetStats.amountLeft.onlineAmount)],
      ['Offline', `${stats.budgetStats.offline.count} entries`, formatAmount(stats.budgetStats.offline.amount), formatAmount(stats.budgetStats.amountLeft.cashAmount)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [paymentHead],
      body: paymentBody,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' }
    });
    yPos = doc.lastAutoTable.finalY + 16;

    // Villagers Stats
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Villagers Statistics', 15, yPos);
    yPos += 4;
    const villagersHead = ['Category', 'Cash', 'Online', 'Web App', 'Total'];
    const villagersBody = [
      ['Paid', formatAmount(stats.villagers.paid.cash), formatAmount(stats.villagers.paid.online), formatAmount(stats.villagers.paid.webApp), formatAmount(stats.villagers.paid.total)],
      ['Pending', formatAmount(stats.villagers.pending.cash), formatAmount(stats.villagers.pending.online), formatAmount(stats.villagers.pending.webApp), formatAmount(stats.villagers.pending.total)],
      ['Total', '-', '-', '-', formatAmount(stats.villagers.total)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [villagersHead],
      body: villagersBody,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' }
    });
    yPos = doc.lastAutoTable.finalY + 16;

    // Youth Stats
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Youth Statistics', 15, yPos);
    yPos += 4;
    const youthHead = ['Category', 'Cash', 'Online', 'Web App', 'Total'];
    const youthBody = [
      ['Paid', formatAmount(stats.youth.paid.cash), formatAmount(stats.youth.paid.online), formatAmount(stats.youth.paid.webApp), formatAmount(stats.youth.paid.total)],
      ['Pending', formatAmount(stats.youth.pending.cash), formatAmount(stats.youth.pending.online), formatAmount(stats.youth.pending.webApp), formatAmount(stats.youth.pending.total)],
      ['Total', '-', '-', '-', formatAmount(stats.youth.total)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [youthHead],
      body: youthBody,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' }
    });
    yPos = doc.lastAutoTable.finalY + 16;

    // Date-wise Statistics
    if (stats.dateWiseStats && stats.dateWiseStats.length > 0) {
      doc.addPage();
      yPos = 20;

      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Date-wise Statistics', 15, yPos);
      yPos += 4;

      const dateWiseHead = ['Date', 'Total Income', 'Amount Received', 'Total Expenses'];
      const dateWiseBody = stats.dateWiseStats.map(dayStat => [
        new Date(dayStat.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'numeric', year: 'numeric' }),
        `${formatAmount(dayStat.totalIncome)} (${dayStat.totalIncomeEntries} entries)`,
        `${formatAmount(dayStat.amountReceived)} (${dayStat.amountReceivedEntries} entries)`,
        `${formatAmount(dayStat.totalExpenses)} (${dayStat.totalExpenseEntries} entries)`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [dateWiseHead],
        body: dateWiseBody,
        theme: 'grid',
        headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255] },
        styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' }
      });
    }

// Footer
const pageCount = doc.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  doc.setFontSize(9);
  doc.setTextColor(100);

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  const leftText = `Generated on: ${timestamp}`;
  const centerText = `NBK Youth App | ${API_URL}`;
  const rightText = `Page ${i} of ${pageCount}`;

  doc.text(leftText, 10, pageHeight - 10);

  const centerX =
    pageWidth / 2 - doc.getTextWidth(centerText) / 2;

  doc.setTextColor(70, 70, 255);
  doc.textWithLink(centerText, centerX, pageHeight - 10, {
    url: API_URL,
  });

  doc.setTextColor(100);
  doc.text(rightText, pageWidth - 30, pageHeight - 10);
}

    doc.save('Statistics_Report.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      Print
    </button>
  );
};

export default StatsPrint;

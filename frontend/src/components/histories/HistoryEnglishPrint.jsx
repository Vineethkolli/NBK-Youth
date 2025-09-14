import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';
import { toast } from 'react-hot-toast';

function EnglishPrint({ selectedHistory, activeTab, data, showBelongsTo }) {
  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const displayAmountWithShortage = (amount) =>
    amount < 0 ? `${formatAmount(amount)} (Shortage)` : formatAmount(amount);

  const handlePrint = () => {
    if (!selectedHistory) {
      toast.error('Please select an event history first');
      return;
    }

    const doc = new jsPDF();
    let yPos = 20;
    const timestamp = new Date().toLocaleString();

    // --- Title ---
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    const title = `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`;
    doc.text(title, 105, yPos, { align: 'center' });
    yPos += 7;

    // --- Snapshot Name (instead of eventLabel) ---
    if (selectedHistory.snapshotName) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(selectedHistory.snapshotName, 105, yPos, { align: 'center' });
      yPos += 10;
    } else {
      yPos += 5;
    }

    // --- Print Sections ---
    if (activeTab === 'stats' && data) {
      printStats(doc, data, yPos);
    } else if (activeTab === 'income' && Array.isArray(data)) {
      printIncome(doc, data, yPos, showBelongsTo);
    } else if (activeTab === 'expense' && Array.isArray(data)) {
      printExpense(doc, data, yPos);
    } else if (activeTab === 'events' && Array.isArray(data)) {
      printEvents(doc, data, yPos);
    }

    // --- Footer: timestamp + page numbers ---
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(`Generated on: ${timestamp}`, 10, doc.internal.pageSize.height - 10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10,
      );
    }

    doc.save(`${selectedHistory.snapshotName}_${activeTab}.pdf`);
  };

  // --- Print Functions ---
  const printStats = (doc, stats, startY) => {
    const budgetStats = stats.budgetStats || {};
    let yPos = startY;

  // --- Budget Stats ---
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Budget Statistics', 15, yPos);
  yPos += 4;

  const amountLeft = budgetStats.amountLeft?.amount || 0;
  const previousYearAmount = budgetStats.previousYearAmount?.amount || 0;
  const totalIncludingPrevious = amountLeft + previousYearAmount;

  const budgetHead = ['Category', 'Count', 'Amount'];
  const budgetBody = [
    ['Total Income', `${budgetStats.totalIncome?.count || 0} entries`, formatAmount(budgetStats.totalIncome?.amount)],
    ['Amount Received', `${budgetStats.amountReceived?.count || 0} entries`, formatAmount(budgetStats.amountReceived?.amount)],
    ['Amount Pending', `${budgetStats.amountPending?.count || 0} entries`, formatAmount(budgetStats.amountPending?.amount)],
    ['Total Expenses', `${budgetStats.totalExpenses?.count || 0} entries`, formatAmount(budgetStats.totalExpenses?.amount)],
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
    styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' }
  });
  yPos = doc.lastAutoTable.finalY + 16;

  // --- Payment Mode Stats ---
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Mode Statistics', 15, yPos);
  yPos += 4;

  const paymentHead = ['Mode', 'Count', 'Amount Received', 'Amount Left'];
  const paymentBody = [
    ['Online', `${budgetStats.online?.count || 0} entries`, formatAmount(budgetStats.online?.amount), formatAmount(budgetStats.amountLeft?.onlineAmount)],
    ['Offline', `${budgetStats.offline?.count || 0} entries`, formatAmount(budgetStats.offline?.amount), formatAmount(budgetStats.amountLeft?.cashAmount)]
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

  // --- Villagers Stats ---
  if (stats.villagers) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Villagers Statistics', 15, yPos);
    yPos += 4;

    const villagersHead = ['Category', 'Cash', 'Online', 'Web App', 'Total'];
    const villagersBody = [
      ['Paid', formatAmount(stats.villagers.paid?.cash), formatAmount(stats.villagers.paid?.online), formatAmount(stats.villagers.paid?.webApp), formatAmount(stats.villagers.paid?.total)],
      ['Pending', formatAmount(stats.villagers.pending?.cash), formatAmount(stats.villagers.pending?.online), formatAmount(stats.villagers.pending?.webApp), formatAmount(stats.villagers.pending?.total)],
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
  }

  // --- Youth Stats ---
  if (stats.youth) {
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Youth Statistics', 15, yPos);
    yPos += 4;

    const youthHead = ['Category', 'Cash', 'Online', 'Web App', 'Total'];
    const youthBody = [
      ['Paid', formatAmount(stats.youth.paid?.cash), formatAmount(stats.youth.paid?.online), formatAmount(stats.youth.paid?.webApp), formatAmount(stats.youth.paid?.total)],
      ['Pending', formatAmount(stats.youth.pending?.cash), formatAmount(stats.youth.pending?.online), formatAmount(stats.youth.pending?.webApp), formatAmount(stats.youth.pending?.total)],
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
  }

  // --- Date-wise Stats ---
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
};


  const printIncome = (doc, incomes, startY, showBelongsTo) => {
    const headers = showBelongsTo
      ? ['S.No', 'Name', 'Amount', 'Belongs To']
      : ['S.No', 'Name', 'Amount'];

    const body = incomes.map((income, index) => {
      const row = [index + 1, income.name || '-', income.amount || 0];
      if (showBelongsTo) row.push(income.belongsTo || '-');
      return row;
    });

    autoTable(doc, {
      startY,
      head: [headers],
      body,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2, rowHeight: 6 },
    });
  };

  const printExpense = (doc, expenses, startY) => {
    const headers = ['S.No', 'Purpose', 'Amount'];
    const body = expenses.map((expense, index) => [
      index + 1,
      expense.purpose || '-',
      expense.amount || 0,
    ]);

    autoTable(doc, {
      startY,
      head: [headers],
      body,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2, rowHeight: 6 },
    });
  };

  const printEvents = (doc, events, startY) => {
    const headers = ['S.No', 'Event Name', 'Date & Time'];
    const body = events.map((event, index) => [
      index + 1,
      event.name || '-',
      event.dateTime ? formatDateTime(event.dateTime) : '-',
    ]);

    autoTable(doc, {
      startY,
      head: [headers],
      body,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7 },
    });
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-2" />
      Print
    </button>
  );
}

export default EnglishPrint;

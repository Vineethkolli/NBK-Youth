import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';

function HistoryPrint({ selectedHistory, activeTab, data, searchQuery, filters }) {
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const displayAmountWithShortage = (amount) => {
    return amount < 0 ? `${formatAmount(amount)} (Shortage)` : formatAmount(amount);
  };

  const handlePrint = () => {
    if (!selectedHistory) {
      toast.error('Please select an event history first');
      return;
    }

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    const title = `${selectedHistory.eventName} ${selectedHistory.year} - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`;
    const titleWidth = doc.getTextWidth(title);
    const xPos = (doc.internal.pageSize.width - titleWidth) / 2;
    doc.text(title, xPos, yPos);
    yPos += 15;

    if (activeTab === 'stats' && data) {
      printStats(doc, data, yPos);
    } else if (activeTab === 'income' && Array.isArray(data)) {
      printIncome(doc, data, yPos);
    } else if (activeTab === 'expense' && Array.isArray(data)) {
      printExpense(doc, data, yPos);
    } else if (activeTab === 'events' && Array.isArray(data)) {
      printEvents(doc, data, yPos);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    doc.save(`${selectedHistory.eventName}_${selectedHistory.year}_${activeTab}.pdf`);
  };

  const printStats = (doc, stats, startY) => {
    const budgetStats = stats.budgetStats || {};
    
    doc.setFontSize(14);
    doc.text('Budget Statistics', 15, startY);
    
    const budgetHead = ['Category', 'Count', 'Amount'];
    const budgetBody = [
      ['Total Income', `${budgetStats.totalIncome?.count || 0} entries`, formatAmount(budgetStats.totalIncome?.amount)],
      ['Amount Received', `${budgetStats.amountReceived?.count || 0} entries`, formatAmount(budgetStats.amountReceived?.amount)],
      ['Amount Pending', `${budgetStats.amountPending?.count || 0} entries`, formatAmount(budgetStats.amountPending?.amount)],
      ['Total Expenses', `${budgetStats.totalExpenses?.count || 0} entries`, formatAmount(budgetStats.totalExpenses?.amount)],
      ['Previous Year Amount', '-', formatAmount(budgetStats.previousYearAmount?.amount)],
      ['Amount Left', '-', displayAmountWithShortage(budgetStats.amountLeft?.amount)]
    ];

    autoTable(doc, {
      startY: startY + 4,
      head: [budgetHead],
      body: budgetBody,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' }
    });
  };

  const printIncome = (doc, incomes, startY) => {
    doc.setFontSize(14);
    doc.text('Income Records', 15, startY);
    
    const headers = ['S.No', 'Income ID', 'Name', 'Amount', 'Status', 'Payment Mode', 'Belongs To', 'Entry Date'];
    const body = incomes.map((income, index) => [
      index + 1,
      income.incomeId || '-',
      income.name || '-',
      income.amount || 0,
      income.status || '-',
      income.paymentMode || '-',
      income.belongsTo || '-',
      income.createdAt ? formatDateTime(income.createdAt) : '-'
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2, rowHeight: 6 }
    });
  };

  const printExpense = (doc, expenses, startY) => {
    doc.setFontSize(14);
    doc.text('Expense Records', 15, startY);
    
    const headers = ['S.No', 'Expense ID', 'Purpose', 'Amount', 'Payment Mode', 'Spender', 'Entry Date'];
    const body = expenses.map((expense, index) => [
      index + 1,
      expense.expenseId || '-',
      expense.purpose || '-',
      expense.amount || 0,
      expense.paymentMode || '-',
      expense.name || '-',
      expense.createdAt ? formatDateTime(expense.createdAt) : '-'
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2, rowHeight: 6 }
    });
  };

  const printEvents = (doc, events, startY) => {
    doc.setFontSize(14);
    doc.text('Events Timeline', 15, startY);
    
    const headers = ['S.No', 'Event Name', 'Date & Time'];
    const body = events.map((event, index) => [
      index + 1,
      event.name || '-',
      event.dateTime ? formatDateTime(event.dateTime) : '-'
    ]);

    autoTable(doc, {
      startY: startY + 4,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7 }
    });
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-2" />
      Print
    </button>
  );
}

export default HistoryPrint;
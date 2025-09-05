import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';
import { toast } from 'react-hot-toast';

function HistoryPrint({ selectedHistory, activeTab, data, searchQuery, filters, showBelongsTo }) {
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
    const title = `${selectedHistory.snapshotName} - ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Report`;
    const titleWidth = doc.getTextWidth(title);
    const xPos = (doc.internal.pageSize.width - titleWidth) / 2;
    doc.text(title, xPos, yPos);
    yPos += 15;

    if (activeTab === 'stats' && data) {
      printStats(doc, data, yPos, selectedHistory.snapshotName);
    } else if (activeTab === 'income' && Array.isArray(data)) {
      printIncome(doc, data, yPos, selectedHistory.snapshotName, showBelongsTo);
    } else if (activeTab === 'expense' && Array.isArray(data)) {
      printExpense(doc, data, yPos, selectedHistory.snapshotName);
    } else if (activeTab === 'events' && Array.isArray(data)) {
      printEvents(doc, data, yPos, selectedHistory.snapshotName);
    }

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
    }

    doc.save(`${selectedHistory.snapshotName}_${activeTab}.pdf`);
  };

  const printStats = (doc, stats, startY) => {
    const budgetStats = stats.budgetStats || {};
    
    
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
      startY: startY,
      head: [budgetHead],
      body: budgetBody,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 10 },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' }
    });
  };

  const printIncome = (doc, incomes, startY, showBelongsTo) => {
    
    const headers = showBelongsTo 
      ? ['S.No', 'Name', 'Amount', 'Belongs To']
      : ['S.No', 'Name', 'Amount'];
      
    const body = incomes.map((income, index) => {
      const row = [
        index + 1,
        income.name || '-',
        income.amount || 0
      ];
      
      if (showBelongsTo) {
        row.push(income.belongsTo || '-');
      }
      
      return row;
    });

    autoTable(doc, {
      startY: startY,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2, rowHeight: 6 }
    });
  };

  const printExpense = (doc, expenses, startY) => {
    
    const headers = ['S.No', 'Purpose', 'Amount'];
    const body = expenses.map((expense, index) => [
      index + 1,
      expense.purpose || '-',
      expense.amount || 0
    ]);

    autoTable(doc, {
      startY: startY,
      head: [headers],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 9 },
      styles: { fontSize: 9, cellPadding: 2, rowHeight: 6 }
    });
  };

  const printEvents = (doc, events, startY) => {
    
    const headers = ['S.No', 'Event Name', 'Date & Time'];
    const body = events.map((event, index) => [
      index + 1,
      event.name || '-',
      event.dateTime ? formatDateTime(event.dateTime) : '-'
    ]);

    autoTable(doc, {
      startY: startY,
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
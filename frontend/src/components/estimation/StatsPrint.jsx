import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { useEventLabel } from '../../context/EventLabelContext';

const StatsPrint = ({ stats, budgetStats }) => {
  const { eventLabel } = useEventLabel();

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Calculate comparisons for the new sections
    const currentIncome = budgetStats?.totalIncome?.amount || 0;
    const currentExpense = budgetStats?.totalExpenses?.amount || 0;
    const currentAmountLeft = budgetStats?.amountLeft?.amount || 0;
    
    const estimatedIncome = stats.totalEstimatedIncome || 0;
    const estimatedExpense = stats.totalEstimatedExpense || 0;
    const estimatedAmountLeft = estimatedIncome - estimatedExpense;

    const incomeExpenseBalance = currentIncome - estimatedExpense;
    const incomeComparison = currentIncome - estimatedIncome;
    const expenseComparison = currentExpense - estimatedExpense;
    const amountLeftComparison = currentAmountLeft - estimatedAmountLeft;

    // Common table options for autoTable
    const commonTableOptions = {
      theme: 'grid',
      headStyles: { 
        fillColor: [33, 115, 175], 
        textColor: [255, 255, 255],
        fontSize: 10 
      },
      styles: { 
        fontSize: 10,
        cellPadding: 2,
        rowHeight: 7,
        halign: 'center'
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 40 },
        2: { cellWidth: 70 }
      }
    };

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    const title = 'Estimation Statistics Report';
    const titleWidth = doc.getTextWidth(title);
    const xPos = (doc.internal.pageSize.width - titleWidth) / 2;
    doc.text(title, xPos, yPos);

    yPos += 10;

    if (eventLabel) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(eventLabel.label, 105, yPos, { align: 'center' });
      yPos += 15;
    } else {
      yPos += 10;
    }

    // Comparison Analysis
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Comparison Analysis', 15, yPos);
    yPos += 4;

    const comparisonData = [
      ['Comparison Type', 'Current', 'Estimated', 'Difference'],
      ['Current Income vs Estimated Expense', formatAmount(currentIncome), formatAmount(estimatedExpense), formatAmount(incomeExpenseBalance)],
      ['Income Comparison', formatAmount(currentIncome), formatAmount(estimatedIncome), formatAmount(incomeComparison)],
      ['Expense Comparison', formatAmount(currentExpense), formatAmount(estimatedExpense), formatAmount(expenseComparison)],
      ['Amount Left Comparison', formatAmount(currentAmountLeft), formatAmount(estimatedAmountLeft), formatAmount(amountLeftComparison)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [comparisonData[0]],
      body: comparisonData.slice(1),
      ...commonTableOptions,
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 35 },
        2: { cellWidth: 35 },
        3: { cellWidth: 40 }
      }
    });

    yPos = doc.lastAutoTable.finalY + 20;

    // Estimation Overview
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Estimation Overview', 15, yPos);
    yPos += 4;

    const estimationData = [
      ['Category', 'Entries', 'Amount'],
      ['Estimated Income', `${stats.incomeCount || 0} `, formatAmount(stats.totalEstimatedIncome)],
      [
        'Youth Income',
        `${stats.youthCount || 0} `,
        formatAmount((stats.youthPaid || 0) + (stats.youthNotPaid || 0))
      ],
      [
        'Villagers Income',
        `${stats.villagersCount || 0} `,
        formatAmount((stats.villagersPaid || 0) + (stats.villagersNotPaid || 0))
      ],
      ['Estimated Expense', `${stats.expenseCount || 0} `, formatAmount(stats.totalEstimatedExpense)],
      ['Amount Left', '-', stats.balance < 0 ? `${formatAmount(stats.balance)} (Shortage)` : formatAmount(stats.balance)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [estimationData[0]],
      body: estimationData.slice(1),
      ...commonTableOptions,
      didParseCell: function(data) {
        if (data.section === 'body' && data.row.index === 4 && data.column.index === 2) {
          data.cell.text = []; 
        }
      },
      didDrawCell: function(data) {
        if (data.section === 'body' && data.row.index === 4 && data.column.index === 2) {
          const cellCenterX = data.cell.x + data.cell.width / 2;
          const cellCenterY = data.cell.y + data.cell.height / 2 + 2;
          if (stats.balance < 0) {
            doc.setTextColor(255, 0, 0); 
          } else if (stats.balance > 0) {
            doc.setTextColor(0, 128, 0); 
          } else {
            doc.setTextColor(0, 0, 0);  
          }
          doc.text(stats.balance < 0 ? `${formatAmount(stats.balance)} (Shortage)` : formatAmount(stats.balance), cellCenterX, cellCenterY, { align: 'center' });
          doc.setTextColor(0, 0, 0);
        }
      }
    });

    yPos = doc.lastAutoTable.finalY + 20;

    // Youth Payment Statistics
    doc.setFontSize(14);
    doc.text('Youth Payment Stats', 15, yPos);
    yPos += 4;

    const youthPaymentData = [
      ['Status', 'Entries', 'Amount'],
      ['Paid', `${stats.youthPaidCount || '-'}`, formatAmount(stats.youthPaid || 0)],
      ['Not Paid', `${stats.youthNotPaidCount || '-'}`, formatAmount(stats.youthNotPaid || 0)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [youthPaymentData[0]],
      body: youthPaymentData.slice(1),
      ...commonTableOptions
    });

    yPos = doc.lastAutoTable.finalY + 20;

    // Villagers Payment Statistics
    doc.setFontSize(14);
    doc.text('Villagers Payment Stats', 15, yPos);
    yPos += 4;

    const villagersPaymentData = [
      ['Status', 'Entries', 'Amount'],
      ['Paid', `${stats.villagersPaidCount || '-'}`, formatAmount(stats.villagersPaid || 0)],
      ['Not Paid', `${stats.villagersNotPaidCount || '-'}`, formatAmount(stats.villagersNotPaid || 0)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [villagersPaymentData[0]],
      body: villagersPaymentData.slice(1),
      ...commonTableOptions
    });

    yPos = doc.lastAutoTable.finalY + 20;

    // Overall Payment Status
    doc.setFontSize(14);
    doc.text('Overall Payment Stats', 15, yPos);
    yPos += 4;

    const overallPaymentData = [
      ['Status', 'Entries', 'Amount'],
      ['Paid', `${stats.overallPaidCount || '-'}`, formatAmount(stats.totalEstimatedPaidIncome || 0)],
      ['Not Paid', `${stats.overallNotPaidCount || '-'}`, formatAmount(stats.totalEstimatedNotPaidIncome || 0)]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [overallPaymentData[0]],
      body: overallPaymentData.slice(1),
      ...commonTableOptions
    });

    // Footer
    const timestamp = new Date().toLocaleString();
    const pageCount = doc.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  doc.setFontSize(9);
  
      doc.setTextColor(100, 100, 100);

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
    doc.save('Estimation_Statistics_Report.pdf');
  };
  
  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      <span>Print</span>
    </button>
  );
};

export default StatsPrint;

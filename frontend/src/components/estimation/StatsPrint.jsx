import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Printer } from 'lucide-react';

const StatsPrint = ({ stats }) => {
  // Format numbers as per Indian numbering
  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Display negative amounts with shortage text
  const displayAmountWithShortage = (amount) => {
    return amount < 0 ? `${formatAmount(amount)} (Shortage)` : formatAmount(amount);
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    let yPos = 20;

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
    const title = 'Estimation Stats';
    const titleWidth = doc.getTextWidth(title);
    const xPos = (doc.internal.pageSize.width - titleWidth) / 2;
    doc.text(title, xPos, yPos);

    yPos += 20;

    // Estimation Overview
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Overview', 15, yPos);
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
      ['Amount Left', '-', displayAmountWithShortage(stats.balance)]
    ];

    doc.autoTable({
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
          doc.text(displayAmountWithShortage(stats.balance), cellCenterX, cellCenterY, { align: 'center' });
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

    doc.autoTable({
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

    doc.autoTable({
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

    doc.autoTable({
      startY: yPos,
      head: [overallPaymentData[0]],
      body: overallPaymentData.slice(1),
      ...commonTableOptions
    });

    // Footer: Add page numbers and timestamp on the bottom of each page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, doc.internal.pageSize.height - 10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 20,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
    }

    doc.save('Estimation_Stats.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary ">
      <Printer className="h-4 w-4 mr-2 inline" />
      <span>Print</span>
    </button>
  );
};

export default StatsPrint;

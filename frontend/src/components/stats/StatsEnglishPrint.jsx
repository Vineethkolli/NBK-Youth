import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';

const StatsPrint = ({ stats }) => {
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
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    const title = 'NBK Youth Statistics Report';
    const titleWidth = doc.getTextWidth(title);
    const xPos = (doc.internal.pageSize.width - titleWidth) / 2;
    doc.text(title, xPos, yPos);
    yPos += 15;

    // Budget Stats
    doc.setFontSize(14);
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
      columnStyles: { 0: { cellWidth: 60 }, 1: { cellWidth: 40 }, 2: { cellWidth: 60 } }
    });
    yPos = doc.lastAutoTable.finalY + 12;

    // Payment Mode Stats
    doc.setFontSize(14);
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
    yPos = doc.lastAutoTable.finalY + 12;

    // User Stats
    doc.setFontSize(14);
    doc.text('User Statistics', 15, yPos);
    yPos += 4;
    const userHead = ['Category', 'Count'];
    const userBody = [
      ['Total Users', stats.userStats.totalUsers],
      ['APP Payments', stats.userStats.successfulPayments]
    ];

    autoTable(doc, {
      startY: yPos,
      head: [userHead],
      body: userBody,
      theme: 'grid',
      headStyles: { fillColor: [33, 115, 175], textColor: [255, 255, 255] },
      styles: { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' }
    });
    yPos = doc.lastAutoTable.finalY + 12;

    // Villagers Stats
    doc.setFontSize(14);
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
    yPos = doc.lastAutoTable.finalY + 12;

    // Youth Stats
    doc.setFontSize(14);
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

    // Footer: timestamp + page numbers
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 20, doc.internal.pageSize.height - 10, { align: 'right' });
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

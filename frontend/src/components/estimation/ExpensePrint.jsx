import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { useEventLabel } from '../../context/EventLabelContext';

const ExpensePrint = ({ expenses, visibleColumns }) => {
  const { eventLabel } = useEventLabel();

  const generatePDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    const pageWidth = doc.internal.pageSize.getWidth();

    // Title
    doc.setFontSize(16);
    doc.text('Estimated Expense', pageWidth / 2, 15, { align: 'center' });

    // Event Label (optional)
    if (eventLabel) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(eventLabel.label, pageWidth / 2, 22, { align: 'center' });
    }

    // Table Columns
    const tableColumns = [];
    if (visibleColumns.sno) tableColumns.push('S.No');
    if (visibleColumns.registerId) tableColumns.push('Register ID');
    if (visibleColumns.purpose) tableColumns.push('Purpose');
    if (visibleColumns.previousAmount) tableColumns.push('Previous Amount');
    if (visibleColumns.presentAmount) tableColumns.push('Present Amount');
    if (visibleColumns.others) tableColumns.push('Others');

    // Table Rows
    const tableRows = expenses.map((expense, index) => {
      const row = [];
      if (visibleColumns.sno) row.push(index + 1);
      if (visibleColumns.registerId) row.push(expense.registerId);
      if (visibleColumns.purpose) row.push(expense.purpose);
      if (visibleColumns.previousAmount) row.push(expense.previousAmount);
      if (visibleColumns.presentAmount) row.push(expense.presentAmount);
      if (visibleColumns.others) row.push(expense.others);
      return row;
    });

    // Table
    autoTable(doc, {
      startY: eventLabel ? 30 : 25,
      head: [tableColumns],
      body: tableRows,
      margin: { top: 10 },
    });

    // Add footer with timestamp and page numbers on every page
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);

      doc.text(
        `Generated on: ${timestamp}`,
        10,
        doc.internal.pageSize.height - 10
      );

      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 30,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save('Estimated_Expense.pdf');
  };

  return (
    <button onClick={generatePDF} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      Print
    </button>
  );
};

export default ExpensePrint;

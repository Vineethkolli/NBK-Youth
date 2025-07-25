import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Printer } from 'lucide-react';

const ExpensePrint = ({ expenses, visibleColumns }) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text("Estimated Expense", pageWidth / 2, 22, { align: 'center' });

    // Prepare table columns based on the visibleColumns settings
    const tableColumns = [];
    if (visibleColumns.sno) tableColumns.push("S.No");
    if (visibleColumns.purpose) tableColumns.push("Purpose");
    if (visibleColumns.previousAmount) tableColumns.push("Previous Amount");
    if (visibleColumns.presentAmount) tableColumns.push("Present Amount");
    if (visibleColumns.others) tableColumns.push("Others");

    // Prepare table rows dynamically from expenses
    const tableRows = expenses.map((expense, index) => {
      const row = [];
      if (visibleColumns.sno) row.push(index + 1);
      if (visibleColumns.purpose) row.push(expense.purpose);
      if (visibleColumns.previousAmount) row.push(expense.previousAmount);
      if (visibleColumns.presentAmount) row.push(expense.presentAmount);
      if (visibleColumns.others) row.push(expense.others);
      return row;
    });

    // PDF table with autoTable, adding a footer with timestamp and page number
    doc.autoTable({
      startY: 30,
      head: [tableColumns],
      body: tableRows,
      margin: { top: 10 },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        // Footer: timestamp on the left
        doc.text(
          `Generated on: ${timestamp}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
        // Footer: page number on the right
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - data.settings.margin.right - 30,
          doc.internal.pageSize.height - 10
        );
      },
    });

    // Save the generated PDF
    doc.save('Estimated_Expense.pdf');
  };

  return (
    <button onClick={generatePDF} className="btn-secondary">
      <Printer className="h-4 w-4 mr-2 inline" />
      Print
    </button>
  );
};

export default ExpensePrint;

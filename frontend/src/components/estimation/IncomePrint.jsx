import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';

const IncomePrint = ({ incomes, visibleColumns, incomeFilters }) => {
  const generatePDF = () => {
    // Clone incomes to avoid mutating the original array
    let sortedIncomes = [...incomes];
    
    // Apply sorting if incomeFilters.sortOrder is provided
    if (incomeFilters && incomeFilters.sortOrder) {
      const { sortField, sortOrder } = incomeFilters;
      sortedIncomes.sort((a, b) => {
        const aValue = Number(a[sortField]) || 0;
        const bValue = Number(b[sortField]) || 0;
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }
    
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();
    
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFontSize(16);
    doc.text("Estimated Income", pageWidth / 2, 22, { align: 'center' });
    
    // Prepare table header based on visible columns
    const tableColumns = [];
    if (visibleColumns.sno) tableColumns.push("S.No");
    if (visibleColumns.name) tableColumns.push("Name");
    if (visibleColumns.previousAmount) tableColumns.push("Previous Amount");
    if (visibleColumns.presentAmount) tableColumns.push("Present Amount");
    if (visibleColumns.belongsTo) tableColumns.push("Belongs To");
    if (visibleColumns.status) tableColumns.push("Status");
    if (visibleColumns.others) tableColumns.push("Others");
    
    // Prepare table rows dynamically from sorted incomes
    const tableRows = sortedIncomes.map((income, index) => {
      const row = [];
      if (visibleColumns.sno) row.push(index + 1);
      if (visibleColumns.name) row.push(income.name);
      if (visibleColumns.previousAmount) row.push(income.previousAmount);
      if (visibleColumns.presentAmount) row.push(income.presentAmount);
      if (visibleColumns.belongsTo) row.push(income.belongsTo);
      if (visibleColumns.status) row.push(income.status);
      if (visibleColumns.others) row.push(income.others);
      return row;
    });
    
    // Generate table using autoTable plugin with a footer
    autoTable(doc, {
      startY: 30,
      head: [tableColumns],
      body: tableRows,
      margin: { top: 10 },
      didDrawPage: (data) => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        // Footer with timestamp on the left
        doc.text(
          `Generated on: ${timestamp}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
        // Footer with page number on the right
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          doc.internal.pageSize.getWidth() - data.settings.margin.right - 30,
          doc.internal.pageSize.height - 10
        );
      },
    });
    
    // Save the generated PDF
    doc.save('Estimated_Income.pdf');
  };

  return (
    <button onClick={generatePDF} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      <span>Print</span>
    </button>
  );
};

export default IncomePrint;

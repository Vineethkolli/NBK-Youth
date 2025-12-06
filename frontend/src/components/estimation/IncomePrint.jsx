import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { useEventLabel } from '../../context/EventLabelContext';

const IncomePrint = ({ incomes, visibleColumns, incomeFilters }) => {
  const { eventLabel } = useEventLabel();

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

    // Title
    doc.setFontSize(16);
    doc.text('Estimated Income Report', pageWidth / 2, 15, { align: 'center' });

    if (eventLabel) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(eventLabel.label, pageWidth / 2, 22, { align: 'center' });
    }

    // Prepare table header based on visible columns
    const tableColumns = [];
    if (visibleColumns.sno) tableColumns.push("S.No");
    if (visibleColumns.registerId) tableColumns.push("Register ID");
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
      if (visibleColumns.registerId) row.push(income.registerId);
      if (visibleColumns.name) row.push(income.name);
      if (visibleColumns.previousAmount) row.push(income.previousAmount);
      if (visibleColumns.presentAmount) row.push(income.presentAmount);
      if (visibleColumns.belongsTo) row.push(income.belongsTo);
      if (visibleColumns.status) row.push(income.status);
      if (visibleColumns.others) row.push(income.others);
      return row;
    });

    // Table
    autoTable(doc, {
      startY: eventLabel ? 30 : 25,
      head: [tableColumns],
      body: tableRows,
      margin: { top: 10 },
    });

    // Footer
    const pageCount = doc.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  doc.setFontSize(9);

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

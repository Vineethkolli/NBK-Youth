import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { useEventLabel } from '../../context/EventLabelContext';

const IncomeTeluguPrint = ({ incomes, visibleColumns, incomeFilters }) => {
  const printRef = useRef();
  const { eventLabel } = useEventLabel();

  const handlePrint = () => {
    const renderedLabel = document.getElementById('event-label-display')?.innerText?.trim();
    const content = printRef.current.innerHTML;
    const printWindow = window.open('height=700,width=1000');
    printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; } th { background: #f4f4f4; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="text-align: center;"><h2><span translate="no">అంచనా ఆదాయం</span></h2></div>');
    if (renderedLabel) {
      printWindow.document.write(`<div class="event-label" style="text-align: center; margin-bottom: 10px; color: #666;">${renderedLabel}</div>`);
    } else if (eventLabel?.label) {
      printWindow.document.write(`<div class="event-label" style="text-align: center; margin-bottom: 10px; color: #666;">${eventLabel.label}</div>`);
    }
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

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

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="h-4 w-4 mr-1 inline" />
        <span>Print</span>
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              {visibleColumns.registerId && <th>Register ID</th>}
              {visibleColumns.name && <th>Name</th>}
              {visibleColumns.previousAmount && <th>Previous Amount</th>}
              {visibleColumns.presentAmount && <th>Present Amount</th>}
              {visibleColumns.belongsTo && <th>Belongs To</th>}
              {visibleColumns.status && <th>Status</th>}
              {visibleColumns.others && <th>Others</th>}
            </tr>
          </thead>
          <tbody>
            {sortedIncomes.map((income, index) => (
              <tr key={income._id}>
                <td><span translate="no">{index + 1}</span></td>
                {visibleColumns.registerId && <td><span translate="no">{income.registerId}</span></td>}
                {visibleColumns.name && <td>{income.name}</td>}
                {visibleColumns.previousAmount && <td><span translate="no">{income.previousAmount}</span></td>}
                {visibleColumns.presentAmount && <td><span translate="no">{income.presentAmount}</span></td>}
                {visibleColumns.belongsTo && <td>{income.belongsTo}</td>}
                {visibleColumns.status && <td>{income.status}</td>}
                {visibleColumns.others && <td>{income.others}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default IncomeTeluguPrint;
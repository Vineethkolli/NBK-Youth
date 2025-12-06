import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';
import { useEventLabel } from '../../context/EventLabelContext';

function IncomePrint({ incomes, visibleColumns }) {
  const printRef = useRef();
  const { eventLabel } = useEventLabel();

  const handlePrint = () => {
    const renderedLabel = document.getElementById('event-label-display')?.innerText?.trim();
    const content = printRef.current.innerHTML;
    const printWindow = window.open('height=700,width=1000');
    printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; } th { background: #f4f4f4; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="text-align: center;"><h2><span translate="no">ఆదాయ నివేదిక</span></h2></div>');
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

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="h-4 w-4 mr-1 inline" />
        Print
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              { visibleColumns.registerId && <th>Register ID</th>}
              {visibleColumns.incomeId && <th>Income ID</th>}
              {visibleColumns.entryDate && <th>Entry Date</th>}
              {visibleColumns.paidDate && <th>Paid Date</th>}
              {visibleColumns.name && <th>Name</th>}
              { visibleColumns.email && <th>Email</th>}
              {visibleColumns.phoneNumber && <th>Phone Number</th>}
              {visibleColumns.amount && <th>Amount</th>}
              {visibleColumns.status && <th>Status</th>}
              {visibleColumns.paymentMode && <th>Payment Mode</th>}
              {visibleColumns.belongsTo && <th>Belongs To</th>}
              {visibleColumns.verifyLog && <th>Verify Log</th>}
            </tr>
          </thead>
          <tbody>
            {incomes.map((income, index) => (
              <tr key={income._id}>
                <td><span translate="no">{index + 1}</span></td>
                {visibleColumns.registerId && <td><span translate="no">{income.registerId}</span></td>}
                {visibleColumns.incomeId && <td><span translate="no">{income.incomeId}</span></td>}
                {visibleColumns.entryDate && <td><span translate="no">{formatDateTime(income.createdAt)}</span></td>}
                {visibleColumns.paidDate && <td><span translate="no">{income.paidDate ? formatDateTime(income.paidDate) : '-'}</span></td>}
                {visibleColumns.name && <td>{income.name}</td>}
                {visibleColumns.email && <td><span translate="no">{income.email}</span></td>}
                {visibleColumns.phoneNumber && <td><span translate="no">{income.phoneNumber}</span></td>}
                {visibleColumns.amount && <td><span translate="no">{income.amount}</span></td>}
                {visibleColumns.status && <td>{income.status}</td>}
                {visibleColumns.paymentMode && <td>{income.paymentMode}</td>}
                {visibleColumns.belongsTo && <td>{income.belongsTo}</td>}
                {visibleColumns.verifyLog && <td>{income.verifyLog}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default IncomePrint;

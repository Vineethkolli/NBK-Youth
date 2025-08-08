import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';
import { useEventLabel } from '../../context/EventLabelContext';

function ExpensePrint({ expenses, visibleColumns }) {
  const printRef = useRef();
  const { eventLabel } = useEventLabel();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const printWindow = window.open('height=700,width=1000');
    printWindow.document.write(
      '<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; vertical-align: top; } th { background: #f4f4f4; }</style>'
    );
    printWindow.document.write('</head><body>');
    printWindow.document.write('<div style="text-align: center;"><h2><span translate="no">ఖర్చు నిర్వహణ</span></h2></div>');
    if (eventLabel) {
      printWindow.document.write(`<div style="text-align: center; margin-bottom: 10px; color: #666;"><span translate="no">${eventLabel.label}</span></div>`);
    }
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const columns = Object.keys(visibleColumns).filter((col) => visibleColumns[col]);

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
              {columns.includes('expenseId') && <th>Expense ID</th>}
              {columns.includes('registerId') && <th>Register ID</th>}
              {columns.includes('dateTime') && <th>Date & Time</th>}
              {columns.includes('purpose') && <th>Purpose</th>}
              {columns.includes('amount') && <th>Amount</th>}
              {columns.includes('paymentMode') && <th>Payment Mode</th>}
              {columns.includes('bill') && <th>Bill</th>}
              {columns.includes('name') && <th>Spender Name</th>}
              {columns.includes('phoneNumber') && <th>Phone Number</th>}
              {columns.includes('verifyLog') && <th>Verify Log</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, idx) => (
              <tr key={expense._id}>
                <td><span translate="no">{idx + 1}</span></td>
                {columns.includes('expenseId') && (
                  <td><span translate="no">{expense.expenseId}</span></td>
                )}
                {columns.includes('registerId') && (
                  <td><span translate="no">{expense.registerId}</span></td>
                )}
                {columns.includes('dateTime') && <td>{formatDateTime(expense.createdAt)}</td>}
                {columns.includes('purpose') && <td>{expense.purpose}</td>}
                {columns.includes('amount') && (
                  <td><span translate="no">{expense.amount}</span></td>
                )}
                {columns.includes('paymentMode') && <td>{expense.paymentMode}</td>}
                {columns.includes('bill') && (
                  <td>{expense.billImage ? 'Available' : 'No Bill'}</td>
                )}
                {columns.includes('name') && <td>{expense.name}</td>}
                {columns.includes('phoneNumber') && (
                  <td>
                    <span translate="no">
                      {expense.phoneNumber}
                    </span>
                  </td>
                )}
                {columns.includes('verifyLog') && <td>{expense.verifyLog}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ExpensePrint;
import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { useHiddenProfiles } from '../../context/HiddenProfileContext';

function ExpensePrint({ expenses, visibleColumns, userRole }) {
  const printRef = useRef();
  const { hiddenProfiles } = useHiddenProfiles();

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=700,width=1000');
    printWindow.document.write('<html><head>');
    printWindow.document.write(
      '<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; } th { background: #f4f4f4; }</style>'
    );
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2><span translate="no">వ్యయ నిర్వహణ</span></h2>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const columns = Object.keys(visibleColumns).filter(col => visibleColumns[col]);


  return (
    <>
      <button onClick={handlePrint} className="btn-secondary">
        <Printer className="h-4 w-4 mr-2" />
        Print
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              {columns.includes('registerId') && <th>Register ID</th>}
              {columns.includes('expenseId') && <th>Expense ID</th>}
              {columns.includes('dateTime') && <th>Date & Time</th>}
              {columns.includes('purpose') && <th>Purpose</th>}
              {columns.includes('spenderName') && <th>Spender Name</th>}
              {columns.includes('phoneNumber') && <th>Phone Number</th>}
              {columns.includes('amountTaken') && (<th>Amount Taken</th>)}
              {columns.includes('totalSpent') && (<th>Total Amount Spent</th>)}
              {columns.includes('subPurpose') && <th>Sub Purpose</th>}
              {columns.includes('subAmount') && (<th>Sub Amount</th>)}
              {columns.includes('amountReturned') && (<th>Amount Returned</th>)}
              {columns.includes('bill') && <th>Bill</th>}
              {columns.includes('paymentMode') && <th>Payment Mode</th>}
              {columns.includes('verifyLog') && <th>Verify Log</th>}
            </tr>
          </thead>
          <tbody>
            {expenses.map((expense, idx) => {
              const isHidden = hiddenProfiles.has(expense._id);
              const totalSpent = expense.subExpenses.reduce((sum, sub) => sum + Number(sub.subAmount), 0);
              return (
                <tr key={expense._id}>
                  <td><span translate="no">{idx + 1}</span></td>
                  {columns.includes('registerId') &&  (
                    <td><span translate="no">{expense.registerId}</span></td> )}
                  {columns.includes('expenseId') && (
                    <td><span translate="no">{expense.expenseId}</span></td> )}
                  {columns.includes('dateTime') && <td>{formatDate(expense.createdAt)}</td>}
                  {columns.includes('purpose') && <td>{expense.purpose}</td>}
                  {columns.includes('spenderName') && (
                    <td>{isHidden ? 'Spender' : expense.name}</td> )}
                  {columns.includes('phoneNumber') && (
                    <td><span translate="no">{isHidden ? 'Spender' : expense.phoneNumber || 'N/A'}</span></td> )}
                  {columns.includes('amountTaken') && (
                    <td><span translate="no">{expense.amount}</span></td>
                  )}
                  {columns.includes('totalSpent') && (
                    <td><span translate="no">{totalSpent}</span></td>
                  )}
                  {columns.includes('subPurpose') && (
                    <td>{expense.subExpenses.map(sub => sub.subPurpose).join(', ')}</td>
                  )}
                  {columns.includes('subAmount') && (
                    <td><span translate="no">{expense.subExpenses.map(sub => sub.subAmount).join(', ')}</span></td>
                  )}
                  {columns.includes('amountReturned') && (
                    <td><span translate="no">{expense.amountReturned || 0}</span></td>
                  )}
                  {columns.includes('bill') && (
                    <td>{expense.subExpenses.map(sub => sub.billImage ? 'Available' : 'No Bill').join(', ')}</td>
                  )}
                  {columns.includes('paymentMode') && <td>{expense.paymentMode}</td>}
                  {columns.includes('verifyLog') && <td>{expense.verifyLog}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default ExpensePrint;

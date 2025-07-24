import React, { useRef } from 'react';
import { Printer } from 'lucide-react';

function IncomePrint({ incomes, visibleColumns, userRole }) {
  const printRef = useRef();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=700,width=1000');
    printWindow.document.write('<html><head><title>Income Report</title>');
    printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; } th { background: #f4f4f4; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2>Income Report</h2>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

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
              {(userRole === 'developer' || userRole === 'financier'|| userRole === 'admin') && visibleColumns.registerId && <th>Register ID</th>}
              {visibleColumns.incomeId && <th>Income ID</th>}
              {visibleColumns.dateTime && <th>Date & Time</th>}
              {visibleColumns.name && <th>Name</th>}
              {['developer', 'financier', 'admin'].includes(userRole) && visibleColumns.email && <th>Email</th>}
              {['developer', 'financier', 'admin'].includes(userRole) && visibleColumns.phoneNumber && <th>Phone Number</th>}
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
                <td>{index + 1}</td>
                {(userRole === 'developer' || userRole === 'financier') && visibleColumns.registerId && (
                  <td>{income.registerId}</td>
                )}
                {visibleColumns.incomeId && <td>{income.incomeId}</td>}
                {visibleColumns.dateTime && <td>{formatDate(income.createdAt)}</td>}
                {visibleColumns.name && <td>{income.name}</td>}
                {['developer', 'financier', 'admin'].includes(userRole) && visibleColumns.email && <td>{income.email}</td>}
                {['developer', 'financier', 'admin'].includes(userRole) && visibleColumns.phoneNumber && <td>{income.phoneNumber}</td>}
                {visibleColumns.amount && <td>{income.amount}</td>}
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

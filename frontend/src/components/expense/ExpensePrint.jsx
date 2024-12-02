import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Printer } from 'lucide-react';

const ExpensePrint = ({ expenses, visibleColumns, userRole }) => {
  const calculateTotalSpent = (subExpenses) => {
    return subExpenses.reduce((sum, sub) => sum + Number(sub.subAmount), 0);
  };

  const formatDate = (dateString) => {
    return dateString ? new Date(dateString).toLocaleString() : 'N/A';
  };

  const canViewPhoneNumber = ['developer', 'financier', 'admin'].includes(userRole);

  const handlePrint = () => {
    const doc = new jsPDF();
    const headers = ['S.No'];
    const body = [];

    // Add visible columns to headers
    if (visibleColumns.registerId && (userRole === 'developer' || userRole === 'financier')) {
      headers.push('Register ID');
    }
    if (visibleColumns.expenseId) headers.push('Expense ID');
    if (visibleColumns.dateTime) headers.push('Date & Time');
    if (visibleColumns.purpose) headers.push('Purpose');
    if (visibleColumns.spenderName) headers.push('Spender Name');
    if (canViewPhoneNumber && visibleColumns.phoneNumber) headers.push('Phone Number');
    if (visibleColumns.amountTaken) headers.push('Amount Taken');
    if (visibleColumns.totalSpent) headers.push('Total Amount Spent');
    if (visibleColumns.subPurpose) headers.push('Sub Purpose');
    if (visibleColumns.subAmount) headers.push('Sub Amount');
    if (visibleColumns.amountReturned) headers.push('Amount Returned');
    if (visibleColumns.bill) headers.push('Bill');
    if (visibleColumns.paymentMode) headers.push('Payment Mode');
    if (visibleColumns.verifyLog) headers.push('Verify Log');

    // Add data to body
    expenses.forEach((expense, index) => {
      const row = [index + 1];

      if (visibleColumns.registerId && (userRole === 'developer' || userRole === 'financier')) {
        row.push(expense.registerId);
      }
      if (visibleColumns.expenseId) row.push(expense.expenseId);
      if (visibleColumns.dateTime) row.push(formatDate(expense.createdAt));
      if (visibleColumns.purpose) row.push(expense.purpose);
      if (visibleColumns.spenderName) row.push(expense.name);
      if (canViewPhoneNumber && visibleColumns.phoneNumber) row.push(expense.phoneNumber);
      if (visibleColumns.amountTaken) row.push(`${expense.amount}`);
      if (visibleColumns.totalSpent) row.push(`${calculateTotalSpent(expense.subExpenses)}`);
      if (visibleColumns.subPurpose) {
        row.push(expense.subExpenses.map(sub => sub.subPurpose).join('\n'));
      }
      if (visibleColumns.subAmount) {
        row.push(expense.subExpenses.map(sub => `${sub.subAmount}`).join('\n'));
      }
      if (visibleColumns.amountReturned) row.push(`${expense.amountReturned || 0}`);
      if (visibleColumns.bill) {
        row.push(expense.subExpenses.map(sub => sub.billImage ? 'Available' : 'No Bill').join('\n'));
      }
      if (visibleColumns.paymentMode) row.push(expense.paymentMode);
      if (visibleColumns.verifyLog) row.push(expense.verifyLog);

      body.push(row);
    });

    // Add title
    doc.setFontSize(16);
    doc.text('Expense Report', 14, 15);

    // Add table
    doc.autoTable({
      startY: 25,
      head: [headers],
      body: body,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [66, 66, 66] },
      columnStyles: {
        0: { cellWidth: 10 }, // S.No width
      },
      didDrawPage: function(data) {
        // Add page number
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} of ${doc.internal.getNumberOfPages()}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    doc.save('Expense-Report.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary">
      <Printer className="h-4 w-4 mr-2" />
      Print
    </button>
  );
};

export default ExpensePrint;
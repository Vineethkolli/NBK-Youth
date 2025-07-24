import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Printer } from 'lucide-react';

const ExpensePrint = ({ expenses, visibleColumns, userRole }) => {
  const handlePrint = () => {
    const doc = new jsPDF();
    const headers = [];
    const body = [];

    const title = "Expense Report";

    const timestamp = new Date().toLocaleString();

    // Dynamically generate headers based on visibleColumns
    const columns = Object.keys(visibleColumns).filter(column => visibleColumns[column]);

    // Add Serial Number as first column
    headers.push('S.No');

    columns.forEach(column => {
      switch (column) {
        case 'registerId':
          headers.push('Register ID');
          break;
        case 'expenseId':
          headers.push('Expense ID');
          break;
        case 'dateTime':
          headers.push('Date & Time');
          break;
        case 'purpose':
          headers.push('Purpose');
          break;
        case 'spenderName':
          headers.push('Spender Name');
          break;
        case 'phoneNumber':
          headers.push('Phone Number');
          break;
        case 'amountTaken':
          headers.push('Amount Taken');
          break;
        case 'totalSpent':
          headers.push('Total Amount Spent');
          break;
        case 'subPurpose':
          headers.push('Sub Purpose');
          break;
        case 'subAmount':
          headers.push('Sub Amount');
          break;
        case 'amountReturned':
          headers.push('Amount Returned');
          break;
        case 'bill':
          headers.push('Bill');
          break;
        case 'paymentMode':
          headers.push('Payment Mode');
          break;
        case 'verifyLog':
          headers.push('Verify Log');
          break;
        default:
          break;
      }
    });

    // Create body rows
    expenses.forEach((expense, index) => {
      const row = [index + 1]; 

      columns.forEach(column => {
        switch (column) {
          case 'registerId':
            row.push(expense.registerId);
            break;
          case 'expenseId':
            row.push(expense.expenseId);
            break;
          case 'dateTime':
            row.push(new Date(expense.createdAt).toLocaleString());
            break;
          case 'purpose':
            row.push(expense.purpose);
            break;
          case 'spenderName':
            row.push(expense.name);
            break;
          case 'phoneNumber':
            row.push(expense.phoneNumber || 'N/A');
            break;
          case 'amountTaken':
            row.push(expense.amount);
            break;
          case 'totalSpent':
            row.push(expense.subExpenses.reduce((sum, sub) => sum + Number(sub.subAmount), 0));
            break;
          case 'subPurpose':
            row.push(expense.subExpenses.map(sub => sub.subPurpose).join('\n'));
            break;
          case 'subAmount':
            row.push(expense.subExpenses.map(sub => sub.subAmount).join('\n'));
            break;
          case 'amountReturned':
            row.push(expense.amountReturned || 0);
            break;
          case 'bill':
            row.push(expense.subExpenses.map(sub => sub.billImage ? 'Available' : 'No Bill').join('\n'));
            break;
          case 'paymentMode':
            row.push(expense.paymentMode);
            break;
          case 'verifyLog':
            row.push(expense.verifyLog);
            break;
          default:
            break;
        }
      });
      body.push(row);
    });

    // Add title 
    doc.setFontSize(16);
    doc.text(title, 105, 15, { align: 'center' }); 

    // Generate PDF with the filtered columns and serial number
    doc.autoTable({
      head: [headers],
      body: body,
      startY: 25, 
      margin: { top: 10 },
      didDrawPage: (data) => {
        // Footer with timestamp and page number
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          `Generated on: ${timestamp}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber} of ${pageCount}`,
          doc.internal.pageSize.width - data.settings.margin.right - 30,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save('Expense_Report.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary">
      <Printer className="h-4 w-4 mr-2" />
      Print
    </button>
  );
};

export default ExpensePrint;
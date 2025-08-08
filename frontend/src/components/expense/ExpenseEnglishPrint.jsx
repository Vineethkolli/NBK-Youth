import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';
import { useEventLabel } from '../../context/EventLabelContext';

const ExpensePrint = ({ expenses, visibleColumns, userRole }) => {
  const { eventLabel } = useEventLabel();

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
        case 'expenseId':
          headers.push('Expense ID');
          break;
        case 'registerId':
          headers.push('Register ID');
          break;
        case 'dateTime':
          headers.push('Date & Time');
          break;
        case 'purpose':
          headers.push('Purpose');
          break;
        case 'amount':
          headers.push('Amount');
          break;
        case 'paymentMode':
          headers.push('Payment Mode');
          break;
        case 'bill':
          headers.push('Bill');
          break;
        case 'name':
          headers.push('Spender Name');
          break;
        case 'phoneNumber':
          headers.push('Phone Number');
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
          case 'expenseId':
            row.push(expense.expenseId);
            break;
          case 'registerId':
            row.push(expense.registerId);
            break;
          case 'dateTime':
            row.push(formatDateTime(expense.createdAt));
            break;
          case 'purpose':
            row.push(expense.purpose);
            break
          case 'amount':
            row.push(expense.amount);
            break;
          case 'paymentMode':
            row.push(expense.paymentMode);
            break;
          case 'bill':
            row.push(expense.billImage ? 'Available' : 'No Bill');
            break;
          case 'name':
            row.push(expense.name);
            break;
          case 'phoneNumber':
            row.push(expense.phoneNumber || 'N/A');
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

    // Add event label if it exists
    if (eventLabel) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(eventLabel.label, 105, 22, { align: 'center' });
    }
    // Generate PDF with the filtered columns and serial number
    autoTable(doc, {
      head: [headers],
      body: body,
      startY: eventLabel ? 30 : 25, 
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
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      Print
    </button>
  );
};

export default ExpensePrint;
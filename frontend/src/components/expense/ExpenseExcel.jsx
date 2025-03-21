import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';

const ExpenseExcel = ({ expenses, visibleColumns }) => {
  const handleExcelDownload = () => {
    const headers = [];
    headers.push('S.No'); 

    // Get columns that are marked visible
    const columns = Object.keys(visibleColumns).filter(col => visibleColumns[col]);

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

    const data = [];
    data.push(headers);

    expenses.forEach((expense, index) => {
      const row = [index + 1];
      columns.forEach(column => {
        switch (column) {
          case 'registerId':
            row.push(expense.registerId || '');
            break;
          case 'expenseId':
            row.push(expense.expenseId || '');
            break;
          case 'dateTime':
            row.push(expense.createdAt ? new Date(expense.createdAt).toLocaleString() : 'N/A');
            break;
          case 'purpose':
            row.push(expense.purpose || '');
            break;
          case 'spenderName':
            row.push(expense.name || '');
            break;
          case 'phoneNumber':
            row.push(expense.phoneNumber || 'N/A');
            break;
          case 'amountTaken':
            row.push(expense.amount || '');
            break;
          case 'totalSpent':
            
            const total = expense.subExpenses?.reduce((sum, sub) => sum + Number(sub.subAmount), 0) || 0;
            row.push(total);
            break;
          case 'subPurpose':
            row.push(expense.subExpenses ? expense.subExpenses.map(sub => sub.subPurpose).join('\n') : '');
            break;
          case 'subAmount':
            row.push(expense.subExpenses ? expense.subExpenses.map(sub => sub.subAmount).join('\n') : '');
            break;
          case 'amountReturned':
            row.push(expense.amountReturned || 0);
            break;
          case 'bill':
            row.push(expense.subExpenses ? expense.subExpenses.map(sub => sub.billImage ? 'Available' : 'No Bill').join('\n') : '');
            break;
          case 'paymentMode':
            row.push(expense.paymentMode || '');
            break;
          case 'verifyLog':
            row.push(expense.verifyLog || '');
            break;
          default:
            break;
        }
      });
      data.push(row);
    });

    // Create a new workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Expense');

    // Write workbook to binary array and trigger download
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'Expense_Excel.xlsx');
  };

  return (
    <button onClick={handleExcelDownload} className="btn-secondary">
      <Download className="h-4 w-4 mr-2" />
      Excel
    </button>
  );
};

export default ExpenseExcel;

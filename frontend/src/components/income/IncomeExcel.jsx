import React from 'react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Download } from 'lucide-react';
import { useHiddenProfiles } from '../../context/HiddenProfileContext';

const IncomeExcel = ({ incomes, visibleColumns }) => {
  const { hiddenProfiles } = useHiddenProfiles();

  const handleExcelDownload = () => {
    const headers = [];
    headers.push('S.No');
    
    // Get the list of columns to include
    const columns = Object.keys(visibleColumns).filter(
      (col) => visibleColumns[col]
    );
    
    columns.forEach((column) => {
      switch (column) {
        case 'registerId':
          headers.push('Register ID');
          break;
        case 'incomeId':
          headers.push('Income ID');
          break;
        case 'dateTime':
          headers.push('Date & Time');
          break;
        case 'name':
          headers.push('Name');
          break;
        case 'email':
          headers.push('Email');
          break;
        case 'phoneNumber':
          headers.push('Phone Number');
          break;
        case 'amount':
          headers.push('Amount');
          break;
        case 'status':
          headers.push('Status');
          break;
        case 'paymentMode':
          headers.push('Payment Mode');
          break;
        case 'belongsTo':
          headers.push('Belongs To');
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

    incomes.forEach((income, index) => {
      const row = [index + 1]; 
      const isHidden = hiddenProfiles.has(income._id);
      columns.forEach((column) => {
        switch (column) {
          case 'registerId':
            row.push(income.registerId);
            break;
          case 'incomeId':
            row.push(income.incomeId);
            break;
          case 'dateTime':
            row.push(new Date(income.createdAt).toLocaleString());
            break;
          case 'name':
            row.push(isHidden ? 'Donor' : income.name);
            break;
          case 'email':
            row.push(isHidden ? 'Donor' : (income.email || 'N/A'));
            break;
          case 'phoneNumber':
            row.push(isHidden ? 'Donor' : (income.phoneNumber || 'N/A'));
            break;
          case 'amount':
            row.push(income.amount);
            break;
          case 'status':
            row.push(income.status);
            break;
          case 'paymentMode':
            row.push(income.paymentMode);
            break;
          case 'belongsTo':
            row.push(income.belongsTo);
            break;
          case 'verifyLog':
            row.push(income.verifyLog);
            break;
          default:
            break;
        }
      });
      data.push(row);
    });

    // Create a new workbook and worksheet from the data array
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Income');

    // Write the workbook to a binary array
    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(blob, 'Income_Excel.xlsx');
  };

  return (
    <button onClick={handleExcelDownload} className="btn-secondary">
      <Download className="h-4 w-4 mr-2" />
      Excel
    </button>
  );
};

export default IncomeExcel;

import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Printer } from 'lucide-react';

const IncomePrint = ({ incomes, visibleColumns }) => {
  const handlePrint = () => {
    const doc = new jsPDF();
    const headers = [];
    const body = [];

    // Dynamically generate headers and body based on visibleColumns
    const columns = Object.keys(visibleColumns).filter(column => visibleColumns[column]);

    // Create header with Register ID first, followed by Income ID
    headers.push('S.No'); // Adding Serial Number 
    
    columns.forEach(column => {
      switch (column) {
        case 'registerId':
          headers.push('Register ID'); // Register ID comes first
          break;
        case 'incomeId':
          headers.push('Income ID'); // Income ID comes second
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

    // Create body rows with Register ID first, followed by Income ID
    incomes.forEach((income, index) => {
      const row = [index + 1]; // Add Serial Number
      columns.forEach(column => {
        switch (column) {
          case 'registerId':
            row.push(income.registerId); // Register ID first
            break;
          case 'incomeId':
            row.push(income.incomeId); // Income ID second
            break;
          case 'dateTime':
            row.push(new Date(income.createdAt).toLocaleString());
            break;
          case 'name':
            row.push(income.name);
            break;
          case 'email':
            row.push(income.email);
            break;
          case 'phoneNumber':
            row.push(income.phoneNumber);
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
      body.push(row);
    });

    // Generate PDF with the filtered columns and serial number
    doc.autoTable({
      head: [headers],
      body: body
    });

    doc.save('Income-Report.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary">
      <Printer className="h-4 w-4 mr-2" />
      Print
    </button>
  );
};

export default IncomePrint;

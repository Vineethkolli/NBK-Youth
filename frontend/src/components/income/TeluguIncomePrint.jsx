import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { teluguFont } from '../../components/fonts/Telugu'; // Import the font
import { useHiddenProfiles } from '../../context/HiddenProfileContext';

// Load and add the Telugu font
const addTeluguFont = (doc) => {
  doc.addFileToVFS('Telugu.ttf', teluguFont);
  doc.addFont('Telugu.ttf', 'NotoSansTelugu', 'normal');
};

const translateToTelugu = async (text) => {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=te&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url);
    const data = await response.json();
    return data[0][0][0];
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
};

const TeluguIncomePrint = ({ incomes, visibleColumns }) => {
  const { hiddenProfiles } = useHiddenProfiles();

  const handlePrint = async () => {
    const doc = new jsPDF();
    addTeluguFont(doc); // Add Telugu font
    doc.setFont('NotoSansTelugu'); // Set Telugu font

    const headers = [];
    const body = [];

    const title = await translateToTelugu("Income Report");
    const timestamp = new Date().toLocaleString();

    headers.push(await translateToTelugu('S.No'));

    const columns = Object.keys(visibleColumns).filter(column => visibleColumns[column]);
    for (const column of columns) {
      let headerText = '';
      switch (column) {
        case 'registerId':
          headerText = await translateToTelugu('Register ID');
          break;
        case 'incomeId':
          headerText = await translateToTelugu('Income ID');
          break;
        case 'dateTime':
          headerText = await translateToTelugu('Date & Time');
          break;
        case 'name':
          headerText = await translateToTelugu('Name');
          break;
        case 'email':
          headerText = await translateToTelugu('Email');
          break;
        case 'phoneNumber':
          headerText = await translateToTelugu('Phone Number');
          break;
        case 'amount':
          headerText = await translateToTelugu('Amount');
          break;
        case 'status':
          headerText = await translateToTelugu('Status');
          break;
        case 'paymentMode':
          headerText = await translateToTelugu('Payment Mode');
          break;
        case 'belongsTo':
          headerText = await translateToTelugu('Belongs To');
          break;
        case 'verifyLog':
          headerText = await translateToTelugu('Verify Log');
          break;
      }
      headers.push(headerText);
    }

    for (let i = 0; i < incomes.length; i++) {
      const income = incomes[i];
      const isHidden = hiddenProfiles.has(income._id);
      const row = [i + 1];

      for (const column of columns) {
        let cellContent = '';
        switch (column) {
          case 'registerId':
            cellContent = income.registerId;
            break;
          case 'incomeId':
            cellContent = income.incomeId;
            break;
          case 'dateTime':
            cellContent = new Date(income.createdAt).toLocaleString();
            break;
          case 'name':
            cellContent = isHidden ? await translateToTelugu('Donor') : await translateToTelugu(income.name);
            break;
          case 'email':
            cellContent = isHidden ? await translateToTelugu('Donor') : (income.email || 'N/A');
            break;
          case 'phoneNumber':
            cellContent = isHidden ? await translateToTelugu('Donor') : (income.phoneNumber || 'N/A');
            break;
          case 'amount':
            cellContent = income.amount.toString();
            break;
          case 'status':
            cellContent = await translateToTelugu(income.status);
            break;
          case 'paymentMode':
            cellContent = await translateToTelugu(income.paymentMode);
            break;
          case 'belongsTo':
            cellContent = await translateToTelugu(income.belongsTo);
            break;
          case 'verifyLog':
            cellContent = await translateToTelugu(income.verifyLog);
            break;
        }
        row.push(cellContent);
      }
      body.push(row);
    }

    doc.setFontSize(16);
    doc.text(title, 105, 15, { align: 'center' });

    doc.autoTable({
      head: [headers],
      body: body,
      startY: 25,
      styles: { font: 'NotoSansTelugu', fontSize: 10 },
      didDrawPage: (data) => {
        doc.setFontSize(9);
        doc.text(`Generated on: ${timestamp}`, data.settings.margin.left, doc.internal.pageSize.height - 10);
      },
    });

    doc.save('Telugu_Income_Report.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary">
      <Printer className="h-4 w-4 mr-2" />
      Telugu Print
    </button>
  );
};

export default TeluguIncomePrint;

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { useHiddenProfiles } from '../../context/HiddenProfileContext';
import { formatDateTime } from '../../utils/dateTime';
import { useEventLabel } from '../../context/EventLabelContext';
import { API_URL } from '../../utils/config';

const IncomePrint = ({ incomes, visibleColumns }) => {
  const { hiddenProfiles } = useHiddenProfiles();
  const { eventLabel } = useEventLabel();

const handlePrint = () => {
  const doc = new jsPDF();
  const headers = [];
  const body = [];
  const title = "Income Report";
  const timestamp = new Date().toLocaleString();

  const columns = Object.keys(visibleColumns).filter(column => visibleColumns[column]);

  headers.push('S.No');
  columns.forEach(column => {
    switch (column) {
      case 'registerId': headers.push('Register ID'); break;
      case 'incomeId': headers.push('Income ID'); break;
      case 'entryDate': headers.push('Entry Date'); break;
      case 'paidDate': headers.push('Paid Date'); break;
      case 'name': headers.push('Name'); break;
      case 'email': headers.push('Email'); break;
      case 'phoneNumber': headers.push('Phone Number'); break;
      case 'amount': headers.push('Amount'); break;
      case 'status': headers.push('Status'); break;
      case 'paymentMode': headers.push('Payment Mode'); break;
      case 'belongsTo': headers.push('Belongs To'); break;
      case 'verifyLog': headers.push('Verify Log'); break;
      default: break;
    }
  });

  incomes.forEach((income, index) => {
    const row = [index + 1];
    const isHidden = hiddenProfiles.has(income._id);
    columns.forEach(column => {
      switch (column) {
        case 'registerId': row.push(income.registerId); break;
        case 'incomeId': row.push(income.incomeId); break;
        case 'entryDate': row.push(formatDateTime(income.createdAt)); break;
        case 'paidDate': row.push(income.paidDate ? formatDateTime(income.paidDate) : '-'); break;
        case 'name': row.push(isHidden ? 'Donor' : income.name); break;
        case 'email': row.push(isHidden ? 'Donor' : (income.email || 'N/A')); break;
        case 'phoneNumber': row.push(isHidden ? 'Donor' : (income.phoneNumber || 'N/A')); break;
        case 'amount': row.push(income.amount); break;
        case 'status': row.push(income.status); break;
        case 'paymentMode': row.push(income.paymentMode); break;
        case 'belongsTo': row.push(income.belongsTo); break;
        case 'verifyLog': row.push(income.verifyLog); break;
        default: break;
      }
    });
    body.push(row);
  });

  doc.setFontSize(16);
  doc.text(title, 105, 15, { align: 'center' });

  if (eventLabel) {
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(eventLabel.label, 105, 22, { align: 'center' });
  }

  autoTable(doc, {
    head: [headers],
    body: body,
    startY: eventLabel ? 30 : 25,
    margin: { top: 10 },
  });

  // Footer
 const pageCount = doc.getNumberOfPages();
for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  doc.setFontSize(9);

  const pageHeight = doc.internal.pageSize.height;
  const pageWidth = doc.internal.pageSize.width;

  const leftText = `Generated on: ${timestamp}`;
  const centerText = `NBK Youth App | ${API_URL}`;
  const rightText = `Page ${i} of ${pageCount}`;

  doc.text(leftText, 10, pageHeight - 10);

  const centerX =
    pageWidth / 2 - doc.getTextWidth(centerText) / 2;

  doc.setTextColor(70, 70, 255);
  doc.textWithLink(centerText, centerX, pageHeight - 10, {
    url: API_URL,
  });

  doc.setTextColor(0, 0, 0);
  doc.text(rightText, pageWidth - 30, pageHeight - 10);
}

  doc.save('Income_Report.pdf');
};

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      Print
    </button>
  );
};

export default IncomePrint;

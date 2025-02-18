import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export const generatePaymentReceipt = (payment) => {
  const doc = new jsPDF();

  // Add logo
  const logoUrl = '/logo.png'; 
  doc.addImage(logoUrl, 'PNG', 20, 10, 40, 40); 

  // Add header
  doc.setFontSize(22);
  doc.setTextColor(34, 34, 34); 
  doc.text('NBK Youth', 105, 30, { align: 'center' });

  doc.setFontSize(16);
  doc.setTextColor(50, 50, 50);
  doc.text('Payment Receipt', 105, 40, { align: 'center' });

  // Add horizontal divider
  const lineYPosition = 50;
  doc.setDrawColor(200, 200, 200); 
  doc.setLineWidth(0.5);
  doc.line(20, lineYPosition, 190, lineYPosition);

  // Payment details title
  doc.setFontSize(14);
  doc.setTextColor(50, 50, 50);
  doc.text('Payment Details', 20, lineYPosition + 10);

  // Details styling
  doc.setFontSize(12);
  doc.setTextColor(60, 60, 60);
  const startY = lineYPosition + 20;
  const leftMargin = 20;
  const rightColumn = 100;

  const details = [
    ['Payment ID:', payment.paymentId],
    ['Register ID:', payment.registerId],
    ['Date:', new Date(payment.createdAt).toLocaleString()],
    ['Name:', payment.name],
    ['Email:', payment.email || 'N/A'],
    ['Phone:', payment.phoneNumber],
    ['Amount:', `${payment.amount}`],
    ['Transaction Status:', payment.transactionStatus],
    ['Verification:', payment.verifyLog],
  ];

  details.forEach((row, index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(leftMargin, startY + (index * 10), row[0]);
    doc.setFont('helvetica', 'normal');
    doc.text(rightColumn, startY + (index * 10), row[1]);
  });

  // Clickable "View" link for Screenshot
  const screenshotYPosition = startY + details.length * 10 + 10;
  doc.setFont('helvetica', 'bold');
  doc.text(leftMargin, screenshotYPosition, 'Screenshot:');
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 255);
  doc.textWithLink('View', rightColumn, screenshotYPosition, { url: payment.screenshot });
  doc.setTextColor(0, 0, 0); 

  // Footer section
  const footerYPosition = screenshotYPosition + 20;
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120); 
  doc.text('Thank you for your payment!', 105, footerYPosition, { align: 'center' });
  doc.text('For any queries, contact us at gangavaramnbkyouth@gmail.com.', 105, footerYPosition + 5, { align: 'center' });

  return doc;
};

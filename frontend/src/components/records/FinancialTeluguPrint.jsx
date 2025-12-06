import { Printer } from 'lucide-react';

const FinancialTeluguPrint = ({ records, selectedEvent }) => {

  const formatDate = (d) => {
    if (!d) return '-';
    const date = new Date(d);
    return date.toLocaleDateString('te-IN');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');

    printWindow.document.write(`
      <html>
      <head>
        <title>ఆర్థిక నివేదిక</title>
        <style>
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #ddd; padding: 6px; font-size: 12px; }
          th { background: #f4f4f4; }
          h2 { text-align: center; }
        </style>
      </head>
      <body>
        <h2>ఆర్థిక టైమ్‌లైన్ - ${selectedEvent}</h2>

        <table>
          <thead>
            <tr>
              <th>సంవత్సరం</th>
              <th>మిగిలిన మొత్తం</th>
              <th>వ్యాజ్యం</th>
              <th>మ్యాచ్యూరిటీ మొత్తం</th>
              <th>FD ప్రారంభం</th>
              <th>FD పూర్తి</th>
              <th>ఖాతా</th>
              <th>గమనికలు</th>
            </tr>
          </thead>
          <tbody>
            ${records.map(rec => `
              <tr>
                <td>${rec.year}</td>
                <td>${rec.amountLeft}</td>
                <td>${rec.maturityAmount - rec.amountLeft}</td>
                <td>${rec.maturityAmount}</td>
                <td>${formatDate(rec.fdStartDate)}</td>
                <td>${formatDate(rec.fdMaturityDate)}</td>
                <td>${rec.fdAccount || '-'}</td>
                <td>${rec.remarks || '-'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

      </body></html>
    `);

    printWindow.document.close();
    printWindow.print();
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
       Print
    </button>
  );
};

export default FinancialTeluguPrint;

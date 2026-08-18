import { useRef } from 'react';
import { Printer } from 'lucide-react';

const TimelineTeluguPrint = ({ records, selectedEvent }) => {
  const printRef = useRef();

  const getTranslatedEventName = () => {
    if (!selectedEvent) return '';
    const name = selectedEvent;

    const translations = [
      { en: 'Sankranti', te: 'సంక్రాంతి' },
      { en: 'Ganesh Chaturthi', te: 'గణేశ్ చతుర్థి' }
    ];

    let translated = name;
    translations.forEach(({ en, te }) => {
      if (translated.includes(en)) translated = translated.replace(en, te);
    });

    return translated;
  };

  const handlePrint = () => {
    const translatedEventName = getTranslatedEventName();
    const content = printRef.current.innerHTML;
    const printWindow = window.open('height=700,width=1000');

    printWindow.document.write(`
      <style>
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th, td { border: 1px solid #ccc; padding: 6px; text-align: center; font-size: 12px; }
        th { background: #e8f0fe; }

        .section {
          margin: 34px 0;
        }

        .year-title {
          font-size: 16px;
          font-weight: bold;
          margin: 16px 0 14px;
        }

        .remarks {
          text-align: left;
          font-size: 12px;
          margin-top: 10px;
          margin-bottom: 24px;
        }

        @media print { button { display: none; } }
      </style>
    `);

    printWindow.document.write('</head><body>');
    printWindow.document.write(
      '<div style="text-align:center;"><h2><span translate="no">కాలక్రమ నివేదిక</span></h2></div>'
    );

    if (translatedEventName) {
      printWindow.document.write(
        `<div style="text-align:center;margin-bottom:10px;color:#666;">${translatedEventName}</div>`
      );
    }

    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="h-4 w-4 mr-1 inline" />
        ప్రింట్
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        {records.map((rec, i) => {
          const formatAmount = (val) =>
            typeof val === 'number' ? new Intl.NumberFormat('te-IN').format(val) : '-';
          const amountLeft = (rec.amountCollected || 0) - (rec.amountSpent || 0);
          const additionalAmount = rec.additionalAmount || 0;
          const previousAmount = rec.previousAmount || 0;
          const finalAmountLeft = amountLeft + additionalAmount + previousAmount;

          return (
            <div key={i} className="section">
              {rec.year && <div className="year-title">{rec.year}</div>}

              <table>
                <thead>
                  <tr>
                    <th>సేకరించిన మొత్తం</th>
                    <th>ఖర్చు చేసిన మొత్తం</th>
                    <th>మిగిలిన మొత్తం</th>
                    <th>అదనపు మొత్తం</th>
                    <th>గత మొత్తం</th>
                    <th>తుది మిగిలిన మొత్తం</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><span translate="no">{formatAmount(rec.amountCollected)}</span></td>
                    <td><span translate="no">{formatAmount(rec.amountSpent)}</span></td>
                    <td><span translate="no">{formatAmount(amountLeft)}</span></td>
                    <td><span translate="no">{formatAmount(additionalAmount)}</span></td>
                    <td><span translate="no">{formatAmount(previousAmount)}</span></td>
                    <td><span translate="no">{formatAmount(finalAmountLeft)}</span></td>
                  </tr>
                </tbody>
              </table>

              {rec.remarks?.trim() && <div className="remarks">{rec.remarks}</div>}
            </div>
          );
        })}
      </div>
    </>
  );
};

export default TimelineTeluguPrint;

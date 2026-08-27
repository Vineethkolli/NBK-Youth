import { useRef } from 'react';
import { Printer } from 'lucide-react';

const OverallTeluguPrint = ({
  events,
  totals,
  totalInflow,
  amountLeft
}) => {
  const printRef = useRef();

  const formatAmount = (amount) =>
    new Intl.NumberFormat('te-IN').format(amount || 0);

  const handlePrint = () => {
    const printWindow = window.open(
      '',
      '',
      'height=700,width=1000'
    );

    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>

          <style>
            body {
              font-family: sans-serif;
              margin: 20px;
            }

            table {
              width: 100%;
              border-collapse: collapse;
              margin: 10px 0 20px;
            }

            th,
            td {
              border: 1px solid #ccc;
              padding: 6px;
              text-align: center;
              font-size: 12px;
            }

            th {
              background: #e8f0fe;
            }

            h2 {
              text-align: center;
              margin-top: 0;
              margin-bottom: 4px;
            }

            .subtitle {
              text-align: center;
              color: #666;
              margin-top: 0;
              margin-bottom: 20px;
            }

            .section-heading {
              text-align: left;
              font-size: 16px;
              font-weight: bold;
              margin: 18px 0 8px;
              color: #000;
            }

            @media print {
              button {
                display: none;
              }
            }
          </style>
        </head>

        <body>
    `);

    printWindow.document.write(`
      <h2 translate="no">
        మొత్తం గణాంకాలు నివేదిక
      </h2>

      <p
        class="subtitle"
        translate="no"
      >
        2023 నుండి డేటా
      </p>
    `);

    printWindow.document.write(
      printRef.current.innerHTML
    );

    printWindow.document.write(`
        </body>
      </html>
    `);

    printWindow.document.close();

    printWindow.focus();

    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <>
      <button
        onClick={handlePrint}
        className="btn-secondary flex items-center"
      >
        <Printer className="mr-1 inline h-4 w-4" />
        ప్రింట్
      </button>

      <div
        ref={printRef}
        style={{ display: 'none' }}
      >

        <table>
          <thead>
            <tr>
              <th translate="no">మొత్తం ఆదాయం</th>
              <th translate="no">సేకరించిన మొత్తం</th>
              <th translate="no">ఖర్చు చేసిన మొత్తం</th>
              <th translate="no">అదనపు మొత్తం</th>
              <th translate="no">మిగిలిన మొత్తం</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td translate="no">
                {formatAmount(totalInflow)}
              </td>

              <td translate="no">
                {formatAmount(totals.amountCollected)}
              </td>

              <td translate="no">
                {formatAmount(totals.amountSpent)}
              </td>

              <td translate="no">
                {formatAmount(totals.additionalAmount)}
              </td>

              <td translate="no">
                {formatAmount(amountLeft)}
              </td>
            </tr>
          </tbody>
        </table>

        <div
          className="section-heading"
          translate="no"
        >
          ఈవెంట్ గణాంకాలు
        </div>

        <table>
          <thead>
            <tr>
              <th translate="no">ఈవెంట్</th>
              <th translate="no">సేకరించిన మొత్తం</th>
              <th translate="no">ఖర్చు చేసిన మొత్తం</th>
              <th translate="no">అదనపు మొత్తం</th>
              <th translate="no">మిగిలిన మొత్తం</th>
            </tr>
          </thead>

          <tbody>
            {events.map((event) => {
              const latestRecord = event.latestRecord;

              const eventAmountLeft =
                (Number(latestRecord.amountCollected) || 0) -
                (Number(latestRecord.amountSpent) || 0) +
                (Number(latestRecord.additionalAmount) || 0) +
                (Number(latestRecord.previousAmount) || 0);

              return (
                <tr key={event.eventName}>
                  <td>
                    {event.eventName}
                  </td>

                  <td translate="no">
                    {formatAmount(event.amountCollected)}
                  </td>

                  <td translate="no">
                    {formatAmount(event.amountSpent)}
                  </td>

                  <td translate="no">
                    {formatAmount(event.additionalAmount)}
                  </td>

                  <td translate="no">
                    {formatAmount(eventAmountLeft)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {events.some(
          (event) =>
            event.additionalDetails &&
            event.additionalDetails.length > 0
        ) && (
          <>
            <div
              className="section-heading"
              translate="no"
            >
              అదనపు మొత్తం వివరాలు
            </div>

            <table>
              <thead>
                <tr>
                  <th translate="no">ఈవెంట్</th>
                  <th translate="no">సంవత్సరం</th>
                  <th translate="no">అదనపు మొత్తం</th>
                  <th translate="no">వివరాలు</th>
                </tr>
              </thead>

              <tbody>
                {events.flatMap((event) =>
                  (event.additionalDetails || []).map(
                    (detail) => (
                      <tr
                        key={`${event.eventName}-${detail.year}`}
                      >
                        <td>
                          {event.eventName}
                        </td>

                        <td translate="no">
                          {detail.year}
                        </td>

                        <td translate="no">
                          {formatAmount(detail.amount)}
                        </td>

                        <td>
                          {detail.remarks || '-'}
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </>
        )}
      </div>
    </>
  );
};

export default OverallTeluguPrint;

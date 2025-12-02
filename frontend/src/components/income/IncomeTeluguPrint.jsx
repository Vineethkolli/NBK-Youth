import { useRef } from 'react';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';
import { useEventLabel } from '../../context/EventLabelContext';

function IncomePrint({ incomes, visibleColumns }) {
  const printRef = useRef();
  const { eventLabel } = useEventLabel();

  const handlePrint = () => {
    const renderedLabel =
      document.getElementById('event-label-display')?.innerText?.trim();

    const content = printRef.current.innerHTML;
    const timestamp = new Date().toLocaleString();

    const printWindow = window.open('height=700,width=1000');

    // Inject basic styles
    printWindow.document.write(`
      <html>
      <head>
        <style>
          table { width: 100%; border-collapse: collapse; }
          th, td { 
            border: 1px solid #ccc; 
            padding: 8px; 
            text-align: left; 
            font-size: 12px; 
          }
          th { background: #f4f4f4; }

          /* Footer fixed at bottom on print */
          @media print {
            .footer {
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
            }
          }
        </style>
      </head>
      <body>
    `);

    // Header
    printWindow.document.write(`
      <div style="text-align:center;">
        <h2><span translate="no">ఆదాయ నిర్వహణ</span></h2>
      </div>
    `);

    if (renderedLabel) {
      printWindow.document.write(`
        <div style="text-align:center; margin-bottom:10px; color:#666;">
          ${renderedLabel}
        </div>
      `);
    } else if (eventLabel?.label) {
      printWindow.document.write(`
        <div style="text-align:center; margin-bottom:10px; color:#666;">
          ${eventLabel.label}
        </div>
      `);
    }

    // Main Table Content
    printWindow.document.write(content);

    // FOOTER (clickable blue URL + timestamp + page text)
    // FOOTER (Beautiful & clickable)
printWindow.document.write(`
  <div class="footer"
    style="
      width: 100%;
      padding: 10px 20px;
      font-size: 11px;
      color: #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #e0e0e0;
      margin-top: 30px;
      position: fixed;
      bottom: 0;
      left: 0;
      background: white;
    "
  >
    <span style="color: #555;">${timestamp}</span>

    <span style="font-weight: 600; color: #222;">
      NBK Youth App • 
      <a href="https://nbkyouth.vercel.app" 
         style="color:#0066cc; text-decoration:none;"
         target="_blank"
      >https://nbkyouth.vercel.app</a>
    </span>

    <span style="color:#555;">Page</span>
  </div>
`);


    // Close HTML
    printWindow.document.write(`</body></html>`);
    printWindow.document.close();

    // Trigger print
    printWindow.print();
  };

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="h-4 w-4 mr-1 inline" />
        Print
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        <table>
          <thead>
            <tr>
              <th>S.No</th>
              {visibleColumns.registerId && <th>Register ID</th>}
              {visibleColumns.incomeId && <th>Income ID</th>}
              {visibleColumns.entryDate && <th>Entry Date</th>}
              {visibleColumns.paidDate && <th>Paid Date</th>}
              {visibleColumns.name && <th>Name</th>}
              {visibleColumns.email && <th>Email</th>}
              {visibleColumns.phoneNumber && <th>Phone Number</th>}
              {visibleColumns.amount && <th>Amount</th>}
              {visibleColumns.status && <th>Status</th>}
              {visibleColumns.paymentMode && <th>Payment Mode</th>}
              {visibleColumns.belongsTo && <th>Belongs To</th>}
              {visibleColumns.verifyLog && <th>Verify Log</th>}
            </tr>
          </thead>

          <tbody>
            {incomes.map((income, index) => (
              <tr key={income._id}>
                <td><span translate="no">{index + 1}</span></td>

                {visibleColumns.registerId && (
                  <td><span translate="no">{income.registerId}</span></td>
                )}

                {visibleColumns.incomeId && (
                  <td><span translate="no">{income.incomeId}</span></td>
                )}

                {visibleColumns.entryDate && (
                  <td><span translate="no">{formatDateTime(income.createdAt)}</span></td>
                )}

                {visibleColumns.paidDate && (
                  <td>
                    <span translate="no">
                      {income.paidDate ? formatDateTime(income.paidDate) : '-'}
                    </span>
                  </td>
                )}

                {visibleColumns.name && <td>{income.name}</td>}

                {visibleColumns.email && (
                  <td><span translate="no">{income.email}</span></td>
                )}

                {visibleColumns.phoneNumber && (
                  <td><span translate="no">{income.phoneNumber}</span></td>
                )}

                {visibleColumns.amount && (
                  <td><span translate="no">{income.amount}</span></td>
                )}

                {visibleColumns.status && <td>{income.status}</td>}

                {visibleColumns.paymentMode && <td>{income.paymentMode}</td>}

                {visibleColumns.belongsTo && <td>{income.belongsTo}</td>}

                {visibleColumns.verifyLog && <td>{income.verifyLog}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default IncomePrint;

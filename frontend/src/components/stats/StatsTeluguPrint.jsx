import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { useEventLabel } from '../../context/EventLabelContext';

const StatsPrint = ({ stats }) => {
  const printRef = useRef();
  const { eventLabel } = useEventLabel();

  const formatAmount = (amount) =>
    `<span translate="no">${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)}</span>`;

  const displayAmountWithShortage = (amount) =>
    amount < 0
      ? `<span translate="no">${formatAmount(amount)} (Shortage)</span>`
      : formatAmount(amount);

  const handlePrint = () => {
    const renderedLabel = document.getElementById('event-label-display')?.innerText?.trim();
    const content = printRef.current.innerHTML;
    const printWindow = window.open('height=800,width=1000');
    printWindow.document.write(`
      <style>
        h2 { text-align: center; margin-bottom: 1rem; }
        h3 { margin-top: 1.5rem; font-size: 1rem; }
        table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
        th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; text-align: center; }
        th { background: #f4f4f4; }
        .page-break { page-break-before: always; }
      </style>
    `);
    printWindow.document.write('</head><body>');
    printWindow.document.write('<h2><span translate="no">NBK యూత్ స్టాటిస్టిక్స్ రిపోర్ట్</span></h2>');
    if (renderedLabel) {
      printWindow.document.write(`<div class="event-label" style="text-align: center; margin-bottom: 10px; color: #666;">${renderedLabel}</div>`);
    } else if (eventLabel?.label) {
      printWindow.document.write(`<div class="event-label" style="text-align: center; margin-bottom: 10px; color: #666;">${eventLabel.label}</div>`);
    }
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  const renderTable = (columns, rows) => {
    return `
      <table>
        <thead>
          <tr>${columns.map(col => `<th>${col}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${rows
            .map(
              row =>
                `<tr>${row
                  .map(cell => `<td>${cell}</td>`)
                  .join('')}</tr>`
            )
            .join('')}
        </tbody>
      </table>
    `;
  };

  // Budget Stats
  const bs = stats.budgetStats;
  const amountLeft = bs.amountLeft.amount;
  const prevYear = bs.previousYearAmount.amount;
  const totalLeft = amountLeft + prevYear;
  const budgetCols = ['Category', 'Count', 'Amount'];
  const budgetRows = [
    ['Total Income', `${bs.totalIncome.count} entries`, formatAmount(bs.totalIncome.amount)],
    ['Amount Received', `${bs.amountReceived.count} entries`, formatAmount(bs.amountReceived.amount)],
    ['Amount Pending', `${bs.amountPending.count} entries`, formatAmount(bs.amountPending.amount)],
    ['Total Expenses', `${bs.totalExpenses.count} entries`, formatAmount(bs.totalExpenses.amount)],
    ['Amount Left', '-', displayAmountWithShortage(amountLeft)],
    ['Previous Year Amount', '-', formatAmount(prevYear)],
    ['Amount Left (incl. prev)', '-', displayAmountWithShortage(totalLeft)],
  ];

  // Payment Mode Stats
  const pm = bs;
  const paymentCols = ['Mode', 'Count', 'Amount Received', 'Amount Left'];
  const paymentRows = [
    ['Online', `${pm.online.count} entries`, formatAmount(pm.online.amount), formatAmount(pm.amountLeft.onlineAmount)],
    ['Offline', `${pm.offline.count} entries`, formatAmount(pm.offline.amount), formatAmount(pm.amountLeft.cashAmount)],
  ];

  // Villagers & Youth Stats helper
  const makeGroup = (group, title) => {
    const cols = ['Category', 'Cash', 'Online', 'Web App', 'Total'];
    const rows = [
      [
        'Paid',
        formatAmount(group.paid.cash),
        formatAmount(group.paid.online),
        formatAmount(group.paid.webApp),
        formatAmount(group.paid.total),
      ],
      [
        'Pending',
        formatAmount(group.pending.cash),
        formatAmount(group.pending.online),
        formatAmount(group.pending.webApp),
        formatAmount(group.pending.total),
      ],
      ['Total', '-', '-', '-', formatAmount(group.total)],
    ];
    return {
      title,
      html: renderTable(cols, rows),
    };
  };

  const villagersSection = makeGroup(stats.villagers, 'Villagers Statistics');
  const youthSection = makeGroup(stats.youth, 'Youth Statistics');

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="h-4 w-4 mr-1 inline" />
        Print
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        <h3>Budget Statistics</h3>
        <div dangerouslySetInnerHTML={{ __html: renderTable(budgetCols, budgetRows) }} />

        <h3>Payment Mode Statistics</h3>
        <div dangerouslySetInnerHTML={{ __html: renderTable(paymentCols, paymentRows) }} />

        <h3>{villagersSection.title}</h3>
        <div dangerouslySetInnerHTML={{ __html: villagersSection.html }} />

        <h3>{youthSection.title}</h3>
        <div dangerouslySetInnerHTML={{ __html: youthSection.html }} />

        {stats.dateWiseStats && stats.dateWiseStats.length > 0 && (
          <>
            <div className="page-break"></div> {/* ✅ Force new page */}
            <h3>Date-wise Statistics</h3>
            {(() => {
              const dateWiseCols = ['Date', 'Total Income', 'Amount Received', 'Total Expenses'];
              const dateWiseRows = stats.dateWiseStats.map(dayStat => [
                new Date(dayStat.date).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'numeric',
                  year: 'numeric'
                }),
                `${formatAmount(dayStat.totalIncome)} (${dayStat.totalIncomeEntries} entries)`,
                `${formatAmount(dayStat.amountReceived)} (${dayStat.amountReceivedEntries} entries)`,
                `${formatAmount(dayStat.totalExpenses)} (${dayStat.totalExpenseEntries} entries)`
              ]);
              return <div dangerouslySetInnerHTML={{ __html: renderTable(dateWiseCols, dateWiseRows) }} />;
            })()}
          </>
        )}
      </div>
    </>
  );
};

export default StatsPrint;

import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';
import { toast } from 'react-hot-toast';

function TeluguPrint({ selectedHistory, activeTab, data, showBelongsTo }) {
  const printRef = useRef();

  const formatAmount = (amount) =>
    `<span translate="no">${new Intl.NumberFormat('en-IN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0)}</span>`;

  const displayAmountWithShortage = (amount) =>
    amount < 0 ? `${formatAmount(amount)} (Shortage)` : formatAmount(amount);

  const handlePrint = () => {
    if (!selectedHistory) {
      toast.error('Please select an event history first');
      return;
    }

    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=800,width=1000');

    printWindow.document.write(`
      <html>
      <head>
        <style>
          h2 { text-align: center; margin-bottom: 1rem; }
          h3 { margin-top: 1.5rem; font-size: 1rem; }
          table { width: 100%; border-collapse: collapse; margin-top: 0.5rem; }
          th, td { border: 1px solid #ccc; padding: 6px; font-size: 12px; text-align: center; }
          th { background: #f4f4f4; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
    `);

    // Title based on active tab
    let teluguTitle = '';
    switch (activeTab) {
      case 'stats':
        teluguTitle = 'NBK యూత గణాంకాలు రిపోర్ట్';
        break;
      case 'income':
        teluguTitle = 'ఆదాయ రిపోర్ట్';
        break;
      case 'expense':
        teluguTitle = 'ఖర్చు రిపోర్ట్';
        break;
      case 'events':
        teluguTitle = 'కార్యక్రమాలు రిపోర్ట్';
        break;
      default:
        teluguTitle = 'రిపోర్ట్';
    }

    printWindow.document.write(`<h2><span translate="no">${teluguTitle}</span></h2>`);

    if (selectedHistory.snapshotName) {
      printWindow.document.write(`
        <div style="text-align: center; margin-bottom: 10px; color: #666;">
          ${selectedHistory.snapshotName}
        </div>
      `);
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

  const generateContent = () => {
    if (!data) return '';

    switch (activeTab) {
      case 'stats':
        return generateStatsContent(data);
      case 'income':
        return generateIncomeContent(data, showBelongsTo);
      case 'expense':
        return generateExpenseContent(data);
      case 'events':
        return generateEventsContent(data);
      default:
        return '';
    }
  };

  const generateStatsContent = (stats) => {
    const budgetStats = stats.budgetStats || {};
    const amountLeft = budgetStats.amountLeft?.amount || 0;
    const previousYearAmount = budgetStats.previousYearAmount?.amount || 0;
    const totalIncludingPrevious = amountLeft + previousYearAmount;

    // Budget Stats
    const budgetCols = ['Category', 'Count', 'Amount'];
    const budgetRows = [
      ['Total Income', `${budgetStats.totalIncome?.count || 0} entries`, formatAmount(budgetStats.totalIncome?.amount)],
      ['Amount Received', `${budgetStats.amountReceived?.count || 0} entries`, formatAmount(budgetStats.amountReceived?.amount)],
      ['Amount Pending', `${budgetStats.amountPending?.count || 0} entries`, formatAmount(budgetStats.amountPending?.amount)],
      ['Total Expenses', `${budgetStats.totalExpenses?.count || 0} entries`, formatAmount(budgetStats.totalExpenses?.amount)],
      ['Amount Left', '-', displayAmountWithShortage(amountLeft)],
      ['Previous Year Amount', '-', formatAmount(previousYearAmount)],
      ['Amount Left (including previous)', '-', displayAmountWithShortage(totalIncludingPrevious)]
    ];

    // Payment Mode Stats
    const paymentCols = ['Mode', 'Count', 'Amount Received', 'Amount Left'];
    const paymentRows = [
      ['Online', `${budgetStats.online?.count || 0} entries`, formatAmount(budgetStats.online?.amount), formatAmount(budgetStats.amountLeft?.onlineAmount)],
      ['Offline', `${budgetStats.offline?.count || 0} entries`, formatAmount(budgetStats.offline?.amount), formatAmount(budgetStats.amountLeft?.cashAmount)]
    ];

    // Villagers & Youth Stats
    const makeGroup = (group, title) => {
      const cols = ['Category', 'Cash', 'Online', 'Web App', 'Total'];
      const rows = [
        [
          'Paid',
          formatAmount(group?.paid?.cash || 0),
          formatAmount(group?.paid?.online || 0),
          formatAmount(group?.paid?.webApp || 0),
          formatAmount(group?.paid?.total || 0),
        ],
        [
          'Pending',
          formatAmount(group?.pending?.cash || 0),
          formatAmount(group?.pending?.online || 0),
          formatAmount(group?.pending?.webApp || 0),
          formatAmount(group?.pending?.total || 0),
        ],
        ['Total', '-', '-', '-', formatAmount(group?.total || 0)],
      ];
      return {
        title,
        html: renderTable(cols, rows),
      };
    };

    const villagersSection = makeGroup(stats.villagers, 'Villagers Statistics');
    const youthSection = makeGroup(stats.youth, 'Youth Statistics');

    let content = `
      <h3>Budget Statistics</h3>
      ${renderTable(budgetCols, budgetRows)}
      
      <h3>Payment Mode Statistics</h3>
      ${renderTable(paymentCols, paymentRows)}
      
      <h3>${villagersSection.title}</h3>
      ${villagersSection.html}
      
      <h3>${youthSection.title}</h3>
      ${youthSection.html}
    `;

    // Date-wise Statistics
    if (stats.dateWiseStats && stats.dateWiseStats.length > 0) {
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

      content += `
        <div class="page-break"></div>
        <h3>Date-wise Statistics</h3>
        ${renderTable(dateWiseCols, dateWiseRows)}
      `;
    }

    return content;
  };

  const generateIncomeContent = (incomes, showBelongsTo) => {
    if (!Array.isArray(incomes) || incomes.length === 0) return '';

    const headers = showBelongsTo
      ? ['S.No', 'Name', 'Amount', 'Belongs To']
      : ['S.No', 'Name', 'Amount'];

    const rows = incomes.map((income, index) => {
      const row = [
        `<span translate="no">${index + 1}</span>`,
        income.name || '-',
        `<span translate="no">${income.amount || 0}</span>`
      ];
      if (showBelongsTo) row.push(income.belongsTo || '-');
      return row;
    });

    return renderTable(headers, rows);
  };

  const generateExpenseContent = (expenses) => {
    if (!Array.isArray(expenses) || expenses.length === 0) return '';

    const headers = ['S.No', 'Purpose', 'Amount'];
    const rows = expenses.map((expense, index) => [
      `<span translate="no">${index + 1}</span>`,
      expense.purpose || '-',
      `<span translate="no">${expense.amount || 0}</span>`
    ]);

    return renderTable(headers, rows);
  };

  const generateEventsContent = (events) => {
    if (!Array.isArray(events) || events.length === 0) return '';

    const headers = ['S.No', 'Event Name', 'Date & Time'];
    const rows = events.map((event, index) => [
      `<span translate="no">${index + 1}</span>`,
      event.name || '-',
      event.dateTime ? formatDateTime(event.dateTime) : '-'
    ]);

    return renderTable(headers, rows);
  };

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="h-4 w-4 mr-2" />
        Print
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        <div dangerouslySetInnerHTML={{ __html: generateContent() }} />
      </div>
    </>
  );
}

export default TeluguPrint;
import React, { useRef } from 'react';
import { Printer } from 'lucide-react';
import { useEventLabel } from '../../context/EventLabelContext';

const StatsTeluguPrint = ({ stats, budgetStats }) => {
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
    printWindow.document.write('<h2><span translate="no">అంచనా గణాంకాలు రిపోర్ట్</span></h2>');
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

  // Calculate comparisons for the new sections
  const currentIncome = budgetStats?.totalIncome?.amount || 0;
  const currentExpense = budgetStats?.totalExpenses?.amount || 0;
  const currentAmountLeft = budgetStats?.amountLeft?.amount || 0;
  
  const estimatedIncome = stats.totalEstimatedIncome || 0;
  const estimatedExpense = stats.totalEstimatedExpense || 0;
  const estimatedAmountLeft = estimatedIncome - estimatedExpense;

  const incomeExpenseBalance = currentIncome - estimatedExpense;
  const incomeComparison = currentIncome - estimatedIncome;
  const expenseComparison = currentExpense - estimatedExpense;
  const amountLeftComparison = currentAmountLeft - estimatedAmountLeft;

  // Comparison Analysis
  const comparisonCols = ['Comparison Type', 'Current', 'Estimated', 'Difference'];
  const comparisonRows = [
    ['Current Income vs Estimated Expense', formatAmount(currentIncome), formatAmount(estimatedExpense), formatAmount(incomeExpenseBalance)],
    ['Income Comparison', formatAmount(currentIncome), formatAmount(estimatedIncome), formatAmount(incomeComparison)],
    ['Expense Comparison', formatAmount(currentExpense), formatAmount(estimatedExpense), formatAmount(expenseComparison)],
    ['Amount Left Comparison', formatAmount(currentAmountLeft), formatAmount(estimatedAmountLeft), formatAmount(amountLeftComparison)]
  ];

  // Estimation Overview
  const estimationCols = ['Category', 'Entries', 'Amount'];
  const estimationRows = [
    ['Estimated Income', `${stats.incomeCount || 0} `, formatAmount(stats.totalEstimatedIncome)],
    [
      'Youth Income',
      `${stats.youthCount || 0} `,
      formatAmount((stats.youthPaid || 0) + (stats.youthNotPaid || 0))
    ],
    [
      'Villagers Income',
      `${stats.villagersCount || 0} `,
      formatAmount((stats.villagersPaid || 0) + (stats.villagersNotPaid || 0))
    ],
    ['Estimated Expense', `${stats.expenseCount || 0} `, formatAmount(stats.totalEstimatedExpense)],
    ['Amount Left', '-', stats.balance < 0 ? `${formatAmount(stats.balance)} (Shortage)` : formatAmount(stats.balance)]
  ];

  // Youth Payment Statistics
  const youthPaymentCols = ['Status', 'Entries', 'Amount'];
  const youthPaymentRows = [
    ['Paid', `${stats.youthPaidCount || '-'}`, formatAmount(stats.youthPaid || 0)],
    ['Not Paid', `${stats.youthNotPaidCount || '-'}`, formatAmount(stats.youthNotPaid || 0)]
  ];

  // Villagers Payment Statistics
  const villagersPaymentCols = ['Status', 'Entries', 'Amount'];
  const villagersPaymentRows = [
    ['Paid', `${stats.villagersPaidCount || '-'}`, formatAmount(stats.villagersPaid || 0)],
    ['Not Paid', `${stats.villagersNotPaidCount || '-'}`, formatAmount(stats.villagersNotPaid || 0)]
  ];

  // Overall Payment Status
  const overallPaymentCols = ['Status', 'Entries', 'Amount'];
  const overallPaymentRows = [
    ['Paid', `${stats.overallPaidCount || '-'}`, formatAmount(stats.totalEstimatedPaidIncome || 0)],
    ['Not Paid', `${stats.overallNotPaidCount || '-'}`, formatAmount(stats.totalEstimatedNotPaidIncome || 0)]
  ];

  return (
    <>
      <button onClick={handlePrint} className="btn-secondary flex items-center">
        <Printer className="h-4 w-4 mr-1 inline" />
        <span>Print</span>
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        <h3>Comparison Analysis</h3>
        <div dangerouslySetInnerHTML={{ __html: renderTable(comparisonCols, comparisonRows) }} />

        <h3>Estimation Overview</h3>
        <div dangerouslySetInnerHTML={{ __html: renderTable(estimationCols, estimationRows) }} />

        <h3>Youth Payment Stats</h3>
        <div dangerouslySetInnerHTML={{ __html: renderTable(youthPaymentCols, youthPaymentRows) }} />

        <h3>Villagers Payment Stats</h3>
        <div dangerouslySetInnerHTML={{ __html: renderTable(villagersPaymentCols, villagersPaymentRows) }} />

        <h3>Overall Payment Stats</h3>
        <div dangerouslySetInnerHTML={{ __html: renderTable(overallPaymentCols, overallPaymentRows) }} />
      </div>
    </>
  );
};

export default StatsTeluguPrint;
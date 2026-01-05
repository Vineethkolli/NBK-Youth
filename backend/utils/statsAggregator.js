import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import PreviousYear from '../models/PreviousYear.js';

const roundNumber = (num = 0) => Math.round(num || 0);

const incomeAggregationPipeline = [
  { $match: { isDeleted: false } },
  {
    $facet: {
      overall: [
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$amount' },
            totalCount: { $sum: 1 },
            paidAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'paid'] }, '$amount', 0] },
            },
            paidCount: { $sum: { $cond: [{ $eq: ['$status', 'paid'] }, 1, 0] } },
            pendingAmount: {
              $sum: { $cond: [{ $eq: ['$status', 'not paid'] }, '$amount', 0] },
            },
            pendingCount: { $sum: { $cond: [{ $eq: ['$status', 'not paid'] }, 1, 0] } },
          },
        },
      ],
      paymentModes: [
        {
          $group: {
            _id: { status: '$status', paymentMode: '$paymentMode' },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ],
      belongsBreakdown: [
        {
          $group: {
            _id: {
              belongsTo: '$belongsTo',
              status: '$status',
              paymentMode: '$paymentMode',
            },
            amount: { $sum: '$amount' },
            count: { $sum: 1 },
          },
        },
      ],
      dateStats: [
        {
          $project: {
            createdDate: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            paidDate: {
              $cond: [
                { $eq: ['$status', 'paid'] },
                { $dateToString: { format: '%Y-%m-%d', date: '$paidDate' } },
                null,
              ],
            },
            amount: '$amount',
            status: '$status',
          },
        },
        {
          $group: {
            _id: null,
            dateEntries: {
              $push: {
                createdDate: '$createdDate',
                paidDate: '$paidDate',
                amount: '$amount',
              },
            },
          },
        },
      ],
    },
  },
];

const expenseAggregationPipeline = [
  { $match: { isDeleted: false } },
  {
    $facet: {
      overall: [
        {
          $group: {
            _id: null,
            totalExpenses: { $sum: '$amount' },
            totalExpenseEntries: { $sum: 1 },
            onlineAmount: {
              $sum: { $cond: [{ $eq: ['$paymentMode', 'online'] }, '$amount', 0] },
            },
            cashAmount: {
              $sum: { $cond: [{ $eq: ['$paymentMode', 'cash'] }, '$amount', 0] },
            },
          },
        },
      ],
      dateStats: [
        {
          $project: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            amount: '$amount',
          },
        },
        {
          $group: {
            _id: '$date',
            totalExpenses: { $sum: '$amount' },
            totalExpenseEntries: { $sum: 1 },
          },
        },
      ],
    },
  },
];

const reducePaymentModes = (paymentModes = [], targetModes = []) =>
  paymentModes.reduce(
    (acc, entry) => {
      const mode = (entry._id?.paymentMode || '').toLowerCase();
      if (entry._id?.status === 'paid' && targetModes.includes(mode)) {
        acc.amount += entry.amount || 0;
        acc.count += entry.count || 0;
      }
      return acc;
    },
    { amount: 0, count: 0 }
  );

const buildGroupStats = (belongsBreakdown = [], target) => {
  const template = () => ({ cash: 0, online: 0, webApp: 0, total: 0 });
  const result = {
    paid: template(),
    pending: template(),
    total: 0,
    count: 0,
  };

  belongsBreakdown
    .filter((entry) => entry._id?.belongsTo?.toLowerCase() === target)
    .forEach((entry) => {
      const paymentMode = (entry._id.paymentMode || '').toLowerCase();
      const bucket = entry._id.status === 'paid' ? result.paid : result.pending;
      const key = paymentMode === 'cash' ? 'cash' : paymentMode === 'web app' ? 'webApp' : 'online';
      bucket[key] += entry.amount || 0;
      result.count += entry.count || 0;
    });

  result.paid.total = result.paid.cash + result.paid.online + result.paid.webApp;
  result.pending.total = result.pending.cash + result.pending.online + result.pending.webApp;
  result.total = result.paid.total + result.pending.total;

  const roundBucket = (bucket) => ({
    cash: roundNumber(bucket.cash),
    online: roundNumber(bucket.online),
    webApp: roundNumber(bucket.webApp),
    total: roundNumber(bucket.total),
  });

  return {
    paid: roundBucket(result.paid),
    pending: roundBucket(result.pending),
    total: roundNumber(result.total),
    count: result.count,
  };
};

const mergeDateWiseStats = (incomeDateStats = [], expenseDateStats = []) => {
  const dateMap = new Map();

  const ensureDate = (dateString) => {
    if (!dateMap.has(dateString)) {
      dateMap.set(dateString, {
        date: dateString,
        totalIncome: 0,
        totalIncomeEntries: 0,
        amountReceived: 0,
        amountReceivedEntries: 0,
        totalExpenses: 0,
        totalExpenseEntries: 0,
      });
    }
    return dateMap.get(dateString);
  };

  // Process income stats
  const incomeDateStatsData = incomeDateStats?.[0]?.dateEntries || [];

  incomeDateStatsData.forEach((stat) => {
    // Add to totalIncome by created date
    const createdEntry = ensureDate(stat.createdDate);
    createdEntry.totalIncome += stat.amount || 0;
    createdEntry.totalIncomeEntries += 1;

    // Add to amountReceived by paid date (only if paidDate exists)
    if (stat.paidDate) {
      const paidEntry = ensureDate(stat.paidDate);
      paidEntry.amountReceived += stat.amount || 0;
      paidEntry.amountReceivedEntries += 1;
    }
  });

  expenseDateStats.forEach((stat) => {
    const entry = ensureDate(stat._id);
    entry.totalExpenses += stat.totalExpenses || 0;
    entry.totalExpenseEntries += stat.totalExpenseEntries || 0;
  });

  return Array.from(dateMap.values())
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((stat) => ({
      ...stat,
      totalIncome: roundNumber(stat.totalIncome),
      amountReceived: roundNumber(stat.amountReceived),
      totalExpenses: roundNumber(stat.totalExpenses),
    }));
};

export const computeBudgetStats = async () => {
  const [[incomeFacets] = [{}], [expenseFacets] = [{}]] = await Promise.all([
    Income.aggregate(incomeAggregationPipeline),
    Expense.aggregate(expenseAggregationPipeline),
  ]);

  const [userCount, successfulPaymentCount, previousYear] = await Promise.all([
    User.countDocuments(),
    Payment.countDocuments({ transactionStatus: 'successful' }),
    PreviousYear.findOne().select('amount').lean(),
  ]);

  const incomeTotals = incomeFacets?.overall?.[0] || {};
  const expenseTotals = expenseFacets?.overall?.[0] || {};

  const onlinePaid = reducePaymentModes(incomeFacets?.paymentModes, ['online', 'web app']);
  const offlinePaid = reducePaymentModes(incomeFacets?.paymentModes, ['cash']);

  const totalIncome = {
    count: incomeTotals.totalCount || 0,
    amount: roundNumber(incomeTotals.totalAmount),
  };

  const amountReceived = {
    count: incomeTotals.paidCount || 0,
    amount: roundNumber(incomeTotals.paidAmount),
  };

  const amountPending = {
    count: incomeTotals.pendingCount || 0,
    amount: roundNumber(incomeTotals.pendingAmount),
  };

  const totalExpenses = {
    count: expenseTotals.totalExpenseEntries || 0,
    amount: roundNumber(expenseTotals.totalExpenses),
    onlineAmount: roundNumber(expenseTotals.onlineAmount),
    cashAmount: roundNumber(expenseTotals.cashAmount),
  };

  const online = {
    count: onlinePaid.count,
    amount: roundNumber(onlinePaid.amount),
  };

  const offline = {
    count: offlinePaid.count,
    amount: roundNumber(offlinePaid.amount),
  };

  const amountLeft = {
    amount: roundNumber((amountReceived.amount || 0) - (totalExpenses.amount || 0)),
    onlineAmount: roundNumber((online.amount || 0) - (totalExpenses.onlineAmount || 0)),
    cashAmount: roundNumber((offline.amount || 0) - (totalExpenses.cashAmount || 0)),
  };

  return {
    budgetStats: {
      totalIncome,
      amountReceived,
      amountPending,
      totalExpenses,
      previousYearAmount: { amount: roundNumber(previousYear?.amount || 0) },
      amountLeft,
      online,
      offline,
    },
    userStats: {
      totalUsers: userCount,
      successfulPayments: successfulPaymentCount,
    },
    villagers: buildGroupStats(incomeFacets?.belongsBreakdown, 'villagers'),
    youth: buildGroupStats(incomeFacets?.belongsBreakdown, 'youth'),
    dateWiseStats: mergeDateWiseStats(incomeFacets?.dateStats, expenseFacets?.dateStats),
  };
};

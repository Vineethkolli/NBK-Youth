import { useState } from 'react';
import { BarChart3, Info, X } from 'lucide-react';

const START_YEAR = 2023;

function OverallStats({ records = [] }) {
  const [showInflowInfo, setShowInflowInfo] = useState(false);

  const recordsSinceStart = records.filter(
    (record) => Number(record.year) >= START_YEAR
  );

  const eventStats = recordsSinceStart.reduce((stats, record) => {
    const eventName = record.eventName || 'Unnamed event';

    const event = stats.get(eventName) || {
      eventName,
      amountCollected: 0,
      amountSpent: 0,
      additionalAmount: 0,
      additionalDetails: [],
      latestRecord: null,
    };

    event.amountCollected += Number(record.amountCollected) || 0;
    event.amountSpent += Number(record.amountSpent) || 0;
    event.additionalAmount += Number(record.additionalAmount) || 0;

    if (
      !event.latestRecord ||
      Number(record.year) > Number(event.latestRecord.year)
    ) {
      event.latestRecord = record;
    }

    if ((Number(record.additionalAmount) || 0) !== 0) {
      event.additionalDetails.push({
        year: record.year,
        amount: Number(record.additionalAmount) || 0,
        remarks: record.remarks || '',
      });
    }

    stats.set(eventName, event);
    return stats;
  }, new Map());

  const totals = Array.from(eventStats.values()).reduce(
    (summary, event) => ({
      amountCollected:
        summary.amountCollected + event.amountCollected,
      amountSpent: summary.amountSpent + event.amountSpent,
      additionalAmount:
        summary.additionalAmount + event.additionalAmount,
    }),
    {
      amountCollected: 0,
      amountSpent: 0,
      additionalAmount: 0,
    }
  );

  const totalInflow =
    totals.amountCollected + totals.additionalAmount;

  const amountLeft = Array.from(eventStats.values()).reduce(
    (sum, event) => {
      const latestRecord = event.latestRecord;

      return (
        sum +
        (Number(latestRecord.amountCollected) || 0) -
        (Number(latestRecord.amountSpent) || 0) +
        (Number(latestRecord.additionalAmount) || 0) +
        (Number(latestRecord.previousAmount) || 0)
      );
    },
    0
  );

  const formatAmount = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount || 0);

  const summaryItems = [
    ['Total Inflow', totalInflow],
    ['Amount Collected', totals.amountCollected],
    ['Amount Spent', totals.amountSpent],
    ['Additional Amount', totals.additionalAmount],
    ['Amount Left', amountLeft],
  ];

  const getSummaryValueColor = (label, amount) => {
    if (label === 'Amount Spent') return 'text-red-600';

    if (
      label === 'Amount Collected' 
    ) {
      return 'text-green-600';
    }

    if (label === 'Amount Left') {
      return amount < 0 ? 'text-red-600' : 'text-green-600';
    }

    return 'text-gray-900';
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Overall Stats
          </h2>
          <p className="text-sm text-gray-500">
            Data from 2023 onwards
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {summaryItems.map(([label, amount]) => (
          <div
            key={label}
            className="rounded-lg bg-white p-4 shadow"
          >
            {label === 'Total Inflow' ? (
              <div className="flex items-center gap-1.5">
                <p className="text-sm text-gray-500">
                  {label}
                </p>
                <button
                  type="button"
                  onClick={() => setShowInflowInfo(true)}
                  className="text-gray-400 transition-colors hover:text-indigo-600"
                  aria-label="Total inflow information"
                >
                  <Info className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                {label}
              </p>
            )}

            <p
              className={`mt-1 text-lg font-semibold ${getSummaryValueColor(
                label,
                amount
              )}`}
            >
              {formatAmount(amount)}
            </p>
          </div>
        ))}
      </div>

<div className="space-y-3">
  <div className="px-1 py-1">
    <h2 className="text-xl font-semibold text-gray-900">
      Event Stats
    </h2>
  </div>

  {eventStats.size === 0 ? (
    <div className="rounded-lg bg-white px-4 py-8 text-center shadow">
      <p className="text-sm text-gray-500">
        No timeline data from 2023 onwards
      </p>
    </div>
  ) : (
    <div className="space-y-3">
      {Array.from(eventStats.values()).map((event) => {
        const latestRecord = event.latestRecord;

        const eventAmountLeft =
          (Number(latestRecord.amountCollected) || 0) -
          (Number(latestRecord.amountSpent) || 0) +
          (Number(latestRecord.additionalAmount) || 0) +
          (Number(latestRecord.previousAmount) || 0);

        return (
          <div
            key={event.eventName}
            className="rounded-lg bg-white p-4 shadow"
          >
            <h4 className="mb-4 font-semibold text-gray-900">
              {event.eventName}
            </h4>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-gray-500">
                  Amount Collected
                </p>
                <p className="font-semibold text-green-600">
                  {formatAmount(event.amountCollected)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Amount Spent
                </p>
                <p className="font-semibold text-red-600">
                  {formatAmount(event.amountSpent)}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Additional Amount
                </p>
                <p className="font-semibold">
                  {formatAmount(event.additionalAmount)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">
                  Amount Left
                </p>
                <p
                  className={`font-semibold ${
                    eventAmountLeft < 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }`}
                >
                  {formatAmount(eventAmountLeft)}
                </p>
              </div>
            </div>

            {event.additionalDetails.length > 0 && (
              <div className="mt-5 border-t border-gray-100 pt-4">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Additional Amount Details
                </p>

                <div className="overflow-x-auto">
                  <table className="min-w-full text-left text-sm">
                    <thead className="text-gray-500">
                      <tr>
                        <th className="pr-6 font-medium">
                          Year
                        </th>
                        <th className="pr-6 font-medium">
                          Additional Amount
                        </th>
                        <th className="font-medium">
                          Remarks
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100">
                      {event.additionalDetails.map((detail) => (
                        <tr
                          key={`${event.eventName}-${detail.year}`}
                        >
                          <td className="py-2 pr-6">
                            {detail.year}
                          </td>

                          <td className="py-2 pr-6 font-medium">
                            {formatAmount(detail.amount)}
                          </td>

                          <td className="py-2">
                            {detail.remarks || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  )}
</div>

      {showInflowInfo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowInflowInfo(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowInflowInfo(false)}
              className="absolute right-3 top-3 rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="pr-8 text-lg font-semibold text-gray-900">
              Total Inflow
            </h3>

            <p className="mt-3 text-sm leading-6 text-gray-600">
              Amount Collected + Additional Amounts
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

export default OverallStats;

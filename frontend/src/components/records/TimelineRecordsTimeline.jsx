import { useState } from 'react';
import { Edit2, Trash2, Loader2, TrendingUp, TrendingDown, Minus, Calendar } from 'lucide-react';

function TimelineRecordsTimeline({ records, isEditMode, onEdit, onDelete }) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  };

  const calculateDifference = (currentRecord, previousRecord) => {
    if (!previousRecord) return null;
    const currentAmountLeft = (currentRecord.amountCollected || 0) - (currentRecord.amountSpent || 0);
    const currentPreviousAmount = currentRecord.previousAmount || 0;
    const currentFinalAmountLeft = currentAmountLeft + currentPreviousAmount;

    const previousAmountLeft = (previousRecord.amountCollected || 0) - (previousRecord.amountSpent || 0);
    const previousPreviousAmount = previousRecord.previousAmount || 0;
    const previousFinalAmountLeft = previousAmountLeft + previousPreviousAmount;

    return currentFinalAmountLeft - previousFinalAmountLeft;
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getAmountLeftStyle = (amountLeft) => {
    return amountLeft < 0 ? 'text-red-600' : 'text-green-600';
  };

  const getDifferenceDisplay = (difference) => {
    if (difference === null) return null;
    if (difference > 0) {
      return {
        color: 'text-green-600',
        icon: <TrendingUp className="h-4 w-4" />,
        text: `+${formatAmount(difference)}`
      };
    }
    if (difference < 0) {
      return {
        color: 'text-red-600',
        icon: <TrendingDown className="h-4 w-4" />,
        text: formatAmount(difference)
      };
    }
    return {
      color: 'text-gray-600',
      icon: <Minus className="h-4 w-4" />,
      text: formatAmount(0)
    };
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <Calendar className="h-12 w-12 mx-auto text-gray-300 mb-4" />
        <p className="text-gray-500">No timeline records found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="relative">
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-300"></div>

        <div className="space-y-8">
          {records.map((record, index) => {
            const previousRecord = records[index + 1];
            const difference = calculateDifference(record, previousRecord);
            const differenceDisplay = getDifferenceDisplay(difference);
            const amountLeft = (record.amountCollected || 0) - (record.amountSpent || 0);
            const previousAmount = record.previousAmount || 0;
            const finalAmountLeft = amountLeft + previousAmount;

            return (
              <div key={record._id} className="relative">
                <div className="absolute left-6 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white shadow"></div>

                <div className="ml-16">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {record.year}{' '}
                      {record.status && record.status.toLowerCase() !== 'conducted' && (
                        <span className="text-sm text-gray-500">(Event {record.status})</span>
                      )}
                    </h3>

                    {isEditMode && (
                      <div className="flex space-x-2">
                        <button onClick={() => onEdit(record)} className="text-indigo-600 hover:text-indigo-800">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(record._id)}
                          disabled={deletingId === record._id}
                          className={`flex items-center justify-center text-red-600 hover:text-red-800 ${
                            deletingId === record._id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {deletingId === record._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Amount Collected</p>
                        <p className="text-lg font-semibold">{formatAmount(record.amountCollected)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount Spent</p>
                        <p className="text-lg font-semibold">{formatAmount(record.amountSpent)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Amount Left</p>
                        <p className={`text-lg font-semibold flex items-center gap-2 ${getAmountLeftStyle(amountLeft)}`}>
                          <span>{formatAmount(amountLeft)}</span>
                          {amountLeft < 0 && <span className="text-sm font-medium">(Shortage)</span>}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Previous Amount</p>
                        <p className="text-lg font-semibold">{formatAmount(previousAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Final Amount Left</p>
                        <p className="text-lg font-semibold">{formatAmount(finalAmountLeft)}</p>
                      </div>
                    </div>

                    {record.remarks && <p>{record.remarks}</p>}
                  </div>
                </div>

                {differenceDisplay && index < records.length - 1 && (
                  <div className="absolute left-8 transform -translate-x-1/2 top-full flex justify-center">
                    <div className={`flex items-center space-x-1 px-2 py-1 rounded-full bg-white shadow-sm border ${differenceDisplay.color}`}>
                      {differenceDisplay.icon}
                      <span className="text-xs font-medium">{differenceDisplay.text}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TimelineRecordsTimeline;

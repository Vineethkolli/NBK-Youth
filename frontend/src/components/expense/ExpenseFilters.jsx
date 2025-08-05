import { Filter, ArrowDown, ArrowUp, Calendar, X } from 'lucide-react';
import { useRef } from 'react';
import { formatDateTime } from '../../utils/dateTime';

function ExpenseFilters({ filters, onChange }) {
  const startRef = useRef(null);
  const endRef = useRef(null);

  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  const openPicker = (ref) => {
    if (ref.current) {
      if (typeof ref.current.showPicker === 'function') {
        ref.current.showPicker();
      } else {
        ref.current.focus();
      }
    }
  };

  const clearDateFilter = (field) => {
    handleChange(field, '');
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <div className="flex items-center">
          <Filter className="h-5 w-5 text-gray-400 mr-2" />
          <span className="text-sm font-medium">Filters:</span>
        </div>

        <select
          value={filters.sort}
          onChange={(e) => handleChange('sort', e.target.value)}
          className="form-select"
        >
          <option value="">Sort</option>
          <option value="desc">Descending</option>
          <option value="asc">Ascending</option>
        </select>
        
        <select
          value={filters.paymentMode}
          onChange={(e) => handleChange('paymentMode', e.target.value)}
          className="form-select"
        >
          <option value="">Payment Mode</option>
          <option value="cash">Cash</option>
          <option value="online">Online</option>
        </select>

        <select
          value={filters.verifyLog}
          onChange={(e) => handleChange('verifyLog', e.target.value)}
          className="form-select"
        >
          <option value="">Verify Log</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="not verified">Not Verified</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Date Range Filters */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-4">
        <span className="text-sm font-medium text-gray-600">Date Range:</span>
        
        {/* Start Date Picker */}
        <div className="flex items-center">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => openPicker(startRef)}
          >
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <input
              ref={startRef}
              type="datetime-local"
              value={filters.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="form-select absolute w-0 opacity-0"
            />
            <span className="text-sm">
              {filters.startDate
                ? formatDateTime(filters.startDate)
                : 'Start Date & Time'}
            </span>
          </div>
          {filters.startDate && (
            <button
              onClick={() => clearDateFilter('startDate')}
              className="ml-2 text-gray-400 hover:text-gray-600"
              title="Clear start date"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* End Date Picker */}
        <div className="flex items-center">
          <div
            className="flex items-center cursor-pointer"
            onClick={() => openPicker(endRef)}
          >
            <Calendar className="h-5 w-5 text-gray-400 mr-2" />
            <input
              ref={endRef}
              type="datetime-local"
              value={filters.endDate || ''}
              min={filters.startDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="form-select opacity-0 absolute w-0"
            />
            <span className="text-sm">
              {filters.endDate
                ? formatDateTime(filters.endDate)
                : 'End Date & Time'}
            </span>
          </div>
          {filters.endDate && (
            <button
              onClick={() => clearDateFilter('endDate')}
              className="ml-2 text-gray-400 hover:text-gray-600"
              title="Clear end date"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseFilters;

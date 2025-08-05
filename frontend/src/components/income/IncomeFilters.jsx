import { Filter, ArrowDown, ArrowUp, Calendar } from 'lucide-react';
import { useRef } from 'react';

function IncomeFilters({ filters, onChange }) {
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

  const formatDateForDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4 ">

      <div className="flex items-center">
        <Filter className="h-5 w-5 text-gray-400 mr-2" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <select
        value={filters.status}
        onChange={(e) => handleChange('status', e.target.value)}
        className="form-select"
      >
        <option value="">Status</option>
        <option value="paid">Paid</option>
        <option value="not paid">Not Paid</option>
      </select>

      <select
        value={filters.belongsTo}
        onChange={(e) => handleChange('belongsTo', e.target.value)}
        className="form-select"
      >
        <option value="">Belongs To</option>
        <option value="villagers">Villagers</option>
        <option value="youth">Youth</option>
      </select>

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
        <option value="web app">Web App</option>
      </select>

      <select
        value={filters.verifyLog}
        onChange={(e) => handleChange('verifyLog', e.target.value)}
        className="form-select"
      >
        <option value="">Verify Log</option>
        <option value="verified">Verified</option>
        <option value="not verified">Not Verified</option>
        <option value="rejected">Rejected</option>
      </select>

      {/* Start Date Picker */}
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
            ? formatDateForDisplay(filters.startDate)
            : 'Start Date & Time'}
        </span>
      </div>

      {/* End Date Picker */}
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
            ? formatDateForDisplay(filters.endDate)
            : 'End Date & Time'}
        </span>
      </div>
    </div>
  );
}

export default IncomeFilters;

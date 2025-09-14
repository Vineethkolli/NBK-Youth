import { useRef, useState, useEffect } from 'react';
import { Filter, Calendar, ChevronDown, X } from 'lucide-react'; 
import { formatDateTime } from '../../utils/dateTime'; 

const ACTION_OPTIONS = ['CREATE', 'UPDATE', 'DELETE', 'VERIFY', 'RESTORE'];

function LogFilters({ filters, onChange }) {
  const startRef = useRef(null);
  const endRef = useRef(null);
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [selectedActions, setSelectedActions] = useState(ACTION_OPTIONS);

  useEffect(() => {
    onChange({ ...filters, action: selectedActions.join(',') });
  }, [selectedActions]);

  const toggleAction = (action) => {
    setSelectedActions((prev) =>
      prev.includes(action) ? prev.filter((a) => a !== action) : [...prev, action]
    );
  };

  const isAllSelected = selectedActions.length === ACTION_OPTIONS.length;

  const toggleAllActions = () => {
    setSelectedActions(isAllSelected ? [] : ACTION_OPTIONS);
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
    onChange({ ...filters, [field]: '' });
  };

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4 relative">
      <div className="flex items-center">
        <Filter className="h-5 w-5 text-gray-400 mr-2" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      {/* Action Checkboxes */}
      <div className="relative">
        <button
          onClick={() => setShowActionDropdown((prev) => !prev)}
          className="form-select flex items-center gap-1"
        >
          {isAllSelected ? 'All Actions' : selectedActions.join(', ')}
          <ChevronDown className="h-4 w-4 ml-1" />
        </button>

        {showActionDropdown && (
          <div className="absolute z-10 mt-1 bg-white border rounded shadow p-2 w-48">
            <div className="mb-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleAllActions}
                />
                <span className="text-sm font-medium">All Actions</span>
              </label>
            </div>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {ACTION_OPTIONS.map((action) => (
                <label key={action} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedActions.includes(action)}
                    onChange={() => toggleAction(action)}
                  />
                  <span className="text-sm">{action}</span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Entity Filter */}
      <select
        value={filters.entityType}
        onChange={(e) => onChange({ ...filters, entityType: e.target.value })}
        className="form-select"
      >
        <option value="">All Entities</option>
        <option value="User">User</option>
        <option value="Income">Income</option>
        <option value="Expense">Expense</option>
        <option value="EstimatedIncome">Estimated Income</option>
        <option value="EstimatedExpense">Estimated Expense</option>
        <option value="Payment">Payment</option>
        <option value="Banner">PopUp Banner</option>
        <option value="PreviousYear">Previous Year</option>
        <option value="MaintenanceMode">Maintenance Mode</option>
        <option value="HiddenProfile">Hidden Profile</option>
        <option value="Event">Event</option>
        <option value="Slide">Slide</option>
        <option value="Notification">Notification</option>
        <option value="Vibe">Vibe</option>
        <option value="Moment">Moment</option>
        <option value="Game">Game</option>
        <option value="Committee">Committee</option>
        <option value="PaymentDetails">Payment Details</option>
        <option value="DeveloperOptions">Developer Options</option>
        <option value="EventLabel">Event Label</option>
        <option value="LockSettings">Lock Settings</option>
        <option value="FinancialRecord">Financial Record</option>
        <option value="EventRecord">Event Record</option>
        <option value="Snapshot">Snapshot</option>
        <option value="History">History</option>
      </select>

      {/* Start Date Picker */}
      <div className="flex items-center">
        <div className="flex items-center cursor-pointer" onClick={() => openPicker(startRef)}>
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <input
            ref={startRef}
            type="datetime-local"
            value={filters.startDate}
            onChange={(e) => onChange({ ...filters, startDate: e.target.value })}
            className="form-select absolute w-0 opacity-0"
          />
          <span className="text-sm">
            {filters.startDate ? formatDateTime(filters.startDate) : 'Start Date & Time'}
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
        <div className="flex items-center cursor-pointer" onClick={() => openPicker(endRef)}>
          <Calendar className="h-5 w-5 text-gray-400 mr-2" />
          <input
            ref={endRef}
            type="datetime-local"
            value={filters.endDate}
            min={filters.startDate || ''}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
            className="form-select opacity-0 absolute w-0"
          />
          <span className="text-sm">
            {filters.endDate ? formatDateTime(filters.endDate) : 'End Date & Time'}
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
  );
}

export default LogFilters;
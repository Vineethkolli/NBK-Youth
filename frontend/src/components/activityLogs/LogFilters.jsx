import { useRef } from 'react';
import { Filter, Calendar } from 'lucide-react';

function LogFilters({ filters, onChange }) {
  const startRef = useRef(null);
  const endRef = useRef(null);

  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
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

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
      <div className="flex items-center">
        <Filter className="h-5 w-5 text-gray-400 mr-2" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <select
        value={filters.action}
        onChange={(e) => handleChange('action', e.target.value)}
        className="form-select"
      >
        <option value="">All Actions</option>
        <option value="CREATE">Create</option>
        <option value="UPDATE">Update</option>
        <option value="DELETE">Delete</option>
        <option value="VERIFY">Verify</option>
        <option value="RESTORE">Restore</option>
      </select>

      <select
        value={filters.entityType}
        onChange={(e) => handleChange('entityType', e.target.value)}
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
        <option value="Collection">Vibe</option>
        <option value="Moment">Moment</option>
        <option value="Game">Game</option>
        <option value="Committee">Committee</option>
        <option value="DeveloperOptions">Developer Options</option>
      </select>

      <div
        className="flex items-center cursor-pointer"
        onClick={() => openPicker(startRef)}
      >
        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
        <input
          ref={startRef}
          type="datetime-local"
          value={filters.startDate}
          onChange={(e) => handleChange('startDate', e.target.value)}
          className="form-select absolute w-0"
        />
        <span className="text-sm ">
          {filters.startDate
            ? new Date(filters.startDate).toLocaleString()
            : 'Start Date & Time'}
        </span>
      </div>

      {/* End DateTime Picker (click container to open) */}
      <div
        className="flex items-center cursor-pointer"
        onClick={() => openPicker(endRef)}
      >
        <Calendar className="h-5 w-5 text-gray-400 mr-2" />
        <input
          ref={endRef}
          type="datetime-local"
          value={filters.endDate}
          min={filters.startDate || ''}
          onChange={(e) => handleChange('endDate', e.target.value)}
          className="form-select opacity-0 absolute w-0"
        />
        <span className="text-sm">
          {filters.endDate
            ? new Date(filters.endDate).toLocaleString()
            : 'End Date & Time'}
        </span>
      </div>
    </div>
  );
}

export default LogFilters;
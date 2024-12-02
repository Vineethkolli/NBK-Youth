import { Filter } from 'lucide-react';

function ExpenseFilters({ filters, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <Filter className="h-5 w-5 text-gray-400 mr-2" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

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
  );
}

export default ExpenseFilters;
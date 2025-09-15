import { Filter } from 'lucide-react';

function VerificationFilters({ filters, onChange }) {
  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center">
        <Filter className="h-5 w-5 text-gray-400 mr-2" />
        <span className="text-sm font-medium">Filters:</span>
      </div>

      <select
        value={filters.verifyLog}
        onChange={(e) => onChange({ ...filters, verifyLog: e.target.value })}
        className="form-select"
      >
        <option value="not verified">Not Verified</option>
        <option value="verified">Verified</option>
        <option value="rejected">Rejected</option>
      </select>
    </div>
  );
}

export default VerificationFilters;

function AuthSessionsFilters({ filters, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        <select
          value={filters.isValid}
          onChange={(e) => handleChange('isValid', e.target.value)}
          className="form-select"
        >
          <option value="">Valid Status</option>
          <option value="true">Valid (True)</option>
          <option value="false">Invalid (False)</option>
        </select>

        <select
          value={filters.action}
          onChange={(e) => handleChange('action', e.target.value)}
          className="form-select"
        >
          <option value="">Action</option>
          <option value="signin">Sign In</option>
          <option value="signup">Sign Up</option>
          <option value="google-signin">Google Sign In</option>
          <option value="google-signup">Google Sign Up</option>
        </select>

        <select
          value={filters.sortOrder}
          onChange={(e) => handleChange('sortOrder', e.target.value)}
          className="form-select"
        >
          <option value="">Sort by RegID</option>
          <option value="asc">Ascending</option>
          <option value="desc">Descending</option>
        </select>

        <select
          value={filters.timeFilter || 'sessions'}
          onChange={(e) => handleChange('timeFilter', e.target.value)}
          className="form-select"
        >
          <option value="sessions">All Sessions</option>
          <option value="today">Today</option>
          <option value="monthly">This Month</option>
        </select>
      </div>
    </div>
  );
}

export default AuthSessionsFilters;

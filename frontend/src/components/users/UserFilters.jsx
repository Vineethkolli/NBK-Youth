function UserFilters({ filters, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...filters,
      [field]: value,
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-3 sm:gap-4">
      <select
        value={filters.role}
        onChange={(e) => handleChange('role', e.target.value)}
        className="form-select"
      >
        <option value="">Role</option>
        <option value="user">User</option>
        <option value="admin">Admin</option>
        <option value="financier">Financier</option>
        <option value="developer">Developer</option>
      </select>

      <select
        value={filters.category}
        onChange={(e) => handleChange('category', e.target.value)}
        className="form-select"
      >
        <option value="">Category</option>
        <option value="youth">Youth</option>
        <option value="villager">Villager</option>
        <option value="general">General</option>
      </select>

      <select
        value={filters.googleLinked}
        onChange={(e) => handleChange('googleLinked', e.target.value)}
        className="form-select"
      >
        <option value="">Google</option>
        <option value="true">Linked</option>
        <option value="false">Not Linked</option>
      </select>

      <select
        value={filters.notifications}
        onChange={(e) => handleChange('notifications', e.target.value)}
        className="form-select"
      >
        <option value="">Notifications</option>
        <option value="true">Allowed</option>
        <option value="false">Not Allowed</option>
      </select>

      <select
        value={filters.language}
        onChange={(e) => handleChange('language', e.target.value)}
        className="form-select"
      >
        <option value="">Language</option>
        <option value="en">English</option>
        <option value="te">Telugu</option>
      </select>
    </div>
  );
}

export default UserFilters;

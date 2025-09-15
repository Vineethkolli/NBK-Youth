import { Activity, Calendar, User, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';

function LogStats({ stats, loading }) {
  const [expandedEntities, setExpandedEntities] = useState(new Set());

  const toggleEntityExpansion = (entityType) => {
    const newExpanded = new Set(expandedEntities);
    if (newExpanded.has(entityType)) {
      newExpanded.delete(entityType);
    } else {
      newExpanded.add(entityType);
    }
    setExpandedEntities(newExpanded);
  };

  const getActionColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800';
      case 'DELETE':
        return 'bg-red-100 text-red-800';
      case 'VERIFY':
        return 'bg-purple-100 text-purple-800';
      case 'RESTORE':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center text-gray-500">
        No statistics available
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Activity className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Logs</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalLogs?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Last 24 Hours</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.recentActivity?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Actions Breakdown</h3>
          <div className="space-y-3">
            {stats.actionBreakdown && Object.entries(stats.actionBreakdown).map(([action, count]) => (
              <div key={action} className="flex justify-between items-center">
                <span className="text-sm font-medium">{action}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{
                        width: `${(count / stats.totalLogs) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">Entity Breakdown</h3>
          <div className="space-y-3">
            {stats.entityBreakdown && Object.entries(stats.entityBreakdown).map(([entity, count]) => (
              <div key={entity} className="flex justify-between items-center">
                <span className="text-sm font-medium">{entity}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full"
                      style={{
                        width: `${(count / stats.totalLogs) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-600">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed User Activity Breakdown */}
      {stats.detailedUserBreakdown && Object.keys(stats.detailedUserBreakdown).length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <User className="h-5 w-5 mr-2" />
            User Activity Breakdown
          </h3>
          <div className="space-y-4">
            {Object.entries(stats.detailedUserBreakdown).map(([entityType, users]) => (
              <div key={entityType} className="border rounded-lg">
                <button
                  onClick={() => toggleEntityExpansion(entityType)}
                  className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    {expandedEntities.has(entityType) ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                    <span className="font-medium">{entityType}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      ({users.length} user{users.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {users.reduce((sum, user) => sum + user.totalActions, 0)} total actions
                  </span>
                </button>
                
                {expandedEntities.has(entityType) && (
                  <div className="border-t bg-gray-50">
                    <div className="p-4 space-y-3">
                      {users.map((user) => (
                        <div key={user.registerId} className="bg-white rounded-lg p-3 border">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <span className="font-medium">{user.userName}</span>
                              <span className="ml-2 text-sm text-gray-500">({user.registerId})</span>
                            </div>
                            <span className="text-sm font-medium text-gray-600">
                              {user.totalActions} action{user.totalActions !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {Object.entries(user.actions).map(([action, count]) => (
                              <span
                                key={action}
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getActionColor(action)}`}
                              >
                                {action}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default LogStats;

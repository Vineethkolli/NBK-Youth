import { Activity, Users, Calendar, TrendingUp } from 'lucide-react';

function LogStats({ stats, loading }) {
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

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Activity Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.recentActivity && stats.totalLogs 
                  ? ((stats.recentActivity / stats.totalLogs) * 100).toFixed(1) + '%'
                  : '0%'
                }
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
    </div>
  );
}

export default LogStats;
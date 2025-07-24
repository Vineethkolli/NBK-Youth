import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

function LogTable({ logs, loading, pagination, onPageChange }) {
  const [expandedRows, setExpandedRows] = useState(new Set());

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
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

  const toggleRowExpansion = (logId) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const renderChanges = (changes) => {
    if (!changes || (!changes.before && !changes.after)) {
      return <span className="text-gray-500">No changes recorded</span>;
    }

    return (
      <div className="space-y-2">
        {changes.before && (
          <div>
            <h5 className="font-medium text-red-600">Before:</h5>
            <pre className="text-xs bg-red-50 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(changes.before, null, 2)}
            </pre>
          </div>
        )}
        {changes.after && (
          <div>
            <h5 className="font-medium text-green-600">After:</h5>
            <pre className="text-xs bg-green-50 p-2 rounded overflow-auto max-h-32">
              {JSON.stringify(changes.after, null, 2)}
            </pre>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Entity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Details
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <>
                <tr key={log._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatDate(log.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="font-medium">{log.userName}</div>
                      <div className="text-gray-500">{log.registerId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getActionColor(log.action)}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div>
                      <div className="font-medium">{log.entityType}</div>
                      <div className="text-gray-500">{log.entityId}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {log.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <button
                      onClick={() => toggleRowExpansion(log._id)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {expandedRows.has(log._id) ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </td>
                </tr>
                {expandedRows.has(log._id) && (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 bg-gray-50">
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-medium mb-2">Changes:</h4>
                          {renderChanges(log.changes)}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-3 border-t">
        <div className="text-sm text-gray-700">
          Showing page {pagination.currentPage} of {pagination.totalPages} 
          ({pagination.totalCount} total entries)
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-1 border rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default LogTable;
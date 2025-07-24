// components/logs/LogPrint.jsx
import React, { useRef } from 'react';

function LogPrint({ logs }) {
  const printRef = useRef();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const printWindow = window.open('', '', 'height=700,width=900');
    printWindow.document.write('<html><head><title>Activity Logs</title>');
    printWindow.document.write('<style>table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ccc; padding: 8px; text-align: left; font-size: 12px; } th { background: #f4f4f4; }</style>');
    printWindow.document.write('</head><body>');
    printWindow.document.write(content);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
  };

  return (
    <>
      <button
        onClick={handlePrint}
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
      >
        🖨️ Print Logs
      </button>

      <div ref={printRef} style={{ display: 'none' }}>
        <h2>Activity Logs</h2>
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Description</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log._id}>
                <td>{formatDate(log.createdAt)}</td>
                <td>
                  <strong>{log.userName}</strong><br />
                  <span>{log.registerId}</span>
                </td>
                <td>{log.action}</td>
                <td>
                  <strong>{log.entityType}</strong><br />
                  <span>{log.entityId}</span>
                </td>
                <td>{log.description}</td>
                <td>
                  {log.changes?.before || log.changes?.after
                    ? 'Has Changes'
                    : 'No Changes'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default LogPrint;

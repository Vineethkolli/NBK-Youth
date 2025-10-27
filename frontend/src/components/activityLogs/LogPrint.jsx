import { useState } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer, Loader2 } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { toast } from 'react-hot-toast';
import { formatDateTime } from '../../utils/dateTime'; 

const ActivityLogPrint = ({ filters, search }) => {
  const [loading, setLoading] = useState(false);

  const handlePrint = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        ...filters,
        limit: 10000,
        page: 1,
      });

      const { data } = await axios.get(`${API_URL}/api/activity-logs?${params}`);
      const logs = data.logs;

      const doc = new jsPDF();
      const title = 'Activity Logs Report';
      const timestamp = new Date().toLocaleString();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const headers = [
        'S.No',
        'Timestamp',
        'User',
        'Action',
        'Entity',
        'Description',
        'Details',
      ];

      const rows = logs.flatMap((log, idx) => {
        const userLabel = `${log.userName} (${log.registerId})`;
        const entityLabel = `${log.entityType} (${log.entityId})`;
        const mainRow = [
          idx + 1,
          formatDateTime(log.createdAt), 
          userLabel,
          log.action,
          entityLabel,
          log.description || '-',
          'See below',
        ];

        const beforeLines = [];
        const afterLines = [];

        if (log.changes) {
          if (log.changes.before) {
            beforeLines.push('Before:');
            Object.entries(log.changes.before).forEach(([key, value]) => {
              if (key === 'deviceInfo' && typeof value === 'object') {
                beforeLines.push(`  ${key}:`);
                Object.entries(value).forEach(([k, v]) => {
                  if (k === 'browser' && typeof v === 'object') {
                    beforeLines.push(`    browser:`);
                    Object.entries(v).forEach(([bk, bv]) => {
                      beforeLines.push(`      ${bk}: ${bv}`);
                    });
                  } else {
                    beforeLines.push(`    ${k}: ${v}`);
                  }
                });
              } else {
                beforeLines.push(`  ${key}: ${value}`);
              }
            });
          }
          if (log.changes.after) {
            afterLines.push('After:');
            Object.entries(log.changes.after).forEach(([key, value]) => {
              if (key === 'deviceInfo' && typeof value === 'object') {
                afterLines.push(`  ${key}:`);
                Object.entries(value).forEach(([k, v]) => {
                  if (k === 'browser' && typeof v === 'object') {
                    afterLines.push(`    browser:`);
                    Object.entries(v).forEach(([bk, bv]) => {
                      afterLines.push(`      ${bk}: ${bv}`);
                    });
                  } else {
                    afterLines.push(`    ${k}: ${v}`);
                  }
                });
              } else {
                afterLines.push(`  ${key}: ${value}`);
              }
            });
          }
        } else {
          beforeLines.push('No Changes');
        }

        const beforeText = beforeLines.join('\n');
        const afterText = afterLines.join('\n') || '-';

        const halfCols = Math.ceil(headers.length / 2);
        return [
          mainRow,
          [
            {
              colSpan: halfCols,
              content: beforeText,
              styles: { fontSize: 9, textColor: 80 },
            },
            {
              colSpan: headers.length - halfCols,
              content: afterText,
              styles: { fontSize: 9, textColor: 80 },
            },
          ],
        ];
      });

      // Title
      doc.setFontSize(16);
      doc.text(title, pageWidth / 2, 15, { align: 'center' });

      // Table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 25,
        styles: { fontSize: 10 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(`Generated on: ${timestamp}`, 10, pageHeight - 10);
        doc.text(`Page ${i} of ${pageCount}`, pageWidth - 30, pageHeight - 10);
      }

      doc.save('Activity_Logs_Report.pdf');
      toast.success('Report printed successfully');
    } catch (err) {
      toast.error('Failed to fetch all logs for printing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePrint}
      disabled={loading}
      className={`btn-secondary flex items-center ${
        loading ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
      ) : (
        <Printer className="h-4 w-4 mr-1" />
      )}
      <span>{loading ? 'Printing...' : 'Print'}</span>
    </button>
  );
};

export default ActivityLogPrint;

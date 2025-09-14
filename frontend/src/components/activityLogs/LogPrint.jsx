import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { toast } from 'react-hot-toast';
import { formatDateTime } from '../../utils/dateTime'; 

const ActivityLogPrint = ({ filters, search }) => {
  const handlePrint = async () => {
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
            Object.entries(log.changes.before).forEach(
              ([key, value]) => beforeLines.push(`  ${key}: ${value}`)
            );
          }
          if (log.changes.after) {
            afterLines.push('After:');
            Object.entries(log.changes.after).forEach(
              ([key, value]) => afterLines.push(`  ${key}: ${value}`)
            );
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
doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, {
  align: 'center',
});

// Generate the table (NO footer here yet)
autoTable(doc, {
  head: [headers],
  body: rows,
  startY: 25,
  styles: { fontSize: 10 },
});

// ✅ Now all pages exist, so we can add correct page numbers
const pageCount = doc.internal.getNumberOfPages();
const pageWidth = doc.internal.pageSize.getWidth();
const pageHeight = doc.internal.pageSize.getHeight();
const marginLeft = 10;
const marginRight = 10;

for (let i = 1; i <= pageCount; i++) {
  doc.setPage(i);
  doc.setFontSize(9);
  doc.text(`Generated: ${timestamp}`, marginLeft, pageHeight - 10);
  doc.text(`Page ${i} of ${pageCount}`, pageWidth - marginRight, pageHeight - 10, {
    align: 'right',
  });
}

doc.save('Activity_Logs_Report.pdf');

    } catch (err) {
      toast.error('Failed to fetch all logs for printing');
    }
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      <span>Print</span>
    </button>
  );
};

export default ActivityLogPrint;

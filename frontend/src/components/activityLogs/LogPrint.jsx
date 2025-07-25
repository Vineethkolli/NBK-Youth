import React from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { Printer } from 'lucide-react';

const ActivityLogPrint = ({ logs }) => {
  const handlePrint = () => {
    const doc = new jsPDF();
    const title = 'Activity Logs Report';
    const timestamp = new Date().toLocaleString();

    // Table headers
    const headers = [
      'S.No',
      'Timestamp',
      'User',
      'Action',
      'Entity',
      'Description',
      'Details',
    ];

    // Build rows with detail lines side by side
    const rows = logs.flatMap((log, idx) => {
      // Main row data
      const userLabel = `${log.userName} (${log.registerId})`;
      const entityLabel = `${log.entityType} (${log.entityId})`;
      const mainRow = [
        idx + 1,
        new Date(log.createdAt).toLocaleString(),
        userLabel,
        log.action,
        entityLabel,
        log.description || '-',
        'See below',
      ];

      // Prepare before/after text arrays
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

      // Split detail row into two cells
      const halfCols = Math.ceil(headers.length / 2);
      return [
        mainRow,
        [
          { colSpan: halfCols, content: beforeText, styles: { fontSize: 9, textColor: 80 } },
          { colSpan: headers.length - halfCols, content: afterText, styles: { fontSize: 9, textColor: 80 } },
        ],
      ];
    });

    // Document title
    doc.setFontSize(16);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

    // Generate table
    doc.autoTable({
      head: [headers],
      body: rows,
      startY: 25,
      styles: { fontSize: 10 },
      didDrawPage: data => {
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(9);
        doc.text(
          `Generated: ${timestamp}`,
          data.settings.margin.left,
          doc.internal.pageSize.getHeight() - 10
        );
        doc.text(
          `Page ${doc.internal.getCurrentPageInfo().pageNumber}/${pageCount}`,
          doc.internal.pageSize.getWidth() - data.settings.margin.right,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'right' }
        );
      },
    });

    doc.save('Activity_Logs_Report.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary">
      <Printer className="h-4 w-4 mr-2 inline" />
      <span>Print</span>
    </button>
  );
};

export default ActivityLogPrint;
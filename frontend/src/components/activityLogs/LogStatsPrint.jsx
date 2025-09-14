import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';

const LogStatsPrint = ({ stats }) => {

  const formatNumber = (n) => {
    if (n === undefined || n === null) return '0';
    return n.toLocaleString();
  };

  const handlePrint = () => {
    const doc = new jsPDF();
    let yPos = 20;

    // Title (centered)
    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    const title = 'Activity Logs Statistics Report';
    const titleWidth = doc.getTextWidth(title);
    const xPos = (doc.internal.pageSize.width - titleWidth) / 2;
    doc.text(title, xPos, yPos);
    yPos += 10;

    // Shared styles
    const headStyles = { fillColor: [33, 115, 175], textColor: [255, 255, 255], fontSize: 10 };
    const commonStyles = { fontSize: 10, cellPadding: 2, rowHeight: 7, halign: 'center' };

    // ----- Overview -----
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Overview', 15, yPos);
    yPos += 4;

    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Count']],
      body: [
        ['Total Logs', formatNumber(stats?.totalLogs)],
        ['Last 24 Hours', formatNumber(stats?.recentActivity)]
      ],
      theme: 'grid',
      headStyles,
      styles: commonStyles,
      columnStyles: { 0: { cellWidth: 110 }, 1: { cellWidth: 70 } }
    });

    yPos = doc.lastAutoTable.finalY + 16;

    // ----- Actions Breakdown -----
    if (stats?.actionBreakdown) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Actions Breakdown', 15, yPos);
      yPos += 4;

      const actionBody = Object.entries(stats.actionBreakdown).map(([action, count]) => [
        action,
        formatNumber(count),
        `${stats?.totalLogs ? ((count / stats.totalLogs) * 100).toFixed(1) : 0}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Action', 'Count', 'Percentage']],
        body: actionBody,
        theme: 'grid',
        headStyles,
        styles: commonStyles,
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 50 }, 2: { cellWidth: 50 } }
      });

      yPos = doc.lastAutoTable.finalY + 16;
    }

    // ----- Entity Breakdown -----
    if (stats?.entityBreakdown) {
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Entity Breakdown', 15, yPos);
      yPos += 4;

      const entityBody = Object.entries(stats.entityBreakdown).map(([entity, count]) => [
        entity,
        formatNumber(count),
        `${stats?.totalLogs ? ((count / stats.totalLogs) * 100).toFixed(1) : 0}%`
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Entity', 'Count', 'Percentage']],
        body: entityBody,
        theme: 'grid',
        headStyles,
        styles: commonStyles,
        columnStyles: { 0: { cellWidth: 80 }, 1: { cellWidth: 50 }, 2: { cellWidth: 50 } }
      });

      yPos = doc.lastAutoTable.finalY + 16;
    }

    // ----- Detailed User Activity Breakdown -----
    if (stats?.detailedUserBreakdown && Object.keys(stats.detailedUserBreakdown).length > 0) {
      const entries = Object.entries(stats.detailedUserBreakdown);

      for (let idx = 0; idx < entries.length; idx++) {
        const [entityType, users] = entries[idx];

        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`Entity Type - ${entityType}`, 15, yPos);
        yPos += 4;

        const body = (users || []).map((user) => [
          user.userName || '-',
          user.registerId || '-',
          formatNumber(user.totalActions || 0),
          Object.entries(user.actions || {})
            .map(([action, cnt]) => `${action}: ${cnt}`)
            .join(', ')
        ]);

        autoTable(doc, {
          startY: yPos,
          head: [['User Name', 'Register ID', 'Total Actions', 'Actions']],
          body,
          theme: 'grid',
          headStyles,
          styles: commonStyles,
          columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30 }, 2: { cellWidth: 30 }, 3: { cellWidth: 70 } }
        });

        yPos = doc.lastAutoTable.finalY + 16;
      }
    }

    // Footer
    const timestamp = new Date().toLocaleString();
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated on: ${timestamp}`, 10, doc.internal.pageSize.height - 10);
      doc.text(`Page ${i} of ${pageCount}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
    }

    doc.save('Activity_Logs_Statistics_Report.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      Print
    </button>
  );
};

export default LogStatsPrint;

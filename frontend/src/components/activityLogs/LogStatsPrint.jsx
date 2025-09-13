import React from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Printer } from 'lucide-react';
import { useEventLabel } from '../../context/EventLabelContext';

const LogStatsPrint = ({ stats }) => {
  const { eventLabel } = useEventLabel();

  const handlePrint = () => {
    const doc = new jsPDF();
    const timestamp = new Date().toLocaleString();

    // ----- Title -----
    doc.setFontSize(16);
    doc.text('Log Statistics Report', 105, 15, { align: 'center' });

    if (eventLabel) {
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(eventLabel.label, 105, 22, { align: 'center' });
      doc.setTextColor(0, 0, 0);
    }

    let yPos = eventLabel ? 30 : 25;

    // ----- Overview -----
    autoTable(doc, {
      startY: yPos,
      head: [['Metric', 'Count']],
      body: [
        ['Total Logs', stats.totalLogs?.toLocaleString() || '0'],
        ['Last 24 Hours', stats.recentActivity?.toLocaleString() || '0']
      ],
      styles: { halign: 'center' }
    });

    yPos = doc.lastAutoTable.finalY + 10;

    // ----- Action Breakdown -----
    if (stats.actionBreakdown) {
      autoTable(doc, {
        startY: yPos,
        head: [['Action', 'Count', 'Percentage']],
        body: Object.entries(stats.actionBreakdown).map(([action, count]) => [
          action,
          count,
          `${((count / stats.totalLogs) * 100).toFixed(1)}%`
        ]),
        theme: 'grid'
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // ----- Entity Breakdown -----
    if (stats.entityBreakdown) {
      autoTable(doc, {
        startY: yPos,
        head: [['Entity', 'Count', 'Percentage']],
        body: Object.entries(stats.entityBreakdown).map(([entity, count]) => [
          entity,
          count,
          `${((count / stats.totalLogs) * 100).toFixed(1)}%`
        ]),
        theme: 'grid'
      });
      yPos = doc.lastAutoTable.finalY + 10;
    }

    // ----- Detailed User Activity Breakdown -----
    if (stats.detailedUserBreakdown && Object.keys(stats.detailedUserBreakdown).length > 0) {
      Object.entries(stats.detailedUserBreakdown).forEach(([entityType, users], idx) => {
        autoTable(doc, {
          startY: yPos,
          head: [['Entity Type', 'User Name', 'Register ID', 'Total Actions', 'Actions']],
          body: users.map(user => [
            entityType,
            user.userName,
            user.registerId,
            user.totalActions,
            Object.entries(user.actions)
              .map(([action, count]) => `${action}: ${count}`)
              .join(', ')
          ]),
          theme: 'grid'
        });
        yPos = doc.lastAutoTable.finalY + 10;

        // If near page bottom, add new page
        if (yPos > 260 && idx !== Object.keys(stats.detailedUserBreakdown).length - 1) {
          doc.addPage();
          yPos = 20;
        }
      });
    }

    // ----- Footer -----
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(9);
      doc.text(`Generated on: ${timestamp}`, 15, doc.internal.pageSize.height - 10);
      doc.text(
        `Page ${i} of ${pageCount}`,
        doc.internal.pageSize.width - 40,
        doc.internal.pageSize.height - 10
      );
    }

    doc.save('Log_Stats_Report.pdf');
  };

  return (
    <button onClick={handlePrint} className="btn-secondary flex items-center">
      <Printer className="h-4 w-4 mr-1 inline" />
      Print
    </button>
  );
};

export default LogStatsPrint;

import { useState, useEffect } from 'react';
import { X, ArrowDown, Printer } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

function ModificationLog({ onClose }) {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [search]);

  const fetchLogs = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/expenses/logs`, {
        params: { search }
      });
      setLogs(data);
    } catch (error) {
      toast.error('Failed to fetch modification logs');
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  const getSubExpensesText = (subExpenses) => {
    if (!subExpenses || !subExpenses.length) return 'N/A';
    return subExpenses.map(sub => 
      `${sub.subPurpose}: ${sub.subAmount}: ${sub.billImage ? 'Available' : 'No Bill'}`
    ).join(', ');
  };
  const handlePrint = () => {
    const doc = new jsPDF();
  
    doc.setFontSize(16);
    doc.text('Expense Modification Log', 14, 15);
  
    let yPos = 30;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
  
    logs.forEach((log, index) => {
      const logNumber = logs.length - index;
  
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = 30;
      }
  
      doc.setFontSize(12);
      doc.setTextColor(100);
      doc.text(`Log Entry #${logNumber}`, 14, yPos);
      yPos += 10;
  
      // Original and Updated Data
      const originalData = [
        `Expense ID: ${log.originalData.expenseId}`,
        `Register ID: ${log.originalData.registerId}`,
        `Spender Name: ${log.originalData.name}`,
        `Phone Number: ${log.originalData.phoneNumber || 'N/A'}`,
        `Amount Taken: ${log.originalData.amount}`,
        `Amount Returned: ${log.originalData.amountReturned || '0'}`,
        `Payment Mode: ${log.originalData.paymentMode}`,
        `Purpose: ${log.originalData.purpose}`,
        `Sub Expenses: ${getSubExpensesText(log.originalData.subExpenses)}`,
        `Verify Log: ${log.originalData.verifyLog}`,
        `Created By: ${log.originalData.registerId}`,
        `Created At: ${formatDate(log.originalData.createdAt)}`
      ];
  
      const updatedData = [
        `Expense ID: ${log.updatedData.expenseId || log.originalData.expenseId}`,
        `Register ID: ${log.updatedData.registerId || log.originalData.registerId}`,
        `Spender Name: ${log.updatedData.name || log.originalData.name}`,
        `Phone Number: ${log.updatedData.phoneNumber || log.originalData.phoneNumber || 'N/A'}`,
        `Amount Taken: ${log.updatedData.amount || log.originalData.amount}`,
        `Amount Returned: ${log.updatedData.amountReturned || '0'}`,
        `Payment Mode: ${log.updatedData.paymentMode || log.originalData.paymentMode}`,
        `Purpose: ${log.updatedData.purpose || log.originalData.purpose}`,
        `Sub Expenses: ${getSubExpensesText(log.updatedData.subExpenses)}`,
        `Verify Log: ${log.updatedData.verifyLog || log.originalData.verifyLog}`,
        `Modified By: ${log.registerId}`,
        `Modified At: ${formatDate(log.createdAt)}`
      ];
  
      doc.setFontSize(10);
      doc.setTextColor(0);
  
      const leftColumnX = 14;
      const rightColumnX = 105;
  
      doc.text('Original Data:', leftColumnX, yPos);
      doc.text('Updated Data:', rightColumnX, yPos);
      yPos += 5;
  
      for (let i = 0; i < Math.max(originalData.length, updatedData.length); i++) {
        if (yPos > pageHeight - margin) {
          doc.addPage();
          yPos = 30;
          doc.text('Original Data:', leftColumnX, yPos);
          doc.text('Updated Data:', rightColumnX, yPos);
          yPos += 5;
        }
  
        if (originalData[i]) {
          doc.text(originalData[i], leftColumnX, yPos);
        }
        if (updatedData[i]) {
          doc.text(updatedData[i], rightColumnX, yPos);
        }
  
        yPos += 5;
      }
  
      yPos += 10;
      if (yPos < pageHeight - margin) {
        doc.setDrawColor(200);
        doc.line(14, yPos, 196, yPos);
        yPos += 15;
      }
    });
  
    doc.save('Expense_Modification_Log.pdf');
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Modification Log</h2>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex items-center px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Log
            </button>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by expense ID, register ID, name"
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log._id} className="border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Original Data</h3>
                  <div className="mt-2 text-sm space-y-1">
                    <p>Expense ID: {log.originalData.expenseId}</p>
                    <p>Register ID: {log.originalData.registerId}</p>
                    <p>Spender Name: {log.originalData.name}</p>
                    <p>Phone Number: {log.originalData.phoneNumber}</p>
                    <p>Amount Taken: {log.originalData.amount}</p>
                    <p>Amount Returned: {log.originalData.amountReturned || '0'}</p>
                    <p>Payment Mode: {log.originalData.paymentMode}</p>
                    <p>Purpose: {log.originalData.purpose}</p>
                    <p>Sub Expenses: {getSubExpensesText(log.originalData.subExpenses)}</p>
                    <p>Verify Log: {log.originalData.verifyLog}</p>
                    <p>Created By: {log.originalData.registerId}</p>
                    <p>Created At: {formatDate(log.originalData.createdAt)}</p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center">
                    <ArrowDown className="h-5 w-5 text-gray-400" />
                    <h3 className="font-medium ml-2">Updated Data</h3>
                  </div>
                  <div className="mt-2 text-sm space-y-1">
                    <p>Expense ID: {log.updatedData.expenseId || log.originalData.expenseId}</p>
                    <p>Register ID: {log.updatedData.registerId || log.originalData.registerId}</p>
                    <p>Spender Name: {log.updatedData.name || log.originalData.name}</p>
                    <p>Phone Number: {log.updatedData.phoneNumber || log.originalData.phoneNumber}</p>
                    <p>Amount Taken: {log.updatedData.amount || log.originalData.amount}</p>
                    <p>Amount Returned: {log.updatedData.amountReturned || '0'}</p>
                    <p>Payment Mode: {log.updatedData.paymentMode || log.originalData.paymentMode}</p>
                    <p>Purpose: {log.updatedData.purpose || log.originalData.purpose}</p>
                    <p>Sub Expenses: {getSubExpensesText(log.updatedData.subExpenses)}</p>
                    <p>Verify Log: {log.updatedData.verifyLog || log.originalData.verifyLog}</p>
                    <p>Modified By: {log.registerId}</p>
                    <p>Modified At: {formatDate(log.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ModificationLog;
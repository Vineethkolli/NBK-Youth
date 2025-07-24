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
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/incomes/logs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: { search },
      });
      setLogs(data);
    } catch (error) {
      console.error(error.response?.data?.message || 'Error fetching logs');
      toast.error(error.response?.data?.message || 'Failed to fetch modification logs');
    }
  };

  const formatDate = (dateString) => new Date(dateString).toLocaleString();

  const handlePrint = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text('Income Modification Log', 14, 15);

    logs.forEach((log, index) => {
      const startY = 25 + index * 70;
      if (startY + 60 > doc.internal.pageSize.height) {
        doc.addPage();
      }

      doc.setFontSize(12);
      doc.text(`Original Data`, 14, startY);
      doc.setFontSize(10);
      doc.text([
        `Income ID: ${log.originalData.incomeId}`,
        `Name: ${log.originalData.name}`,
        `Email: ${log.originalData.email || 'N/A'}`,
        `Phone Number: ${log.originalData.phoneNumber || 'N/A'}`,
        `Amount: ${log.originalData.amount}`,
        `Status: ${log.originalData.status}`,
        `Payment Mode: ${log.originalData.paymentMode}`,
        `Belongs To: ${log.originalData.belongsTo || 'N/A'}`,
        `Verify Log: ${log.originalData.verifyLog}`,
        `Created By: ${log.originalData.registerId}`,
        `Created At: ${formatDate(log.originalData.createdAt)}`,
      ].join('\n'), 14, startY + 6);

      doc.setFontSize(12);
      doc.text(`Updated Data`, 105, startY);
      doc.setFontSize(10);
      doc.text([
        `Income ID: ${log.updatedData.incomeId || log.originalData.incomeId}`,
        `Name: ${log.updatedData.name || 'N/A'}`,
        `Email: ${log.updatedData.email || 'N/A'}`,
        `Phone Number: ${log.updatedData.phoneNumber || 'N/A'}`,
        `Amount: ${log.updatedData.amount || log.originalData.amount}`,
        `Status: ${log.updatedData.status || log.originalData.status}`,
        `Payment Mode: ${log.updatedData.paymentMode || log.originalData.paymentMode}`,
        `Belongs To: ${log.updatedData.belongsTo || 'N/A'}`,
        `Verify Log: ${log.updatedData.verifyLog || log.originalData.verifyLog}`,
        `Modified By: ${log.registerId}`,
        `Modified At: ${formatDate(log.createdAt)}`,
      ].join('\n'), 105, startY + 6);

      doc.setDrawColor(150, 150, 150);
      doc.line(10, startY + 55, 200, startY + 55);
    });

    doc.save('Income_Modification_Log.pdf');
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
            placeholder="Search by income ID, register ID, name"
            className="border rounded-lg px-3 py-2 w-full"
          />
        </div>

        <div className="space-y-4">
          {logs.map((log) => (
            <div key={log._id} className="border rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-medium">Original Data</h3>
                  <div className="mt-2 text-sm">
                    <p>Income ID: {log.originalData.incomeId}</p>
                    <p>Name: {log.originalData.name}</p>
                    <p>Email: {log.originalData.email || 'N/A'}</p>
                    <p>Phone Number: {log.originalData.phoneNumber || 'N/A'}</p>
                    <p>Amount: {log.originalData.amount}</p>
                    <p>Status: {log.originalData.status}</p>
                    <p>Payment Mode: {log.originalData.paymentMode}</p>
                    <p>Belongs To: {log.originalData.belongsTo || 'N/A'}</p>
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
                  <div className="mt-2 text-sm">
                    <p>Income ID: {log.updatedData.incomeId || log.originalData.incomeId}</p>
                    <p>Name: {log.updatedData.name || log.originalData.name}</p>
                    <p>Email: {log.updatedData.email || log.originalData.email}</p>
                    <p>Phone Number: {log.updatedData.phoneNumber || log.originalData.phoneNumber}</p>
                    <p>Amount: {log.updatedData.amount || log.originalData.amount}</p>
                    <p>Status: {log.updatedData.status || log.originalData.status}</p>
                    <p>Payment Mode: {log.updatedData.paymentMode || log.originalData.paymentMode}</p>
                    <p>Belongs To: {log.updatedData.belongsTo || log.originalData.belongsTo}</p>
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

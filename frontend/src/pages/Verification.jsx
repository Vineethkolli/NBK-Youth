import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import VerificationTable from '../components/verification/VerificationTable';
import VerificationFilters from '../components/verification/VerificationFilters';
import { API_URL } from '../utils/config';
import EventLabelDisplay from '../components/common/EventLabelDisplay';
import LockIndicator from '../components/common/LockIndicator';
import { useLockSettings } from '../context/LockContext';
import { IndianRupee, DollarSign, ShieldCheck } from 'lucide-react'; 

function Verification() {
  const { user } = useAuth();
  const { lockSettings } = useLockSettings();
  const [activeTab, setActiveTab] = useState('income');
  const [incomeData, setIncomeData] = useState([]);
  const [expenseData, setExpenseData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [filters, setFilters] = useState({
    verifyLog: 'not verified'
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, filters]);

  const fetchData = async () => {
    try {
      let endpoint;
      if (activeTab === 'income') {
        endpoint = 'incomes/verification';
      } else if (activeTab === 'expense') {
        endpoint = 'expenses/verification';
      } else {
        endpoint = 'payments/verification/data';
      }

      const { data } = await axios.get(`${API_URL}/api/${endpoint}`, { params: filters });

      if (activeTab === 'income') setIncomeData(data);
      else if (activeTab === 'expense') setExpenseData(data);
      else setPaymentData(data);
    } catch (error) {
      toast.error(`Failed to fetch ${activeTab} data`);
    }
  };

  const handleVerifyLogUpdate = async (id, verifyLog) => {
    try {
      let endpoint;
      if (activeTab === 'income') endpoint = 'incomes';
      else if (activeTab === 'expense') endpoint = 'expenses';
      else endpoint = 'payments';

      await axios.patch(`${API_URL}/api/${endpoint}/${id}/verify`, {
        verifyLog,
        registerId: user.registerId
      });
      
      toast.success('Verification status updated successfully');
      fetchData();
    } catch (error) {
      if (error.response?.data?.existingName) throw error;
      toast.error('Failed to update verification status');
    }
  };

  const handleUpdatePayment = async (id, updateData) => {
    try {
      await axios.put(`${API_URL}/api/payments/${id}`, {
        ...updateData,
        registerId: user.registerId
      });
      fetchData();
      return true;
    } catch (error) {
      throw error;
    }
  };

  if (!['developer', 'financier'].includes(user?.role)) return <div>Access denied</div>;

  const tabIcons = {
    income: <IndianRupee size={18} />,
    expense: <DollarSign size={18} />,
    payment: <ShieldCheck size={18} />
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-semibold mb-2 lg:mb-0">Verification Management</h1>
          <div className="flex items-center mb-6 lg:mb-0 space-x-2">
            <LockIndicator />
            <EventLabelDisplay />
          </div>

          <div className="flex space-x-4">
            {['income', 'expense', 'payment'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-2 rounded-md font-semibold flex items-center space-x-2 ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {tabIcons[tab]}
                <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="my-4">
        <VerificationFilters filters={filters} onChange={setFilters} />
      </div>

      <div className="bg-white rounded-lg shadow">
        <VerificationTable
          data={
            activeTab === 'income'
              ? incomeData
              : activeTab === 'expense'
              ? expenseData
              : paymentData
          }
          type={activeTab}
          onVerifyLogUpdate={handleVerifyLogUpdate}
          onUpdatePayment={handleUpdatePayment}
          isLocked={lockSettings.isLocked}
        />
      </div>
    </div>
  );
}

export default Verification;

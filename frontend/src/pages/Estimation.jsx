import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import EstimationStats from '../components/estimation/Stats';
import IncomeSection from '../components/estimation/IncomeSection';
import ExpenseSection from '../components/estimation/ExpenseSection';
import { useAuth } from '../context/AuthContext';
import EventLabelDisplay from '../components/common/EventLabelDisplay';

function Estimation() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('stats'); 
  const [stats, setStats] = useState({
    totalEstimatedIncome: 0,
    totalEstimatedPaidIncome: 0,
    totalEstimatedNotPaidIncome: 0,
    totalEstimatedExpense: 0,
    balance: 0
  });

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const statsResponse = await axios.get(`${API_URL}/api/estimation/stats`);
      setStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch stats');
    }
  };

  return (
    <div className="space-y-6">
      <EventLabelDisplay />
      
      {/* Tab Buttons */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Estimation Management</h1>
        <div className="space-x-2">
          <button
            onClick={() => setActiveTab('stats')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'stats'
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Stats
          </button>
          {/* Render Income and Expense buttons only if the user's role is not "user" */}
          {user?.category == 'youth' && (
            <>
              <button
                onClick={() => setActiveTab('income')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'income'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Income
              </button>
              <button
                onClick={() => setActiveTab('expense')}
                className={`px-4 py-2 rounded-md ${
                  activeTab === 'expense'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                Expense
              </button>
            </>
          )}
        </div>
      </div>

      {/* Render content based on active tab */}
      {activeTab === 'stats' && (
        <EstimationStats stats={stats} />
      )}

      {activeTab === 'income' && user?.category == 'youth' && (
        <IncomeSection refreshStats={fetchStats} />
      )}

      {activeTab === 'expense' && user?.category == 'youth' && (
        <ExpenseSection refreshStats={fetchStats} />
      )}
    </div>
  );
}

export default Estimation;

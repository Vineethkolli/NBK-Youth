import { useState, useEffect } from 'react';
import api from '../utils/api';
import { toast } from 'react-hot-toast';
import EstimationStats from '../components/estimation/Stats';
import IncomeSection from '../components/estimation/IncomeSection';
import ExpenseSection from '../components/estimation/ExpenseSection';
import { useAuth } from '../context/AuthContext';
import EventLabelDisplay from '../components/common/EventLabelDisplay';
import { BarChart2, DollarSign, IndianRupee } from 'lucide-react'; 

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
  const [budgetStats, setBudgetStats] = useState({
    totalIncome: { amount: 0 },
    totalExpenses: { amount: 0 },
    amountLeft: { amount: 0 }
  });

  useEffect(() => {
    if (activeTab === 'stats') {
      fetchStats();
      fetchBudgetStats();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      const statsResponse = await api.get(`/api/estimation/stats`);
      setStats(statsResponse.data);
    } catch (error) {
      toast.error('Failed to fetch stats');
    }
  };

  const fetchBudgetStats = async () => {
    try {
      const budgetResponse = await api.get(`/api/stats`);
      setBudgetStats(budgetResponse.data.budgetStats);
    } catch (error) {
      console.error('Failed to fetch budget stats');
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <h1 className="text-2xl font-semibold mb-2 lg:mb-0">Estimation Management</h1>
          <div className="flex items-center mb-6 lg:mb-0 ">
            <EventLabelDisplay />
          </div>
          <div className="flex space-x-4">
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-2 rounded-md font-semibold flex items-center space-x-2 ${
                activeTab === 'stats'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BarChart2 size={18} />
              <span>Stats</span>
            </button>

            {user?.category === 'youth' && (
              <>
                <button
                  onClick={() => setActiveTab('income')}
                  className={`px-3 py-2 rounded-md font-semibold flex items-center space-x-2 ${
                    activeTab === 'income'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <IndianRupee size={18} />
                  <span>Income</span>
                </button>
                <button
                  onClick={() => setActiveTab('expense')}
                  className={`px-3 py-2 rounded-md font-semibold flex items-center space-x-2 ${
                    activeTab === 'expense'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <DollarSign size={18} />
                  <span>Expense</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {activeTab === 'stats' && <EstimationStats stats={stats} budgetStats={budgetStats} />}

      {activeTab === 'income' && user?.category === 'youth' && (
        <IncomeSection refreshStats={fetchStats} />
      )}

      {activeTab === 'expense' && user?.category === 'youth' && (
        <ExpenseSection refreshStats={fetchStats} />
      )}
    </div>
  );
}

export default Estimation;

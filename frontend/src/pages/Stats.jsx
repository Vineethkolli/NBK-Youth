import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import Footer from '../components/Footer';
import TeluguPrint from '../components/stats/StatsTeluguPrint';
import EnglishPrint from '../components/stats/StatsEnglishPrint';
import { useLanguage } from '../context/LanguageContext';
import EventLabelDisplay from '../components/common/EventLabelDisplay';
import LockIndicator from '../components/common/LockIndicator';
import { useLockSettings } from '../context/LockContext';

import StatsOverview from '../components/stats/Overview';

function Stats() {
  const { user } = useAuth();
  const { language } = useLanguage();
  const { lockSettings } = useLockSettings();
  const PrintComponent = language === 'te' ? TeluguPrint : EnglishPrint;

  const [stats, setStats] = useState({
    budgetStats: {
      totalIncome: { count: 0, amount: 0 },
      amountReceived: { count: 0, amount: 0 },
      amountPending: { count: 0, amount: 0 },
      totalExpenses: { count: 0, amount: 0, onlineAmount: 0, cashAmount: 0 },
      previousYearAmount: { amount: 0 },
      amountLeft: { amount: 0, onlineAmount: 0, cashAmount: 0 },
      online: { count: 0, amount: 0 },
      offline: { count: 0, amount: 0 }
    },
    userStats: {
      totalUsers: 0,
      successfulPayments: 0
    },
    villagers: {
      paid: { cash: 0, online: 0, webApp: 0, total: 0 },
      pending: { cash: 0, online: 0, webApp: 0, total: 0 },
      total: 0, count: 0
    },
    youth: {
      paid: { cash: 0, online: 0, webApp: 0, total: 0 },
      pending: { cash: 0, online: 0, webApp: 0, total: 0 },
      total: 0, count: 0
    },
    dateWiseStats: []
  });

  const [isEditingPreviousYear, setIsEditingPreviousYear] = useState(false);
  const [previousYearAmount, setPreviousYearAmount] = useState(0);
  const [isAddingPreviousYear, setIsAddingPreviousYear] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/stats`);
      setStats(data);
      setPreviousYearAmount(data.budgetStats.previousYearAmount.amount);
    } catch (error) {
      toast.error('Failed to fetch stats');
    }
  };

  const handlePreviousYearUpdate = async () => {
    try {
      setIsAddingPreviousYear(true);
      await axios.patch(`${API_URL}/api/stats/previous-year`, {
        amount: previousYearAmount
      });
      toast.success('Previous year amount updated');
      setIsEditingPreviousYear(false);
      fetchStats();
    } catch (error) {
      toast.error('Failed to update previous year amount');
    } finally {
      setIsAddingPreviousYear(false);
    }
  };

  const noTranslate = (value) => {
    return <span translate="no" className="notranslate">{value}</span>;
  };

  // Wrap currency values in a noTranslate span
  const formatAmount = (amount) => {
    const formatted = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
    return noTranslate(formatted);
  };

  const formatNumber = (num) => {
    return noTranslate(num);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold">Statistics</h1>
          <PrintComponent stats={stats} />
        </div>

        <div className="flex items-center">
          <LockIndicator />
          <EventLabelDisplay />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <StatsOverview
          stats={stats}
          user={user}
          lockSettings={lockSettings}
          formatAmount={formatAmount}
          formatNumber={formatNumber}
          isEditingPreviousYear={isEditingPreviousYear}
          setIsEditingPreviousYear={setIsEditingPreviousYear}
          previousYearAmount={previousYearAmount}
          setPreviousYearAmount={setPreviousYearAmount}
          isAddingPreviousYear={isAddingPreviousYear}
          handlePreviousYearUpdate={handlePreviousYearUpdate}
        />
      </div>

      <Footer />
    </div>
  );
}

export default Stats;

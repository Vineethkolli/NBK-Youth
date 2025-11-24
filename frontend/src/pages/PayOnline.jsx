import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import PaymentForm from '../components/payment/PaymentForm';
import PaymentHistory from '../components/payment/PaymentHistory';
import { API_URL } from '../utils/config';
import EventLabelDisplay from '../components/common/EventLabelDisplay';

function PayOnline() {
  const [payments, setPayments] = useState([]);

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_URL}/api/payments`, {
        headers: {
          Authorization: `Bearer ${token}`,
        }
      });
      setPayments(data);
    } catch (error) {
      toast.error('Failed to fetch payment history');
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const handlePaymentSubmit = async (paymentData) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_URL}/api/payments`, paymentData, {
        headers: {
          'Authorization': `Bearer ${token}`
          // Do NOT set Content-Type here; let axios set it for FormData
        }
      });

      // Add new payment to top of the list
      setPayments((prev) => [response.data, ...prev]);

      return response.data;
    } catch (error) {
      console.error('Payment submission error:', error.response?.data || error.message);
      throw error;
    }
  };
return (
  <div className="space-y-6">
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Pay Online</h1>
      </div>

    <div className="flex items-center">
        <EventLabelDisplay />
      </div>
      </div>
    <PaymentForm onSubmit={handlePaymentSubmit} />
    <PaymentHistory payments={payments} />
  </div>
);

}

export default PayOnline;

import { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config'; 
import { useAuth } from '../../context/AuthContext'; 

function NotificationForm({ onSuccess }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [link, setLink] = useState(''); 
  const [isLoading, setIsLoading] = useState(false);
  const [target, setTarget] = useState('All');
  const [registerId, setRegisterId] = useState('');

  const sendNotification = async (e) => {
    e.preventDefault();
    if (!title || !body) {
      toast.error('Please enter both title and message');
      return;
    }

    setIsLoading(true);
    try {
      const requestData = { title, body, link, target };
      if (target === 'Specific User') {
        if (!registerId) {
          toast.error('Please enter Register ID for the specific user');
          setIsLoading(false);
          return;
        }
        requestData.registerId = registerId;
      }

      await axios.post(`${API_URL}/api/notifications/notify`, requestData);

      if (onSuccess) {
        onSuccess(requestData);
      }

      setTitle('');
      setBody('');
      setLink(''); 
      setRegisterId('');
      toast.success(`Notification sent successfully to ${target}`);
    } catch (error) {
      console.error('Error sending notification:', error);
      toast.error('Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-xl font-semibold mb-4">Send Notification</h2>
      <form onSubmit={sendNotification} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Message *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={2}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Link</label>
          <input
            type="text"
            placeholder="Ex: /vibe or https://example.com"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Send to</label>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          >
            <option value="All">All</option>
            <option value="Youth_Category">Youth</option>
            <option value="Admins_Financiers_Developers">Admins, Financiers, Developers</option>
            <option value="Specific User">Specific User</option>
          </select>
        </div>

        {target === 'Specific User' && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Register ID</label>
            <input
              type="text"
              placeholder="Ex: R1"
              value={registerId}
              onChange={(e) => setRegisterId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              required
            />
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 ${
            isLoading ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isLoading ? 'Sending...' : 'Send Notification'}
        </button>
      </form>
    </div>
  );
}

export default NotificationForm;

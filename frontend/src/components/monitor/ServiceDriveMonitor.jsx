import { useState, useEffect } from 'react';
import axios from 'axios';
import { RefreshCcw, Trash2, RotateCcw, XCircle } from 'lucide-react';
import { API_URL } from '../../utils/config';
import { toast } from 'react-hot-toast';

export default function ServiceDriveMonitor() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showTrash, setShowTrash] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/monitor/drive`);
      // Include trashed info for folders
      setData(res.data);
      toast.success('Drive data synced');
    } catch (err) {
      console.error(err);
      toast.error('Failed to fetch Drive data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Auto fetch on mount
  }, []);

  const handleTrash = async (fileId) => {
    try {
      await axios.put(`${API_URL}/api/monitor/folder/trash/${fileId}`);
      toast.success('Folder moved to trash');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to trash folder');
    }
  };

  const handleRestore = async (fileId) => {
    try {
      await axios.put(`${API_URL}/api/monitor/folder/restore/${fileId}`);
      toast.success('Folder restored');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to restore folder');
    }
  };

  const handleDeletePermanent = async (fileId) => {
    try {
      await axios.delete(`${API_URL}/api/monitor/folder/delete/${fileId}`);
      toast.success('Folder permanently deleted');
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete folder permanently');
    }
  };

  if (loading) return <p>Loading Drive data...</p>;
  if (!data) return null;

  const { user, storage, folders } = data;

  // Filter folders based on trashed toggle
  const visibleFolders = folders.filter(f => (showTrash ? f.trashed : !f.trashed));

  return (
    <div className="bg-white p-4 rounded-lg shadow space-y-4">
      <h2 className="text-2xl font-semibold mb-4">Service Drive Storage</h2>

      <div className="flex justify-between items-center">
        <div>
          <p><strong>User:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => setShowTrash(!showTrash)}
            className="bg-gray-200 text-gray-800 px-3 py-1 rounded-md hover:bg-gray-300"
          >
            {showTrash ? 'Hide Trash' : 'Show Trash'}
          </button>
          <button
            onClick={fetchData}
            className="flex items-center space-x-2 bg-indigo-600 text-white px-3 py-1 rounded-md hover:bg-indigo-700"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Sync</span>
          </button>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Storage</h3>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <li><strong>Limit:</strong> {storage.limit}</li>
          <li><strong>Used:</strong> {storage.used}</li>
          <li><strong>Drive Used:</strong> {storage.driveUsed}</li>
          <li><strong>Trash Used:</strong> {storage.trashUsed}</li>
        </ul>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Folder Usage</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-200">
                <th className="p-2 text-left">Folder Name</th>
                <th className="p-2 text-left">Size (GB)</th>
                <th className="p-2 text-left">Files</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visibleFolders.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-2 text-center">No folders found</td>
                </tr>
              )}
              {visibleFolders.map(f => (
                <tr key={f.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">{f.name}</td>
                  <td className="p-2">{f.sizeGB.toFixed(2)}</td>
                  <td className="p-2">{f.fileCount}</td>
                  <td className="p-2 flex space-x-2">
                    {!f.trashed && (
                      <button
                        onClick={() => handleTrash(f.id)}
                        className="flex items-center space-x-1 text-yellow-600 hover:text-yellow-800"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span>Trash</span>
                      </button>
                    )}
                    {f.trashed && (
                      <>
                        <button
                          onClick={() => handleRestore(f.id)}
                          className="flex items-center space-x-1 text-green-600 hover:text-green-800"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span>Restore</span>
                        </button>
                        <button
                          onClick={() => handleDeletePermanent(f.id)}
                          className="flex items-center space-x-1 text-red-600 hover:text-red-800"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

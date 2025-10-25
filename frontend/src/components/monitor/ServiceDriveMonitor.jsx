import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { RefreshCcw, Trash2, Folder, File, Download, Home } from 'lucide-react';
import { API_URL } from '../../utils/config';
import { toast } from 'react-hot-toast';

// Confirmation Modal component
const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText, isDestructive }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center p-4 z-50">
      <div className={`bg-white rounded-xl p-6 max-w-sm w-full transform transition-all duration-300 scale-100`}>
        <h3 className={`text-xl font-bold mb-3 ${isDestructive ? 'text-red-600' : 'text-gray-800'}`}>{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition duration-150 shadow-md ${isDestructive ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'}`}
          >
            {confirmText || 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function ServiceDriveMonitor() {
  const [quotaData, setQuotaData] = useState(null);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTrash, setShowTrash] = useState(false);
  const [processingItems, setProcessingItems] = useState({});
  const [currentFolderId, setCurrentFolderId] = useState('root');
  const [pathHistory, setPathHistory] = useState([{ id: 'root', name: 'My Drive' }]);

  const [modal, setModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    onCancel: () => setModal({ ...modal, isOpen: false }),
    confirmText: 'Confirm',
    isDestructive: false,
    itemId: null,
    itemName: '',
    action: '',
  });

  const fetchStorageQuota = useCallback(async () => {
    try {
      const res = await axios.get(`${API_URL}/api/monitor/drive/quota`);
      setQuotaData(res.data);
    } catch (err) {
      console.error('Failed to fetch quota:', err);
      toast.error('Failed to fetch Drive storage quota');
    }
  }, []);

  const fetchCurrentItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/monitor/drive/files?parentId=${currentFolderId}`);
      setItems(res.data.items);
    } catch (err) {
      console.error('Failed to fetch items:', err);
      toast.error('Failed to fetch folder contents');
      if (currentFolderId !== 'root') handleNavigation('root');
    } finally {
      setLoading(false);
    }
  }, [currentFolderId]);

  const fetchTrashItems = useCallback(async (parentId = 'root') => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/monitor/drive/trash?parentId=${parentId}`);
      setItems(res.data.items);
      setCurrentFolderId(res.data.parentId || parentId);
    } catch (err) {
      console.error('Failed to fetch trash items:', err);
      toast.error('Failed to fetch trash contents');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchData = useCallback(() => {
    fetchStorageQuota();
    if (showTrash) {
      fetchTrashItems(currentFolderId === 'root' ? 'root' : currentFolderId);
    } else {
      fetchCurrentItems();
    }
  }, [fetchStorageQuota, fetchCurrentItems, fetchTrashItems, showTrash, currentFolderId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleNavigation = useCallback((itemId, itemName) => {
    if (showTrash) {
      fetchTrashItems(itemId === 'root' ? 'root' : itemId);

      if (itemId === 'root') {
        setPathHistory([{ id: 'root', name: 'Trash' }]);
      } else if (itemName) {
        const index = pathHistory.findIndex(p => p.id === itemId);
        if (index !== -1) setPathHistory(pathHistory.slice(0, index + 1));
        else setPathHistory([...pathHistory, { id: itemId, name: itemName }]);
      }
      return;
    }

    if (itemId === currentFolderId) return;

    setCurrentFolderId(itemId);

    const index = pathHistory.findIndex(p => p.id === itemId);
    if (index !== -1) {
      setPathHistory(pathHistory.slice(0, index + 1));
    } else if (itemName) {
      setPathHistory([...pathHistory, { id: itemId, name: itemName }]);
    }
  }, [currentFolderId, pathHistory, showTrash, fetchTrashItems]);

  const handleItemClick = (item) => {
    if (item.isFolder) {
      if (showTrash) {
        handleNavigation(item.id, item.name);
      } else {
        handleNavigation(item.id, item.name);
      }
    }
  };

  const handleDownload = async (item) => {
    if (processingItems[item.id]) return;
    setProcessingItems(prev => ({ ...prev, [item.id]: true }));

    const toastId = toast.loading(item.isFolder ? `Downloading folder "${item.name}"...` : `Downloading "${item.name}"...`);
    try {
     if (item.isFolder) {
  // Fetch files in the folder
  const endpoint = showTrash
    ? `${API_URL}/api/monitor/drive/trash?parentId=${item.id}`
    : `${API_URL}/api/monitor/drive/files?parentId=${item.id}`;

  const res = await axios.get(endpoint);
  const files = res.data.items.filter(f => !f.isFolder);

  if (files.length === 0) {
    toast('No files to download in this folder');
  } else {
    for (const file of files) {
      const response = await axios.get(
        `${API_URL}/api/monitor/item/download/${file.id}?itemName=${encodeURIComponent(file.name)}`,
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data]);
      const link = document.createElement('a');
      link.href = window.URL.createObjectURL(blob);
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    }
  }
}
else {
        // For folders, download children files
        const res = await axios.get(`${API_URL}/api/monitor/drive/files?parentId=${item.id}`);
        const files = res.data.items.filter(f => !f.isFolder);
        for (const file of files) {
          const response = await axios.get(`${API_URL}/api/monitor/item/download/${file.id}?itemName=${encodeURIComponent(file.name)}`, { responseType: 'blob' });
          const blob = new Blob([response.data]);
          const link = document.createElement('a');
          link.href = window.URL.createObjectURL(blob);
          link.download = file.name;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(link.href);
        }
      }
      toast.success(item.isFolder ? `Folder "${item.name}" downloaded!` : `File "${item.name}" downloaded!`);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to download "${item.name}"`);
    } finally {
      toast.dismiss(toastId);
      setProcessingItems(prev => ({ ...prev, [item.id]: false }));
    }
  };

  // Action Handlers trash and permanent delete
  const triggerAction = (itemId, itemName, action) => {
    const isDestructive = action === 'delete';
    const title = isDestructive ? 'Permanent Delete' : 'Move to Trash';
    let message = `Are you sure you want to ${action === 'delete' ? 'permanently delete' : 'move to trash'} "${itemName}"?`;

    setModal({
      isOpen: true,
      title,
      message,
      confirmText: isDestructive ? 'DELETE PERMANENTLY' : `Yes, ${action === 'trash' ? 'Move' : 'Confirm'}`,
      isDestructive,
      itemId,
      itemName,
      action,
      onConfirm: () => handleActionExecution(itemId, itemName, action),
      onCancel: () => setModal({ ...modal, isOpen: false }),
    });
  };

  const handleActionExecution = async (itemId, itemName, action) => {
    if (processingItems[itemId]) return;
    setProcessingItems(prev => ({ ...prev, [itemId]: true }));
    setModal({ ...modal, isOpen: false });

    try {
      let url = '', method = '', data = {};
      if (action === 'trash') { url = `${API_URL}/api/monitor/item/trash/${itemId}`; method = 'PUT'; data = { confirm: true }; }
      else if (action === 'delete') { url = `${API_URL}/api/monitor/item/delete/${itemId}`; method = 'DELETE'; data = { confirm: true }; }
      else return;

      const toastId = toast.loading(`${action === 'delete' ? 'Deleting' : 'Trashing'} "${itemName}"...`);
      await axios({ url, method, data });
      toast.dismiss(toastId);
      toast.success(`Item "${itemName}" successfully ${action === 'delete' ? 'deleted permanently' : 'moved to trash'}!`);
      // Refresh appropriate view
      if (showTrash) fetchTrashItems(currentFolderId === 'root' ? 'root' : currentFolderId);
      else fetchCurrentItems();
    } catch (err) {
      console.error(err);
      toast.error(`Failed to ${action} "${itemName}"`);
    } finally {
      setProcessingItems(prev => ({ ...prev, [itemId]: false }));
    }
  };

  const handleEmptyTrash = () => {
    setModal({
      isOpen: true,
      title: 'Empty Trash',
      message: 'This will permanently delete ALL items in the trash. This action cannot be undone. Continue?',
      confirmText: 'Empty Trash',
      isDestructive: true,
      onConfirm: async () => {
        setModal({ ...modal, isOpen: false });
        const toastId = toast.loading('Emptying trash...');
        try {
          await axios.delete(`${API_URL}/api/monitor/item/trash/empty`, { data: { confirm: true } });
          toast.dismiss(toastId);
          toast.success('Trash emptied');
          fetchTrashItems('root');
        } catch (err) {
          console.error('Empty trash failed', err);
          toast.error('Failed to empty trash');
        }
      },
      onCancel: () => setModal({ ...modal, isOpen: false }),
    });
  };

  const currentPath = useMemo(() => {
  const rootName = showTrash ? 'Trash' : 'My Drive';
  const RootIcon = showTrash ? Trash2 : Home; 

  return (
    <div className="flex items-center space-x-2 text-sm whitespace-nowrap overflow-x-auto py-1">
      {pathHistory.map((p, index) => (
        <span key={p.id} className="flex items-center">
          <button
            onClick={() => handleNavigation(p.id, p.name)}
            className={`px-1 rounded-md transition duration-150 flex items-center ${
              index === pathHistory.length - 1
                ? 'text-indigo-600 font-bold'
                : 'text-gray-500 hover:text-indigo-600 hover:bg-indigo-50'
            }`}
          >
            {index === 0 ? <RootIcon className="w-4 h-4 mr-1" /> : null}
            {index === 0 ? rootName : p.name}
          </button>
          {index < pathHistory.length - 1 && (
            <span className="text-gray-400 mx-1">/</span>
          )}
        </span>
      ))}
    </div>
  );
}, [pathHistory, showTrash, handleNavigation]);

  const isRoot = currentFolderId === 'root';
  const hasItems = items.length > 0;

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg space-y-6 max-w-7xl mx-auto font-sans">
      <h2 className="text-2xl font-semibold text-gray-900 pb-3 mb-4">Service Drive Monitor</h2>

      <div className="flex flex-col md:flex-row md:justify-between md:items-start space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex flex-col space-y-1 text-sm text-gray-700 p-4 bg-gray-50 rounded-xl w-full md:w-1/3 shadow-inner border border-gray-100">
          <p className="font-bold text-gray-900 truncate">User: {quotaData?.user.name || 'N/A'}</p>
          <p className="truncate">Email: {quotaData?.user.email || 'N/A'}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm w-full md:w-2/3">
          {['storageLimit', 'storageUsed', 'driveUsed', 'trashUsed'].map((key) => (
            <div key={key} className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
              <span className="text-xs font-medium text-indigo-600 uppercase">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <span className="font-bold text-gray-900 text-lg">{quotaData?.storage[key] || '...'}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center py-2 border-b border-gray-200">
        <div className='mb-2 sm:mb-0'>{currentPath}</div>

        <div className="flex space-x-3">
          <button
            onClick={() => {
              const entering = !showTrash;
              setShowTrash(entering);
              if (entering) {
                setPathHistory([{ id: 'root', name: 'Trash' }]);
                fetchTrashItems('root');
              } else {
                setPathHistory([{ id: 'root', name: 'My Drive' }]);
                setCurrentFolderId('root');
                fetchCurrentItems();
              }
            }}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium transition duration-200 shadow-md ${
              showTrash ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Trash2 className="h-4 w-4" />
            <span>{showTrash ? 'Exit Trash' : 'View Trash'}</span>
          </button>

          <button
            onClick={fetchData}
            className="flex items-center space-x-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
            disabled={loading}
          >
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

     {showTrash && (
  <div className="flex items-center justify-between bg-yellow-50 border border-yellow-100 rounded-md px-2 py-1 mt-1">
    <div className="text-sm text-gray-800 flex items-center">
      Items in trash are deleted forever after 30 days.
    </div>
    <button
      onClick={handleEmptyTrash}
      className="flex items-center gap-1 px-2 py-1.5 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 transition"
    >
      <Trash2 className="w-4 h-4" />
      Empty Trash
    </button>
  </div>
)}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-100 sticky top-0">
  <tr>
    <th className="p-3 text-left font-bold text-gray-700 w-0">S.No.</th>
    <th className="p-3 text-left font-bold text-gray-700">Name</th>
    <th className="p-3 text-left font-bold text-gray-700">Size</th>
    <th className="p-3 text-center font-bold text-gray-700">Count</th>
    <th className="p-3 text-left font-bold text-gray-700">Modified</th>
    <th className="p-3 text-left font-bold text-gray-700">Actions</th>
  </tr>
</thead>
<tbody>
  {items.map((item, index) => (
    <tr key={item.id} className="hover:bg-indigo-50 transition duration-150">
      <td className="p-3 text-gray-600 text-center">{index + 1}</td>
      <td
        className={`p-3 whitespace-nowrap ${item.isFolder ? 'cursor-pointer' : 'cursor-default'}`}
        onClick={() => handleItemClick(item)}
      >
        <div className="flex items-center space-x-3 font-medium text-gray-800">
          {item.isFolder ? (
            <Folder className="h-5 w-5 text-indigo-500" />
          ) : (
            <File className="h-5 w-5 text-indigo-500" />
          )}
          <span className={item.isFolder ? 'hover:text-indigo-600' : ''}>{item.name}</span>
        </div>
      </td>
      <td className="p-3 text-gray-600">{item.size}</td>
      <td className="p-3 text-gray-600 text-center">{item.count || '-'}</td>
      <td className="p-3 text-gray-600">
        {item.modifiedTime ? new Date(item.modifiedTime).toLocaleDateString() : '-'}
      </td>
      <td className="p-3 whitespace-nowrap space-x-2">
        {/* Action buttons (same as before) */}
        <button
          onClick={() => handleDownload(item)}
          title="Download"
          className={`text-indigo-600 hover:text-indigo-800 p-1 rounded-full transition duration-150 ${
            processingItems[item.id] ? 'cursor-not-allowed opacity-50' : 'hover:bg-indigo-100'
          }`}
          disabled={processingItems[item.id]}
        >
          {processingItems[item.id] ? (
            <span className="animate-spin inline-block w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full"></span>
          ) : (
            <Download className="h-4 w-4" />
          )}
        </button>

        {!showTrash && (
          <button
            onClick={() => triggerAction(item.id, item.name, 'trash')}
            title="Move to Trash"
            className={`text-red-600 hover:text-gray-800 p-1 rounded-full transition duration-150 ${
              processingItems[item.id] ? 'cursor-not-allowed opacity-50' : 'hover:bg-red-100'
            }`}
            disabled={processingItems[item.id]}
          >
            {processingItems[item.id] ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></span>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}

        {showTrash && (
          <button
            onClick={() => triggerAction(item.id, item.name, 'delete')}
            title="Delete Permanently"
            className={`text-red-700 hover:text-gray-800 p-1 rounded-full transition duration-150 ${
              processingItems[item.id] ? 'cursor-not-allowed opacity-50' : 'hover:bg-red-100'
            }`}
            disabled={processingItems[item.id]}
          >
            {processingItems[item.id] ? (
              <span className="animate-spin inline-block w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full"></span>
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
          </button>
        )}
      </td>
    </tr>
  ))}
</tbody>
        </table>
      </div>

      <ConfirmationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        onConfirm={modal.onConfirm}
        onCancel={modal.onCancel}
        confirmText={modal.confirmText}
        isDestructive={modal.isDestructive}
      />
    </div>
  );
}

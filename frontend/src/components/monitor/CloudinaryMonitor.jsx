import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Download, File, Folder, Home, RefreshCcw, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const attachmentUrl = (url) => url?.replace('/upload/', '/upload/fl_attachment/');

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl p-6 max-w-sm w-full">
        <h3 className="text-xl font-bold mb-3 text-red-600">{title}</h3>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-4">
          <button onClick={onCancel} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm font-medium text-white rounded-lg bg-red-600 hover:bg-red-700 transition shadow-md">
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CloudinaryMonitor() {
  const [quota, setQuota] = useState(null);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(false);
    const [files, setFiles] = useState([]);
    const [currentFolder, setCurrentFolder] = useState(null);
    const [pathHistory, setPathHistory] = useState([]);
    const [processing, setProcessing] = useState({});
    const [modal, setModal] = useState({ isOpen: false, item: null, isFolder: false });

    const fetchQuota = useCallback(async () => {
      try {
        const res = await axios.get(`${API_URL}/api/monitor/cloudinary/quota`);
        setQuota(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to fetch Cloudinary quota');
      }
    }, []);

    const fetchContents = useCallback(async (folder = null) => {
      setLoading(true);
      try {
        if (folder) {
          const res = await axios.get(`${API_URL}/api/monitor/cloudinary/files`, { params: { folder: folder.path } });
          setFiles(res.data.files || []);
        } else {
          const res = await axios.get(`${API_URL}/api/monitor/cloudinary/folders`);
          setFolders(res.data.folders || []);
        }
      } catch (err) {
        console.error(err);
        toast.error(folder ? 'Failed to fetch Cloudinary files' : 'Failed to fetch Cloudinary folders');
      } finally {
        setLoading(false);
      }
    }, []);

    const syncData = useCallback(() => {
      fetchQuota();
      fetchContents(currentFolder);
    }, [currentFolder, fetchContents, fetchQuota]);

    useEffect(() => {
      Promise.resolve().then(syncData);
    }, [syncData]);

    const openFolder = (folder) => {
      setCurrentFolder(folder);
      setPathHistory((history) => [...history, folder]);
    };

    const goToPath = (index) => {
      if (index < 0) {
        setCurrentFolder(null);
        setPathHistory([]);
        return;
      }
      const folder = pathHistory[index];
      setCurrentFolder(folder);
      setPathHistory(pathHistory.slice(0, index + 1));
    };

    const downloadFile = (file) => {
      const link = document.createElement('a');
      link.href = attachmentUrl(file.secureUrl);
      link.download = file.name;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    };

    const downloadFolder = async (folder) => {
      setProcessing((state) => ({ ...state, [folder.path]: true }));
      const toastId = toast.loading(`Downloading files in "${folder.name}"...`);
      try {
        const res = await axios.get(`${API_URL}/api/monitor/cloudinary/download`, { params: { folder: folder.path } });
        window.open(res.data.url, '_blank', 'noopener,noreferrer');
        toast.dismiss(toastId);
        toast.success(`${res.data.count} file${res.data.count === 1 ? '' : 's'} ready to download`);
      } catch (err) {
        console.error(err);
        toast.dismiss(toastId);
        toast.error(err.response?.status === 404 ? `No files in "${folder.name}"` : `Failed to download "${folder.name}"`);
      } finally {
        setProcessing((state) => ({ ...state, [folder.path]: false }));
      }
    };

    const deleteItem = async (item, isFolder = false) => {
      const label = item.name;
      const key = isFolder ? item.path : item.publicId;
      setProcessing((state) => ({ ...state, [key]: true }));
      const toastId = toast.loading(`Deleting "${label}"...`);
      try {
        await axios.delete(`${API_URL}/api/monitor/cloudinary/items`, {
          data: isFolder ? { folder: item.path } : { publicId: item.publicId, resourceType: item.resourceType },
        });
        toast.dismiss(toastId);
        toast.success(`"${label}" deleted`);
        if (isFolder) {
          setCurrentFolder(null);
          setPathHistory([]);
        }
        await fetchContents(isFolder ? null : currentFolder);
        await fetchQuota();
      } catch (err) {
        console.error(err);
        toast.dismiss(toastId);
        toast.error(`Failed to delete "${label}"`);
      } finally {
        setProcessing((state) => ({ ...state, [key]: false }));
      }
    };

    const requestDelete = (item, isFolder = false) => {
      setModal({ isOpen: true, item, isFolder });
    };

    const renderActions = (item, isFolder = false) => {
      const key = isFolder ? item.path : item.publicId;
      return (
        <div className="flex items-center gap-2">
          <button
            onClick={() => (isFolder ? downloadFolder(item) : downloadFile(item))}
            title="Download"
            disabled={processing[key]}
            className="p-1 text-indigo-600 rounded-full hover:bg-indigo-100 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
          </button>
          <button
            onClick={() => requestDelete(item, isFolder)}
            title="Delete permanently"
            disabled={processing[key]}
            className="p-1 text-red-600 rounded-full hover:bg-red-100 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      );
    };

    const rows = currentFolder ? files : folders;

    return (
      <div className="bg-white p-6 rounded-xl shadow-lg max-w-6xl mx-auto space-y-6 font-sans">
        <h2 className="text-2xl font-semibold text-gray-900 pb-3 mb-4">Cloudinary Monitor</h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm w-full md:w-2/3">
          <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
            <div className="text-xs font-medium text-indigo-600 uppercase">Storage Limit</div>
            <div className="font-bold text-gray-900 text-lg">{quota?.lifetime?.storageLimitReadable ?? '...'}</div>
          </div>
          <div className="p-3 bg-indigo-50 rounded-xl flex flex-col justify-center shadow-md">
            <div className="text-xs font-medium text-indigo-600 uppercase">Storage Used</div>
            <div className="font-bold text-gray-900 text-lg">{quota?.lifetime?.storageUsedReadable ?? '...'}</div>
          </div>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-gray-200">
          <div className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap">
  <button
    onClick={() => goToPath(-1)}
    className={`flex items-center gap-1 font-bold transition ${
      currentFolder
        ? 'text-gray-400 hover:text-indigo-600'
        : 'text-indigo-600 hover:text-indigo-800'
    }`}
  >
    <Home className="h-4 w-4" />
    Home
  </button>

  {pathHistory.map((folder, index) => {
    const isCurrentFolder = index === pathHistory.length - 1;

    return (
      <span
        key={folder.path}
        className="flex items-center gap-2"
      >
        <span className="text-gray-400">/</span>

        <button
          onClick={() => goToPath(index)}
          className={`font-bold transition ${
            isCurrentFolder
              ? 'text-indigo-600 hover:text-indigo-800'
              : 'text-gray-400 hover:text-indigo-600'
          }`}
        >
          {folder.name}
        </button>
      </span>
    );
  })}
</div>
          <button
            onClick={syncData}
            title="Sync"
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 disabled:opacity-60"
          >
            <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-xl">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left font-bold text-gray-700">S.No.</th>
                <th className="p-3 text-left font-bold text-gray-700">Name</th>
                <th className="p-3 text-left font-bold text-gray-700">Size</th>
                <th className="p-3 text-left font-bold text-gray-700">
                  {currentFolder ? 'Type' : 'Count'}
                </th>
                <th className="p-3 text-left font-bold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item, index) => {
                const isFolder = !currentFolder;
                return (
                  <tr key={isFolder ? item.path : item.publicId} className="hover:bg-indigo-50 transition">
                    <td className="p-3 text-gray-600 text-center">{index + 1}</td>
                    <td className="p-3 whitespace-nowrap">
                      <button
                        onClick={() => (isFolder ? openFolder(item) : window.open(item.secureUrl, '_blank', 'noopener,noreferrer'))}
                        className="flex items-center gap-3 font-medium text-gray-800 hover:text-indigo-600"
                      >
                        {isFolder ? <Folder className="h-5 w-5 text-indigo-500" /> : <File className="h-5 w-5 text-indigo-500" />}
                        {item.name || item.folder}
                      </button>
                    </td>
                    <td className="p-3 text-gray-600">{isFolder ? item.sizeReadable : item.size}</td>
                    <td className="p-3 text-gray-600">{isFolder ? `${item.count} files` : item.resourceType}</td>
                    <td className="p-3">{renderActions(item, isFolder)}</td>
                  </tr>
                );
              })}
              {!rows.length && <tr><td colSpan={5} className="p-4 text-center text-gray-500">{loading ? 'Loading...' : 'No files found'}</td></tr>}
            </tbody>
          </table>
        </div>

        <ConfirmationModal
          isOpen={modal.isOpen}
          title={modal.isFolder ? 'Delete Folder' : 'Delete File'}
          message={`Are you sure you want to permanently delete "${modal.item?.name || ''}"?`}
          confirmText="DELETE PERMANENTLY"
          onCancel={() => setModal({ isOpen: false, item: null, isFolder: false })}
          onConfirm={() => {
            const { item, isFolder } = modal;
            setModal({ isOpen: false, item: null, isFolder: false });
            deleteItem(item, isFolder);
          }}
        />
      </div>
    );
  }


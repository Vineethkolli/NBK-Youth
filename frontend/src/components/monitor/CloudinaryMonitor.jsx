import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Download, File, Folder, Home, RefreshCcw, Trash2, RotateCcw, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const attachmentUrl = (url) => url?.replace('/upload/', '/upload/fl_attachment/');

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <h3 className="mb-3 text-xl font-bold text-red-600">{title}</h3>
        <p className="mb-6 text-gray-600">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-md transition hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function CloudinaryMonitor() {
  const [quota, setQuota] = useState(null);
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [pathHistory, setPathHistory] = useState([]);
  const [processing, setProcessing] = useState({});
  const [modal, setModal] = useState({
    isOpen: false,
    item: null,
    isFolder: false,
    action: null,
    title: '',
    message: '',
    confirmText: 'Confirm',
  });

  const [showTrash, setShowTrash] = useState(false);
  const [trashItems, setTrashItems] = useState([]);
  const [trashCursor, setTrashCursor] = useState(null);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashActionLoading, setTrashActionLoading] = useState(false);

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
        const res = await axios.get(`${API_URL}/api/monitor/cloudinary/files`, {
          params: { folder: folder.path },
        });
        setFiles(res.data.files || []);
      } else {
        const res = await axios.get(`${API_URL}/api/monitor/cloudinary/folders`);
        setFolders(res.data.folders || []);
        setFiles([]);
      }
    } catch (err) {
      console.error(err);
      toast.error(
        folder
          ? 'Failed to fetch Cloudinary files'
          : 'Failed to fetch Cloudinary folders',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const syncData = useCallback(() => {
    fetchQuota();
    if (!showTrash) fetchContents(currentFolder);
  }, [currentFolder, fetchContents, fetchQuota, showTrash]);
  useEffect(() => {
    syncData();
  }, [syncData]);

  const fetchTrash = useCallback(async (cursor = null, append = false) => {
    setTrashLoading(true);
    try {
      const res = await axios.get(`${API_URL}/api/monitor/cloudinary/trash`, {
        params: cursor ? { nextCursor: cursor } : {},
      });
      const newItems = res.data.items || [];
      setTrashItems((previous) => (append ? [...previous, ...newItems] : newItems));
      setTrashCursor(res.data.nextCursor || null);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to fetch Cloudinary Trash');
    } finally {
      setTrashLoading(false);
    }
  }, []);

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
    if (!file.secureUrl) {
      toast.error('Download URL is unavailable');
      return;
    }
    const link = document.createElement('a');
    link.href = attachmentUrl(file.secureUrl);
    link.download = file.name || 'download';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const downloadFolder = async (folder) => {
    const key = folder.path;
    setProcessing((state) => ({ ...state, [key]: true }));
    const toastId = toast.loading(`Preparing "${folder.name}" for download...`);
    try {
      const res = await axios.get(`${API_URL}/api/monitor/cloudinary/download`, {
        params: { folder: folder.path },
      });
      if (!res.data?.url) throw new Error('Download URL was not returned');
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
      toast.dismiss(toastId);
      toast.success(
        `${res.data.count ?? 0} file${res.data.count === 1 ? '' : 's'} ready to download`,
      );
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error(
        err.response?.status === 404
          ? `No files in "${folder.name}"`
          : `Failed to download "${folder.name}"`,
      );
    } finally {
      setProcessing((state) => ({ ...state, [key]: false }));
    }
  };

  const deleteItem = async (item, isFolder = false) => {
    if (!item) return;
    const label = item.name || item.publicId || item.path || 'item';
    const key = isFolder ? item.path : item.publicId;
    setProcessing((state) => ({ ...state, [key]: true }));
    const toastId = toast.loading(`Deleting "${label}"...`);
    try {
      await axios.delete(`${API_URL}/api/monitor/cloudinary/items`, {
        data: isFolder
          ? { folder: item.path }
          : { publicId: item.publicId, resourceType: item.resourceType },
      });
      toast.dismiss(toastId);
      toast.success(`"${label}" deleted`);
      if (isFolder) {
        setCurrentFolder(null);
        setPathHistory([]);
        await fetchContents(null);
      } else {
        await fetchContents(currentFolder);
      }
      await fetchQuota();
    } catch (err) {
      console.error(err);
      toast.dismiss(toastId);
      toast.error(err.response?.data?.message || `Failed to delete "${label}"`);
    } finally {
      setProcessing((state) => ({ ...state, [key]: false }));
    }
  };

  const requestAction = (action, item = null, isFolder = false) => {
    const label = item?.name || item?.publicId || item?.path || 'this item';
    const details = {
      delete: {
        title: isFolder ? 'Delete Folder' : 'Delete File',
        message: `Are you sure you want to delete "${label}" from Cloudinary?`,
        confirmText: 'DELETE',
      },
      restore: {
        title: 'Restore Asset',
        message: `Restore "${label}" from Cloudinary backup?`,
        confirmText: 'RESTORE',
      },
      permanentDelete: {
        title: 'Permanently Delete Backup',
        message: `Permanently delete all backed-up versions of "${label}"? This cannot be undone.`,
        confirmText: 'DELETE PERMANENTLY',
      },
      emptyTrash: {
        title: 'Empty Cloudinary Trash',
        message: 'Permanently delete all eligible backups in Cloudinary Trash? This cannot be undone.',
        confirmText: 'EMPTY TRASH',
      },
    };
    setModal({
      isOpen: true,
      item,
      isFolder,
      action,
      ...(details[action] || details.delete),
    });
  };

  const closeModal = () => {
    if (trashActionLoading) return;
    setModal({
      isOpen: false,
      item: null,
      isFolder: false,
      action: null,
      title: '',
      message: '',
      confirmText: 'Confirm',
    });
  };

  const toggleTrash = () => {
    const enteringTrash = !showTrash;
    setShowTrash(enteringTrash);
    if (enteringTrash) {
      setTrashItems([]);
      setTrashCursor(null);
      fetchTrash();
    }
  };

  const restoreTrashItem = async (item) => {
    if (!item?.assetId) {
      toast.error('Asset ID is missing; this item cannot be restored');
      return;
    }
    setTrashActionLoading(true);
    try {
      await axios.post(`${API_URL}/api/monitor/cloudinary/restore`, {
        assetId: item.assetId,
      });
      toast.success(`Restore request completed for "${item.name}"`);
      await fetchTrash();
      await fetchQuota();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to restore asset');
    } finally {
      setTrashActionLoading(false);
    }
  };

  const permanentlyDeleteTrashItem = async (item) => {
    if (!item?.assetId) {
      toast.error('Asset ID is missing; this item cannot be deleted');
      return;
    }
setTrashActionLoading(true);
    try {
      await axios.delete(`${API_URL}/api/monitor/cloudinary/trash/item`, {
        data: { assetId: item.assetId },
      });
      toast.success(`Backup deletion processed for "${item.name}"`);
      await fetchTrash();
      await fetchQuota();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Permanent deletion failed');
    } finally {
      setTrashActionLoading(false);
    }
  };

  const emptyTrash = async () => {
setTrashActionLoading(true);
    try {
      const res = await axios.delete(
        `${API_URL}/api/monitor/cloudinary/trash/empty`,
        { data: { confirm: true } },
      );
      const deletedCount = res.data?.deletedAssets ?? 0;
      toast.success(`${deletedCount} asset backup(s) processed`);
      if (res.data?.failures?.length) {
        toast.error(`${res.data.failures.length} item(s) could not be deleted`);
      }
      await fetchTrash();
      await fetchQuota();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Failed to empty Trash');
    } finally {
      setTrashActionLoading(false);
    }
  };

  const renderActions = (item, isFolder = false) => {
    const key = isFolder ? item.path : item.publicId;
    return (
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => (isFolder ? downloadFolder(item) : downloadFile(item))}
          title="Download"
          disabled={Boolean(processing[key])}
          className="rounded-full p-1 text-indigo-600 hover:bg-indigo-100 disabled:opacity-50"
        >
          <Download className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => requestAction('delete', item, isFolder)}
          title="Delete"
          disabled={Boolean(processing[key])}
          className="rounded-full p-1 text-red-600 hover:bg-red-100 disabled:opacity-50"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const rows = currentFolder ? files : folders;


  return (
    <div className="mx-auto max-w-6xl space-y-6 rounded-xl bg-white p-6 font-sans shadow-lg">
      <h2 className="mb-4 border-b border-gray-200 pb-3 text-2xl font-semibold text-gray-900">
        Cloudinary Monitor
      </h2>
      <div className="grid w-full grid-cols-2 gap-3 text-sm md:w-2/3 lg:grid-cols-4">
        <div className="flex flex-col justify-center rounded-xl bg-indigo-50 p-3 shadow-md">
          <div className="text-xs font-medium uppercase text-indigo-600">Storage Limit</div>
          <div className="text-lg font-bold text-gray-900">
            {quota?.lifetime?.storageLimitReadable ?? '...'}
          </div>
        </div>
        <div className="flex flex-col justify-center rounded-xl bg-indigo-50 p-3 shadow-md">
          <div className="text-xs font-medium uppercase text-indigo-600">Storage Used</div>
          <div className="text-lg font-bold text-gray-900">
            {quota?.lifetime?.storageUsedReadable ?? '...'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 py-2">
        {showTrash ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Trash2 className="h-4 w-4" />
            <span className="font-semibold text-indigo-600">Cloudinary Trash</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap text-sm">
            <button
              type="button"
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
                <span key={folder.path} className="flex items-center gap-2">
                  <span className="text-gray-400">/</span>
                  <button
                    type="button"
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
        )}

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleTrash}
            className="flex items-center gap-2 rounded-lg bg-gray-200 px-3 py-2 text-gray-700 hover:bg-gray-300"
          >
            <Trash2 className="h-4 w-4" />
            {showTrash ? 'Exit Trash' : 'View Trash'}
          </button>
          <button
            type="button"
            onClick={showTrash ? () => fetchTrash() : syncData}
            title="Sync"
            disabled={loading || trashLoading}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-3 py-2 text-white shadow-md hover:bg-green-700 disabled:opacity-60"
          >
            <RefreshCcw
              className={`h-4 w-4 ${(loading || trashLoading) ? 'animate-spin' : ''}`}
            />
            <span>{(loading || trashLoading) ? 'Syncing...' : 'Sync'}</span>
          </button>
        </div>
      </div>

      {showTrash ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Cloudinary Trash</h3>
              <p className="mt-1 text-sm text-gray-500">
                Restore backed-up assets or permanently remove their backups.
              </p>
            </div>
            <button
              type="button"
              onClick={() => requestAction('emptyTrash')}
              disabled={trashLoading || trashActionLoading || trashItems.length === 0}
              className="rounded-lg bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {trashActionLoading ? 'Processing...' : 'Empty Trash'}
            </button>
          </div>
          {trashLoading && trashItems.length === 0 ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading deleted assets...
            </div>
          ) : trashItems.length === 0 ? (
            <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-gray-500">
              No deleted assets found.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-3 text-left font-bold text-gray-700">S.No.</th>
                    <th className="p-3 text-left font-bold text-gray-700">Name</th>
                    <th className="p-3 text-left font-bold text-gray-700">Type</th>
                    <th className="p-3 text-left font-bold text-gray-700">Size</th>
                    <th className="p-3 text-left font-bold text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {trashItems.map((item, index) => (
                    <tr key={item.assetId || `${item.publicId}-${index}`} className="hover:bg-indigo-50">
                      <td className="p-3 text-gray-600">{index + 1}</td>
                      <td className="p-3 font-medium text-gray-800">{item.name || item.publicId || 'Unnamed asset'}</td>
                      <td className="p-3 text-gray-600">{item.resourceType || item.resource_type || '—'}</td>
                      <td className="p-3 text-gray-600">{item.sizeReadable || item.size || '—'}</td>
                      <td className="p-3">
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => requestAction('restore', item)}
                            disabled={trashActionLoading}
                            className="flex items-center gap-1 font-medium text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => requestAction('permanentDelete', item)}
                            disabled={trashActionLoading}
                            className="font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {trashCursor && (
            <button
              type="button"
              onClick={() => fetchTrash(trashCursor, true)}
              disabled={trashLoading || trashActionLoading}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {trashLoading ? 'Loading...' : 'Load next page'}
            </button>
          )}
        </div>
      ) : (
        <>
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
              <tbody className="divide-y divide-gray-200">
                {rows.map((item, index) => {
                  const isFolder = !currentFolder;
                  return (
                    <tr
                      key={isFolder ? item.path : item.publicId}
                      className="transition hover:bg-indigo-50"
                    >
                      <td className="p-3 text-center text-gray-600">{index + 1}</td>
                      <td className="whitespace-nowrap p-3">
                        <button
                          type="button"
                          onClick={() =>
                            isFolder
                              ? openFolder(item)
                              : window.open(item.secureUrl, '_blank', 'noopener,noreferrer')
                          }
                          className="flex items-center gap-3 font-medium text-gray-800 hover:text-indigo-600"
                        >
                          {isFolder ? (
                            <Folder className="h-5 w-5 text-indigo-500" />
                          ) : (
                            <File className="h-5 w-5 text-indigo-500" />
                          )}
                          {item.name || item.folder || item.publicId}
                        </button>
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-600">
                        {isFolder ? item.sizeReadable : item.size}
                      </td>
                      <td className="whitespace-nowrap p-3 text-gray-600">
                        {isFolder ? `${item.count} files` : item.resourceType}
                      </td>
                      <td className="p-3">{renderActions(item, isFolder)}</td>
                    </tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-500">
                      {loading ? 'Loading...' : 'No files found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
      
      <ConfirmationModal
        isOpen={modal.isOpen}
        title={modal.title}
        message={modal.message}
        confirmText={modal.confirmText}
        onCancel={closeModal}
        onConfirm={async () => {
          if (!modal.action) return;
          const { action, item, isFolder } = modal;
          try {
            if (action === 'delete') await deleteItem(item, isFolder);
            else if (action === 'restore') await restoreTrashItem(item);
            else if (action === 'permanentDelete') await permanentlyDeleteTrashItem(item);
            else if (action === 'emptyTrash') await emptyTrash();
          } finally {
            setModal({
              isOpen: false,
              item: null,
              isFolder: false,
              action: null,
              title: '',
              message: '',
              confirmText: 'Confirm',
            });
          }
        }}
        loading={
          modal.action === 'delete'
            ? Boolean(processing[modal.isFolder ? modal.item?.path : modal.item?.publicId])
            : trashActionLoading
        }
      />
    </div>
  );
}

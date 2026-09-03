import { useEffect, useState } from 'react';
import axios from 'axios';
import { Archive, Edit2, Images, Loader2, Plus, Search, StickyNote } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import FileForm from '../components/myFiles/FileForm';
import FileList from '../components/myFiles/FileList';
import NoteForm from '../components/myFiles/NoteForm';
import NoteList from '../components/myFiles/NoteList';
import PinDialog from '../components/myFiles/PinDialog';

const tabs = [
  {
    id: 'assets',
    label: 'Assets',
    icon: Images,
  },
  {
    id: 'notes',
    label: 'Notes',
    icon: StickyNote,
  },
  {
    id: 'dumps',
    label: 'Dumps',
    icon: Archive,
  },
];

const getErrorData = async (error) => {
  const data = error.response?.data;

  if (data instanceof Blob) {
    try {
      return JSON.parse(await data.text());
    } catch {
      return {};
    }
  }

  return data || {};
};

export default function MyFiles() {
  const { hasAccess } = useAuth();

  const [activeTab, setActiveTab] = useState('assets');
  const [files, setFiles] = useState([]);
  const [notes, setNotes] = useState([]);
  const [modal, setModal] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [pinRequest, setPinRequest] = useState(null);

  const getFile = async (file, pin) => {
    const response = await axios.get(
      `${API_URL}/api/my-files/files/${file._id}`,
      pin ? { headers: { 'X-Universal-Pin': pin } } : undefined
    );
    return response.data;
  };

  const openFile = async (file, pin) => {
    const openedFile = await getFile(file, pin);
    window.open(openedFile.url, '_blank', 'noopener,noreferrer');
  };

  const copyFileLink = async (file, pin) => {
    const openedFile = await getFile(file, pin);
    await navigator.clipboard.writeText(openedFile.url);
    toast.success('Link copied');
  };

  const downloadFile = async (file, pin) => {
    const response = await axios.get(
      `${API_URL}/api/my-files/files/${file._id}/download`,
      {
        responseType: 'blob',
        headers: pin ? { 'X-Universal-Pin': pin } : undefined,
      }
    );
    const url = URL.createObjectURL(response.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.filename || file.title;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const requestFileAction = async (file, action, pin) => {
    try {
      if (action === 'open') await openFile(file, pin);
      if (action === 'copy') await copyFileLink(file, pin);
      if (action === 'download') await downloadFile(file, pin);
    } catch (error) {
      const data = await getErrorData(error);
      if (data.pinRequired) {
        if (pin) throw new Error(data.message || 'Wrong PIN');
        setPinRequest({ type: 'file', action, file });
        return;
      }
      toast.error(data.message || 'Could not access file');
    }
  };

  const load = async () => {
    setLoading(true);

    try {
      if (activeTab === 'notes') {
        const response = await axios.get(
          `${API_URL}/api/my-files/notes`
        );

        setNotes(response.data);
      } else {
        const kind = activeTab === 'dumps' ? 'dump' : 'asset';

        const response = await axios.get(
          `${API_URL}/api/my-files/files?kind=${kind}`
        );

        setFiles(response.data);
      }
    } catch (error) {
      console.error('Failed to load My Files:', error);
      toast.error('Could not load My Files');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [activeTab]);

  useEffect(() => {
    setSearch('');
  }, [activeTab]);

  if (!hasAccess('Privileged')) {
    return (
      <div className="mt-10 text-center font-semibold text-red-500">
        Access denied
      </div>
    );
  }

const openNote = async (note, pin) => {
  try {
    const response = await axios.get(
      `${API_URL}/api/my-files/notes/${note._id}`,
      pin
        ? {
            headers: {
              'X-Universal-Pin': pin,
            },
          }
        : undefined
    );

    setModal({
      type: 'note',
      item: response.data,
      pin: pin || null,
    });
  } catch (error) {
    const data = await getErrorData(error);

    if (!data.pinRequired) {
      toast.error(
        data.message ||
          'Could not open note'
      );
      return;
    }

    if (pin) {
      throw new Error(data.message || 'Wrong PIN');
    }

    setPinRequest({
      type: 'note',
      action: 'open',
      note,
    });
  }
};


  const downloadNote = async (note, pin) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/my-files/notes/${note._id}`,
        pin ? { headers: { 'X-Universal-Pin': pin } } : undefined
      );

      const blob = new Blob(
        [response.data.content],
        { type: 'text/plain' }
      );

      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${response.data.title}.txt`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      URL.revokeObjectURL(url);
    } catch (error) {
      const data = await getErrorData(error);
      if (data.pinRequired) {
        if (pin) throw new Error(data.message || 'Wrong PIN');
        setPinRequest({ type: 'note', action: 'download', note });
        return;
      }
      console.error('Failed to download note:', error);

      toast.error(
        data.message ||
          'Could not download note'
      );
    }
  };


  const deleteItem = async (item, pin) => {
    const confirmed = pin || window.confirm(`Delete "${item.title}"?`);

    if (!confirmed) return;

    try {
      let headers;

      if (item.passwordProtected && !pin) {
        setPinRequest({
          type: activeTab === 'notes' ? 'note' : 'file',
          action: 'delete',
          ...(activeTab === 'notes' ? { note: item } : { file: item }),
        });
        return;
      } else if (pin) {
        headers = { 'X-Universal-Pin': pin };
      }

      const endpoint =
        activeTab === 'notes'
          ? 'notes'
          : 'files';

      await axios.delete(
        `${API_URL}/api/my-files/${endpoint}/${item._id}`,
        headers ? { headers } : undefined
      );

      toast.success(
        activeTab === 'notes'
          ? 'Note deleted'
          : 'File deleted'
      );

      await load();
    } catch (error) {
      console.error('Failed to delete item:', error);

      const data = await getErrorData(error);
      if (data.pinRequired) {
        if (pin) throw new Error(data.message || 'Wrong PIN');
        setPinRequest({
          type: activeTab === 'notes' ? 'note' : 'file',
          action: 'delete',
          ...(activeTab === 'notes' ? { note: item } : { file: item }),
        });
        return;
      }
      toast.error(data.message || 'Could not delete item');
    }
  };


  const add = () => {
    setModal({
      type: activeTab === 'notes' ? 'note' : 'file',
      item: null,
    });
  };


  const submitPin = async (pin) => {
  if (pinRequest.type === 'file') {
    if (pinRequest.action === 'open') {
      await requestFileAction(pinRequest.file, 'open', pin);
    }

    if (pinRequest.action === 'download') {
      await requestFileAction(pinRequest.file, 'download', pin);
    }

    if (pinRequest.action === 'copy') {
      await requestFileAction(pinRequest.file, 'copy', pin);
    }

    if (pinRequest.action === 'edit') {
  try {
    await getFile(pinRequest.file, pin);

    setModal({
      type: 'file',
      item: pinRequest.file,
      pin,
    });
  } catch (error) {
    const data = await getErrorData(error);

    if (data.pinRequired) {
      throw new Error(data.message || 'Wrong PIN');
    }

    throw new Error(
      data.message || 'Could not access file'
    );
  }
}

    if (pinRequest.action === 'delete') {
      await deleteItem(pinRequest.file, pin);
    }

    setPinRequest(null);
    return;
  }

  const request = pinRequest;

  if (request.action === 'delete') {
    await deleteItem(request.note, pin);
  }

  if (request.action === 'download') {
    await downloadNote(request.note, pin);
  }

  if (request.action === 'open') {
    await openNote(request.note, pin);
  }

  if (request.action === 'edit') {
  try {
    await axios.get(
      `${API_URL}/api/my-files/notes/${request.note._id}`,
      {
        headers: {
          'X-Universal-Pin': pin,
        },
      }
    );

    setModal({
      type: 'note',
      item: request.note,
      pin,
    });
  } catch (error) {
    const data = await getErrorData(error);

    if (data.pinRequired) {
      throw new Error(data.message || 'Wrong PIN');
    }

    throw new Error(
      data.message || 'Could not access note'
    );
  }
}

  setPinRequest(null);
};

  const visibleItems = (activeTab === 'notes' ? notes : files).filter((item) => {
    const value = item.title;
    return value.toLowerCase().includes(search.trim().toLowerCase());
  });

  const tab = tabs.find(
    (item) => item.id === activeTab
  );

  const TabIcon = tab.icon;


  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <h1 className="mb-2 text-2xl font-semibold">
            My Files
          </h1>

          <div className="flex flex-wrap gap-3">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id);
                  setEditMode(false);
                }}
                className={`flex items-center space-x-2 rounded-md px-3 py-2 font-semibold transition ${
                  activeTab === id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Icon size={18} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center justify-between gap-4">
          <div className="relative max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${tab.label.toLowerCase()}...`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-lg border py-1 pl-10 pr-4"
            />
          </div>

          <div className="flex gap-4">
          <button
            onClick={add}
            className="btn-secondary flex items-center"
          >
            <Plus className="h-4 w-4 mr-1 inline" />
            Add
          </button>

          <button
            onClick={() => setEditMode((value) => !value)}
            className={`btn-secondary flex items-center`}
          >
            <Edit2 className="h-4 w-4 mr-1 inline" />
            {editMode ? 'Done' : 'Edit'}
          </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="animate-spin text-indigo-600" />
        </div>
      ) : activeTab === 'notes' ? (
        <NoteList
          notes={visibleItems}
          editMode={editMode}
          onOpen={openNote}
          onDownload={downloadNote}
          onEdit={(note) =>
            note.passwordProtected
              ? setPinRequest({ type: 'note', action: 'edit', note })
              : setModal({ type: 'note', item: note })
          }
          onDelete={deleteItem}
        />
      ) : (
        <FileList
          files={visibleItems}
          editMode={editMode}
          onEdit={(file) =>
            file.passwordProtected
              ? setPinRequest({ type: 'file', action: 'edit', file })
              : setModal({ type: 'file', item: file })
          }
          onDelete={deleteItem}
          onOpen={(file) => requestFileAction(file, 'open')}
          onDownload={(file) => requestFileAction(file, 'download')}
          onCopy={(file) => requestFileAction(file, 'copy')}
        />
      )}

      {modal?.type === 'file' && (
        <FileForm
          kind={activeTab === 'dumps' ? 'dump' : 'asset'}
          file={modal.item}
          pin={modal.pin}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      {modal?.type === 'note' && (
        <NoteForm
          note={modal.item}
          pin={modal.pin}
          onClose={() => setModal(null)}
          onSaved={load}
        />
      )}

      <PinDialog
        open={Boolean(pinRequest)}
        title={pinRequest?.type === 'file' ? 'Access protected file' : 'Access protected note'}
        onSubmit={submitPin}
        onClose={() => setPinRequest(null)}
      />
    </div>
  );
}

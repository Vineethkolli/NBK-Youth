import { useEffect, useState } from 'react';
import axios from 'axios';
import { Loader2, Lock, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

import { API_URL } from '../../utils/config';

export default function NoteForm({
  note,
  pin,
  onClose,
  onSaved,
}) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [protectedNote, setProtectedNote] = useState(false);

  const [loading, setLoading] = useState(Boolean(note));
  const [saving, setSaving] = useState(false);

  // PIN received after successful PIN verification
  const [universalPin] = useState(pin || null);

  useEffect(() => {
    const loadNote = async () => {
      if (!note) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(
          `${API_URL}/api/my-files/notes/${note._id}`,
          universalPin
            ? {
                headers: {
                  'X-Universal-Pin': universalPin,
                },
              }
            : undefined
        );

        setTitle(response.data.title || '');
        setContent(response.data.content || '');
        setProtectedNote(
          Boolean(response.data.passwordProtected)
        );
      } catch (error) {
        console.error('Failed to load note:', error);

        toast.error(
          error.response?.data?.message ||
            'Could not open note'
        );

        onClose();
      } finally {
        setLoading(false);
      }
    };

    loadNote();
  }, [note, universalPin]);

  const save = async (event) => {
    event.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!content.trim()) {
      toast.error('Content is required');
      return;
    }

    setSaving(true);

    try {
      const isEditing = Boolean(note);

      const headers = {};

      // IMPORTANT:
      // If this note was previously protected and the user
      // entered the correct PIN to open it, send that same PIN
      // when updating/unprotecting it.
      if (isEditing && universalPin) {
        headers['X-Universal-Pin'] = universalPin;
      }

      await axios({
        method: isEditing ? 'put' : 'post',

        url: isEditing
          ? `${API_URL}/api/my-files/notes/${note._id}`
          : `${API_URL}/api/my-files/notes`,

        data: {
          title: title.trim(),
          content,
          passwordProtected: protectedNote,
        },

        headers:
          Object.keys(headers).length > 0
            ? headers
            : undefined,
      });

      toast.success(
        isEditing
          ? 'Note updated'
          : 'Note saved'
      );

      await onSaved();
      onClose();
    } catch (error) {
      console.error('Failed to save note:', error);

      toast.error(
        error.response?.data?.message ||
          'Could not save note'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="rounded-lg bg-white p-8">
          <Loader2 className="animate-spin text-indigo-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <form
        onSubmit={save}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-lg bg-white p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {note ? 'Edit Note' : 'Add Note'}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
          >
            <X />
          </button>
        </div>

        <label className="block text-sm font-medium text-gray-700">
          Title *

          <input
            value={title}
            onChange={(event) =>
              setTitle(event.target.value)
            }
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </label>

        <label className="mb-4 block text-sm font-medium text-gray-700">
          Content *

          <textarea
            value={content}
            onChange={(event) =>
              setContent(event.target.value)
            }
            placeholder="Write your note here..."
            required
            rows={12}
            className="mt-1.5 block min-h-56 w-full resize-y rounded-md border-gray-300 p-3 font-mono text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </label>

        <label className="mb-5 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={protectedNote}
            onChange={(event) =>
              setProtectedNote(event.target.checked)
            }
          />

          Password protect this file

          <Lock className="h-4 w-4 text-red-600" />
        </label>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="ml-auto rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

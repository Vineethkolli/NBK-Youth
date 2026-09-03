import { useState } from 'react';
import { Download, Edit2, FileText, Loader2, Lock, Trash2 } from 'lucide-react';

export default function NoteList({
  notes,
  editMode,
  onOpen,
  onDownload,
  onEdit,
  onDelete,
}) {
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (note) => {
    if (deletingId) return;

    setDeletingId(note._id);

    try {
      await onDelete(note);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="divide-y rounded-lg border bg-white">
      {notes.map((note) => {
        const isDeleting = deletingId === note._id;

        return (
          <div
            key={note._id}
            className={`flex items-center gap-3 p-4 transition ${
              isDeleting ? 'opacity-60' : ''
            }`}
          >
            <button
              onClick={() => !isDeleting && onOpen(note)}
              disabled={isDeleting}
              className="flex min-w-0 flex-1 items-center gap-3 text-left hover:text-indigo-700 disabled:cursor-not-allowed"
            >
              <FileText className="h-5 w-5 shrink-0 text-indigo-600" />

              <span className="truncate font-medium">
                {note.title}
              </span>

              {note.passwordProtected && (
                <Lock className="h-4 w-4 shrink-0 text-red-600" />
              )}
            </button>

            {editMode ? (
              <>
                <button
                  onClick={() => !isDeleting && onEdit(note)}
                  disabled={isDeleting}
                  aria-label="Edit"
                  className="rounded p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleDelete(note)}
                  disabled={Boolean(deletingId)}
                  aria-label="Delete"
                  className="flex h-8 w-8 items-center justify-center rounded p-2 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => !isDeleting && onDownload(note)}
                disabled={isDeleting}
                aria-label="Download"
                className="rounded p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Download className="h-4 w-4" />
              </button>
            )}
          </div>
        );
      })}

      {notes.length === 0 && (
        <p className="p-10 text-center text-gray-500">
          No Notes found
        </p>
      )}
    </div>
  );
}

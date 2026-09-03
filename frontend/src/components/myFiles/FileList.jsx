
import { useState } from 'react';
import { Copy, Download, Edit2, File, FileAudio, FileImage, FileText, FileVideo, Loader2, Lock, Trash2 } from 'lucide-react';

export default function FileList({
  files,
  editMode,
  onEdit,
  onDelete,
  onOpen,
  onDownload,
  onCopy,
}) {
  const [deletingId, setDeletingId] = useState(null);

  const getFileIcon = (resourceType, filename) => {
    const type = `${resourceType || ''}/${filename || ''}`.toLowerCase();

    if (type.includes('image')) return FileImage;
    if (type.includes('video')) return FileVideo;
    if (type.includes('audio')) return FileAudio;
    if (type.includes('pdf')) return FileText;

    return File;
  };

  const handleDelete = async (file) => {
    if (deletingId) return;

    setDeletingId(file._id);

    try {
      await onDelete(file);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="divide-y rounded-lg border bg-white">
      {files.map((file) => {
        const FileIcon = getFileIcon(
          file.resourceType,
          file.filename
        );

        const isDeleting = deletingId === file._id;

        return (
          <div
            key={file._id}
            className={`flex items-center gap-3 p-4 transition ${
              isDeleting ? 'opacity-60' : ''
            }`}
          >
            <button
              onClick={() => !isDeleting && onOpen(file)}
              disabled={isDeleting}
              className="flex min-w-0 flex-1 items-center gap-3 text-left hover:text-indigo-700 disabled:cursor-not-allowed"
            >
              <FileIcon className="h-5 w-5 shrink-0 text-emerald-600" />

              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {file.title || file.filename}
                </div>

                {file.description?.trim() && (
                  <div className="mt-0.5 truncate text-xs text-gray-500">
                    {file.description}
                  </div>
                )}
              </div>

              {file.passwordProtected && (
                <Lock className="h-4 w-4 shrink-0 text-red-600" />
              )}
            </button>

            {editMode ? (
              <>
                <button
                  onClick={() => !isDeleting && onEdit(file)}
                  disabled={isDeleting}
                  aria-label="Edit"
                  className="rounded p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Edit2 className="h-4 w-4" />
                </button>

                <button
                  onClick={() => handleDelete(file)}
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
              <>
                <button
                  onClick={() => !isDeleting && onDownload(file)}
                  disabled={isDeleting}
                  aria-label="Download"
                  className="rounded p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Download className="h-4 w-4" />
                </button>

                <button
                  onClick={() => !isDeleting && onCopy(file)}
                  disabled={isDeleting}
                  aria-label="Copy link"
                  className="rounded p-2 text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        );
      })}

      {files.length === 0 && (
        <p className="p-10 text-center text-gray-500">
          No files found
        </p>
      )}
    </div>
  );
}

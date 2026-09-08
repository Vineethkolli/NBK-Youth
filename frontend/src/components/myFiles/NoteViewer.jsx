import { X } from 'lucide-react';

export default function NoteViewer({ note, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 sm:p-6">
      <div className="flex max-h-[calc(100vh-2rem)] w-full max-w-5xl flex-col rounded-lg bg-white shadow-xl sm:max-h-[calc(100vh-3rem)]">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="min-w-0 truncate text-xl font-semibold">
            {note.title}
          </h2>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-4 shrink-0 rounded p-1 text-gray-600 transition hover:bg-gray-100"
          >
            <X />
          </button>
        </div>

        <div className="overflow-y-auto whitespace-pre-wrap p-6 font-mono text-sm leading-6 text-gray-800">
          {note.content}
        </div>
      </div>
    </div>
  );
}
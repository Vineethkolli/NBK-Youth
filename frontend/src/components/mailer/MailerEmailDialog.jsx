import { useEffect, useState } from 'react';
import { Code2, Eye, X } from 'lucide-react';
import { formatDateTime } from '../../utils/dateTime';

function formatRecipients(recipients) {
  if (!recipients?.length) return 'No recipients';

  return recipients
    .map((rec) => rec.registerId || rec.email)
    .join(', ');
}

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  completed: 'bg-emerald-100 text-emerald-700',
  failed: 'bg-rose-100 text-rose-700',
};

function MailerEmailDialog({ email, onClose }) {
  const [view, setView] = useState('rendered');

  useEffect(() => {
    setView('rendered');
  }, [email]);

  useEffect(() => {
    if (!email) return;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [email, onClose]);

  if (!email) return null;

  const body = email.body ?? email.content ?? '';
  const bodyFormat = email.bodyFormat || 'text';

  const isHtml = bodyFormat === 'html';

  const renderBody = () => {
    if (isHtml) {
      return (
        <div
          className="prose prose-sm max-w-none text-gray-800"
          dangerouslySetInnerHTML={{ __html: body }}
        />
      );
    }

    return (
      <div className="whitespace-pre-wrap break-words text-sm text-gray-800">
        {body}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
          <div className="min-w-0">
            <h2 className="break-words text-lg font-semibold text-gray-900">
              {email.subject || 'Untitled Email'}
            </h2>

            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {email.status && (
                <span
                  className={`rounded-full px-2 py-1 font-semibold ${
                    statusStyles[email.status] || 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {email.status.replace('_', ' ')}
                </span>
              )}

              {bodyFormat && (
                <span className="rounded-full bg-gray-100 px-2 py-1">
                  {isHtml ? 'HTML' : 'Plain Text'}
                </span>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Details */}
        <div className="grid gap-2 border-b border-gray-200 bg-gray-50 px-5 py-3 text-xs text-gray-600 sm:grid-cols-2">
          {email.scheduledAt && (
            <div>
              <span className="font-semibold text-gray-700">Scheduled:</span>{' '}
              {formatDateTime(email.scheduledAt)}
            </div>
          )}

          {email.sentAt && (
            <div>
              <span className="font-semibold text-gray-700">Sent:</span>{' '}
              {formatDateTime(email.sentAt)}
            </div>
          )}

          {email.completedAt && (
            <div>
              <span className="font-semibold text-gray-700">Completed:</span>{' '}
              {formatDateTime(email.completedAt)}
            </div>
          )}

          {email.targetType && (
            <div>
              <span className="font-semibold text-gray-700">Target:</span>{' '}
              {email.targetType}
            </div>
          )}

          {email.totalRecipients !== undefined && (
            <div>
              <span className="font-semibold text-gray-700">Recipients:</span>{' '}
              {email.totalRecipients}
            </div>
          )}

          {email.recipients?.length > 0 && (
            <div className="sm:col-span-2 break-words">
              <span className="font-semibold text-gray-700">To:</span>{' '}
              {formatRecipients(email.recipients)}
            </div>
          )}
        </div>

        {/* View switcher */}
        <div className="flex items-center gap-2 border-b border-gray-200 px-5 py-3">
          <button
            type="button"
            onClick={() => setView('rendered')}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              view === 'rendered'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Eye className="h-4 w-4" />
            Rendered Email
          </button>

          <button
            type="button"
            onClick={() => setView('raw')}
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              view === 'raw'
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Code2 className="h-4 w-4" />
            Raw Content
          </button>
        </div>

        {/* Content */}
        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          {view === 'rendered' ? (
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              {renderBody()}

              {email.footer && (
                <div className="mt-6 border-t border-gray-200 pt-4 whitespace-pre-wrap text-sm text-gray-500">
                  {email.footer}
                </div>
              )}
            </div>
          ) : (
            <pre className="min-h-[250px] overflow-x-auto whitespace-pre-wrap break-words rounded-lg bg-gray-900 p-5 font-mono text-sm text-gray-100">
              {body || 'No content'}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export default MailerEmailDialog;

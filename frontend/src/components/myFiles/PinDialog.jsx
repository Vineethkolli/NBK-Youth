
import { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, KeyRound, Loader2, X } from 'lucide-react';

export default function PinDialog({
  open,
  title = 'Enter PIN',
  onSubmit,
  onClose,
}) {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setPin('');
      setError('');
      setShowPin(false);

      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!open) return null;

  const submit = async (event) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(pin)) {
      setError('Please enter 6-digit Universal PIN');
      inputRef.current?.focus();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSubmit(pin);
    } catch (submitError) {
      setError(submitError.message || 'Incorrect PIN');
      setPin('');
      inputRef.current?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !loading) {
          onClose();
        }
      }}
    >
      <form
        onSubmit={submit}
        className="w-full max-w-sm overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl"
      >
        <div className="relative border-b border-gray-100 px-6 pb-5 pt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            aria-label="Close"
            className="absolute right-4 top-4 rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50">
              <KeyRound className="h-7 w-7 text-indigo-600" />
            </div>

            <h2 className="text-xl font-semibold text-gray-900">
              {title}
            </h2>

            <p className="mt-1.5 text-sm text-gray-500">
              Enter 6-digit Universal PIN to continue
            </p>
          </div>
        </div>

        <div className="px-6 py-6">
          <label
            htmlFor="universal-pin"
            className="mb-2 block text-sm font-semibold text-gray-700"
          >
            Universal PIN
          </label>

          <div
            className={`relative flex rounded-xl border bg-gray-50 transition ${
              error
                ? 'border-red-400 ring-2 ring-red-100'
                : 'border-gray-300 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100'
            }`}
          >
            <input
              id="universal-pin"
              ref={inputRef}
              value={pin}
              onChange={(event) => {
                setPin(
                  event.target.value
                    .replace(/\D/g, '')
                    .slice(0, 6)
                );

                if (error) {
                  setError('');
                }
              }}
              type={showPin ? 'text' : 'password'}
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              placeholder="••••••"
              disabled={loading}
              className="w-full border-0 bg-transparent px-4 py-3.5 pr-12 text-center text-xl font-semibold tracking-[0.45em] text-gray-900 outline-none placeholder:text-gray-300 disabled:cursor-not-allowed disabled:opacity-60"
              aria-invalid={Boolean(error)}
            />

            <button
              type="button"
              onClick={() => setShowPin((value) => !value)}
              disabled={loading}
              aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-gray-400 transition hover:bg-gray-200 hover:text-gray-700 disabled:opacity-50"
            >
              {showPin ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          <div className="mt-3 flex justify-center gap-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <span
                key={index}
                className={`h-1.5 w-6 rounded-full transition ${
                  index < pin.length
                    ? 'bg-indigo-600'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-lg bg-red-50 px-3 py-2.5 text-center">
              <p className="text-sm font-medium text-red-600">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || pin.length !== 6}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white shadow-sm transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}

            {loading ? 'Verifying...' : 'Continue'}
          </button>

          <p className="mt-4 text-center text-xs text-gray-400">
            PIN is required to access protected content.
          </p>
        </div>
      </form>
    </div>
  );
}

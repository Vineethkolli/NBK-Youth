import { useEffect, useState } from 'react';
import axios from 'axios';
import { KeyRound, RotateCcw, ShieldCheck, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../utils/config';

const OTP_EXPIRY_SECONDS = 10 * 60;
const RESEND_COOLDOWN_SECONDS = 30;

export default function UniversalPinManager() {
  const [configured, setConfigured] = useState(null);

  const [resetting, setResetting] = useState(false);
  const [sent, setSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [otp, setOtp] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');

  const [loading, setLoading] = useState(true);

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [saving, setSaving] = useState(false);

  const [otpSecondsLeft, setOtpSecondsLeft] = useState(0);
  const [resendSecondsLeft, setResendSecondsLeft] = useState(0);

  const digits = (value) =>
    value.replace(/\D/g, '').slice(0, 6);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const { data } = await axios.get(
          `${API_URL}/api/universal-pin/status`
        );

        setConfigured(Boolean(data.configured));
      } catch (error) {
        console.error(
          'Failed to load Universal PIN status:',
          error
        );

        setConfigured(false);
      } finally {
        setLoading(false);
      }
    };

    loadStatus();
  }, []);

  useEffect(() => {
    if (otpSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setOtpSecondsLeft((seconds) =>
        Math.max(0, seconds - 1)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [otpSecondsLeft]);

  useEffect(() => {
    if (resendSecondsLeft <= 0) return;

    const timer = setInterval(() => {
      setResendSecondsLeft((seconds) =>
        Math.max(0, seconds - 1)
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [resendSecondsLeft]);

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(
      remainingSeconds
    ).padStart(2, '0')}`;
  };

  const requestOtp = async () => {
    if (sendingOtp || resendSecondsLeft > 0) return;

    setSendingOtp(true);

    try {
      await axios.post(
        `${API_URL}/api/universal-pin/request-otp`
      );

      setSent(true);
      setOtp('');
      setOtpVerified(false);

      setOtpSecondsLeft(OTP_EXPIRY_SECONDS);
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS);

      toast.success(
        'OTP sent to the default developer email'
      );
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not send OTP'
      );
    } finally {
      setSendingOtp(false);
    }
  };


  const startReset = async () => {
    setResetting(true);
    setOtpVerified(false);
    setOtp('');
    setNewPin('');
    setConfirmPin('');

    await requestOtp();
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('Enter the 6-digit OTP');
      return;
    }

    if (otpSecondsLeft <= 0) {
      toast.error(
        'OTP has expired. Please request a new OTP.'
      );
      return;
    }

    setVerifyingOtp(true);

    try {
      await axios.post(
        `${API_URL}/api/universal-pin/verify-otp`,
        { otp }
      );

      setOtpVerified(true);

      toast.success('OTP verified successfully');
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Invalid OTP'
      );
    } finally {
      setVerifyingOtp(false);
    }
  };


  const savePin = async (event) => {
    event.preventDefault();

    if (!/^\d{6}$/.test(newPin)) {
      toast.error('PIN must contain exactly 6 digits');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('PINs do not match');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      toast.error('Invalid OTP');
      return;
    }

    setSaving(true);

    try {
      await axios.post(
        `${API_URL}/api/universal-pin/change`,
        {
          otp,
          pin: newPin,
          confirmPin,
        }
      );

      toast.success(
        'Universal PIN updated successfully'
      );

      setConfigured(true);

      setResetting(false);
      setSent(false);
      setOtpVerified(false);
      setOtp('');
      setNewPin('');
      setConfirmPin('');
      setOtpSecondsLeft(0);
      setResendSecondsLeft(0);
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          'Could not update Universal PIN'
      );
    } finally {
      setSaving(false);
    }
  };


  const cancelReset = () => {
    setResetting(false);
    setSent(false);
    setOtpVerified(false);
    setOtp('');
    setNewPin('');
    setConfirmPin('');
    setOtpSecondsLeft(0);
    setResendSecondsLeft(0);
  };


  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
          <KeyRound className="h-5 w-5 text-emerald-600" />
        </div>

        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Universal PIN
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            A 6-digit PIN used to access protected content
            across the application.
          </p>
        </div>
      </div>

      {!resetting ? (
        <>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-700">
                  PIN Status
                </p>

                <div className="mt-1 flex items-center gap-2">
                  {loading ? (
                    <span className="text-sm font-medium text-gray-400">
                      Checking...
                    </span>
                  ) : configured ? (
                    <>
                      <span className="tracking-[0.35em] text-lg font-semibold text-gray-800">
                        ••••••
                      </span>

                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Configured
                      </span>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-amber-600">
                      Not configured
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={startReset}
                disabled={loading || sendingOtp}
                className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" />

                {sendingOtp
                  ? 'Sending OTP...'
                  : configured
                  ? 'Reset PIN'
                  : 'Set PIN'}
              </button>
            </div>
          </div>
        </>
      ) : (
        <form
          onSubmit={savePin}
          className="space-y-5"
        >
          <div className="flex items-center gap-2 text-sm">
            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                otpVerified
                  ? 'bg-emerald-600 text-white'
                  : 'bg-indigo-600 text-white'
              }`}
            >
              {otpVerified ? '✓' : '1'}
            </div>

            <span className="text-gray-600">
              Verify OTP
            </span>

            <div className="h-px w-8 bg-gray-300" />

            <div
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ${
                otpVerified
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              2
            </div>

            <span className="text-gray-600">
              Set new PIN
            </span>
          </div>

          {!otpVerified ? (
            <div className="rounded-lg border border-gray-200 p-4">
              <div className="mb-4">
                <h3 className="font-medium text-gray-900">
                  Verify your identity
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  A 6-digit OTP has been sent to the
                  default developer email address.
                </p>
              </div>

              <label className="block text-sm font-medium text-gray-700">
                Enter OTP

                <input
                  value={otp}
                  onChange={(e) =>
                    setOtp(digits(e.target.value))
                  }
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  placeholder="Enter 6-digit OTP"
                  className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-lg tracking-[0.25em] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 sm:max-w-xs"
                />
              </label>

              {sent && (
                <div className="mt-3 flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-gray-400" />

                  {otpSecondsLeft > 0 ? (
                    <span className="text-gray-500">
                      OTP expires in{' '}
                      <strong className="text-gray-700">
                        {formatTime(otpSecondsLeft)}
                      </strong>
                    </span>
                  ) : (
                    <span className="font-medium text-red-600">
                      OTP expired
                    </span>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={verifyOtp}
                  disabled={
                    verifyingOtp ||
                    otp.length !== 6 ||
                    otpSecondsLeft <= 0
                  }
                  className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {verifyingOtp
                    ? 'Verifying...'
                    : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={requestOtp}
                  disabled={
                    sendingOtp ||
                    resendSecondsLeft > 0
                  }
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {sendingOtp
                    ? 'Sending...'
                    : resendSecondsLeft > 0
                    ? `Resend in ${resendSecondsLeft}s`
                    : 'Resend OTP'}
                </button>

                <button
                  type="button"
                  onClick={cancelReset}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />

                  <h3 className="font-medium text-gray-900">
                    OTP verified
                  </h3>
                </div>

                <p className="mt-1 text-sm text-gray-500">
                  Create your new 6-digit Universal PIN.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-gray-700">
                  New PIN

                  <input
                    value={newPin}
                    onChange={(e) =>
                      setNewPin(digits(e.target.value))
                    }
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={6}
                    placeholder="6 digits"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 tracking-[0.25em] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>

                <label className="block text-sm font-medium text-gray-700">
                  Confirm PIN

                  <input
                    value={confirmPin}
                    onChange={(e) =>
                      setConfirmPin(
                        digits(e.target.value)
                      )
                    }
                    type="password"
                    inputMode="numeric"
                    autoComplete="new-password"
                    maxLength={6}
                    placeholder="Repeat PIN"
                    className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2.5 tracking-[0.25em] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                </label>
              </div>

              {newPin.length === 6 &&
                confirmPin.length === 6 &&
                newPin !== confirmPin && (
                  <p className="mt-2 text-sm text-red-600">
                    PINs do not match.
                  </p>
                )}

              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelReset}
                  disabled={saving}
                  className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={
                    saving ||
                    !/^\d{6}$/.test(newPin) ||
                    newPin !== confirmPin
                  }
                  className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Updating PIN...'
                    : 'Update PIN'}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </section>
  );
}

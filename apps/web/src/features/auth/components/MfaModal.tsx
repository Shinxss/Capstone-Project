type Props = {
  open: boolean;
  emailMasked: string;
  code: string;
  setCode: (v: string) => void;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onVerify: () => void;
};

export default function MfaModal({
  open,
  emailMasked,
  code,
  setCode,
  loading,
  error,
  onClose,
  onVerify,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
        <h2 className="text-xl font-bold text-gray-900">Admin Verification</h2>
        <p className="mt-1 text-sm text-gray-600">
          We sent a 6-digit code to <span className="font-semibold">{emailMasked}</span>
        </p>

        <div className="mt-4">
          <label className="block text-sm font-semibold text-gray-700 mb-1">OTP Code</label>
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            className="w-full rounded border border-gray-300 bg-gray-50 px-3 py-2 font-semibold outline-none focus:border-gray-400"
            placeholder="Enter 6-digit code"
          />
        </div>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 rounded border border-gray-300 py-2 font-semibold text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onVerify}
            className="w-1/2 rounded bg-[#DC2626] py-2 font-semibold text-white hover:bg-[#c81e1e] disabled:opacity-60"
            disabled={loading || code.length !== 6}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>
      </div>
    </div>
  );
}

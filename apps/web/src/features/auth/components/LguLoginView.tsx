import { useMemo, useState } from "react";
import bgWhite from "../../../assets/bg_white.jpg";
import bgDark from "../../../assets/bg_dark.jpg";
import { Eye, EyeOff } from "lucide-react";
import { LifelineLogo } from "../../../components/LifelineLogo";
import MfaModal from "./MfaModal";
import { useThemeMode } from "../../theme/hooks/useThemeMode";

type Props = {
  username: string;
  password: string;
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
  loading: boolean;
  error: string | null;
  usernameError: string | null;
  passwordError: string | null;
  onSubmit: (e: React.FormEvent) => void;

  // ✅ MFA props
  mfaOpen: boolean;
  emailMasked: string;
  otp: string;
  setOtp: (v: string) => void;
  mfaLoading: boolean;
  mfaError: string | null;
  onVerifyOtp: () => void;
  closeMfa: () => void;
};

export default function LguLoginView({
  username,
  password,
  setUsername,
  setPassword,
  loading,
  error,
  usernameError,
  passwordError,
  onSubmit,

  mfaOpen,
  emailMasked,
  otp,
  setOtp,
  mfaLoading,
  mfaError,
  onVerifyOtp,
  closeMfa,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const { isDark } = useThemeMode();

  const pageBg = useMemo(() => (isDark ? bgDark : bgWhite), [isDark]);

  return (
    <>
      <div
        className="relative min-h-screen w-full flex items-start justify-center px-4 overflow-hidden pt-45"
        style={{
          backgroundImage: `url(${pageBg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      >
        {/* overlay */}
        <div
          className={
            isDark
              ? "absolute inset-0 bg-linear-to-b from-[#070D18]/70 via-[#070D18]/70 to-[#070D18]/70 backdrop-blur-sm"
              : "absolute inset-0 bg-white/70 backdrop-blur-xs"
          }
        />

        <div className="relative z-10 w-full max-w-117.5">
          <div className="mb-6 flex justify-center">
            <LifelineLogo
              variant="full"
              iconSize={44}
              textClassName="text-5xl"
              logoColor={isDark ? "blue" : "red"}
            />
          </div>

          <div className="bg-white border-2 rounded-xl border-b-3 border-gray-200 p-8 shadow-sm h-112.5 dark:bg-[#0B1220]/80 dark:border-slate-800 dark:shadow-black/30">
            <h1 className="text-center text-[30px] font-bold text-[#111827] dark:text-slate-100">
              Welcome Back
            </h1>
            <p className="mt-1 text-center text-base font-semibold text-gray-400 dark:text-slate-400">
              Login to access Dashboard
            </p>

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-base font-bold text-gray-700 mb-1 dark:text-slate-200">
                  Username
                </label>
                <input
                  className={`w-full rounded border bg-gray-100 px-3 py-2 font-semibold text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-400 ${
                    usernameError
                      ? "border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500"
                      : "border-gray-300 focus:border-gray-400 dark:border-slate-700 dark:focus:border-slate-500"
                  }`}
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  aria-invalid={!!usernameError}
                />
                {usernameError && <div className="mt-1 text-sm text-red-600 dark:text-red-300">{usernameError}</div>}
              </div>

              <div>
                <label className="block text-base font-bold text-gray-700 mb-1 dark:text-slate-200">
                  Password
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className={`w-full rounded border bg-gray-100 px-3 py-2 pr-11 font-semibold text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-400 ${
                      passwordError
                        ? "border-red-500 focus:border-red-500 dark:border-red-500 dark:focus:border-red-500"
                        : "border-gray-300 focus:border-gray-400 dark:border-slate-700 dark:focus:border-slate-500"
                    }`}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    aria-invalid={!!passwordError}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && <div className="mt-1 text-sm text-red-600 dark:text-red-300">{passwordError}</div>}
              </div>

              {error && <div className="text-sm text-red-600">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-[#DC2626] mt-2 py-3 text-base font-semibold text-white hover:bg-[#c81e1e] disabled:opacity-60 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <p className="pt-2 text-center text-md text-gray-500 dark:text-slate-400">
                Contact your administrator if you need access
              </p>
            </form>
          </div>
        </div>
      </div>

      {/* ✅ ADMIN MFA MODAL */}
      <MfaModal
        open={mfaOpen}
        emailMasked={emailMasked}
        code={otp}
        setCode={setOtp}
        loading={mfaLoading}
        error={mfaError}
        onClose={closeMfa}
        onVerify={onVerifyOtp}
      />
    </>
  );
}

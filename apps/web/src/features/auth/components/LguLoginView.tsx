import { useState } from "react";
import bgWhite from "../../../assets/bg_white.jpg";
import { Eye, EyeOff } from "lucide-react";
import { ShieldLogo } from "../../../components/ShieldLogo";

type Props = {
  username: string;
  password: string;
  setUsername: (v: string) => void;
  setPassword: (v: string) => void;
  loading: boolean;
  error: string | null;
  onSubmit: (e: React.FormEvent) => void;
};

export default function LguLoginView({
  username,
  password,
  setUsername,
  setPassword,
  loading,
  error,
  onSubmit,
}: Props) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div
      className="relative min-h-screen w-full flex items-center justify-center px-4 overflow-hidden"
      style={{
        backgroundImage: `url(${bgWhite})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-white/70 backdrop-blur-xs" />

      <div className="relative z-10 w-full max-w-117.5">
        <div className="mb-4">
          <ShieldLogo />
        </div>

        <div className="bg-white border-2 rounded-xl border-b-3 border-gray-200 p-8 shadow-sm h-112.5">
          <h1 className="text-center text-[30px] font-bold text-[#111827]">
            Welcome Back
          </h1>
          <p className="mt-1 text-center text-base font-semibold text-gray-400">
            Login to access Dashboard
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">
                Username
              </label>
              <input
                className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 font-semibold text-sm outline-none focus:border-gray-400"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-base font-bold text-gray-700 mb-1">
                Password
              </label>

              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full rounded border border-gray-300 bg-gray-100 px-3 py-2 pr-11 font-semibold text-sm outline-none focus:border-gray-400"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-[#DC2626] mt-2 py-3 text-base font-semibold text-white hover:bg-[#c81e1e] disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>

            <p className="pt-2 text-center text-md text-gray-500">
              Contact your administrator if you need access
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}

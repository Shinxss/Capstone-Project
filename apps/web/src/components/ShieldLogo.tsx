export function ShieldLogo() {
  return (
    <div className="flex items-center justify-center gap-2">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M12 2l8 4v6c0 5-3.4 9.4-8 10-4.6-.6-8-5-8-10V6l8-4z"
          stroke="#E11D2E"
          strokeWidth="2"
          fill="white"
        />
      </svg>
      <div className="text-4xl font-bold leading-none">
        <span className="text-[#E11D2E]">Life</span>
        <span className="text-gray-500">line</span>
      </div>
    </div>
  );
}

export function LogoMark({ className = "h-[34px] w-[34px]" }: { className?: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" className={`shrink-0 ${className}`}>
      <rect width="34" height="34" rx="9" fill="#1E6B4C" />
      <circle cx="15.5" cy="15.5" r="7.5" fill="none" stroke="#F5EFE2" strokeWidth="2.4" />
      <path d="M21 21l6 6" stroke="#F5EFE2" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M15.5 11.5c3 1.6 3 6.4 0 8c-3-1.6-3-6.4 0-8z" fill="#E9A13B" />
    </svg>
  );
}

export function Wrap({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-[1140px] px-6 ${className}`}>{children}</div>
}

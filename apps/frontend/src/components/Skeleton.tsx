'use client';

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[#1a1a1a] rounded-lg ${className}`}></div>
  );
}

export function TradeSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] p-4 space-y-4">
      {/* Header Skeleton */}
      <div className="h-16 bg-[var(--surface)] border-b border-[var(--border)] -m-4 mb-4 px-6 flex items-center justify-between">
        <Skeleton className="w-48 h-8" />
        <Skeleton className="w-32 h-8" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Panel */}
        <div className="lg:col-span-1 space-y-4">
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-[400px]" />
        </div>

        {/* Right Panel */}
        <div className="lg:col-span-3 space-y-4">
          <Skeleton className="w-full h-24" />
          <Skeleton className="w-full h-[400px]" />
          <Skeleton className="w-full h-64" />
        </div>
      </div>
    </div>
  );
}

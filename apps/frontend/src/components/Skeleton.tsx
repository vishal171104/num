'use client';

export default function Skeleton({ className }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-[var(--surface-hover)] rounded-lg ${className}`}></div>
  );
}

export function TradeSkeleton() {
  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      {/* Header Skeleton */}
      <div className="h-14 bg-[var(--surface)] border-b border-[var(--border)] px-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-24 h-6" />
          <Skeleton className="w-32 h-8 rounded-lg" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-20 h-8 rounded-lg" />
          <Skeleton className="w-8 h-8 rounded-lg" />
          <Skeleton className="w-24 h-8 rounded-lg" />
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel */}
        <div className="w-80 bg-[var(--surface)] border-r border-[var(--border)] p-4 space-y-4">
          <Skeleton className="w-full h-12 rounded-lg" />
          <Skeleton className="w-full h-10" />
          <div className="space-y-3 pt-4">
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-12" />
            <Skeleton className="w-full h-4" />
            <Skeleton className="w-full h-12" />
          </div>
          <Skeleton className="w-full h-12 rounded-lg mt-4" />
        </div>

        {/* Center Panel */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="h-12 bg-[var(--surface)] border-b border-[var(--border)] px-4 flex items-center gap-2">
            <Skeleton className="w-10 h-7 rounded" />
            <Skeleton className="w-10 h-7 rounded" />
            <Skeleton className="w-10 h-7 rounded" />
            <Skeleton className="w-10 h-7 rounded" />
          </div>
          
          {/* Chart Area */}
          <div className="flex-1 bg-[var(--background)] p-4">
            <Skeleton className="w-full h-full min-h-[400px]" />
          </div>
          
          {/* Orders Table */}
          <div className="h-[280px] bg-[var(--surface)] border-t border-[var(--border)]">
            <div className="h-11 px-4 border-b border-[var(--border)] flex items-center gap-4">
              <Skeleton className="w-20 h-7 rounded" />
              <Skeleton className="w-24 h-7 rounded" />
              <Skeleton className="w-28 h-7 rounded" />
            </div>
            <div className="p-4 space-y-3">
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
              <Skeleton className="w-full h-10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

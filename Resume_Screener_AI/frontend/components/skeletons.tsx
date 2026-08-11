import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

export function PremiumSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('animate-pulse space-y-3', className)} aria-hidden>
      <div className="h-3 w-24 rounded-full bg-muted" />
      <div className="h-7 w-16 rounded-lg bg-muted" />
      <div className="h-2 w-32 rounded-full bg-muted/70" />
    </div>
  );
}

export function MetricSkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <PremiumSkeleton />
          </CardHeader>
          <CardContent>
            <PremiumSkeleton className="w-20" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <div className="h-3 w-28 animate-pulse rounded-full bg-muted" />
          <div className="h-2 animate-pulse rounded-full bg-muted/70" />
        </div>
      ))}
    </div>
  );
}

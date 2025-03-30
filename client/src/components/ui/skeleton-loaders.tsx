import { Skeleton } from "@/components/ui/skeleton";

export function ShowCardSkeleton() {
  return (
    <div className="border rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Skeleton className="w-full sm:w-24 md:w-32 h-16 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <Skeleton className="h-9 w-full sm:w-28" />
      </div>
    </div>
  );
}

export function ReservationCardSkeleton() {
  return (
    <div className="border rounded-lg p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-full sm:w-28" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-20" />
      </div>
    </div>
  );
}

export function FormSkeleton() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-10 w-24 mt-6" />
    </div>
  );
}

export function UserItemSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg gap-4">
      <div className="space-y-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        <Skeleton className="h-9 w-20 flex-1 sm:flex-none" />
        <Skeleton className="h-9 w-20 flex-1 sm:flex-none" />
      </div>
    </div>
  );
}

export function SeatGridSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-6 w-28" />
        <div className="w-full bg-muted/30 p-4 sm:p-8 rounded-lg shadow-inner">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 justify-center">
                <Skeleton className="w-6 h-4" />
                <div className="flex gap-2 sm:gap-3">
                  {Array.from({ length: 10 }).map((_, j) => (
                    <Skeleton key={j} className="w-6 h-6 rounded-sm" />
                  ))}
                </div>
                <Skeleton className="w-6 h-4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
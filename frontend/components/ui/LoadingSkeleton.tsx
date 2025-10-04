export function CountyListSkeleton() {
  return (
    <div className="space-y-2">
      {[...Array(10)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-12 bg-gray-200 rounded-lg"></div>
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      <div className="h-64 bg-gray-200 rounded"></div>
      <div className="flex space-x-2">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      </div>
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-96 bg-gray-200 rounded-lg"></div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="animate-pulse">
        <div className="h-12 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
      <div className="animate-pulse">
        <div className="h-96 bg-gray-200 rounded-lg"></div>
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="animate-pulse bg-white p-6 rounded-lg shadow">
      <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded w-4/6"></div>
      </div>
    </div>
  );
}


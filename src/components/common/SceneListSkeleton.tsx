// src/components/common/SceneListSkeleton.tsx
import { Skeleton } from './Skeleton';

export const SceneListSkeleton: React.FC = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="flex items-center gap-3 p-3 border rounded">
        <Skeleton variant="rectangular" className="w-12 h-12" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-32 h-4" />
          <Skeleton variant="text" className="w-48 h-3" />
        </div>
      </div>
    ))}
  </div>
);

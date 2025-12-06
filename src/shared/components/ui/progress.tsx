import * as React from 'react'
import { cn } from '@/shared/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
  max?: number
}

export function Progress({ value = 0, max = 100, className, ...props }: ProgressProps) {
  const percent = Math.max(0, Math.min(100, Math.round((value / max) * 100)))

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('w-full h-2 rounded bg-muted', className)}
      {...props}
    >
      <div
        className="h-full rounded bg-primary transition-all"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export default Progress
